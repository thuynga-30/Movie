import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { api, getImageUrl } from "@/services/api";

const SoloPlayer = () => {
    const { movieId } = useParams(); // Lấy Movie ID từ URL
    const navigate = useNavigate();

    const [movie, setMovie] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                setLoading(true);
                // Gọi API lấy thông tin phim trực tiếp
                const res = await api.get(`/api/movies/${movieId}`);
                setMovie(res.data);
            } catch (error) {
                console.error("Lỗi tải phim:", error);
            } finally {
                setLoading(false);
            }
        };

        if (movieId) fetchMovie();
    }, [movieId]);

    if (loading) {
        return (
            <div className="h-screen bg-black flex items-center justify-center text-white">
                <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="h-screen bg-black flex flex-col items-center justify-center text-white gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p>Không tìm thấy phim.</p>
                <Button onClick={() => navigate("/movies")}>Quay lại</Button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-black flex flex-col">
            {/* Header đơn giản */}
            <div className="absolute top-0 left-0 z-10 p-4">
                <Button variant="secondary" size="icon" className="rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            </div>

            {/* Video Player */}
            <div className="flex-1 flex items-center justify-center">
                <video
                    className="w-full h-full max-h-screen object-contain"
                    controls
                    autoPlay
                    // Dùng getImageUrl để xử lý link video (local hoặc online)
                    src={getImageUrl(movie.videoUrl)}
                />
            </div>

            <div className="absolute bottom-10 left-10 z-10 bg-black/60 px-4 py-2 rounded text-white">
                <h1 className="text-xl font-bold">{movie.title}</h1>
                <p className="text-sm text-gray-300">Đang xem chế độ một mình</p>
            </div>
        </div>
    );
};

export default SoloPlayer;