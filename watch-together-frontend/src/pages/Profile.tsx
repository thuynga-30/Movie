import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import MovieCard from "@/components/MovieCard";
import { Camera, History, Heart, Loader2, LogOut } from "lucide-react";
import { api, getImageUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 1. Load dữ liệu
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        // Gọi 3 API song song
        const [userRes, favRes, histRes] = await Promise.all([
          api.get("/api/user/me"),
          api.get("/api/interactions/favorites"),
          api.get("/api/interactions/history")
        ]);

        const userData = userRes.data;
        setUser(userData);
        setEmail(userData.email || ""); // Điền email vào form

        setFavorites(favRes.data);
        setHistory(histRes.data.map((h) => ({ ...h.movie, watchedAt: h.watchedAt })));

      } catch (error) {
        console.error("Lỗi tải profile:", error);
        toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải dữ liệu." });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // 2. Upload Avatar
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await api.post("/api/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // Update UI ngay lập tức
      const newUser = { ...user, avatar: res.data.avatar };
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser)); // Update cache
      toast({ title: "Thành công", description: "Đã đổi ảnh đại diện!" });

    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể upload ảnh." });
    } finally {
      setUploading(false);
    }
  };

  // 3. Cập nhật thông tin (Email/Pass)
  const handleUpdate = async () => {
    try {
      const payload: any = { email };
      if (password.trim()) payload.password = password;

      const res = await api.put("/api/user/update", payload);

      setUser(res.data);
      localStorage.setItem("user", JSON.stringify(res.data));

      toast({ title: "Đã lưu", description: "Cập nhật thông tin thành công." });
      setPassword(""); // Xóa mật khẩu sau khi lưu xong
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: error.response?.data || "Cập nhật thất bại." });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated={true} userName={user?.username} userAvatar={getImageUrl(user?.avatar)} />

        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4">

            {/* HEADER */}
            <Card className="p-8 mb-8 bg-card border-border relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-primary opacity-20" />
              <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">

                {/* AVATAR (Click để đổi) */}
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={getImageUrl(user?.avatar)} className="object-cover" />
                    <AvatarFallback className="text-4xl">{user?.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploading ? <Loader2 className="animate-spin text-white" /> : <Camera className="text-white h-8 w-8" />}
                  </div>
                </div>

                <div className="text-center md:text-left flex-1">
                  <h1 className="text-3xl font-bold">{user?.username}</h1>
                  <p className="text-muted-foreground">{user?.email}</p>

                  <div className="flex justify-center md:justify-start gap-8 mt-4">
                    <div className="text-center"><div className="font-bold text-xl">{history.length}</div><div className="text-xs text-muted-foreground">Đã xem</div></div>
                    <div className="text-center"><div className="font-bold text-xl">{favorites.length}</div><div className="text-xs text-muted-foreground">Yêu thích</div></div>
                  </div>
                </div>

                <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </Button>
              </div>
            </Card>

            {/* TABS */}
            <Tabs defaultValue="favorites" className="space-y-6">
              <TabsList className="bg-card border border-border">
                <TabsTrigger value="favorites" className="gap-2"><Heart className="h-4 w-4"/> Yêu thích</TabsTrigger>
                <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4"/> Lịch sử</TabsTrigger>
                <TabsTrigger value="settings">Cài đặt</TabsTrigger>
              </TabsList>

              <TabsContent value="favorites">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {favorites.map(m => <MovieCard key={m.id} {...m} poster={getImageUrl(m.poster)} isFavorite={true} />)}
                  {favorites.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">Chưa có phim yêu thích.</p>}
                </div>
              </TabsContent>

              <TabsContent value="history">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {history.map((m, i) => <MovieCard key={i} {...m} poster={getImageUrl(m.poster)} />)}
                  {history.length === 0 && <p className="text-muted-foreground col-span-full text-center py-10">Chưa có lịch sử xem.</p>}
                </div>
              </TabsContent>

              <TabsContent value="settings">
                <Card className="p-6 bg-card border-border max-w-xl">
                  <h2 className="text-xl font-bold mb-4">Cài đặt tài khoản</h2>
                  <div className="space-y-4">

                    <div className="space-y-2">
                      <Label>Tên đăng nhập</Label>
                      <Input value={user?.username} disabled className="bg-muted opacity-70" />
                      <p className="text-xs text-muted-foreground">Không thể thay đổi tên đăng nhập.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={email} onChange={e => setEmail(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Mật khẩu mới</Label>
                      <Input type="password" placeholder="••••••" value={password} onChange={e => setPassword(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Chỉ điền nếu muốn đổi mật khẩu.</p>
                    </div>

                    <div className="pt-2">
                      <Button className="bg-gradient-primary w-full md:w-auto" onClick={handleUpdate}>
                        Lưu thay đổi
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
  );
};

export default Profile;