import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { api, API_BASE_URL } from "@/services/api";
import SockJS from "sockjs-client";
import Stomp from "stompjs";

// Import các icon
import { Play, Pause, Volume2, Maximize, Heart, Share2, Star, ArrowLeft } from "lucide-react";

const PrivateWatch = () => {
  const { id } = useParams(); // id ở đây là ROOM CODE (ví dụ: ROOM123)
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stompClientRef = useRef<any>(null);
  const isSyncing = useRef(false);

  const [movie, setMovie] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false); // Dùng để hiển thị icon Play/Pause

  // 1. Lấy thông tin user
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      alert("Vui lòng đăng nhập!");
      navigate("/login");
      return;
    }
    setCurrentUser(JSON.parse(userStr));
  }, []);

  // 2. Vào phòng và kết nối Socket
  useEffect(() => {
    const joinRoom = async () => {
      try {
        // Gọi API Backend lấy thông tin phòng
        const res = await api.get(`/api/rooms/${id}`);
        setMovie(res.data.movie);

        // Nếu phòng đang chiếu, nhảy tới đoạn đó
        if (videoRef.current) {
          videoRef.current.currentTime = res.data.currentTime;
          if (res.data.isPlaying) {
            videoRef.current.play().catch(e => console.log("Cần tương tác để autoplay"));
          }
        }

        // Kết nối Socket
        connectSocket(id!);
      } catch (error) {
        console.error(error);
        alert("Phòng không tồn tại hoặc lỗi kết nối!");
        navigate("/movies");
      }
    };

    if (id) joinRoom();

    return () => {
      if (stompClientRef.current) stompClientRef.current.disconnect();
    };
  }, [id]);

  const connectSocket = (roomCode: string) => {
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = Stomp.over(socket);
    client.debug = () => {};

    client.connect({}, () => {
      stompClientRef.current = client;

      client.subscribe(`/topic/room/${roomCode}`, (payload) => {
        const data = JSON.parse(payload.body);

        if (data.type === 'CHAT') {
          setChatMessages(prev => [...prev, data]);
        } else if (['PLAY', 'PAUSE', 'SEEK'].includes(data.type)) {
          handleRemoteCommand(data);
        }
      });
    });
  };

  const handleRemoteCommand = (data: any) => {
    if (!videoRef.current) return;
    isSyncing.current = true;

    if (data.type === 'PAUSE') {
      videoRef.current.pause();
      setIsPlaying(false);
      videoRef.current.currentTime = data.seekTime;
    } else if (data.type === 'PLAY') {
      videoRef.current.currentTime = data.seekTime;
      videoRef.current.play();
      setIsPlaying(true);
    } else if (data.type === 'SEEK') {
      videoRef.current.currentTime = data.seekTime;
    }

    setTimeout(() => { isSyncing.current = false; }, 500);
  };

  const sendSync = (type: string) => {
    if (!stompClientRef.current || isSyncing.current || !videoRef.current) return;
    stompClientRef.current.send(`/app/sync/${id}`, {}, JSON.stringify({
      type: type,
      seekTime: videoRef.current.currentTime
    }));
  };

  const sendChat = () => {
    if (!chatInput.trim() || !stompClientRef.current) return;
    stompClientRef.current.send(`/app/chat/${id}`, {}, JSON.stringify({
      type: 'CHAT',
      message: chatInput,
      senderName: currentUser.username,
      avatar: currentUser.avatar
    }));
    setChatInput("");
  };

  if (!movie) return <div className="text-white text-center pt-20">Đang tải phòng...</div>;

  return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 py-4 pt-20 h-[calc(100vh-80px)]">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">

            {/* CỘT TRÁI: VIDEO PLAYER (Chiếm 3 phần) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-border group">
                {/* VIDEO TAG CHÍNH */}
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    src={movie.videoUrl} // Link phim từ Backend
                    controls
                    onPlay={() => { setIsPlaying(true); sendSync('PLAY'); }}
                    onPause={() => { setIsPlaying(false); sendSync('PAUSE'); }}
                    onSeeked={() => sendSync('SEEK')}
                />
              </div>

              {/* Movie Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold">{movie.title}</h1>
                  <p className="text-muted-foreground mt-1">Phòng: {id}</p>
                </div>
                <Button variant="outline" onClick={() => navigate(-1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Thoát phòng
                </Button>
              </div>
            </div>

            {/* CỘT PHẢI: CHAT (Chiếm 1 phần) */}
            <div className="lg:col-span-1 h-full flex flex-col bg-card rounded-lg border border-border">
              <div className="p-4 border-b border-border font-bold">Chat Phòng</div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.senderName === currentUser?.username ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.avatar} />
                        <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className={`p-2 rounded-lg text-sm max-w-[80%] ${msg.senderName === currentUser?.username ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <div className="font-bold text-xs opacity-70 mb-1">{msg.senderName}</div>
                        {msg.message}
                      </div>
                    </div>
                ))}
              </div>

              <div className="p-3 border-t border-border flex gap-2">
                <input
                    className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm"
                    placeholder="Nhập tin nhắn..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                />
                <Button size="sm" onClick={sendChat}>Gửi</Button>
              </div>
            </div>

          </div>
        </div>
      </div>
  );
};

export default PrivateWatch;