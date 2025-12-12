import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowLeft, Loader2, Send, Smile, X, Users, Play, Power } from "lucide-react"; // Thêm icon Power
import { api, API_BASE_URL, getImageUrl } from "@/services/api";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useToast } from "@/hooks/use-toast";
import { STICKERS } from "@/constants/stickers";
import ReactPlayer from 'react-player';

const WatchRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const ReactPlayerAny = ReactPlayer as any;

  // Refs
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const stompClientRef = useRef<any>(null);
  const isSyncing = useRef(false);

  // Data States
  const [room, setRoom] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Video States
  const [videoUrl, setVideoUrl] = useState("");
  const [isYouTube, setIsYouTube] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // 🆕 STATE MỚI CHO TÍNH NĂNG KẾT THÚC
  const [isEnded, setIsEnded] = useState(false);

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  // 1. Check Login
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { navigate("/login"); return; }
    setCurrentUser(JSON.parse(userStr));
  }, []);

  // 2. Init Room
  useEffect(() => {
    const initRoom = async () => {
      try {
        setLoading(true);
        const resRoom = await api.get(`/api/rooms/${id}`);
        setRoom(resRoom.data);

        const rawUrl = resRoom.data.movie?.videoUrl;
        const url = getImageUrl(rawUrl);
        setVideoUrl(url);

        const isYT = url.includes("youtube.com") || url.includes("youtu.be");
        setIsYouTube(isYT);

        if (resRoom.data.isPlaying) setIsPlaying(true);

        try {
          const resChat = await api.get(`/api/rooms/${id}/messages`);
          setChatMessages(resChat.data.map((msg: any) => ({ ...msg, type: 'CHAT' })));
        } catch (e) {}

        connectSocket(id!, resRoom.data.host?.username);
      } catch (error) {
        toast({ variant: "destructive", title: "Lỗi", description: "Phòng không tồn tại!" });
        navigate("/rooms");
      } finally {
        setLoading(false);
      }
    };
    if (id) initRoom();
    return () => { if (stompClientRef.current) stompClientRef.current.disconnect(); };
  }, [id]);

  // Socket Connection (Giữ nguyên)
  const connectSocket = (roomCode: string, hostName: string) => {
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = Stomp.over(socket);
    client.debug = () => {};

    client.connect({}, () => {
      stompClientRef.current = client;
      const me = JSON.parse(localStorage.getItem("user") || "{}");
      client.send(`/app/join/${roomCode}`, {}, JSON.stringify({ type: 'JOIN', senderName: me.username }));

      client.subscribe(`/topic/room/${roomCode}`, (payload: any) => {
        const data = JSON.parse(payload.body);
        handleSocketData(data, hostName, me.username);
      });
    });
  };

  // Player Control (Giữ nguyên)
  const playerControl = {
    getCurrentTime: () => {
      if (isYouTube) {
        const p = youtubePlayerRef.current;
        if (p && typeof p.getCurrentTime === 'function') return p.getCurrentTime();
        return 0;
      }
      return nativeVideoRef.current?.currentTime || 0;
    },
    seekTo: (time: number) => {
      if (isYouTube) {
        const p = youtubePlayerRef.current;
        if (p && typeof p.seekTo === 'function') p.seekTo(time, 'seconds');
      }
      else if (nativeVideoRef.current) nativeVideoRef.current.currentTime = time;
    },
    play: () => {
      setIsPlaying(true);
      setIsEnded(false); // Reset trạng thái Ended
      if (!isYouTube && nativeVideoRef.current) nativeVideoRef.current.play().catch(()=>{});
    },
    pause: () => {
      setIsPlaying(false);
      if (!isYouTube && nativeVideoRef.current) nativeVideoRef.current.pause();
    }
  };

  const handleSocketData = (data: any, hostName: string, myName: string) => {
    if (data.type === 'CHAT') setChatMessages(prev => [...prev, data]);
    else if (data.type === 'COUNT') setOnlineCount(parseInt(data.message));
    else if (['PLAY', 'PAUSE', 'SEEK'].includes(data.type)) handleVideoSync(data);
    else if (data.type === 'JOIN') {
      if (data.senderName !== myName && myName === hostName) {
        sendSync(isPlaying ? 'PLAY' : 'PAUSE', playerControl.getCurrentTime());
      }
    }
    // 🆕 Xử lý khi phòng bị xóa (nếu Host xóa)
    else if (data.type === 'END_ROOM') {
      toast({ title: "Phòng đã kết thúc", description: "Host đã đóng phòng." });
      navigate("/rooms");
    }
  };

  // Sync Logic (Giữ nguyên)
  const handleVideoSync = (data: any) => {
    isSyncing.current = true;
    const currentTime = playerControl.getCurrentTime();

    if (Math.abs(currentTime - data.seekTime) > 1.5) playerControl.seekTo(data.seekTime);

    if (data.type === 'PAUSE') playerControl.pause();
    else if (data.type === 'PLAY') playerControl.play();

    setTimeout(() => { isSyncing.current = false; }, 500);
  };

  const sendSync = (type: string, time?: number) => {
    if (!stompClientRef.current || isSyncing.current) return;
    const t = time !== undefined ? time : playerControl.getCurrentTime();
    stompClientRef.current.send(`/app/sync/${id}`, {}, JSON.stringify({ type, seekTime: t }));
  };

  // Events
  const onPlay = () => {
    if(!isSyncing.current) {
      setIsPlaying(true);
      setIsEnded(false); // Bắt đầu chạy lại thì tắt màn hình End
      sendSync('PLAY');
    }
  };
  const onPause = () => {
    if(!isSyncing.current) { setIsPlaying(false); sendSync('PAUSE'); }
  };

  // 🆕 SỰ KIỆN KHI HẾT PHIM
  const onEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    sendSync('PAUSE'); // Đồng bộ trạng thái dừng cho mọi người
  };

  // 🆕 HÀM XỬ LÝ NÚT KẾT THÚC PHÒNG (Cho Host)
  const handleEndRoom = async () => {
    if(!confirm("Bạn có chắc chắn muốn kết thúc và xóa phòng này không?")) return;

    try {
      // 1. Gọi API xóa phòng
      await api.delete(`/api/rooms/${id}`);

      // 2. (Tuỳ chọn) Gửi socket báo mọi người out (hoặc để họ tự out khi API lỗi)
      if(stompClientRef.current) {
        stompClientRef.current.send(`/app/chat/${id}`, {}, JSON.stringify({ type: 'END_ROOM' }));
      }

      toast({ title: "Đã kết thúc phòng" });
      navigate("/rooms");
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa phòng." });
    }
  };

  // Chat & Sticker
  const handleSendMessage = () => {
    if (messageInput.trim() && stompClientRef.current) {
      stompClientRef.current.send(`/app/chat/${id}`, {}, JSON.stringify({
        type: 'CHAT', message: messageInput, senderName: currentUser.username, avatar: currentUser.avatar
      }));
      setMessageInput("");
    }
  };
  const handleSendSticker = (url: string) => {
    stompClientRef.current.send(`/app/chat/${id}`, {}, JSON.stringify({
      type: 'CHAT', message: `STICKER|${url}`, senderName: currentUser.username, avatar: currentUser.avatar
    }));
    setShowStickerPicker(false);
  };

  if (loading) return <div className="h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  // 🆕 KIỂM TRA QUYỀN HOST
  const isHost = currentUser?.username === room?.host?.username;

  return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 bg-card/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/rooms")}><ArrowLeft className="h-5 w-5"/></Button>
            <div>
              <h1 className="font-bold text-lg">{room?.movie?.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary">Room: {room?.roomCode}</Badge>
                <Badge variant="outline" className="text-green-600 border-green-500/20"><Users className="h-3 w-3 mr-1" />{onlineCount}</Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => {navigator.clipboard.writeText(window.location.href); toast({title: "Đã copy link!"});}}>
            <Copy className="h-4 w-4 mr-2" /> Mời
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">

          {/* --- VIDEO PLAYER AREA --- */}
          <div className="flex-1 bg-black relative group flex items-center justify-center">

            {/* 1. MÀN HÌNH CHỜ (Click to Play) */}
            {!hasInteracted && !isEnded && (
                <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center cursor-pointer"
                     onClick={() => { setHasInteracted(true); setIsPlaying(true); }}>
                  <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center animate-bounce">
                    <Play className="h-8 w-8 text-white ml-1" />
                  </div>
                  <p className="text-white mt-4 font-bold">Bấm để tham gia xem chung</p>
                </div>
            )}

            {/* 🆕 2. MÀN HÌNH KẾT THÚC (Chỉ hiện khi hết phim) */}
            {isEnded && (
                <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center">
                  <h2 className="text-white text-3xl font-bold mb-6">Phim đã kết thúc</h2>

                  {/* CHỈ HOST MỚI THẤY NÚT XÓA PHÒNG */}
                  {isHost ? (
                      <div className="flex flex-col gap-4 items-center">
                        <Button
                            variant="destructive"
                            size="lg"
                            className="scale-125 font-bold"
                            onClick={handleEndRoom}
                        >
                          <Power className="mr-2 h-5 w-5" /> KẾT THÚC PHÒNG
                        </Button>
                        <p className="text-gray-400 text-sm mt-2">Hành động này sẽ giải tán phòng xem</p>

                        <Button variant="ghost" className="text-white mt-4" onClick={() => { setIsEnded(false); playerControl.seekTo(0); }}>
                          Xem lại từ đầu
                        </Button>
                      </div>
                  ) : (
                      <div className="text-center">
                        <p className="text-gray-300 mb-4">Cảm ơn bạn đã xem cùng mọi người!</p>
                        <Button variant="secondary" onClick={() => navigate("/rooms")}>
                          Rời phòng
                        </Button>
                      </div>
                  )}
                </div>
            )}

            {/* TRƯỜNG HỢP A: YOUTUBE */}
            {isYouTube && hasInteracted && (
                <div className="absolute inset-0">
                  <ReactPlayerAny
                      ref={youtubePlayerRef}
                      url={videoUrl}
                      width="100%"
                      height="100%"
                      controls={true}
                      playing={isPlaying}
                      onPlay={onPlay}
                      onPause={onPause}
                      onEnded={onEnded} // 🆕 Gắn sự kiện hết phim
                      config={{ youtube: { playerVars: { origin: window.location.origin } } }}
                  />
                </div>
            )}

            {/* TRƯỜNG HỢP B: MP4 NATIVE */}
            {!isYouTube && (
                <video
                    ref={nativeVideoRef}
                    className="w-full h-full object-contain"
                    controls
                    src={videoUrl}
                    onPlay={onPlay}
                    onPause={onPause}
                    onEnded={onEnded} // 🆕 Gắn sự kiện hết phim
                    onSeeked={() => sendSync('SEEK')}
                />
            )}
          </div>

          {/* --- CHAT SECTION --- */}
          <Card className="w-80 md:w-96 border-l border-border rounded-none flex flex-col bg-card h-full shrink-0 z-10 relative">
            <div className="p-3 border-b font-bold bg-card/50 flex justify-between items-center">
              <span>Chat</span>
              <span className="text-xs text-green-500">● Live</span>
            </div>
            <ScrollArea className="flex-1 p-4 bg-background/30">
              <div className="space-y-3">
                {chatMessages.map((msg, idx) => {
                  const isMe = msg.senderName === currentUser?.username;
                  const isSticker = msg.message?.startsWith("STICKER|");
                  const content = isSticker ? msg.message.split("|")[1] : msg.message;
                  return (
                      <div key={idx} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 border border-white/10 mt-1"><AvatarImage src={getImageUrl(msg.avatar)} /><AvatarFallback>{msg.senderName?.[0]}</AvatarFallback></Avatar>
                        <div className={`max-w-[80%]`}>
                          <div className={`text-[10px] opacity-70 mb-1 ${isMe ? 'text-right' : ''}`}>{msg.senderName}</div>
                          {isSticker ? <img src={content} className="w-24 h-24" /> : <div className={`p-2 rounded-lg text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{content}</div>}
                        </div>
                      </div>
                  )
                })}
              </div>
            </ScrollArea>

            {showStickerPicker && (
                <div className="absolute bottom-16 left-2 right-2 bg-card border rounded-lg shadow-xl p-2 z-50">
                  <div className="flex justify-between items-center mb-2"><span className="text-xs">Sticker</span><Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=>setShowStickerPicker(false)}><X className="h-4 w-4"/></Button></div>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">{STICKERS.map((u,i)=><img key={i} src={u} className="w-full h-16 object-contain cursor-pointer hover:bg-muted p-1" onClick={()=>handleSendSticker(u)}/>)}</div>
                </div>
            )}

            <div className="p-3 border-t mt-auto flex gap-2 items-center bg-card">
              <Button size="icon" variant="ghost" onClick={()=>setShowStickerPicker(!showStickerPicker)}><Smile className="h-5 w-5"/></Button>
              <Input value={messageInput} onChange={e=>setMessageInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendMessage()} placeholder="Chat..." className="flex-1" />
              <Button size="icon" onClick={handleSendMessage}><Send className="h-4 w-4"/></Button>
            </div>
          </Card>
        </div>
      </div>
  );
};

export default WatchRoom;