import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2, ChevronLeft, ChevronRight, Video, Star } from "lucide-react";
import { api, getImageUrl } from "@/services/api";

// --- 1. Định nghĩa Interface (Khớp với Backend) ---
interface Movie {
  id: number;
  title: string;
  poster: string;
  genre: string;
  releaseYear: number;
  duration: number;
  rating?: number; // Backend gửi field này về
}

const Movies = () => {
  // --- 2. State Management ---
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 18;

  // --- 3. Hàm gọi API ---
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);

        const response = await api.get("/api/movies", {
          params: {
            page: currentPage,
            size: pageSize,
            title: searchQuery,
            sort: "id,desc"
          }
        });

        const data = response.data;

        // Xử lý dữ liệu trả về
        if (data.content && Array.isArray(data.content)) {
          setMovies(data.content);

          // Xử lý phân trang (hỗ trợ cả cấu trúc lồng nhau và phẳng)
          if (data.page && typeof data.page.totalPages === 'number') {
            setTotalPages(data.page.totalPages);
          } else if (typeof data.totalPages === 'number') {
            setTotalPages(data.totalPages);
          } else {
            setTotalPages(1);
          }
        } else if (Array.isArray(data)) {
          setMovies(data);
          setTotalPages(1);
        } else {
          setMovies([]);
          setTotalPages(0);
        }

      } catch (error) {
        console.error("Lỗi tải phim:", error);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchMovies();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentPage, searchQuery]);

  // --- 4. Handlers ---
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(0);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
      <div className="min-h-screen bg-background pb-20">
        <Navbar />

        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
                <Video className="h-8 w-8 text-primary" /> Khám phá phim
              </h1>

              <div className="flex w-full md:w-auto gap-4">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Tìm tên phim..."
                      className="pl-10 bg-card border-border focus:ring-primary"
                      value={searchQuery}
                      onChange={handleSearchChange}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Nội dung chính */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="text-muted-foreground">Đang tải danh sách phim...</p>
                </div>
            ) : (
                <>
                  {/* Grid Phim */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {movies.map((movie) => (
                        <MovieCard
                            key={movie.id}
                            id={movie.id}
                            title={movie.title}
                            poster={getImageUrl(movie.poster)}
                            year={movie.releaseYear?.toString()}
                            duration={`${movie.duration} phút`}
                            // 👇 QUAN TRỌNG: Chỉ lấy đúng trường rating
                            rating={movie.rating || 0}
                        />
                    ))}
                  </div>

                  {movies.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        <Search className="h-10 w-10 mb-2 opacity-20" />
                        <p>Không tìm thấy phim nào.</p>
                      </div>
                  )}
                </>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-6 mt-12 pt-6 border-t border-border/40">
                  <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  <span className="text-sm font-medium bg-secondary px-4 py-2 rounded-full">
                    Trang <span className="text-primary font-bold">{currentPage + 1}</span> / {totalPages}
                  </span>

                  <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages - 1}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default Movies;