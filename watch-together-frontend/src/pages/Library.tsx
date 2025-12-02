import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, History, Star, Loader2 } from "lucide-react";
import { api, getImageUrl } from "@/services/api"; // Import api & helper

const Library = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Lấy dữ liệu khi trang tải
  useEffect(() => {
    const fetchData = async () => {
      // Kiểm tra đăng nhập
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        // Gọi song song 2 API
        // GET /api/interactions/favorites
        // GET /api/interactions/history
        const [favRes, histRes] = await Promise.all([
          api.get("/api/interactions/favorites"),
          api.get("/api/interactions/history")
        ]);

        setFavorites(favRes.data);

        // Lịch sử trả về object { id, movie, watchedAt... } -> Cần map lấy movie ra
        // Và có thể thêm trường progress nếu muốn
        const historyMovies = histRes.data.map((h) => ({
          ...h.movie,
          // Thêm thông tin lịch sử vào movie để hiển thị (nếu cần)
          watchedAt: h.watchedAt
        }));
        setHistory(historyMovies);

      } catch (error) {
        console.error("Lỗi tải thư viện:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  return (
      <div className="min-h-screen bg-background">
        {/* Navbar tự động lấy info từ localStorage */}
        <Navbar />

        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Thư viện <span className="text-primary">của tôi</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Bộ sưu tập phim cá nhân của bạn
              </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <Tabs defaultValue="favorites" className="space-y-6">
                  <TabsList className="bg-card border border-border">
                    <TabsTrigger value="favorites" className="gap-2">
                      <Heart className="h-4 w-4" />
                      Yêu thích ({favorites.length})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <History className="h-4 w-4" />
                      Lịch sử xem ({history.length})
                    </TabsTrigger>
                    {/* Tính năng Watchlist backend chưa có nên tạm ẩn hoặc để trống */}
                    <TabsTrigger value="watchlist" className="gap-2">
                      <Star className="h-4 w-4" />
                      Danh sách xem (0)
                    </TabsTrigger>
                  </TabsList>

                  {/* TAB YÊU THÍCH */}
                  <TabsContent value="favorites" className="space-y-6">
                    {favorites.length === 0 ? (
                        <p className="text-muted-foreground">Bạn chưa có phim yêu thích nào.</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                          {favorites.map((movie) => (
                              <MovieCard
                                  key={movie.id}
                                  id={movie.id}
                                  title={movie.title}
                                  poster={getImageUrl(movie.poster)}
                                  rating={movie.rating || 0}
                                  year={movie.releaseYear?.toString()}
                                  duration={`${movie.duration} phút`}
                                  genre={movie.category?.name}
                                  isFavorite={true}
                              />
                          ))}
                        </div>
                    )}
                  </TabsContent>

                  {/* TAB LỊCH SỬ */}
                  <TabsContent value="history" className="space-y-6">
                    {history.length === 0 ? (
                        <p className="text-muted-foreground">Bạn chưa xem phim nào.</p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                          {history.map((movie, index) => (
                              <MovieCard
                                  key={`${movie.id}-${index}`}
                                  id={movie.id}
                                  title={movie.title}
                                  poster={getImageUrl(movie.poster)}
                                  rating={movie.rating || 0}
                                  year={movie.releaseYear?.toString()}
                                  duration={`${movie.duration} phút`}
                                  genre={movie.category?.name}
                              />
                          ))}
                        </div>
                    )}
                  </TabsContent>

                  <TabsContent value="watchlist" className="space-y-6">
                    <p className="text-muted-foreground italic">Tính năng đang phát triển...</p>
                  </TabsContent>
                </Tabs>
            )}
          </div>
        </div>
      </div>
  );
};

export default Library;