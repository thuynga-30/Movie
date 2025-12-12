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
// Thêm icon List
import { Users, Film, Plus, Trash2, Loader2, RefreshCw, Pencil, FileVideo, Link, List } from "lucide-react";
import { api, getImageUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- STATES ---
  const [users, setUsers] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ STATE CHO THỂ LOẠI MỚI
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false); // Chế độ nhập mới
  const [newCategoryName, setNewCategoryName] = useState("");      // Tên thể loại mới

  // Add Form States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMovie, setNewMovie] = useState({
    title: "", description: "", videoUrl: "", releaseYear: "2024", duration: "",
    categoryId: ""
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Edit Form States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);

  // Check quyền Admin
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { navigate("/login"); return; }
    const user = JSON.parse(userStr);
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
      const [usersRes, moviesRes, categoriesRes] = await Promise.all([
        api.get("/api/admin/users"),
        api.get("/api/movies?size=100&sort=id,desc"),
        api.get("/api/categories")
      ]);

      const onlyNormalUsers = usersRes.data.filter((u: any) => u.role === 'user' || u.role === 'USER');
      setUsers(onlyNormalUsers);
      setMovies(moviesRes.data.content || []);
      setCategories(categoriesRes.data || []);

      if (categoriesRes.data.length > 0) {
        setNewMovie(prev => ({ ...prev, categoryId: categoriesRes.data[0].id }));
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải dữ liệu." });
    } finally {
      setLoading(false);
    }
  };

  // --- HÀM HỖ TRỢ: TẠO CATEGORY MỚI NẾU CẦN ---
  const getFinalCategoryId = async (currentId: string) => {
    // Nếu không phải chế độ nhập mới -> Dùng ID cũ
    if (!isNewCategoryMode) return currentId;

    // Nếu đang nhập mới mà để trống -> Lỗi
    if (!newCategoryName.trim()) throw new Error("Vui lòng nhập tên thể loại mới!");

    // Gọi API tạo thể loại mới
    const res = await api.post("/api/categories", { name: newCategoryName });

    // Refresh lại list categories để lần sau dùng
    const catRes = await api.get("/api/categories");
    setCategories(catRes.data);

    // Trả về ID của thể loại vừa tạo
    return res.data.id;
  };

  // --- XỬ LÝ THÊM PHIM ---
  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Xử lý Category (Tạo mới hoặc lấy cũ)
      const finalCatId = await getFinalCategoryId(newMovie.categoryId);

      const formData = new FormData();
      formData.append("title", newMovie.title);
      formData.append("description", newMovie.description);
      formData.append("releaseYear", newMovie.releaseYear);
      formData.append("duration", newMovie.duration);
      formData.append("categoryId", finalCatId); // Dùng ID chuẩn

      if(posterFile) formData.append("poster", posterFile);

      if (videoFile) formData.append("videoFile", videoFile);
      else formData.append("videoUrl", newMovie.videoUrl);

      await api.post("/api/admin/movies", formData, { headers: { "Content-Type": "multipart/form-data" } });

      toast({ title: "Thành công", description: "Đã thêm phim mới!" });
      setIsAddOpen(false);

      // Reset form
      setNewMovie({
        title: "", description: "", videoUrl: "", releaseYear: "2024", duration: "",
        categoryId: categories.length > 0 ? categories[0].id : ""
      });
      setVideoFile(null);
      setPosterFile(null);
      setIsNewCategoryMode(false); // Reset chế độ
      setNewCategoryName("");

      fetchData();
    } catch(e: any) {
      toast({variant: "destructive", title: "Lỗi", description: e.message || "Thêm thất bại."});
    } finally { setIsSubmitting(false); }
  };

  // --- XỬ LÝ SỬA PHIM ---
  const openEditModal = (movie: any) => {
    setEditingMovie({
      ...movie,
      categoryId: movie.category?.id || (categories.length > 0 ? categories[0].id : "")
    });
    setEditPosterFile(null);
    setEditVideoFile(null);
    setIsNewCategoryMode(false); // Reset chế độ khi mở modal sửa
    setNewCategoryName("");
    setIsEditOpen(true);
  };

  const handleUpdateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;
    setIsSubmitting(true);

    try {
      // 1. Xử lý Category
      const finalCatId = await getFinalCategoryId(editingMovie.categoryId);

      const formData = new FormData();
      formData.append("title", editingMovie.title);
      formData.append("description", editingMovie.description);
      formData.append("releaseYear", editingMovie.releaseYear);
      formData.append("duration", editingMovie.duration);
      formData.append("categoryId", finalCatId);

      formData.append("videoUrl", editingMovie.videoUrl);

      if (editPosterFile) formData.append("poster", editPosterFile);
      if (editVideoFile) formData.append("videoFile", editVideoFile);

      await api.put(`/api/admin/movies/${editingMovie.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast({ title: "Cập nhật thành công!" });
      setIsEditOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Lỗi", description: e.message || "Cập nhật thất bại" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMovie = async (id: number) => {
    if(!confirm("Xóa phim này?")) return;
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
      toast({title: "Đã xóa"});
    } catch(e) {}
  };

  return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="flex flex-col gap-8">

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Admin Dashboard</h1>
              </div>
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tổng Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{users.length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tổng Phim</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{movies.length}</div></CardContent></Card>
            </div>

            <Tabs defaultValue="movies" className="space-y-4">
              <TabsList>
                <TabsTrigger value="movies">Quản lý Phim</TabsTrigger>
                <TabsTrigger value="users">Quản lý User</TabsTrigger>
              </TabsList>

              <TabsContent value="movies" className="space-y-4">
                <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
                  <h2 className="text-xl font-semibold">Danh sách phim</h2>

                  {/* --- ADD MODAL --- */}
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" /> Thêm phim mới</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                      <DialogHeader><DialogTitle>Thêm phim mới</DialogTitle></DialogHeader>
                      <form onSubmit={handleAddMovie} className="space-y-4 py-4">

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Tên phim</Label><Input value={newMovie.title} onChange={e=>setNewMovie({...newMovie, title: e.target.value})} required/></div>
                          <div className="space-y-2"><Label>Năm phát hành</Label><Input type="number" value={newMovie.releaseYear} onChange={e=>setNewMovie({...newMovie, releaseYear: e.target.value})} required/></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Thời lượng (phút)</Label><Input type="number" value={newMovie.duration} onChange={e=>setNewMovie({...newMovie, duration: e.target.value})} required/></div>

                          {/* ✅ CHỌN HOẶC TẠO MỚI THỂ LOẠI */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>Thể loại</Label>
                              {/* Nút chuyển đổi */}
                              <span
                                  className="text-[10px] text-primary cursor-pointer hover:underline flex items-center gap-1"
                                  onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}
                              >
                                    {isNewCategoryMode ? <><List className="h-3 w-3"/> Chọn có sẵn</> : <><Plus className="h-3 w-3"/> Thêm mới</>}
                                  </span>
                            </div>

                            {isNewCategoryMode ? (
                                // Ô nhập mới
                                <Input
                                    placeholder="Nhập tên thể loại mới..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="border-primary"
                                    autoFocus
                                />
                            ) : (
                                // Ô chọn cũ
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={newMovie.categoryId}
                                    onChange={(e) => setNewMovie({...newMovie, categoryId: e.target.value})}
                                    required
                                >
                                  {categories.map((cat) => (
                                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                                  ))}
                                </select>
                            )}
                          </div>
                        </div>

                        {/* Video Input (Giữ nguyên) */}
                        <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-dashed border-primary/20">
                          <Label className="text-primary font-bold flex items-center gap-2"><FileVideo className="h-4 w-4"/> Nguồn Video (Chọn 1 trong 2)</Label>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Link className="h-3 w-3"/> Cách 1: Link Online</Label>
                            <Input placeholder="https://..." value={newMovie.videoUrl} onChange={e=>setNewMovie({...newMovie, videoUrl: e.target.value})} disabled={!!videoFile} />
                          </div>
                          <div className="text-center text-xs text-muted-foreground font-bold">- HOẶC -</div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Cách 2: Upload file</Label>
                            <div className="flex gap-2">
                              <Input type="file" accept="video/*" onChange={e=>setVideoFile(e.target.files?.[0]||null)} className="cursor-pointer file:text-primary"/>
                              {videoFile && <Button type="button" variant="ghost" size="icon" onClick={()=>setVideoFile(null)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2"><Label>Mô tả</Label><Textarea value={newMovie.description} onChange={e=>setNewMovie({...newMovie, description: e.target.value})} rows={3}/></div>
                        <div className="space-y-2"><Label>Poster</Label><Input type="file" accept="image/*" onChange={e=>setPosterFile(e.target.files?.[0]||null)} required/></div>

                        <Button type="submit" className="w-full bg-gradient-primary" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : "Thêm phim"}</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <Table>
                    <TableHeader><TableRow><TableHead>Poster</TableHead><TableHead>Tên</TableHead><TableHead>Thể loại</TableHead><TableHead>Năm</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
                    <TableBody>{movies.map(m => (
                        <TableRow key={m.id}>
                          <TableCell><img src={getImageUrl(m.poster)} className="w-10 h-14 object-cover rounded shadow-sm"/></TableCell>
                          <TableCell className="font-medium">{m.title}</TableCell>
                          <TableCell><span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">{m.category?.name}</span></TableCell>
                          <TableCell>{m.releaseYear}</TableCell>
                          <TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="secondary" size="icon" onClick={() => openEditModal(m)}><Pencil className="h-4 w-4 text-blue-500"/></Button><Button variant="secondary" size="icon" onClick={()=>handleDeleteMovie(m.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></TableCell>
                        </TableRow>
                    ))}</TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Xóa</TableHead></TableRow></TableHeader><TableBody>{users.map(u=><TableRow key={u.id}><TableCell>{u.username}</TableCell><TableCell>{u.role}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={()=>handleDeleteUser(u.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell></TableRow>)}</TableBody></Table></Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* --- EDIT MODAL (Cập nhật tương tự) --- */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>Sửa phim</DialogTitle></DialogHeader>
            {editingMovie && (
                <form onSubmit={handleUpdateMovie} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Tên phim</Label><Input value={editingMovie.title} onChange={e=>setEditingMovie({...editingMovie, title: e.target.value})} required/></div>
                    <div className="space-y-2"><Label>Năm</Label><Input type="number" value={editingMovie.releaseYear} onChange={e=>setEditingMovie({...editingMovie, releaseYear: e.target.value})} required/></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Thời lượng</Label><Input type="number" value={editingMovie.duration} onChange={e=>setEditingMovie({...editingMovie, duration: e.target.value})} required/></div>

                    {/* ✅ EDIT: CHỌN HOẶC NHẬP MỚI */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Thể loại</Label>
                        <span
                            className="text-[10px] text-primary cursor-pointer hover:underline flex items-center gap-1"
                            onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}
                        >
                                    {isNewCategoryMode ? <><List className="h-3 w-3"/> Chọn có sẵn</> : <><Plus className="h-3 w-3"/> Thêm mới</>}
                                  </span>
                      </div>
                      {isNewCategoryMode ? (
                          <Input
                              placeholder="Tên thể loại mới..."
                              value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                              className="border-primary" autoFocus
                          />
                      ) : (
                          <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={editingMovie.categoryId} onChange={(e) => setEditingMovie({...editingMovie, categoryId: e.target.value})} required
                          >
                            {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                          </select>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-dashed border-primary/20">
                    <Label className="text-primary font-bold">Cập nhật Video</Label>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Link mới:</Label>
                      <Input value={editingMovie.videoUrl} onChange={e=>setEditingMovie({...editingMovie, videoUrl: e.target.value})} disabled={!!editVideoFile} />
                    </div>
                    <div className="text-center text-xs font-bold">- HOẶC -</div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Upload file mới:</Label>
                      <div className="flex gap-2">
                        <Input type="file" accept="video/*" onChange={e=>setEditVideoFile(e.target.files?.[0]||null)} />
                        {editVideoFile && <Button type="button" variant="ghost" size="icon" onClick={()=>setEditVideoFile(null)}><Trash2 className="h-4 w-4"/></Button>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2"><Label>Mô tả</Label><Textarea value={editingMovie.description} onChange={e=>setEditingMovie({...editingMovie, description: e.target.value})} rows={3}/></div>
                  <div className="space-y-2"><Label>Poster mới</Label><Input type="file" accept="image/*" onChange={e=>setEditPosterFile(e.target.files?.[0]||null)} /></div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
                    <Button type="submit" className="bg-gradient-primary" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : "Lưu"}</Button>
                  </div>
                </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default AdminDashboard;