import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Star, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/services/api";

interface MovieCardProps {
    id: number | string;
    title: string;
    poster?: string;
    rating?: number | string; // Cho phép nhận cả string để tránh lỗi type check
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

    const posterSrc = getImageUrl(poster);

    // --- LOGIC XỬ LÝ RATING AN TOÀN ---
    // 1. Ép kiểu về số (dù đầu vào là "8.5" hay 8.5 đều thành số 8.5)
    // 2. Kiểm tra nếu là NaN (Not a Number) thì gán bằng 0
    const numericRating = Number(rating);
    const displayRating = !isNaN(numericRating) && numericRating > 0
        ? numericRating.toFixed(1)
        : "N/A";

    return (
        <Card className="group relative overflow-hidden bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-glow">
            <Link to={`/movie/${id}`}>
                <div className="relative aspect-[2/3] overflow-hidden">
                    <img
                        src={posterSrc}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
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
                            e.preventDefault();
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
              {/* Sử dụng biến displayRating đã xử lý ở trên */}
              {displayRating}
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