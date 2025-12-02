import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, Copy, ArrowLeft, Loader2, Send, AlertCircle, Smile, X, Users } from "lucide-react";
import { api, API_BASE_URL, getImageUrl } from "@/services/api";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useToast } from "@/hooks/use-toast";
import { STICKERS } from "@/constants/stickers"; // Import Sticker

const WatchRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const stompClientRef = useRef<any>(null);
  const isSyncing = useRef(false);

  // States
  const [room, setRoom] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // State Sync
  const [initialSeekTime, setInitialSeekTime] = useState(0);

  // State UI
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [onlineCount, setOnlineCount] = useState(1);

  // 1. Check Login
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { navigate("/login"); return; }
    setCurrentUser(JSON.parse(userStr));
  }, []);

  // 2. Init Room & Data
  useEffect(() => {
    const initRoom = async () => {
      try {
        setLoading(true);
        const resRoom = await api.get(`/api/rooms/${id}`);
        setRoom(resRoom.data);

        // Lưu thời gian server để sync sau khi video load xong metadata
        setInitialSeekTime(resRoom.data.currentTime || 0);
        if (resRoom.data.isPlaying) setIsPlaying(true);

        try {
          const resChat = await api.get(`/api/rooms/${id}/messages`);
          const history = resChat.data.map((msg: any) => ({
            ...msg,
            type: 'CHAT' // Đảm bảo đúng type
          }));
          setChatMessages(history);
        } catch (e) { console.log("Lỗi tải chat cũ"); }

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

  // 3. Socket Logic
  const connectSocket = (roomCode: string, hostName: string) => {
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = Stomp.over(socket);
    client.debug = () => {};

    client.connect({}, () => {
      stompClientRef.current = client;

      // Gửi tín hiệu JOIN để Host biết mà sync
      const me = JSON.parse(localStorage.getItem("user") || "{}");
      client.send(`/app/join/${roomCode}`, {}, JSON.stringify({ type: 'JOIN', senderName: me.username }));

      client.subscribe(`/topic/room/${roomCode}`, (payload: any) => {
        const data = JSON.parse(payload.body);
        handleSocketData(data, hostName, me.username);
      });
    });
  };

  const handleSocketData = (data: any, hostName: string, myName: string) => {
    if (data.type === 'CHAT') {
      setChatMessages(prev => [...prev, data]);
    }
    else if (data.type === 'COUNT') {
      setOnlineCount(parseInt(data.message));
    }
    else if (['PLAY', 'PAUSE', 'SEEK'].includes(data.type)) {
      handleVideoSync(data);
    }
    // LOGIC JOIN: Host tự động gửi thời gian cho người mới
    else if (data.type === 'JOIN') {
      if (data.senderName !== myName && myName === hostName) {
        sendSync(videoRef.current?.paused ? 'PAUSE' : 'PLAY');
      }
    }
  };

  // 4. Video Sync Logic (Giữ nguyên logic chuẩn)
  const handleVideoSync = (data: any) => {
    if (!videoRef.current) return;
    isSyncing.current = true;
    const diff = Math.abs(videoRef.current.currentTime - data.seekTime);

    if (data.type === 'PAUSE') {
      videoRef.current.pause();
      setIsPlaying(false);
      if (diff > 0.5) videoRef.current.currentTime = data.seekTime;
    } else if (data.type === 'PLAY') {
      if (diff > 1) videoRef.current.currentTime = data.seekTime;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else if (data.type === 'SEEK') {
      videoRef.current.currentTime = data.seekTime;
    }
    setTimeout(() => { isSyncing.current = false; }, 500);
  };

  const sendSync = (type: string) => {
    if (!stompClientRef.current || isSyncing.current || !videoRef.current) return;
    stompClientRef.current.send(`/app/sync/${id}`, {}, JSON.stringify({
      type: type, seekTime: videoRef.current.currentTime
    }));
  };

  const onVideoLoaded = () => {
    if (videoRef.current && initialSeekTime > 0) {
      videoRef.current.currentTime = initialSeekTime;
      if (isPlaying) videoRef.current.play().catch(() => {});
    }
  };

  // 5. Chat & Sticker Logic
  const sendMessageToSocket = (msgContent: string) => {
    if (!stompClientRef.current) return;
    stompClientRef.current.send(`/app/chat/${id}`, {}, JSON.stringify({
      type: 'CHAT', message: msgContent, senderName: currentUser.username, avatar: currentUser.avatar
    }));
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessageToSocket(messageInput);
      setMessageInput("");
    }
  };

  const handleSendSticker = (url: string) => {
    sendMessageToSocket(`STICKER|${url}`);
    setShowStickerPicker(false);
  };

  // --- RENDER ---
  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-white"><Loader2 className="animate-spin mr-2"/> Đang tải...</div>;
  if (!room) return null;

  return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="border-b border-border px-4 py-3 bg-card/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/rooms")}><ArrowLeft className="h-5 w-5"/></Button>
            <div>
              <h1 className="font-bold text-lg">{room.movie?.title}</h1>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <Badge variant="secondary">Code: {room.roomCode}</Badge>
                <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 text-green-600 border-green-500/20">
                  <Users className="h-3 w-3" /> {onlineCount} online
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => {navigator.clipboard.writeText(window.location.href); toast({title: "Đã copy link!"});}}>
            <Copy className="h-4 w-4 mr-2" /> Mời bạn bè
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* VIDEO */}
          <div className="flex-1 bg-black flex items-center justify-center relative group">
            {videoError ? <div className="text-red-500">Lỗi tải video</div> : (
                <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    controls
                    src={getImageUrl(room.movie?.videoUrl)}
                    onError={() => setVideoError(true)}
                    onLoadedMetadata={onVideoLoaded} // Sync khởi tạo
                    onPlay={() => { setIsPlaying(true); sendSync('PLAY'); }}
                    onPause={() => { setIsPlaying(false); sendSync('PAUSE'); }}
                    onSeeked={() => sendSync('SEEK')}
                />
            )}
          </div>

          {/* CHAT */}
          <Card className="w-80 md:w-96 border-l border-border rounded-none flex flex-col bg-card h-full shrink-0 z-10 relative">
            <div className="p-3 border-b font-bold bg-card/50 flex justify-between items-center">
              <span>Chat nhóm</span>
              <span className="text-xs text-green-500 flex items-center gap-1">● Live</span>
            </div>

            <ScrollArea className="flex-1 p-4 bg-background/30">
              <div className="space-y-3">
                {chatMessages.map((msg, idx) => {
                  const isMe = msg.senderName === currentUser?.username;
                  const isSticker = msg.message?.startsWith("STICKER|");
                  const content = isSticker ? msg.message.split("|")[1] : msg.message;

                  return (
                      <div key={idx} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <Avatar className="w-8 h-8 border border-white/10 mt-1">
                          <AvatarImage src={getImageUrl(msg.avatar)} />
                          <AvatarFallback>{msg.senderName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div className={`max-w-[80%]`}>
                          <div className={`text-[10px] opacity-70 mb-1 ${isMe ? 'text-right' : ''}`}>{msg.senderName}</div>
                          {isSticker ? (
                              <img src={content} className="w-24 h-24 object-contain rounded-lg hover:scale-110 transition-transform" />
                          ) : (
                              <div className={`p-2 rounded-lg text-sm ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                {content}
                              </div>
                          )}
                        </div>
                      </div>
                  )
                })}
              </div>
            </ScrollArea>

            {/* STICKER PICKER */}
            {showStickerPicker && (
                <div className="absolute bottom-16 left-2 right-2 bg-card border border-border rounded-lg shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-bold text-muted-foreground">Sticker</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowStickerPicker(false)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                    {STICKERS.map((url, i) => (
                        <div key={i} className="cursor-pointer hover:bg-muted p-1 rounded flex justify-center" onClick={() => handleSendSticker(url)}>
                          <img src={url} className="w-16 h-16 object-contain" loading="lazy" />
                        </div>
                    ))}
                  </div>
                </div>
            )}

            <div className="p-3 border-t mt-auto flex gap-2 items-center bg-card">
              <Button variant="ghost" size="icon" onClick={() => setShowStickerPicker(!showStickerPicker)} className={showStickerPicker ? "text-primary bg-primary/10" : "text-muted-foreground"}>
                <Smile className="h-5 w-5" />
              </Button>
              <Input value={messageInput} onChange={e=>setMessageInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSendMessage()} placeholder="Chat..." className="flex-1" />
              <Button onClick={handleSendMessage} size="icon"><Send className="h-4 w-4" /></Button>
            </div>
          </Card>
        </div>
      </div>
  );
};

export default WatchRoom;