import axios from "axios";

// 1. Cấu hình đường dẫn gốc (Backend chạy port 8080)
export const API_BASE_URL = "http://192.168.2.35:8080";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: { "Content-Type": "application/json" },
});

// Tự động gắn Token vào mọi request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. HÀM XỬ LÝ ẢNH/VIDEO THÔNG MINH (QUAN TRỌNG)
export const getImageUrl = (path?: string) => {
    // Nếu không có path hoặc path rỗng -> Trả về chuỗi rỗng
    if (!path) return "";

    // A. Nếu là link Online (YouTube, Facebook...) -> Giữ nguyên
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    // B. Xử lý đường dẫn nội bộ (File trong máy)
    // Bước 1: Xóa dấu gạch chéo ở đầu (nếu có) để chuẩn hóa
    // Ví dụ: "/images/abc.mp4" -> thành "images/abc.mp4"
    const cleanPath = path.startsWith("/") ? path.substring(1) : path;

    // Bước 2: Kiểm tra xem trong chuỗi đã có chữ "images/" chưa
    if (cleanPath.startsWith("images/")) {
        // Nếu có rồi -> Chỉ nối domain
        // Kết quả: http://localhost:8080/images/abc.mp4
        return `${API_BASE_URL}/${cleanPath}`;
    }

    // Nếu chưa có -> Nối thêm "images/"
    // Kết quả: http://localhost:8080/images/abc.mp4
    return `${API_BASE_URL}/images/${cleanPath}`;
};