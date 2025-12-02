import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import MovieCard from "@/components/MovieCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, getImageUrl } from "@/services/api";

// Định nghĩa kiểu dữ liệu Phim
interface Movie {
  id: number;
  title: string;
  poster: string;
  genre: string;
  releaseYear: number;
  duration: number;
  rating?: number;
}

const Movies = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy phim khi trang tải
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        // Backend API: GET /api/movies
        // Bạn có thể truyền params: { keyword: searchQuery } để tìm kiếm
        const response = await api.get("/api/movies");

        // Spring Boot trả về Page<Movie>, lấy phần content
        setMovies(response.data.content || []);
      } catch (error) {
        console.error("Lỗi tải phim:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []); // Thêm searchQuery vào đây nếu muốn tìm kiếm real-time

  return (
      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Khám phá phim
              </h1>

              <div className="flex w-full md:w-auto gap-4">
                <div className="relative flex-1 md:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Tìm kiếm phim..."
                      className="pl-10 bg-card border-border"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  {/* Phần Filter giữ nguyên */}
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* HIỂN THỊ DANH SÁCH PHIM THẬT */}
            {loading ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                  {movies.map((movie) => (
                      <MovieCard
                          key={movie.id}
                          {...movie}
                          poster={getImageUrl(movie.poster)} // Xử lý link ảnh
                          year={movie.releaseYear.toString()}
                          duration={`${movie.duration} phút`}
                      />
                  ))}

                  {movies.length === 0 && (
                      <div className="col-span-full text-center text-muted-foreground">
                        Không tìm thấy phim nào.
                      </div>
                  )}
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default Movies;