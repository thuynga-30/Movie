import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { api, getImageUrl } from "@/services/api";

const SoloPlayer = () => {
    const { movieId } = useParams();
    const navigate = useNavigate();

    const [movie, setMovie] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/api/movies/${movieId}`);
                setMovie(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        if (movieId) fetchMovie();
    }, [movieId]);

    // --- HÀM XỬ LÝ LINK YOUTUBE ---
    const getYouTubeEmbedUrl = (url: string) => {
        let videoId = "";

        // Trường hợp 1: Link dạng youtu.be/ID
        if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        }
        // Trường hợp 2: Link dạng youtube.com/watch?v=ID
        else if (url.includes("v=")) {
            videoId = url.split("v=")[1]?.split("&")[0];
        }

        // Trả về link nhúng chuẩn của YouTube
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
        }
        return "";
    };

    if (loading) return <div className="h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
    if (!movie) return null;

    const finalUrl = getImageUrl(movie.videoUrl);
    const isYouTube = finalUrl.includes("youtube.com") || finalUrl.includes("youtu.be");
    const embedUrl = isYouTube ? getYouTubeEmbedUrl(finalUrl) : finalUrl;

    return (
        <div className="h-screen w-screen bg-black flex flex-col relative overflow-hidden">

            {/* Nút Back */}
            <div className="absolute top-4 left-4 z-50">
                <Button variant="secondary" size="icon" className="rounded-full bg-black/50 hover:bg-black/80 text-white" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            </div>

            {/* KHUNG PHÁT VIDEO */}
            <div className="absolute inset-0 bg-black flex items-center justify-center z-0">

                {/* TRƯỜNG HỢP 1: YOUTUBE */}
                {isYouTube ? (
                    <iframe
                        src={embedUrl}
                        title="YouTube Video"
                        className="w-full h-full"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                ) : (
                    /* TRƯỜNG HỢP 2: FILE MP4 (Từ máy tính hoặc link trực tiếp) */
                    <video
                        src={finalUrl}
                        className="w-full h-full object-contain"
                        controls
                        autoPlay
                    >
                        Trình duyệt của bạn không hỗ trợ thẻ video.
                    </video>
                )}

            </div>

            {/* Thông tin phim */}
            {/*<div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-8 pb-10 pointer-events-none">*/}
            {/*    <div className="container mx-auto">*/}
            {/*        <h1 className="text-3xl font-bold text-white mb-2">{movie.title}</h1>*/}
            {/*        <p className="text-gray-400 text-sm line-clamp-2">{movie.description}</p>*/}
            {/*    </div>*/}
            {/*</div>*/}
        </div>
    );
};

export default SoloPlayer;