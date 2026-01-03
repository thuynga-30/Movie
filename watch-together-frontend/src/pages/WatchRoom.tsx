import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Copy, ArrowLeft, Loader2, Send, Smile, X, Users, Play, Power, Pause } from "lucide-react";
import { api, API_BASE_URL, getImageUrl } from "@/services/api";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useToast } from "@/hooks/use-toast";
import { STICKERS } from "@/constants/stickers";
import ReactPlayer from 'react-player';

const WatchRoom = () => {
  const { id } = useParams(); // id ở đây là RoomCode
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fix lỗi TypeScript cho ReactPlayer
  const ReactPlayerAny = ReactPlayer as any;

  // --- REFS (Lưu giá trị không gây render lại) ---
  const nativeVideoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const stompClientRef = useRef<any>(null);

  // Cờ quan trọng: Chặn vòng lặp Sync
  // true = Đang nhận lệnh từ Server (không gửi ngược lại)
  // false = User tự bấm (gửi lệnh đi)
  const isRemoteUpdate = useRef(false);

  // --- STATES ---
  const [room, setRoom] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);

  // Video States
  const [videoUrl, setVideoUrl] = useState("");
  const [isYouTube, setIsYouTube] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false); // User đã click vào màn hình chưa
  const [isEnded, setIsEnded] = useState(false); // Trạng thái phim kết thúc

  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  // 1. KHỞI TẠO: CHECK USER & LẤY INFO PHÒNG
  useEffect(() => {
    const initData = async () => {
      const userStr = localStorage.getItem("user");
      if (!userStr) { navigate("/login"); return; }
      const user = JSON.parse(userStr);
      setCurrentUser(user);

      try {
        // Lấy thông tin phòng qua API (Dữ liệu tĩnh ban đầu)
        const resRoom = await api.get(`/api/rooms/${id}`);
        setRoom(resRoom.data);

        // Xử lý URL Video
        const rawUrl = resRoom.data.movie?.videoUrl;
        const url = getImageUrl(rawUrl);
        setVideoUrl(url);
        setIsYouTube(url.includes("youtube.com") || url.includes("youtu.be"));

        // Đồng bộ trạng thái ban đầu từ DB
        if (resRoom.data.isPlaying) setIsPlaying(true);
        // (Lưu ý: setSeekTime ban đầu hơi khó chính xác tuyệt đối do video chưa load xong, sẽ sync lại qua socket sau)

        // Lấy lịch sử chat cũ
        try {
          const resChat = await api.get(`/api/rooms/${id}/messages`);
          // Map dữ liệu API về format chung của socket
          setChatMessages(resChat.data.map((msg: any) => ({
            type: 'CHAT',
            message: msg.message,
            senderName: msg.user?.username || msg.senderName,
            avatar: msg.user?.avatar || msg.avatar
          })));
        } catch (e) { console.log("Chưa có tin nhắn cũ"); }

        // KẾT NỐI SOCKET
        connectSocket(id!, user.username, resRoom.data.host?.username);

      } catch (error) {
        toast({ variant: "destructive", title: "Lỗi", description: "Phòng không tồn tại hoặc đã bị xóa!" });
        navigate("/rooms");
      } finally {
        setLoading(false);
      }
    };

    if (id) initData();

    // Cleanup khi rời trang
    return () => {
      if (stompClientRef.current) stompClientRef.current.disconnect();
    };
  }, [id]);

  // 2. HÀM KẾT NỐI SOCKET
  const connectSocket = (roomCode: string, myUsername: string, hostUsername: string) => {
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = Stomp.over(socket);
    client.debug = () => {}; // Tắt log debug console

    client.connect({}, () => {
      stompClientRef.current = client;

      // Subscribe kênh chung của phòng
      client.subscribe(`/topic/room/${roomCode}`, (payload: any) => {
        const data = JSON.parse(payload.body);
        handleSocketMessage(data, myUsername, hostUsername);
      });

      // Gửi tin nhắn báo danh (JOIN)
      client.send(`/app/join/${roomCode}`, {}, JSON.stringify({
        type: 'JOIN',
        senderName: myUsername
      }));
    }, (err) => {
      console.error("Socket error", err);
      toast({variant: "destructive", title: "Mất kết nối máy chủ!"});
    });
  };

  // 3. XỬ LÝ MESSAGE TỪ SOCKET (TẤT CẢ LOGIC Ở ĐÂY)
  const handleSocketMessage = (data: any, myUsername: string, hostUsername: string) => {
    // A. Chat Message
    if (data.type === 'CHAT') {
      setChatMessages(prev => [...prev, data]);
    }
    // B. Đếm người online
    else if (data.type === 'COUNT') {
      setOnlineCount(parseInt(data.message));
    }
    // C. Xử lý Sync Video (Play/Pause/Seek)
    else if (['PLAY', 'PAUSE', 'SEEK'].includes(data.type)) {
      // Nếu tin nhắn do chính mình gửi -> Bỏ qua (để tránh giật)
      if (data.senderName === myUsername) return;

      handleVideoSync(data);
    }
    // D. Người mới vào -> Nếu mình là Host, hãy gửi trạng thái hiện tại cho họ sync
    else if (data.type === 'JOIN') {
      if (data.senderName !== myUsername && myUsername === hostUsername) {
        // Host gửi trạng thái hiện tại để người mới bắt kịp
        sendSyncAction(isPlaying ? 'PLAY' : 'PAUSE', getCurrentTime());
      }
    }
    // E. Phòng bị Host xóa (END_ROOM)
    else if (data.type === 'END_ROOM') {
      setIsPlaying(false);
      toast({ title: "Phòng đã kết thúc", description: "Host đã đóng phòng này." });
      navigate("/rooms");
    }
  };

  // 4. LOGIC ĐIỀU KHIỂN PLAYER (Dùng chung cho YT và Video thường)
  const getCurrentTime = () => {
    if (isYouTube) return youtubePlayerRef.current?.getCurrentTime() || 0;
    return nativeVideoRef.current?.currentTime || 0;
  };

  const seekTo = (time: number) => {
    if (isYouTube) youtubePlayerRef.current?.seekTo(time, 'seconds');
    else if (nativeVideoRef.current) nativeVideoRef.current.currentTime = time;
  };

  const handleVideoSync = (data: any) => {
    isRemoteUpdate.current = true; // 🔴 BẬT CỜ: Đừng gửi lại lệnh này lên server

    // 1. Sync Thời gian (Nếu lệch quá 1.5 giây mới chỉnh để tránh giật)
    const currentTime = getCurrentTime();
    if (Math.abs(currentTime - data.seekTime) > 1.5) {
      seekTo(data.seekTime);
    }

    // 2. Sync Trạng thái
    if (data.type === 'PLAY') {
      setIsPlaying(true);
      setIsEnded(false);
      if(!isYouTube) nativeVideoRef.current?.play().catch(()=>{});
    } else if (data.type === 'PAUSE') {
      setIsPlaying(false);
      if(!isYouTube) nativeVideoRef.current?.pause();
    }

    // 🟢 TẮT CỜ sau 500ms (Cho phép gửi lệnh lại)
    setTimeout(() => { isRemoteUpdate.current = false; }, 500);
  };

  // 5. GỬI LỆNH SYNC (User thao tác)
  const sendSyncAction = (type: string, time?: number) => {
    // Nếu đang xử lý lệnh từ người khác (Remote) thì không gửi
    if (isRemoteUpdate.current || !stompClientRef.current) return;

    const currentTime = time !== undefined ? time : getCurrentTime();

    stompClientRef.current.send(`/app/sync/${id}`, {}, JSON.stringify({
      type: type,
      seekTime: currentTime,
      senderName: currentUser?.username
    }));
  };

  // --- EVENTS CỦA PLAYER ---
  const onPlay = () => {
    if(!isRemoteUpdate.current) {
      setIsPlaying(true);
      setIsEnded(false);
      sendSyncAction('PLAY');
    }
  };
  const onPause = () => {
    if(!isRemoteUpdate.current) {
      setIsPlaying(false);
      sendSyncAction('PAUSE');
    }
  };
  const onEnded = () => {
    setIsPlaying(false);
    setIsEnded(true);
    sendSyncAction('PAUSE'); // Báo mọi người dừng lại
  };

  // 6. CÁC TÁC VỤ KHÁC
  const handleSendMessage = () => {
    if (messageInput.trim() && stompClientRef.current) {
      stompClientRef.current.send(`/app/chat/${id}`, {}, JSON.stringify({
        type: 'CHAT', message: messageInput, senderName: currentUser.username, avatar: currentUser.avatar
      }));
      setMessageInput("");
    }
  };

  const handleSendSticker = (url: string) => {
    if(stompClientRef.current) {
      stompClientRef.current.send(`/app/chat/${id}`, {}, JSON.stringify({
        type: 'CHAT', message: `STICKER|${url}`, senderName: currentUser.username, avatar: currentUser.avatar
      }));
      setShowStickerPicker(false);
    }
  };

  const handleEndRoom = async () => {
    if(!confirm("Bạn có chắc chắn muốn kết thúc phòng? Mọi người sẽ bị buộc rời khỏi đây.")) return;
    try {
      // Xóa phòng trên DB
      await api.delete(`/api/rooms/${id}`);
      // Gửi tín hiệu Socket để kick mọi người
      if(stompClientRef.current) {
        stompClientRef.current.send(`/app/chat/${id}`, {}, JSON.stringify({ type: 'END_ROOM' }));
      }
      navigate("/rooms");
    } catch (e) { toast({title: "Lỗi xóa phòng"}); }
  };

  const isHost = currentUser?.username === room?.host?.username;

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin mr-2"/> Đang vào phòng...</div>;

  return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="h-14 border-b px-4 flex items-center justify-between shrink-0 bg-card z-20">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/rooms")}><ArrowLeft className="h-5 w-5"/></Button>
            <div>
              <h1 className="font-bold text-sm md:text-base truncate max-w-[200px]">{room?.movie?.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="font-mono">{room?.roomCode}</Badge>
                <span className="flex items-center text-green-500"><Users className="h-3 w-3 mr-1"/> {onlineCount}</span>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => {navigator.clipboard.writeText(window.location.href); toast({title: "Đã copy link!"});}}>
            <Copy className="h-4 w-4 mr-2" /> <span className="hidden md:inline">Mời bạn bè</span>
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* --- KHU VỰC VIDEO --- */}
          <div className="flex-1 bg-black relative flex items-center justify-center group">

            {/* Màn hình Chờ / Tương tác lần đầu */}
            {!hasInteracted && !isEnded && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center cursor-pointer"
                     onClick={() => { setHasInteracted(true); setIsPlaying(true); sendSyncAction('PLAY'); }}>
                  <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                    <Play className="h-10 w-10 text-primary ml-1" />
                  </div>
                  <p className="text-white mt-4 font-semibold">Bấm để bắt đầu xem cùng nhau</p>
                </div>
            )}

            {/* Màn hình Kết thúc phim */}
            {isEnded && (
                <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-white">
                  <h2 className="text-2xl font-bold mb-4">Hết phim</h2>
                  {isHost ? (
                      <div className="flex gap-4">
                        <Button variant="outline" onClick={() => { setIsEnded(false); seekTo(0); sendSyncAction('SEEK', 0); sendSyncAction('PLAY'); }}>
                          <Play className="mr-2 h-4 w-4"/> Xem lại
                        </Button>
                        <Button variant="destructive" onClick={handleEndRoom}>
                          <Power className="mr-2 h-4 w-4"/> Kết thúc phòng
                        </Button>
                      </div>
                  ) : (
                      <p className="text-gray-400">Cảm ơn bạn đã xem!</p>
                  )}
                </div>
            )}

            {/* PLAYER: YOUTUBE */}
            {isYouTube && (
                <ReactPlayerAny
                    ref={youtubePlayerRef}
                    url={videoUrl}
                    width="100%"
                    height="100%"
                    controls={true}
                    playing={isPlaying}
                    // Sự kiện
                    onPlay={onPlay}
                    onPause={onPause}
                    onEnded={onEnded}
                    // Config ẩn logo YT nếu có thể
                    config={{ youtube: { playerVars: { showinfo: 0, rel: 0, modestbranding: 1 } } }}
                />
            )}

            {/* PLAYER: NATIVE MP4 */}
            {!isYouTube && (
                <video
                    ref={nativeVideoRef}
                    className="w-full h-full object-contain"
                    src={videoUrl}
                    controls
                    // Sự kiện
                    onPlay={onPlay}
                    onPause={onPause}
                    onEnded={onEnded}
                    onSeeked={() => {
                      // Chỉ gửi sync seek nếu do người dùng kéo (check logic cờ)
                      if (!isRemoteUpdate.current) sendSyncAction('SEEK');
                    }}
                />
            )}
          </div>

          {/* --- KHU VỰC CHAT --- */}
          <Card className="w-80 md:w-96 border-l rounded-none flex flex-col bg-card h-full shrink-0 relative shadow-xl z-30">
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-4">
                {chatMessages.map((msg, i) => {
                  const isMe = msg.senderName === currentUser?.username;
                  const isSticker = msg.message.startsWith("STICKER|");
                  const content = isSticker ? msg.message.split("|")[1] : msg.message;

                  return (
                      <div key={i} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 mt-1 border">
                          <AvatarImage src={getImageUrl(msg.avatar)} />
                          <AvatarFallback>{msg.senderName?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                          <span className="text-[10px] text-muted-foreground mb-1">{msg.senderName}</span>
                          {isSticker ? (
                              <img src={content} alt="sticker" className="w-20 h-20 object-contain hover:scale-110 transition-transform" />
                          ) : (
                              <div className={`px-3 py-2 rounded-lg text-sm break-words ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {content}
                              </div>
                          )}
                        </div>
                      </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* Sticker Picker */}
            {showStickerPicker && (
                <div className="absolute bottom-16 left-2 right-2 bg-popover border rounded-lg shadow-lg p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-semibold">Stickers</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={()=>setShowStickerPicker(false)}><X className="h-4 w-4"/></Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {STICKERS.map((s, i) => (
                        <img key={i} src={s} className="w-full h-14 object-contain cursor-pointer hover:bg-muted/50 rounded p-1 transition-colors" onClick={() => handleSendSticker(s)} />
                    ))}
                  </div>
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t bg-card/50 flex gap-2 items-center">
              <Button size="icon" variant="ghost" className="text-muted-foreground" onClick={()=>setShowStickerPicker(!showStickerPicker)}>
                <Smile className="h-5 w-5" />
              </Button>
              <Input
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 bg-background"
              />
              <Button size="icon" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
  );
};

export default WatchRoom;