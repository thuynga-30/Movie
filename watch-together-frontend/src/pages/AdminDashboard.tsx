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
// Icons
import { Users, Plus, Trash2, Loader2, RefreshCw, Pencil, FileVideo, Link, List, Wand2, Youtube, Image as ImageIcon } from "lucide-react";
import { api, getImageUrl } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // --- STATES DỮ LIỆU ---
  const [users, setUsers] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATES TMDB ---
  const [tmdbKeyword, setTmdbKeyword] = useState("");
  const [isFetchingTmdb, setIsFetchingTmdb] = useState(false);
  const [tmdbPosterPreview, setTmdbPosterPreview] = useState("");
  const [tmdbPosterUrl, setTmdbPosterUrl] = useState("");

  // --- STATES FORM ---
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMovie, setNewMovie] = useState({
    title: "", description: "", videoUrl: "", releaseYear: "2024", duration: "",
    categoryId: ""
  });
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // --- EDIT STATES ---
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<any>(null);
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null);
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);

  // Check quyền
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
        api.get("/api/admin/movies"),
        api.get("/api/categories")
      ]);

      setUsers(usersRes.data);
      const moviesData = Array.isArray(moviesRes.data) ? moviesRes.data : (moviesRes.data.content || []);
      setMovies(moviesData);
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

  // 1. TMDB Logic
  const handleAutoFill = async () => {
    if (!tmdbKeyword.trim()) return toast({ title: "Vui lòng nhập tên phim!" });
    try {
      setIsFetchingTmdb(true);
      const res = await api.get(`/api/admin/movies/fetch-tmdb?title=${encodeURIComponent(tmdbKeyword)}`);
      const data = res.data;
      if (data) {
        const videos = data.videos?.results || [];
        const trailer = videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") || videos[0];
        const youtubeLink = trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "";

        setTmdbPosterPreview(data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : "");
        setTmdbPosterUrl(data.poster_path ? `https://image.tmdb.org/t/p/original${data.poster_path}` : "");

        const tmdbGenreName = data.genres && data.genres.length > 0 ? data.genres[0].name : "";
        let foundCatId = newMovie.categoryId;

        if (tmdbGenreName) {
          const existingCat = categories.find(c => c.name.toLowerCase() === tmdbGenreName.toLowerCase());
          if (existingCat) {
            foundCatId = existingCat.id;
            setIsNewCategoryMode(false);
            setNewCategoryName("");
            toast({ title: "Đã khớp thể loại!", description: `Đã chọn: ${existingCat.name}` });
          } else {
            setIsNewCategoryMode(true);
            setNewCategoryName(tmdbGenreName);
            toast({ title: "Thể loại mới", description: `Hệ thống đề xuất tạo: ${tmdbGenreName}` });
          }
        }

        setNewMovie(prev => ({
          ...prev,
          title: data.title,
          description: data.overview,
          releaseYear: data.release_date ? data.release_date.split("-")[0] : "2024",
          videoUrl: youtubeLink || prev.videoUrl,
          duration: data.runtime?.toString() || "120",
          categoryId: foundCatId
        }));
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Không tìm thấy phim trên TMDB" });
    } finally {
      setIsFetchingTmdb(false);
    }
  };

  // Helper: Get Category ID (Create if new)
  const getFinalCategoryId = async (currentId: string) => {
    if (!isNewCategoryMode) return currentId;
    if (!newCategoryName.trim()) throw new Error("Vui lòng nhập tên thể loại mới!");
    const res = await api.post("/api/categories", { name: newCategoryName });
    const catRes = await api.get("/api/categories");
    setCategories(catRes.data);
    return res.data.id;
  };

  // 2. Add Movie Logic
  const handleAddMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!posterFile && !tmdbPosterUrl) {
      return toast({ variant: "destructive", title: "Thiếu ảnh", description: "Vui lòng chọn ảnh hoặc kéo dữ liệu từ TMDB." });
    }
    setIsSubmitting(true);
    try {
      const finalCatId = await getFinalCategoryId(newMovie.categoryId);
      const formData = new FormData();
      formData.append("title", newMovie.title);
      formData.append("description", newMovie.description);
      formData.append("releaseYear", newMovie.releaseYear);
      formData.append("duration", newMovie.duration);
      formData.append("categoryId", finalCatId);

      if(posterFile) formData.append("poster", posterFile);
      else if (tmdbPosterUrl) formData.append("posterUrl", tmdbPosterUrl);

      if (videoFile) formData.append("videoFile", videoFile);
      else formData.append("videoUrl", newMovie.videoUrl);

      await api.post("/api/admin/movies", formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast({ title: "Thành công", description: "Đã thêm phim mới!" });
      setIsAddOpen(false);
      setNewMovie({ title: "", description: "", videoUrl: "", releaseYear: "2024", duration: "", categoryId: categories[0]?.id });
      setVideoFile(null); setPosterFile(null);
      setIsNewCategoryMode(false); setNewCategoryName("");
      setTmdbKeyword(""); setTmdbPosterUrl(""); setTmdbPosterPreview("");
      fetchData();
    } catch(e: any) {
      toast({variant: "destructive", title: "Lỗi", description: e.response?.data || "Thêm thất bại."});
    } finally { setIsSubmitting(false); }
  };

  // 3. Delete Logic
  const handleDeleteMovie = async (id: number) => {
    if(!confirm("Xóa phim này?")) return;
    try { await api.delete(`/api/admin/movies/${id}`); fetchData(); toast({title: "Đã xóa"}); } catch(e) { toast({variant: "destructive", title: "Lỗi xóa"}); }
  };
  const handleDeleteUser = async (id: number) => {
    if(!confirm("Xóa user này?")) return;
    try { await api.delete(`/api/admin/users/${id}`); fetchData(); toast({title: "Đã xóa"}); } catch(e) {}
  };

  // 4. Update Logic
  const openEditModal = (movie: any) => {
    setEditingMovie({ ...movie, categoryId: movie.category?.id || categories[0]?.id });
    // Reset Edit Files
    setEditPosterFile(null);
    setEditVideoFile(null);
    // Reset Category Logic
    setIsNewCategoryMode(false);
    setNewCategoryName("");
    setIsEditOpen(true);
  };

  const handleUpdateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalCatId = await getFinalCategoryId(editingMovie.categoryId);
      const formData = new FormData();
      formData.append("title", editingMovie.title);
      formData.append("description", editingMovie.description);
      formData.append("releaseYear", editingMovie.releaseYear);
      formData.append("duration", editingMovie.duration);
      formData.append("categoryId", finalCatId);

      // Video logic: Ưu tiên File > URL hiện tại
      if (editVideoFile) formData.append("videoFile", editVideoFile);
      else formData.append("videoUrl", editingMovie.videoUrl); // Giữ link cũ nếu không upload mới

      // Poster logic: Chỉ gửi nếu có file mới
      if (editPosterFile) formData.append("poster", editPosterFile);

      await api.put(`/api/admin/movies/${editingMovie.id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      toast({ title: "Cập nhật thành công!" });
      setIsEditOpen(false);
      fetchData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Lỗi cập nhật", description: e.response?.data });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="flex flex-col gap-8">

            {/* HEADER */}
            <div className="flex items-center justify-between">
              <div><h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">Admin Dashboard</h1></div>
              <Button variant="outline" onClick={fetchData} disabled={loading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
              </Button>
            </div>

            {/* STATS */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tổng Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{users.length}</div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Tổng Phim</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{movies.length}</div></CardContent></Card>
            </div>

            <Tabs defaultValue="movies" className="space-y-4">
              <TabsList><TabsTrigger value="movies">Quản lý Phim</TabsTrigger><TabsTrigger value="users">Quản lý User</TabsTrigger></TabsList>

              <TabsContent value="movies" className="space-y-4">
                <div className="flex justify-between items-center bg-card p-4 rounded-lg border">
                  <h2 className="text-xl font-semibold">Danh sách phim</h2>

                  {/* --- MODAL THÊM PHIM --- */}
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild><Button className="bg-gradient-primary"><Plus className="mr-2 h-4 w-4" /> Thêm phim mới</Button></DialogTrigger>
                    <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
                      <DialogHeader><DialogTitle>Thêm phim mới</DialogTitle></DialogHeader>

                      {/* TMDB SECTION */}
                      <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl space-y-3 mb-2">
                        <Label className="text-blue-500 font-bold flex items-center gap-2"><Wand2 className="h-4 w-4"/> Kéo dữ liệu tự động (Khuyên dùng)</Label>
                        <div className="flex gap-2">
                          <Input placeholder="Nhập tên tiếng Anh (VD: Iron Man...)" value={tmdbKeyword} onChange={e => setTmdbKeyword(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAutoFill())}/>
                          <Button type="button" onClick={handleAutoFill} disabled={isFetchingTmdb}>{isFetchingTmdb ? <Loader2 className="animate-spin" /> : "Tìm kiếm"}</Button>
                        </div>
                        {tmdbPosterPreview && (
                            <div className="flex items-center gap-3 p-2 bg-background rounded border animate-in fade-in">
                              <img src={tmdbPosterPreview} className="h-16 rounded shadow" alt="preview" />
                              <div className="text-[11px] text-muted-foreground leading-tight space-y-1">
                                <p className="font-bold text-green-600 flex items-center gap-1"><ImageIcon className="h-3 w-3"/> Đã lấy được Link Poster</p>
                                {newCategoryName && <p className="font-bold text-orange-500 flex items-center gap-1"><List className="h-3 w-3"/> Đã đề xuất thể loại mới: {newCategoryName}</p>}
                              </div>
                            </div>
                        )}
                      </div>

                      <form onSubmit={handleAddMovie} className="space-y-4 py-2">
                        {/* Grid Title & Year */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Tên phim</Label><Input value={newMovie.title} onChange={e=>setNewMovie({...newMovie, title: e.target.value})} required/></div>
                          <div className="space-y-2"><Label>Năm phát hành</Label><Input type="number" value={newMovie.releaseYear} onChange={e=>setNewMovie({...newMovie, releaseYear: e.target.value})} required/></div>
                        </div>

                        {/* Grid Duration & Category */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label>Thời lượng (phút)</Label><Input type="number" value={newMovie.duration} onChange={e=>setNewMovie({...newMovie, duration: e.target.value})} required/></div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>Thể loại</Label>
                              <span className="text-[10px] text-primary cursor-pointer hover:underline flex items-center gap-1" onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}>
                              {isNewCategoryMode ? <><List className="h-3 w-3"/> Chọn có sẵn</> : <><Plus className="h-3 w-3"/> Thêm mới</>}
                            </span>
                            </div>
                            {isNewCategoryMode ? (
                                <Input placeholder="Nhập tên thể loại mới..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="border-primary" autoFocus />
                            ) : (
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newMovie.categoryId} onChange={(e) => setNewMovie({...newMovie, categoryId: e.target.value})} required>
                                  {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                                </select>
                            )}
                          </div>
                        </div>

                        {/* Video Source */}
                        <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-dashed border-primary/20">
                          <Label className="text-primary font-bold flex items-center gap-2"><FileVideo className="h-4 w-4"/> Nguồn Video (Chọn 1 trong 2)</Label>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground flex items-center gap-1"><Link className="h-3 w-3"/> Cách 1: Link Online / YouTube</Label>
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

                        <div className="space-y-2">
                          <Label>Poster</Label>
                          <Input type="file" accept="image/*" onChange={e=>setPosterFile(e.target.files?.[0]||null)} required={!posterFile && !tmdbPosterUrl} />
                          {tmdbPosterUrl && !posterFile && <p className="text-[10px] text-green-600 italic mt-1">* Hệ thống sẽ dùng ảnh từ TMDB</p>}
                        </div>

                        <Button type="submit" className="w-full bg-gradient-primary" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="animate-spin"/> : "Thêm phim"}</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* TABLE MOVIES */}
                <Card>
                  <Table>
                    <TableHeader><TableRow><TableHead>Poster</TableHead><TableHead>Tên</TableHead><TableHead>Thể loại</TableHead><TableHead>Năm</TableHead><TableHead className="text-right">Hành động</TableHead></TableRow></TableHeader>
                    <TableBody>{movies.map(m => (
                        <TableRow key={m.id}>
                          <TableCell><img src={getImageUrl(m.poster)} className="w-10 h-14 object-cover rounded shadow-sm" alt="poster"/></TableCell>
                          <TableCell className="font-medium">{m.title}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20">{m.category?.name}</Badge></TableCell>
                          <TableCell>{m.releaseYear}</TableCell>
                          <TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="secondary" size="icon" onClick={() => openEditModal(m)}><Pencil className="h-4 w-4 text-blue-500"/></Button><Button variant="secondary" size="icon" onClick={()=>handleDeleteMovie(m.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></div></TableCell>
                        </TableRow>
                    ))}</TableBody>
                  </Table>
                </Card>
              </TabsContent>

              <TabsContent value="users">
                <Card>
                  <Table>
                    <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Xóa</TableHead></TableRow></TableHeader>
                    <TableBody>{users.map(u=>(
                        <TableRow key={u.id}>
                          <TableCell>{u.username || u.fullName}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                          <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={()=>handleDeleteUser(u.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button></TableCell>
                        </TableRow>
                    ))}</TableBody>
                  </Table>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* --- MODAL SỬA PHIM (ĐÃ CẬP NHẬT GIAO DIỆN MỚI) --- */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
            <DialogHeader><DialogTitle>Chỉnh sửa phim</DialogTitle></DialogHeader>

            {editingMovie && (
                <form onSubmit={handleUpdateMovie} className="space-y-4 py-2">
                  {/* Row 1: Tên + Năm */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tên phim</Label>
                      <Input value={editingMovie.title} onChange={e=>setEditingMovie({...editingMovie, title: e.target.value})} required/>
                    </div>
                    <div className="space-y-2">
                      <Label>Năm phát hành</Label>
                      <Input type="number" value={editingMovie.releaseYear} onChange={e=>setEditingMovie({...editingMovie, releaseYear: e.target.value})} required/>
                    </div>
                  </div>

                  {/* Row 2: Thời lượng + Thể loại */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Thời lượng (phút)</Label>
                      <Input type="number" value={editingMovie.duration} onChange={e=>setEditingMovie({...editingMovie, duration: e.target.value})} required/>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Thể loại</Label>
                        <span className="text-[10px] text-primary cursor-pointer hover:underline flex items-center gap-1" onClick={() => setIsNewCategoryMode(!isNewCategoryMode)}>
                      {isNewCategoryMode ? <><List className="h-3 w-3"/> Chọn có sẵn</> : <><Plus className="h-3 w-3"/> Thêm mới</>}
                    </span>
                      </div>
                      {isNewCategoryMode ? (
                          <Input placeholder="Tên thể loại mới..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="border-primary" autoFocus />
                      ) : (
                          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editingMovie.categoryId} onChange={(e) => setEditingMovie({...editingMovie, categoryId: e.target.value})} required>
                            {categories.map((cat) => (<option key={cat.id} value={cat.id}>{cat.name}</option>))}
                          </select>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Video Source (Giống Add Form) */}
                  <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-dashed border-primary/20">
                    <Label className="text-primary font-bold flex items-center gap-2"><FileVideo className="h-4 w-4"/> Nguồn Video</Label>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1"><Link className="h-3 w-3"/> Link hiện tại / Link mới</Label>
                      <Input placeholder="https://..." value={editingMovie.videoUrl} onChange={e=>setEditingMovie({...editingMovie, videoUrl: e.target.value})} disabled={!!editVideoFile} />
                    </div>

                    <div className="text-center text-xs text-muted-foreground font-bold">- HOẶC TẢI FILE MỚI -</div>

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input type="file" accept="video/*" onChange={e=>setEditVideoFile(e.target.files?.[0]||null)} className="cursor-pointer file:text-primary"/>
                        {editVideoFile && <Button type="button" variant="ghost" size="icon" onClick={()=>setEditVideoFile(null)}><Trash2 className="h-4 w-4 text-destructive"/></Button>}
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Mô tả */}
                  <div className="space-y-2">
                    <Label>Mô tả</Label>
                    <Textarea value={editingMovie.description} onChange={e=>setEditingMovie({...editingMovie, description: e.target.value})} rows={3}/>
                  </div>

                  {/* Row 5: Poster */}
                  <div className="space-y-2">
                    <Label>Thay đổi Poster (Không bắt buộc)</Label>
                    {/* Hiển thị poster hiện tại nhỏ bên cạnh */}
                    <div className="flex items-end gap-4">
                      {editingMovie.poster && !editPosterFile && (
                          <div className="shrink-0">
                            <p className="text-[10px] text-muted-foreground mb-1">Hiện tại:</p>
                            <img src={getImageUrl(editingMovie.poster)} alt="Current" className="h-16 w-12 object-cover rounded border" />
                          </div>
                      )}
                      <div className="flex-1">
                        <Input type="file" accept="image/*" onChange={e=>setEditPosterFile(e.target.files?.[0]||null)} />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Hủy</Button>
                    <Button type="submit" className="bg-gradient-primary" disabled={isSubmitting}>
                      {isSubmitting ? <Loader2 className="animate-spin"/> : "Lưu thay đổi"}
                    </Button>
                  </div>
                </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
  );
};

export default AdminDashboard;