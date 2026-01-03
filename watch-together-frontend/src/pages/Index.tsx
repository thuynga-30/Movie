import { useState, useEffect, useRef } from "react"; // Thêm useRef
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Play, Users, Film, TrendingUp, Star, Loader2, Search, X, Frown } from "lucide-react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import heroBanner from "@/assets/hero-banner.jpg";
import { api, getImageUrl } from "@/services/api";
// 1. IMPORT THƯ VIỆN SOCKET
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useToast } from "@/hooks/use-toast"; // Import Toast để thông báo

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
  const { toast } = useToast(); // Hook thông báo

  const [searchParams] = useSearchParams();
  const searchKeyword = searchParams.get("search");

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Ref để giữ searchKeyword hiện tại trong callback của socket
  // (Tránh closure stale state khi socket chạy)
  const searchKeywordRef = useRef(searchKeyword);

  // Cập nhật ref mỗi khi searchKeyword thay đổi
  useEffect(() => {
    searchKeywordRef.current = searchKeyword;
  }, [searchKeyword]);

  // 2. LOGIC SOCKET: LẮNG NGHE PHIM MỚI
  useEffect(() => {
    // Kết nối đến endpoint /ws mà bạn đã cấu hình trong WebSocketConfig.java
    const socket = new SockJS('http://localhost:8080/ws');
    const client = Stomp.over(socket);

    // Tắt log debug của stomp cho gọn console
    client.debug = () => {};

    client.connect({}, () => {
      // Đăng ký lắng nghe kênh "/topic/movies" (Kênh Admin gửi tin)
      client.subscribe('/topic/movies', (message) => {
        const newMovie: Movie = JSON.parse(message.body);

        // A. Hiện thông báo Toast cho đẹp
        toast({
          title: "🎬 Phim mới vừa lên sóng!",
          description: `Phim "${newMovie.title}" (${newMovie.releaseYear}) vừa được thêm.`,
          duration: 5000,
          action: <Button variant="outline" size="sm" onClick={() => {
            document.getElementById('movie-section')?.scrollIntoView({ behavior: 'smooth' });
          }}>Xem</Button>
        });

        // B. Cập nhật danh sách phim (Real-time)
        // Chỉ thêm vào list nếu người dùng đang ở trang chủ (không tìm kiếm)
        // Nếu đang tìm kiếm "Hành động" mà phim mới là "Tình cảm" nhảy vào thì vô lý
        if (!searchKeywordRef.current) {
          setMovies(prevMovies => [newMovie, ...prevMovies]);
        }
      });
    });

    // Cleanup khi rời trang
    return () => {
      if (client && client.connected) {
        client.disconnect(() => {});
      }
    };
  }, [toast]); // Chỉ chạy 1 lần khi mount

  // 3. LOGIC GỌI API (GIỮ NGUYÊN)
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        let endpoint = "";

        if (searchKeyword) {
          endpoint = `/api/movies?search=${encodeURIComponent(searchKeyword)}`;
        } else {
          endpoint = "/api/movies?page=0&size=12&sort=id,desc";
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
  }, [searchKeyword]);

  const clearSearch = () => {
    navigate("/");
  };

  return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />

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

        {!searchKeyword && (
            <section className="py-20 bg-card/50">
              <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
                  Tại sao chọn <span className="text-primary">WatchTogether</span>?
                </h2>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="p-6 rounded-lg bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Users className="h-6 w-6 text-white"/>
                    </div>
                    <h3 className="text-xl font-bold">Xem cùng nhau</h3>
                    <p className="text-muted-foreground">Phát đồng bộ hoàn hảo với bạn bè và gia đình.</p>
                  </div>

                  <div className="p-6 rounded-lg bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Film className="h-6 w-6 text-white"/>
                    </div>
                    <h3 className="text-xl font-bold">Thư viện khổng lồ</h3>
                    <p className="text-muted-foreground">Hàng nghìn bộ phim và chương trình truyền hình.</p>
                  </div>

                  <div className="p-6 rounded-lg bg-background border border-border hover:border-primary transition-all duration-300 hover:shadow-glow space-y-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Star className="h-6 w-6 text-white"/>
                    </div>
                    <h3 className="text-xl font-bold">Đánh giá & Nhận xét</h3>
                    <p className="text-muted-foreground">Chia sẻ suy nghĩ của bạn với cộng đồng.</p>
                  </div>
                </div>
              </div>
            </section>
        )}

        <section id="movie-section" className={`py-20 ${searchKeyword ? 'mt-16' : ''}`}>
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                {searchKeyword ? (
                    <>
                      <Search className="h-8 w-8 text-primary"/>
                      <div>
                        <h2 className="text-3xl font-bold">Kết quả tìm kiếm</h2>
                        <p className="text-muted-foreground">Từ khóa: <span className="text-primary font-bold">"{searchKeyword}"</span></p>
                      </div>
                    </>
                ) : (
                    <>
                      <TrendingUp className="h-8 w-8 text-primary"/>
                      <h2 className="text-3xl md:text-4xl font-bold">Phim mới cập nhật</h2>
                    </>
                )}
              </div>

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
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                        {movies.map((movie) => (
                            <MovieCard
                                key={movie.id}
                                id={movie.id}
                                title={movie.title}
                                poster={movie.poster}
                                rating={movie.rating}
                                year={movie.releaseYear?.toString()}
                                duration={`${movie.duration}`}
                                genre={movie.category?.name}
                            />
                        ))}
                      </div>
                  ) : (
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

        <footer className="py-12 border-t border-border mt-auto">
          <div className="container mx-auto px-4 text-center md:text-left">
            <p className="text-muted-foreground text-sm">© 2025 WatchTogether - Đồ án cơ sở 4.</p>
          </div>
        </footer>
      </div>
  );
};

export default Index;