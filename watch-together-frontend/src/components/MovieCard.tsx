import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Star, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// Import hàm xử lý ảnh từ file api.ts chúng ta đã tạo trước đó
import { getImageUrl } from "@/services/api";

// 1. Sửa lại Interface: id chấp nhận cả number và string
interface MovieCardProps {
  id: number | string; // <--- FIX LỖI Ở ĐÂY
  title: string;
  poster?: string;
  rating?: number;
  year?: string;
  duration?: string;
  genre?: string;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const MovieCard = ({
                     id,
                     title,
                     poster,
                     rating = 0,
                     year,
                     duration,
                     genre,
                     isFavorite = false,
                     onToggleFavorite,
                   }: MovieCardProps) => {

  // 2. Xử lý logic hiển thị ảnh
  // Nếu poster là link từ backend -> dùng getImageUrl
  // Nếu poster null -> getImageUrl tự trả về ảnh placeholder
  const posterSrc = getImageUrl(poster);

  return (
      <Card className="group relative overflow-hidden bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-glow">
        <Link to={`/movie/${id}`}>
          <div className="relative aspect-[2/3] overflow-hidden">
            <img
                src={posterSrc} // <--- Dùng biến đã xử lý
                alt={title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                // Thêm xử lý khi ảnh lỗi
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/400x600?text=No+Image";
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                {duration && (
                    <Badge variant="secondary" className="bg-secondary/80 backdrop-blur-sm">
                      {duration}
                    </Badge>
                )}
                <Button className="w-full bg-gradient-primary hover:opacity-90 transition-opacity">
                  <Play className="mr-2 h-4 w-4" />
                  Xem ngay
                </Button>
              </div>
            </div>
          </div>
        </Link>

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/movie/${id}`}>
              <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {title}
              </h3>
            </Link>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => {
                  e.preventDefault(); // Ngăn chặn chuyển trang khi bấm tym
                  onToggleFavorite?.();
                }}
            >
              <Heart
                  className={`h-4 w-4 ${
                      isFavorite ? "fill-primary text-primary" : "text-muted-foreground"
                  }`}
              />
            </Button>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-secondary text-secondary" />
            {rating ? rating.toFixed(1) : "N/A"}
          </span>
            <span>{year}</span>
          </div>

          {genre && (
              <Badge variant="outline" className="text-xs">
                {genre}
              </Badge>
          )}
        </div>
      </Card>
  );
};

export default MovieCard;