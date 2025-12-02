import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Users, Film, TrendingUp, Star, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import heroBanner from "@/assets/hero-banner.jpg";
import { api, getImageUrl } from "@/services/api"; // Import API

// Định nghĩa kiểu dữ liệu phim từ Backend trả về
interface Movie {
  id: number;
  title: string;
  poster: string;
  rating?: number;
  releaseYear: number;
  duration: number;
  category?: { id: number; name: string }; // Backend trả về object Category
}

const Index = () => {
  const [trendingMovies, setTrendingMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy danh sách phim (Lấy 6 phim mới nhất làm Trending)
  useEffect(() => {
    const fetchTrendingMovies = async () => {
      try {
        setLoading(true);
        // Gọi API: Lấy trang 0, 6 phần tử, sắp xếp theo ID giảm dần (mới nhất)
        // Nếu bạn đã làm chức năng rating, có thể sort theo rating
        const response = await api.get("/api/movies?page=0&size=6&sort=id,desc");
        setTrendingMovies(response.data.content || []);
      } catch (error) {
        console.error("Lỗi tải phim trending:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingMovies();
  }, []);

  return (
      <div className="min-h-screen bg-background">
        {/* Navbar: Tự động check login bên trong component đó */}
        <Navbar />

        {/* Hero Section (Giữ nguyên giao diện đẹp của bạn) */}
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
                src={heroBanner}
                alt="Rạp chiếu phim"
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-hero" />
            <div className="absolute inset-0 bg-background/40" />
          </div>

          <div className="relative z-10 container mx-auto px-4 text-center space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold text-foreground drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
              Xem cùng nhau,
              <br />
              <span className="bg-gradient-primary bg-clip-text text-transparent">
              Cảm nhận cùng nhau
            </span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
              Trải nghiệm phim với bạn bè trong sự đồng bộ hoàn hảo. Tạo phòng, trò chuyện theo thời gian thực và thưởng thức điện ảnh từ bất cứ đâu.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
              <Link to="/movies">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-6 shadow-glow">
                  <Play className="mr-2 h-5 w-5" />
                  Xem phim ngay
                </Button>
              </Link>
              {/* Nếu chưa đăng nhập thì hiện nút này, logic này có thể tùy chỉnh */}
              <Link to="/rooms">
                <Button size="lg" variant="outline" className="border-2 text-lg px-8 py-6 bg-black/50 backdrop-blur-sm hover:bg-black/70">
                  <Users className="mr-2 h-5 w-5" />
                  Có mã phòng?
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section (Giữ nguyên) */}
        <section className="py-20 bg-card/50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Tại sao chọn <span className="text-primary">WatchTogether</span>?
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-6 rounded-lg bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Xem cùng nhau</h3>
                <p className="text-muted-foreground">
                  Phát đồng bộ hoàn hảo với bạn bè và gia đình. Phát, tạm dừng và tua cùng nhau theo thời gian thực qua WebSocket.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Film className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Thư viện đa dạng</h3>
                <p className="text-muted-foreground">
                  Hệ thống hỗ trợ cập nhật phim liên tục, phân loại theo nhiều thể loại hấp dẫn.
                </p>
              </div>

              <div className="p-6 rounded-lg bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow space-y-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold">Tương tác thực</h3>
                <p className="text-muted-foreground">
                  Chat trực tiếp ngay trong phòng chiếu. Chia sẻ cảm xúc và bình luận về bộ phim đang xem.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trending Movies Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-bold flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-primary" />
                Phim mới cập nhật
              </h2>
              <Link to="/movies">
                <Button variant="outline">Xem tất cả</Button>
              </Link>
            </div>

            {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                  {trendingMovies.map((movie) => (
                      <MovieCard
                          key={movie.id}
                          id={movie.id}
                          title={movie.title}
                          // Xử lý ảnh: dùng hàm getImageUrl để nối domain backend
                          poster={getImageUrl(movie.poster)}
                          // Xử lý các trường khác cho khớp props
                          rating={movie.rating || 0}
                          year={movie.releaseYear?.toString()}
                          duration={`${movie.duration} phút`}
                          genre={movie.category?.name || "Phim hay"}
                      />
                  ))}

                  {trendingMovies.length === 0 && (
                      <div className="col-span-full text-center text-muted-foreground py-10">
                        Chưa có phim nào trong hệ thống. Hãy vào trang Admin để thêm phim.
                      </div>
                  )}
                </div>
            )}
          </div>
        </section>

        {/* CTA Section (Giữ nguyên) */}
        <section className="py-20 bg-gradient-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          </div>
          <div className="container mx-auto px-4 text-center space-y-6 relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Sẵn sàng bắt đầu xem?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Tham gia cùng hàng nghìn người yêu phim đang trải nghiệm điện ảnh cùng nhau
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="bg-background text-foreground hover:bg-background/90 text-lg px-8 py-6">
                Bắt đầu miễn phí
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <Film className="h-6 w-6 text-primary" />
                <span className="font-bold text-lg">WatchTogether</span>
              </div>
              <p className="text-muted-foreground text-sm">
                © 2025 WatchTogether - Đồ án cơ sở 4 (Nga & An).
              </p>
            </div>
          </div>
        </footer>
      </div>
  );
};

export default Index;