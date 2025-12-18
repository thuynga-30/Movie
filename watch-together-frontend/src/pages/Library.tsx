import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, History, Star, Loader2, Film } from "lucide-react";
import { api, getImageUrl } from "@/services/api";

const Library = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- HÀM 1: Lấy đúng object phim ---
  // API có thể trả về: { movie: {...} } HOẶC trực tiếp {...}
  // Hàm này giúp chuẩn hóa về một dạng duy nhất
  const extractMovieData = (item: any) => {
    if (!item) return null;
    // Nếu item có thuộc tính "movie" bên trong (dạng Interaction) -> lấy movie
    if (item.movie) return item.movie;
    // Nếu không, coi chính item là movie
    return item;
  };

  // --- HÀM 2: Lấy Rating thông minh ---
  // Tìm mọi ngóc ngách để lấy điểm số
  const getRatingValue = (movie: any) => {
    if (!movie) return 0;
    const score =
        movie.averageRating ??
        movie.rating ??
        movie.vote_average ??
        movie.score ??
        0;
    return parseFloat(score); // Trả về số để MovieCard tự xử lý
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        const [favRes, histRes] = await Promise.all([
          api.get("/api/interactions/favorites"),
          api.get("/api/interactions/history")
        ]);

        console.log("🔥 Raw Favorites:", favRes.data); // Xem log này để check
        console.log("🔥 Raw History:", histRes.data);

        // XỬ LÝ FAVORITES: Dùng hàm extract để đảm bảo lấy đúng object movie
        const validFavorites = Array.isArray(favRes.data)
            ? favRes.data.map(extractMovieData).filter(Boolean)
            : [];
        setFavorites(validFavorites);

        // XỬ LÝ HISTORY
        const validHistory = Array.isArray(histRes.data)
            ? histRes.data.map((h: any) => {
              const movieData = extractMovieData(h);
              return { ...movieData, watchedAt: h.watchedAt };
            }).filter(Boolean)
            : [];
        setHistory(validHistory);

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
        <Navbar />

        <div className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Thư viện <span className="text-primary">của tôi</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Bộ sưu tập phim cá nhân và lịch sử xem
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
                      <Heart className="h-4 w-4" /> Yêu thích ({favorites.length})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="gap-2">
                      <History className="h-4 w-4" /> Lịch sử xem ({history.length})
                    </TabsTrigger>

                  </TabsList>

                  {/* TAB YÊU THÍCH */}
                  <TabsContent value="favorites" className="space-y-6">
                    {favorites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                          <Film className="h-10 w-10 mb-2 opacity-20"/>
                          <p>Bạn chưa có phim yêu thích nào.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                          {favorites.map((movie, index) => (
                              <MovieCard
                                  key={`fav-${movie.id}-${index}`}
                                  id={movie.id}
                                  title={movie.title}
                                  poster={getImageUrl(movie.poster)}
                                  // ✅ Gọi hàm lấy rating thông minh
                                  rating={getRatingValue(movie)}
                                  year={movie.releaseYear?.toString()}
                                  duration={`${movie.duration || 0} phút`}
                                  genre={movie.category?.name || "Phim lẻ"}
                                  isFavorite={true}
                              />
                          ))}
                        </div>
                    )}
                  </TabsContent>

                  {/* TAB LỊCH SỬ */}
                  <TabsContent value="history" className="space-y-6">
                    {history.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                          <History className="h-10 w-10 mb-2 opacity-20"/>
                          <p>Bạn chưa xem phim nào.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                          {history.map((movie, index) => (
                              <MovieCard
                                  key={`hist-${movie.id}-${index}`}
                                  id={movie.id}
                                  title={movie.title}
                                  poster={getImageUrl(movie.poster)}
                                  // ✅ Gọi hàm lấy rating thông minh
                                  rating={getRatingValue(movie)}
                                  year={movie.releaseYear?.toString()}
                                  duration={`${movie.duration || 0} phút`}
                                  genre={movie.category?.name || "Phim lẻ"}
                              />
                          ))}
                        </div>
                    )}
                  </TabsContent>


                </Tabs>
            )}
          </div>
        </div>
      </div>
  );
};

export default Library;