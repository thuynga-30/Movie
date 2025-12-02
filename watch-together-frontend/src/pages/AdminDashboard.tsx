import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Film, Plus, Trash2, Loader2, RefreshCw, Pencil } from "lucide-react"; // Đã bỏ icon Eye
import { api, getImageUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Data State
  const [users, setUsers] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State (Add)
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMovie, setNewMovie] = useState({ title: "", description: "", videoUrl: "", releaseYear: "2024", duration: "", categoryId: "1" });
  const [posterFile, setPosterFile] = useState<File | null>(null);

  // Form State (Edit)
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check quyền Admin
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { navigate("/login"); return; }
    const user = JSON.parse(userStr);

    // Check role (admin thường hoặc ADMIN hoa tùy db)
    if (user.role !== "admin" && user.role !== "ADMIN") {
      alert("Bạn không có quyền truy cập!");
      navigate("/");
    } else {
      fetchData();
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, moviesRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/movies?size=100&sort=id,desc")
      ]);
      setUsers(usersRes.data);
      setMovies(moviesRes.data.content || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải dữ liệu admin." });
    } finally {
      setLoading(false);
    }
  };

  // --- XỬ LÝ THÊM PHIM ---
  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", newMovie.title);
      formData.append("description", newMovie.description);
      formData.append("videoUrl", newMovie.videoUrl);
      formData.append("releaseYear", newMovie.releaseYear);
      formData.append("duration", newMovie.duration);
      formData.append("categoryId", newMovie.categoryId);
      if(posterFile) formData.append("poster", posterFile);

      await api.post("/api/admin/movies", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast({ title: "Thành công", description: "Đã thêm phim mới!" });
      setIsAddOpen(false);
      setNewMovie({ title: "", description: "", videoUrl: "", releaseYear: "2024", duration: "", categoryId: "1" });
      fetchData();
    } catch(e) { toast({variant: "destructive", title: "Lỗi", description: "Thêm thất bại"}); }
    finally { setIsSubmitting(false); }
  };

  // --- XỬ LÝ SỬA PHIM ---
  const openEditModal = (movie: any) => {
    setEditingMovie(movie);
    setEditPosterFile(null);
    setIsEditOpen(true);
  };

  const handleUpdateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", editingMovie.title);
      formData.append("description", editingMovie.description);
      formData.append("videoUrl", editingMovie.videoUrl);
      formData.append("releaseYear", editingMovie.releaseYear);
      formData.append("duration", editingMovie.duration);

      if (editPosterFile) {
        formData.append("poster", editPosterFile);
      }

      await api.put(`/api/admin/movies/${editingMovie.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast({ title: "Cập nhật thành công!" });
      setIsEditOpen(false);
      fetchData();
    } catch (e) {
      toast({ variant: "destructive", title: "Lỗi", description: "Cập nhật thất bại" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- XỬ LÝ XÓA ---
  const handleDeleteMovie = async (id: number) => {
    if(!confirm("Xóa phim này? Hành động không thể hoàn tác.")) return;
    try {
      await api.delete(`/api/admin/movies/${id}`);
      setMovies(movies.filter(m => m.id !== id));
      toast({title: "Đã xóa"});
    } catch(e) { toast({variant: "destructive", title: "Lỗi xóa"}); }
  };

  const handleDeleteUser = async (id: number) => {
    if(!confirm("Xóa user này?")) return;
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(users.filter(u => u.id !== id));
      toast({title: "Đã xóa user"});
    } catch(e) { toast({variant: "destructive", title: "Lỗi xóa"}); }
  };

  return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="flex flex-col gap-8">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Admin Dashboard</h1>
                <p className="text-muted-foreground mt-1">Quản lý nội dung và người dùng</p>
              </div>
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
              </Button>
            </div>

            {/* Thống kê */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Tổng Người dùng</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{users.length}</div></CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Tổng Phim</CardTitle><Film className="h-4 w-4 text-muted-foreground" /></CardHeader>
                <CardContent><div className="text-2xl font-bold">{movies.length}</div></CardContent>
              </Card>
            </div>

            {/* Tabs Chính */}
            <Tabs defaultValue="movies" className="space-y-4">
              <TabsList>
                <TabsTrigger value="movies">Quản lý Phim</TabsTrigger>
                <TabsTrigger value="users">Quản lý Người dùng</TabsTrigger>
              </TabsList>

              {/* --- TAB PHIM --- */}
              <TabsContent value="movies" className="space-y-4">
                <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border">
                  <h2 className="text-xl font-semibold">Danh sách phim</h2>

                  {/* MODAL THÊM PHIM */}
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" /> Thêm phim mới</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                      <DialogHeader><DialogTitle>Thêm phim mới</DialogTitle></DialogHeader>
                      <form onSubmit={handleAddMovie} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Tên phim</Label><Input value={newMovie.title} onChange={e=>setNewMovie({...newMovie, title: e.target.value})} required/></div>
                          <div className="space-y-2"><Label>Năm phát hành</Label><Input type="number" value={newMovie.releaseYear} onChange={e=>setNewMovie({...newMovie, releaseYear: e.target.value})} required/></div>
                        </div>
                        <div className="space-y-2"><Label>Link Video (URL)</Label><Input value={newMovie.videoUrl} onChange={e=>setNewMovie({...newMovie, videoUrl: e.target.value})} required/></div>
                        <div className="space-y-2"><Label>Mô tả phim</Label><Textarea value={newMovie.description} onChange={e=>setNewMovie({...newMovie, description: e.target.value})} rows={3}/></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Thời lượng (phút)</Label><Input type="number" value={newMovie.duration} onChange={e=>setNewMovie({...newMovie, duration: e.target.value})} required/></div>
                          <div className="space-y-2"><Label>Poster</Label><Input type="file" onChange={e=>setPosterFile(e.target.files?.[0]||null)} required/></div>
                        </div>
                        <Button type="submit" className="w-full bg-gradient-primary" disabled={isSubmitting}>{isSubmitting?"Đang xử lý...":"Thêm phim"}</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* BẢNG DANH SÁCH PHIM (ĐÃ XÓA CỘT VIEW) */}
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Poster</TableHead>
                        <TableHead>Tên phim</TableHead>
                        <TableHead>Năm</TableHead>
                        {/* Đã xóa cột Lượt xem ở đây */}
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movies.map(m => (
                          <TableRow key={m.id}>
                            <TableCell><img src={getImageUrl(m.poster)} className="w-10 h-14 object-cover rounded shadow-sm"/></TableCell>
                            <TableCell className="font-medium">{m.title}</TableCell>
                            <TableCell>{m.releaseYear}</TableCell>
                            {/* Đã xóa cột hiển thị View ở đây */}
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {/* Nút Sửa */}
                                <Button variant="secondary" size="icon" onClick={() => openEditModal(m)}>
                                  <Pencil className="h-4 w-4 text-blue-500"/>
                                </Button>
                                {/* Nút Xóa */}
                                <Button variant="secondary" size="icon" className="hover:bg-destructive/10" onClick={()=>handleDeleteMovie(m.id)}>
                                  <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>

              {/* --- TAB USER (Giữ nguyên) --- */}
              <TabsContent value="users">
                <Card>
                  <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Username</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Xóa</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {users.map(u => (
                          <TableRow key={u.id}>
                            <TableCell>#{u.id}</TableCell>
                            <TableCell className="font-bold">{u.username}</TableCell>
                            <TableCell><span className={`px-2 py-1 rounded text-xs font-bold ${u.role?.toUpperCase() === 'ADMIN'?'bg-red-100 text-red-600':'bg-blue-100 text-blue-600'}`}>{u.role}</span></TableCell>
                            <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={()=>handleDeleteUser(u.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                          </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* --- MODAL SỬA PHIM (Edit Dialog) --- */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>Chỉnh sửa phim</DialogTitle></DialogHeader>
            {editingMovie && (
                <form onSubmit={handleUpdateMovie} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Tên phim</Label><Input value={editingMovie.title} onChange={e=>setEditingMovie({...editingMovie, title: e.target.value})} required/></div>
                    <div className="space-y-2"><Label>Năm phát hành</Label><Input type="number" value={editingMovie.releaseYear} onChange={e=>setEditingMovie({...editingMovie, releaseYear: e.target.value})} required/></div>
                  </div>
                  <div className="space-y-2"><Label>Link Video (URL)</Label><Input value={editingMovie.videoUrl} onChange={e=>setEditingMovie({...editingMovie, videoUrl: e.target.value})} required/></div>
                  <div className="space-y-2"><Label>Mô tả phim</Label><Textarea value={editingMovie.description} onChange={e=>setEditingMovie({...editingMovie, description: e.target.value})} rows={3}/></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Thời lượng (phút)</Label><Input type="number" value={editingMovie.duration} onChange={e=>setEditingMovie({...editingMovie, duration: e.target.value})} required/></div>
                    <div className="space-y-2">
                      <Label>Poster Mới (Bỏ trống nếu không đổi)</Label>
                      <Input type="file" onChange={e=>setEditPosterFile(e.target.files?.[0]||null)} />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
                    <Button type="submit" className="bg-gradient-primary" disabled={isSubmitting}>{isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}</Button>
                  </div>
                </form>
            )}
          </DialogContent>
        </Dialog>

      </div>
  );
};

export default AdminDashboard;