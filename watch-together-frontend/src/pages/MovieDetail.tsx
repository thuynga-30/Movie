import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Heart, Star, Clock, Calendar, Users, Loader2, Send, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, API_BASE_URL, getImageUrl } from "@/services/api";

// Thư viện Socket
import SockJS from "sockjs-client";
import Stomp from "stompjs";

// --- ĐỊNH NGHĨA KIỂU DỮ LIỆU ---
interface Comment {
  id: number;
  content: string;
  username: string;
  fullName: string;
  avatar: string;
  createdAt: string;
  star?: number;
}

interface MovieDetail {
  id: number;
  title: string;
  description: string;
  poster: string;
  videoUrl: string;
  releaseYear: number;
  duration: number;
  genre: string;
  category?: { name: string };
}

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Refs
  const stompClientRef = useRef<any>(null);

  // Data States
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // UI/Interaction States
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // --- 1. KHỞI TẠO DỮ LIỆU & SOCKET ---
  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (userStr) setCurrentUser(JSON.parse(userStr));

        // Gọi API lấy dữ liệu tĩnh ban đầu
        const promises = [
          api.get(`/api/movies/${id}`),
          api.get(`/api/reviews/comments/${id}`),
          api.get(`/api/reviews/ratings/${id}/average`)
        ];

        if (token) {
          promises.push(api.get("/api/interactions/favorites"));
        }

        const results = await Promise.all(promises);

        setMovie(results[0].data);
        setComments(results[1].data);
        setAvgRating(results[2].data);

        // Check favorite status
        if (token && results[3]) {
          const myFavorites: any[] = results[3].data;
          setIsFavorite(myFavorites.some((m: any) => m.id === Number(id)));
        }

        // Kết nối Socket sau khi tải xong dữ liệu
        connectSocket(id!);

      } catch (error) {
        console.error("Lỗi tải trang:", error);
        toast({ title: "Lỗi", description: "Không tải được dữ liệu phim.", variant: "destructive" });
        navigate("/movies");
      } finally {
        setLoading(false);
      }
    };

    if (id) initPage();

    return () => {
      if (stompClientRef.current) stompClientRef.current.disconnect();
    };
  }, [id]);

  // --- 2. HÀM KẾT NỐI SOCKET & XỬ LÝ SỰ KIỆN ---
  const connectSocket = (movieId: string) => {
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = Stomp.over(socket);
    client.debug = () => {};

    client.connect({}, () => {
      stompClientRef.current = client;
      setIsConnected(true);

      // Subscribe để nhận update review
      client.subscribe(`/topic/movie/${movieId}/reviews`, (payload: any) => {
        const data = JSON.parse(payload.body);

        // A. CÓ COMMENT MỚI
        if (data.comment) {
          setComments((prev) => [data.comment, ...prev]);
        }

        // B. CÓ COMMENT BỊ XÓA (Logic mới)
        if (data.deletedCommentId) {
          setComments((prev) => prev.filter(c => c.id !== data.deletedCommentId));
        }

        // C. CẬP NHẬT RATING
        if (data.newAvgRating !== undefined && data.newAvgRating !== null) {
          setAvgRating(data.newAvgRating);
        }
      });
    }, (err) => console.error("Socket error", err));
  };

  // --- 3. GỬI REVIEW QUA SOCKET ---
  const handleSubmitReview = () => {
    if (!currentUser) {
      toast({ title: "Yêu cầu", description: "Vui lòng đăng nhập để bình luận.", variant: "destructive" });
      navigate("/login");
      return;
    }

    if (userRating === 0 && userComment.trim() === "") {
      toast({ title: "Thông báo", description: "Hãy nhập nội dung hoặc chọn sao.", variant: "destructive" });
      return;
    }

    if (!stompClientRef.current || !isConnected) {
      toast({ title: "Lỗi kết nối", description: "Đang kết nối lại máy chủ...", variant: "destructive" });
      return;
    }

    const payload = {
      movieId: id,
      content: userComment,
      star: userRating,
      username: currentUser.username,
      avatar: currentUser.avatar
    };

    try {
      stompClientRef.current.send(`/app/movie/${id}/review`, {}, JSON.stringify(payload));
      setUserComment("");
      setUserRating(0);
      toast({ title: "Đã gửi", description: "Đánh giá của bạn đã được gửi!" });
    } catch (e) {
      toast({ title: "Lỗi", description: "Không gửi được tin nhắn.", variant: "destructive" });
    }
  };

  // --- 4. GỬI YÊU CẦU XÓA QUA SOCKET ---
  const handleDeleteComment = (commentId: number) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    if (stompClientRef.current && isConnected && currentUser) {
      const payload = {
        commentId: commentId,
        username: currentUser.username // Gửi username để Backend check quyền
      };
      stompClientRef.current.send(`/app/movie/${id}/delete-review`, {}, JSON.stringify(payload));
    } else {
      toast({ title: "Lỗi", description: "Mất kết nối server", variant: "destructive" });
    }
  };

  // --- 5. CÁC LOGIC KHÁC (Favorite, Watch) ---
  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    try {
      setFavLoading(true);
      if (isFavorite) {
        await api.delete(`/api/interactions/favorites/${id}`);
        setIsFavorite(false);
        toast({ title: "Đã xóa", description: "Đã xóa khỏi danh sách yêu thích." });
      } else {
        await api.post(`/api/interactions/favorites/${id}`);
        setIsFavorite(true);
        toast({ title: "Đã lưu", description: "Đã thêm vào danh sách yêu thích!" });
      }
    } catch (e) { toast({ variant: "destructive", title: "Lỗi thao tác" }); }
    finally { setFavLoading(false); }
  };

  const handleWatchNow = async () => {
    if (localStorage.getItem("token") && id) {
      try { await api.post("/api/interactions/history", { movieId: Number(id), progress: 0.0 }); } catch (e) { }
    }
    navigate(`/watch/solo/${id}`);
  };

  const handleWatchTogether = async () => {
    if (!localStorage.getItem("token")) { navigate("/login"); return; }
    try {
      const res = await api.post("/api/rooms", null, { params: { movieId: id, isPrivate: false } });
      navigate(`/room/${res.data.roomCode}`);
    } catch (e) { toast({ variant: "destructive", title: "Lỗi tạo phòng" }); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>;
  if (!movie) return null;

  return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <div className="pt-16">
          {/* BACKDROP */}
          <div className="relative h-[50vh] overflow-hidden">
            <img src={getImageUrl(movie.poster)} className="w-full h-full object-cover blur-sm opacity-50" alt="backdrop" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          {/* MOVIE INFO */}
          <div className="container mx-auto px-4 -mt-32 relative z-10">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/3 max-w-[300px] mx-auto lg:mx-0">
                <Card className="overflow-hidden shadow-2xl shadow-primary/20"><img src={getImageUrl(movie.poster)} className="w-full aspect-[2/3] object-cover" alt="poster" /></Card>
              </div>
              <div className="lg:w-2/3 space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-4xl md:text-5xl font-bold">{movie.title}</h1>
                    <Button variant="ghost" size="icon" onClick={handleToggleFavorite} disabled={favLoading}>
                      <Heart className={`h-6 w-6 transition-colors ${isFavorite ? "fill-red-600 text-red-600" : "text-muted-foreground hover:text-red-500"}`} />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">{(movie.genre || movie.category?.name) && <Badge variant="secondary">{movie.genre || movie.category?.name}</Badge>}</div>

                  <div className="flex flex-wrap gap-6 text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-foreground text-lg">{avgRating ? avgRating.toFixed(1) : "Chưa có đánh giá"}</span>
                    </div>
                    <div className="flex items-center gap-2"><Calendar className="h-5 w-5" /><span>{movie.releaseYear}</span></div>
                    <div className="flex items-center gap-2"><Clock className="h-5 w-5" /><span>{movie.duration} phút</span></div>
                  </div>
                  <p className="text-foreground/90 text-lg leading-relaxed">{movie.description}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button className="flex-1 bg-gradient-primary" size="lg" onClick={handleWatchNow}><Play className="mr-2 h-5 w-5" /> Xem ngay</Button>
                  <Button variant="outline" className="flex-1 border-primary text-primary" size="lg" onClick={handleWatchTogether}><Users className="mr-2 h-5 w-5" /> Xem cùng nhau</Button>
                </div>
              </div>
            </div>

            {/* --- REVIEW SECTION --- */}
            <div className="mt-16 space-y-6 pb-20">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-bold">Đánh giá & Bình luận</h2>
                {isConnected && <Badge variant="outline" className="text-green-500 border-green-500 animate-pulse">● Live Chat</Badge>}
              </div>

              {/* FORM NHẬP */}
              <Card className="p-6 bg-card border-border">
                <h3 className="font-semibold mb-4">Viết đánh giá của bạn</h3>
                <div className="mb-4 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setUserRating(star)} className="transition-transform hover:scale-110 focus:outline-none">
                        <Star className={`h-8 w-8 ${star <= userRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30"}`} />
                      </button>
                  ))}
                </div>
                <div className="flex gap-4">
                  <Avatar className="hidden md:block">
                    <AvatarImage src={currentUser?.avatar} />
                    <AvatarFallback>{currentUser?.username?.[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <Textarea
                        placeholder="Chia sẻ cảm nghĩ..."
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        className="bg-background border-border min-h-[80px]"
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleSubmitReview} disabled={!isConnected} className="bg-secondary text-white hover:bg-secondary/80">
                        <Send className="mr-2 h-4 w-4" /> Gửi đánh giá
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* LIST COMMENT */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                    comments.map((c, index) => (
                        <Card key={c.id || index} className="p-6 bg-card/50 border-border/50 hover:border-border transition-all animate-in fade-in slide-in-from-bottom-2 group">
                          <div className="flex gap-4">
                            <Avatar>
                              <AvatarImage src={getImageUrl(c.avatar)} />
                              <AvatarFallback className="bg-primary/20 text-primary">{c.username?.[0]?.toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-semibold text-primary">{c.fullName || c.username}</p>
                                    {c.star && c.star > 0 && (
                                        <div className="flex text-yellow-500 text-xs">
                                          {[...Array(c.star)].map((_, i) => <Star key={i} className="h-3 w-3 fill-current" />)}
                                        </div>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground">{c.createdAt ? new Date(c.createdAt).toLocaleDateString('vi-VN') : 'Vừa xong'}</p>
                                </div>

                                {/* NÚT XÓA: CHỈ HIỆN KHI LÀ CHÍNH CHỦ */}
                                {currentUser && currentUser.username === c.username && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => handleDeleteComment(c.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                              </div>
                              <p className="text-foreground/90">{c.content}</p>
                            </div>
                          </div>
                        </Card>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default MovieDetail;