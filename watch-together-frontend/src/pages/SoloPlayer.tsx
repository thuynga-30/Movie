import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { api, getImageUrl } from "@/services/api";

const SoloPlayer = () => {
    // ✅ Sửa thành 'id' để khớp với Route path="/watch/solo/:id"
    const { id } = useParams();
    const navigate = useNavigate();

    const [movie, setMovie] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/movies/${id}`);
                setMovie(res.data);
            } catch (error) {
                console.error("Lỗi tải phim:", error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchMovie();
    }, [id]);

    // --- HÀM XỬ LÝ LINK YOUTUBE ---
    const getYouTubeEmbedUrl = (url: string) => {
        let videoId = "";
        if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        } else if (url.includes("v=")) {
            videoId = url.split("v=")[1]?.split("&")[0];
        }

        if (videoId) {
            // Thêm autoplay=1 và mute=1 để trình duyệt cho phép tự chạy
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1`;
        }
        return "";
    };

    if (loading) return (
        <div className="h-screen bg-black flex items-center justify-center text-white">
            <Loader2 className="animate-spin h-10 w-10 text-primary" />
        </div>
    );

    if (error || !movie) return (
        <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p>Không thể tải phim hoặc link phim bị hỏng.</p>
            <Button className="mt-4" onClick={() => navigate("/")}>Quay về trang chủ</Button>
        </div>
    );

    const finalUrl = getImageUrl(movie.videoUrl);
    const isYouTube = finalUrl.includes("youtube.com") || finalUrl.includes("youtu.be");
    const embedUrl = isYouTube ? getYouTubeEmbedUrl(finalUrl) : finalUrl;

    return (
        <div className="h-screen w-screen bg-black flex flex-col relative overflow-hidden">
            {/* Nút Quay lại */}
            <div className="absolute top-4 left-4 z-50 transition-opacity opacity-0 hover:opacity-100 group">
                <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full bg-black/50 hover:bg-black/80 text-white border-white/10"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            </div>

            {/* KHUNG PHÁT VIDEO */}
            <div className="absolute inset-0 bg-black flex items-center justify-center z-0">
                {isYouTube ? (
                    <iframe
                        src={embedUrl}
                        title={movie.title}
                        className="w-full h-full border-none"
                        // ✅ Thêm autoplay vào đây để hỗ trợ YouTube
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    <video
                        src={finalUrl}
                        className="w-full h-full object-contain shadow-2xl"
                        controls
                        autoPlay
                    >
                        Trình duyệt của bạn không hỗ trợ thẻ video.
                    </video>
                )}
            </div>

            {/* Overlay thông tin khi hover (Tùy chọn) */}
            <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity opacity-0 group-hover:opacity-100">
                <h1 className="text-xl font-bold text-white">{movie.title}</h1>
                <p className="text-xs text-gray-400">Đang xem: Một mình</p>
            </div>
        </div>
    );
};

export default SoloPlayer;