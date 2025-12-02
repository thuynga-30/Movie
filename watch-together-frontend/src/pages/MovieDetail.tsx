import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Play, Heart, Star, Clock, Calendar, Users, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, getImageUrl } from "@/services/api";

// Định nghĩa kiểu dữ liệu
interface Comment {
  id: number;
  content: string;
  username: string;
  fullName: string;
  avatar: string;
  createdAt: string;
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
  category?: { name: string }; // Handle cả trường hợp backend trả về object category
}

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [avgRating, setAvgRating] = useState(0);

  // --- STATE MỚI THÊM CHO LOGIC ---
  const [isFavorite, setIsFavorite] = useState(false); // Trạng thái đã thích hay chưa
  const [favLoading, setFavLoading] = useState(false); // Loading khi bấm tim

  // State cho form đánh giá
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. TẢI DỮ LIỆU TỪ BACKEND
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Gọi các API cơ bản
        const promises = [
          api.get(`/api/movies/${id}`),
          api.get(`/api/reviews/comments/${id}`),
          api.get(`/api/reviews/ratings/${id}/average`)
        ];

        // LOGIC MỚI: Nếu đã đăng nhập, gọi thêm API lấy danh sách yêu thích để kiểm tra
        // (Vì Controller không có API check riêng, ta lấy list về so sánh ID)
        if (token) {
          promises.push(api.get("/api/interactions/favorites"));
        }

        const results = await Promise.all(promises);

        setMovie(results[0].data);
        setComments(results[1].data);
        setAvgRating(results[2].data);

        // Xử lý check favorite
        if (token && results[3]) {
          const myFavorites: any[] = results[3].data;
          // Kiểm tra xem phim hiện tại có trong list favorite không
          const isLiked = myFavorites.some((m: any) => m.id === Number(id));
          setIsFavorite(isLiked);
        }

      } catch (error) {
        console.error("Lỗi tải trang chi tiết:", error);
        toast({ title: "Lỗi", description: "Không tìm thấy phim này!", variant: "destructive" });
        navigate("/movies");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, navigate, toast]);

  // --- LOGIC MỚI: XỬ LÝ YÊU THÍCH ---
  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast({ title: "Yêu cầu", description: "Bạn cần đăng nhập để lưu phim.", variant: "destructive" });
      navigate("/login");
      return;
    }

    try {
      setFavLoading(true);
      if (isFavorite) {
        // Đang thích -> Gọi API Xóa (DELETE)
        await api.delete(`/api/interactions/favorites/${id}`);
        setIsFavorite(false);
        toast({ title: "Đã xóa", description: "Đã xóa khỏi danh sách yêu thích." });
      } else {
        // Chưa thích -> Gọi API Thêm (POST)
        await api.post(`/api/interactions/favorites/${id}`);
        setIsFavorite(true);
        toast({ title: "Đã lưu", description: "Đã thêm vào danh sách yêu thích!" });
      }
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể cập nhật trạng thái.", variant: "destructive" });
    } finally {
      setFavLoading(false);
    }
  };

  // --- LOGIC MỚI: XEM PHIM & LƯU LỊCH SỬ ---
  const handleWatchNow = async () => {
    // 1. Lưu lịch sử trước khi chuyển trang
    const token = localStorage.getItem("token");
    if (token && id) {
      try {
        await api.post("/api/interactions/history", {
          movieId: Number(id),
          progress: 0.0
        });
      } catch (e) {
        console.error("Lỗi lưu lịch sử", e);
      }
    }

    // 2. Chuyển hướng (Logic cũ của bạn định làm gì thì làm ở đây, ví dụ mở trang watch)
    // Ở đây mình tạm chuyển sang trang watch/id
    navigate(`/watch/movie/${id}`);
  };

  const handleWatchTogether = async () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }
    try {
      // Gọi API tạo phòng mới
      const res = await api.post("/api/rooms", null, {
        params: { movieId: id, isPrivate: false }
      });

      // Thành công -> Chuyển hướng sang trang WatchRoom với MÃ PHÒNG (RoomCode)
      // Ví dụ: /room/ROOM123 (Khác với ID phim)
      navigate(`/room/${res.data.roomCode}`);

    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể tạo phòng lúc này.", variant: "destructive" });
    }
  };

  // 2. XỬ LÝ GỬI BÌNH LUẬN & ĐÁNH GIÁ (GIỮ NGUYÊN)
  const handleSubmitReview = async () => {
    if (!localStorage.getItem("token")) {
      toast({ title: "Yêu cầu đăng nhập", description: "Bạn cần đăng nhập để đánh giá.", variant: "destructive" });
      navigate("/login");
      return;
    }

    if (userRating === 0 && userComment.trim() === "") {
      toast({ title: "Thông báo", description: "Vui lòng nhập nội dung hoặc chọn số sao.", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      if (userRating > 0) {
        await api.post("/api/reviews/ratings", { movieId: id, star: userRating });
      }
      if (userComment.trim() !== "") {
        await api.post("/api/reviews/comments", { movieId: id, content: userComment });
      }
      toast({ title: "Thành công", description: "Cảm ơn bạn đã đánh giá!" });
      setUserComment("");
      setUserRating(0);
      const res = await api.get(`/api/reviews/comments/${id}`);
      setComments(res.data);
    } catch (error) {
      toast({ title: "Lỗi", description: "Không thể gửi đánh giá lúc này.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
  }

  if (!movie) return null;

  return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />

        <div className="pt-16">
          {/* Backdrop */}
          <div className="relative h-[50vh] overflow-hidden">
            <img
                src={getImageUrl(movie.poster)}
                alt={movie.title}
                className="w-full h-full object-cover blur-sm opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 -mt-32 relative z-10">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Poster */}
              <div className="lg:w-1/3 max-w-[300px] mx-auto lg:mx-0">
                <Card className="overflow-hidden border-border shadow-2xl shadow-primary/20">
                  <img
                      src={getImageUrl(movie.poster)}
                      alt={movie.title}
                      className="w-full aspect-[2/3] object-cover"
                  />
                </Card>
              </div>

              {/* Details */}
              <div className="lg:w-2/3 space-y-6">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-4xl md:text-5xl font-bold">{movie.title}</h1>

                    {/* --- NÚT TIM (ĐÃ CẬP NHẬT LOGIC) --- */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={handleToggleFavorite} // Thêm sự kiện click
                        disabled={favLoading} // Disable khi đang load
                    >
                      <Heart
                          className={`h-6 w-6 transition-colors ${
                              isFavorite
                                  ? "fill-red-600 text-red-600" // Nếu đã thích: Tô đỏ
                                  : "text-muted-foreground hover:text-red-500" // Chưa thích: Màu xám cũ
                          }`}
                      />
                    </Button>
                    {/* ---------------------------------- */}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {(movie.genre || (movie.category && movie.category.name)) && (
                        <Badge variant="secondary">{movie.genre || movie.category?.name}</Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-6 text-muted-foreground mb-6">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                      <span className="font-semibold text-foreground">{avgRating || "Chưa có đánh giá"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      <span>{movie.releaseYear}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>{movie.duration} phút</span>
                    </div>
                  </div>

                  <p className="text-foreground/90 text-lg leading-relaxed">
                    {movie.description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  {/* Nút Xem ngay -> CẬP NHẬT LOGIC LƯU LỊCH SỬ */}
                  <Button
                      className="flex-1 bg-gradient-primary hover:opacity-90 transition-opacity"
                      size="lg"
                      onClick={handleWatchNow} // Thay vì handleWatchTogether
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Xem ngay
                  </Button>

                  {/* Nút Xem cùng nhau */}
                  <Button
                      variant="outline"
                      className="flex-1 border-primary text-primary hover:bg-primary/10"
                      size="lg"
                      onClick={handleWatchTogether}
                  >
                    <Users className="mr-2 h-5 w-5" />
                    Xem cùng nhau
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments Section (GIỮ NGUYÊN) */}
            <div className="mt-16 space-y-6 pb-20">
              <h2 className="text-3xl font-bold">Đánh giá & Bình luận</h2>

              {/* Form đánh giá */}
              <Card className="p-6 bg-card border-border">
                <h3 className="font-semibold mb-4">Viết đánh giá của bạn</h3>
                <div className="mb-4">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onClick={() => setUserRating(star)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                          <Star
                              className={`h-8 w-8 ${
                                  star <= userRating
                                      ? "fill-yellow-500 text-yellow-500"
                                      : "text-muted-foreground/30"
                              }`}
                          />
                        </button>
                    ))}
                  </div>
                </div>
                <Textarea
                    placeholder="Chia sẻ suy nghĩ của bạn về bộ phim này..."
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    className="mb-4 bg-background border-border min-h-[100px]"
                />
                <Button
                    onClick={handleSubmitReview}
                    className="bg-secondary hover:bg-secondary/80 text-white"
                    disabled={submitting}
                >
                  {submitting ? <Loader2 className="animate-spin mr-2" /> : "Gửi đánh giá"}
                </Button>
              </Card>

              {/* Danh sách bình luận */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
                ) : (
                    comments.map((c) => (
                        <Card key={c.id} className="p-6 bg-card/50 border-border/50 hover:border-border transition-colors">
                          <div className="flex gap-4">
                            <Avatar>
                              <AvatarImage src={c.avatar} />
                              <AvatarFallback className="bg-primary/20 text-primary">
                                {c.username?.[0]?.toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-primary">{c.fullName || c.username}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                                  </p>
                                </div>
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