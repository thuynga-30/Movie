import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Lock, Globe, Loader2, Trash2, PlayCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, getImageUrl } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Rooms = () => {
  const [joinCode, setJoinCode] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data States
  const [movies, setMovies] = useState<any[]>([]);
  const [myRooms, setMyRooms] = useState<any[]>([]); // Phòng của tôi
  const [activeRooms, setActiveRooms] = useState<any[]>([]); // Phòng công khai

  // Create Room States
  const [selectedMovieId, setSelectedMovieId] = useState("");
  const [roomPrivacy, setRoomPrivacy] = useState("public");
  const [roomPassword, setRoomPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // 1. Load Dữ liệu
  useEffect(() => {
    fetchMovies();
    fetchMyRooms();
    fetchPublicRooms();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await api.get("/api/movies?size=100");
      setMovies(res.data.content || []);
    } catch (e) { console.error(e); }
  };

  const fetchMyRooms = async () => {
    if (!localStorage.getItem("token")) return;
    try {
      const res = await api.get("/api/rooms/my-rooms");
      setMyRooms(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchPublicRooms = async () => {
    try {
      const res = await api.get("/api/rooms/public");
      setActiveRooms(res.data);
    } catch (e) { console.error(e); }
  };

  // 2. Tạo phòng
  const handleCreateRoom = async () => {
    if (!selectedMovieId) return toast({ variant: "destructive", title: "Chưa chọn phim!" });
    if (roomPrivacy === "private" && !roomPassword) return toast({ variant: "destructive", title: "Cần mật khẩu cho phòng riêng tư!" });

    try {
      setCreating(true);
      const res = await api.post("/api/rooms", null, {
        params: {
          movieId: selectedMovieId,
          isPrivate: roomPrivacy === "private",
          password: roomPassword
        }
      });
      toast({ title: "Thành công", description: "Đã tạo phòng mới!" });
      setIsCreateOpen(false);
      navigate(`/room/${res.data.roomCode}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể tạo phòng." });
    } finally {
      setCreating(false);
    }
  };

  // 3. Vào phòng bằng mã
  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return;
    try {
      await api.post("/api/rooms/check-join", { roomCode: joinCode, password: joinPassword });
      navigate(`/room/${joinCode}`);
    } catch (error) {
      if (error.response?.status === 403) {
        toast({ variant: "destructive", title: "Lỗi", description: "Mật khẩu phòng không đúng." });
      } else {
        toast({ variant: "destructive", title: "Lỗi", description: "Phòng không tồn tại." });
      }
    }
  };

  // 4. Xóa phòng
  const handleDeleteRoom = async (roomCode: string) => {
    if (!confirm("Bạn có chắc chắn muốn giải tán phòng này?")) return;
    try {
      await api.delete(`/api/rooms/${roomCode}`);
      toast({ title: "Đã xóa", description: `Đã giải tán phòng ${roomCode}` });
      setMyRooms(myRooms.filter(r => r.roomCode !== roomCode));
      setActiveRooms(activeRooms.filter(r => r.roomCode !== roomCode)); // Cập nhật cả list công khai nếu có
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể xóa phòng." });
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Đã sao chép mã!" });
  };

  return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />

        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Phòng <span className="text-primary">xem chung</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Tạo không gian riêng tư để xem phim cùng bạn bè
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* THAM GIA PHÒNG */}
              <Card className="p-6 bg-card border-border shadow-lg">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Users className="text-primary"/> Tham gia phòng</h3>
                <div className="space-y-3">
                  <Input placeholder="Mã phòng (VD: ROOM123)" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} />
                  <Input type="password" placeholder="Mật khẩu (nếu có)" value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} />
                  <Button onClick={handleJoinRoom} className="w-full bg-gradient-primary">Vào ngay</Button>
                </div>
              </Card>

              {/* TẠO PHÒNG */}
              <Card className="p-6 bg-card border-border shadow-lg">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="text-primary"/> Tạo phòng mới</h3>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full h-12 text-lg border-2 border-dashed border-primary/50 hover:border-primary bg-transparent text-primary hover:bg-primary/10">
                      + Bấm để tạo phòng
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Thiết lập phòng</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Chọn phim</Label>
                        <Select onValueChange={setSelectedMovieId}>
                          <SelectTrigger><SelectValue placeholder="Chọn phim..." /></SelectTrigger>
                          <SelectContent>
                            {movies.map(m => <SelectItem key={m.id} value={m.id.toString()}>{m.title}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quyền riêng tư</Label>
                        <Select value={roomPrivacy} onValueChange={setRoomPrivacy}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="public">Công khai</SelectItem>
                            <SelectItem value="private">Riêng tư (Cần mật khẩu)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {roomPrivacy === "private" && (
                          <div className="space-y-2"><Label>Mật khẩu</Label><Input value={roomPassword} onChange={e => setRoomPassword(e.target.value)} /></div>
                      )}
                      <Button onClick={handleCreateRoom} disabled={creating} className="w-full bg-gradient-primary">
                        {creating ? <Loader2 className="animate-spin" /> : "Tạo Phòng"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </Card>
            </div>

            {/* DANH SÁCH PHÒNG CỦA TÔI */}
            {myRooms.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Globe className="text-blue-500" /> Phòng đang quản lý ({myRooms.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myRooms.map((room) => (
                        <Card key={room.id} className="p-4 border-l-4 border-l-primary flex flex-col justify-between hover:shadow-md transition-shadow">
                          <div>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-lg truncate pr-2">{room.movie?.title}</h4>
                              {room.isPrivate ? <Lock className="h-4 w-4 text-orange-500" /> : <Globe className="h-4 w-4 text-green-500" />}
                            </div>
                            <div className="flex items-center gap-2 bg-muted p-2 rounded mb-3 cursor-pointer hover:bg-muted/80" onClick={() => copyCode(room.roomCode)}>
                              <span className="font-mono font-bold text-primary">{room.roomCode}</span>
                              <Copy className="h-3 w-3 text-muted-foreground" />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-auto">
                            <Button size="sm" className="flex-1 bg-primary/10 text-primary hover:bg-primary/20" onClick={() => navigate(`/room/${room.roomCode}`)}>
                              <PlayCircle className="h-4 w-4 mr-1" /> Vào lại
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteRoom(room.roomCode)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                    ))}
                  </div>
                </div>
            )}

            {/* DANH SÁCH PHÒNG CÔNG KHAI */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Globe className="text-green-500" /> Phòng đang chiếu ({activeRooms.length})
              </h2>
              {activeRooms.length === 0 ? <p className="text-muted-foreground">Chưa có phòng công khai nào.</p> : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeRooms.map((room) => (
                        <Card key={room.id} className="overflow-hidden hover:shadow-lg transition-all group">
                          <div className="relative h-40 overflow-hidden">
                            <img src={getImageUrl(room.movie?.poster)} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link to={`/room/${room.roomCode}`}>
                                <Button className="rounded-full bg-primary hover:bg-primary/90">
                                  <PlayCircle className="mr-2 h-4 w-4" /> Tham gia
                                </Button>
                              </Link>
                            </div>
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold truncate pr-2">{room.movie?.title}</h3>
                              <Badge variant="secondary" className="font-mono text-xs">{room.roomCode}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Đang xem</span>
                              <span className="flex items-center gap-1 text-green-500">● Online</span>
                            </div>
                          </div>
                        </Card>
                    ))}
                  </div>
              )}
            </div>

          </div>
        </div>
      </div>
  );
};

export default Rooms;