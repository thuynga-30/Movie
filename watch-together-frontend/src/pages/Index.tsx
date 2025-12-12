import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom"; // Thêm useSearchParams, useNavigate
import { Button } from "@/components/ui/button";
import { Play, Users, Film, TrendingUp, Star, Loader2, Search, X, Frown } from "lucide-react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import heroBanner from "@/assets/hero-banner.jpg";
import { api, getImageUrl } from "@/services/api";

// Định nghĩa kiểu dữ liệu phim
interface Movie {
  id: number;
  title: string;
  poster: string;
  rating?: number;
  releaseYear: number;
  duration: number;
  category?: { id: number; name: string };
}

const Index = () => {
  const navigate = useNavigate();

  // 1. Lấy từ khóa tìm kiếm từ URL
  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get("search");

  // Đổi tên state từ trendingMovies -> movies (vì nó chứa cả kết quả tìm kiếm)
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. Gọi API (Tự động chạy lại khi searchKeyword thay đổi)
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        let endpoint = "";

        if (searchKeyword) {
          // A. Nếu đang tìm kiếm -> Gọi API Search
          endpoint = `/api/movies?search=${encodeURIComponent(searchKeyword)}`;
        } else {
          // B. Nếu không tìm kiếm -> Gọi API Trending (Mới nhất)
          endpoint = "/api/movies?page=0&size=12&sort=id,desc"; // Tăng size lên 12 để nhìn cho đã
        }

        const response = await api.get(endpoint);
        setMovies(response.data.content || []);
      } catch (error) {
        console.error("Lỗi tải phim:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, [searchKeyword]); // ✅ Quan trọng: Chạy lại khi URL thay đổi

  // Hàm xóa tìm kiếm để về trang chủ
  const clearSearch = () => {
    navigate("/");
  };

  return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />

        {/* 3. LOGIC HIỂN THỊ HERO BANNER
            - Nếu đang ở trang chủ bình thường: HIỆN Banner.
            - Nếu đang tìm kiếm: ẨN Banner đi để hiện kết quả ngay.
        */}
        {!searchKeyword && (
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0">
                <img src={heroBanner} alt="Rạp chiếu phim" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-hero" />
                <div className="absolute inset-0 bg-background/40" />
              </div>

              <div className="relative z-10 container mx-auto px-4 text-center space-y-8">
                <h1 className="text-5xl md:text-7xl font-bold text-foreground drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  Xem cùng nhau,<br />
                  <span className="bg-gradient-primary bg-clip-text text-transparent">Cảm nhận cùng nhau</span>
                </h1>
                <p className="text-xl md:text-2xl text-foreground/90 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
                  Trải nghiệm phim với bạn bè trong sự đồng bộ hoàn hảo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                  <Button size="lg" className="bg-gradient-primary text-lg px-8 py-6 shadow-glow" onClick={() => document.getElementById('movie-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    <Play className="mr-2 h-5 w-5" /> Khám phá ngay
                  </Button>
                </div>
              </div>
            </section>
        )}

        {/* 4. Features Section
            - Chỉ hiện khi không tìm kiếm (để đỡ rối mắt)
        */}
        {!searchKeyword && (
            <section className="py-20 bg-card/50">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                  Tại sao chọn <span className="text-primary">WatchTogether</span>?
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  <div
                      className="p-6 rounded-lg bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Users className="h-6 w-6 text-white"/>
                    </div>
                    <h3 className="text-xl font-bold">Xem cùng nhau</h3>
                    <p className="text-muted-foreground">
                      Phát đồng bộ hoàn hảo với bạn bè và gia đình. Phát, tạm dừng và tua cùng nhau theo thời gian thực.
                    </p>
                  </div>

                  <div
                      className="p-6 rounded-lg bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Film className="h-6 w-6 text-white"/>
                    </div>
                    <h3 className="text-xl font-bold">Thư viện khổng lồ</h3>
                    <p className="text-muted-foreground">
                      Truy cập hàng nghìn bộ phim và chương trình truyền hình thuộc mọi thể loại. Nội dung mới được bổ
                      sung hàng tuần.
                    </p>
                  </div>

                  <div
                      className="p-6 rounded-lg bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Star className="h-6 w-6 text-white"/>
                    </div>
                    <h3 className="text-xl font-bold">Đánh giá & Nhận xét</h3>
                    <p className="text-muted-foreground">
                      Chia sẻ suy nghĩ của bạn và khám phá những gì người khác nghĩ. Xây dựng danh sách xem của bạn với
                      đánh giá cộng đồng.
                    </p>
                  </div>
                </div>
              </div>
            </section>
        )}

        {/* 5. MOVIE SECTION (HIỂN THỊ KẾT QUẢ)
            Đây là phần quan trọng nhất thay đổi theo logic tìm kiếm
        */}
        <section id="movie-section" className={`py-20 ${searchKeyword ? 'mt-16' : ''}`}>
          <div className="container mx-auto px-4">

            {/* TIÊU ĐỀ THAY ĐỔI THEO TRẠNG THÁI */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                {searchKeyword ? (
                    <>
                      <Search className="h-8 w-8 text-primary"/>
                      <div>
                        <h2 className="text-3xl font-bold">Kết quả tìm kiếm</h2>
                        <p className="text-muted-foreground">Từ khóa: <span
                            className="text-primary font-bold">"{searchKeyword}"</span></p>
                      </div>
                    </>
                ) : (
                    <>
                      <TrendingUp className="h-8 w-8 text-primary"/>
                      <h2 className="text-3xl md:text-4xl font-bold">Phim mới cập nhật</h2>
                    </>
                )}
              </div>

              {/* Nút xóa tìm kiếm */}
              {searchKeyword && (
                  <Button variant="outline" onClick={clearSearch} className="gap-2">
                    <X className="h-4 w-4"/> Quay lại trang chủ
                  </Button>
              )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4"/>
                  <p className="text-muted-foreground">Đang tải phim...</p>
                </div>
            ) : (
                <>
                  {movies.length > 0 ? (
                      // GRID PHIM
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {movies.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                id={movie.id}
                                title={movie.title}
                                poster={movie.poster} // MovieCard đã tự gọi getImageUrl bên trong hoặc gọi ở đây đều được
                                rating={movie.rating}
                                year={movie.releaseYear?.toString()}
                                duration={`${movie.duration}`}
                                genre={movie.category?.name}
                            />
                        ))}
                      </div>
                  ) : (
                      // TRƯỜNG HỢP KHÔNG TÌM THẤY
                      <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl bg-card/30">
                        <Frown className="h-16 w-16 mb-4 opacity-50 text-muted-foreground" />
                        <h3 className="text-xl font-bold mb-2">Không tìm thấy phim nào</h3>
                        <p className="text-muted-foreground mb-6">Thử tìm kiếm với từ khóa khác xem sao?</p>
                        <Button onClick={clearSearch} className="bg-gradient-primary">
                          Xem tất cả phim
                        </Button>
                      </div>
                  )}
                </>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 border-t border-border mt-auto">
          <div className="container mx-auto px-4 text-center md:text-left">
            <p className="text-muted-foreground text-sm">© 2025 WatchTogether - Đồ án cơ sở 4.</p>
          </div>
        </footer>
      </div>
  );
};

export default Index;