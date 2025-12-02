// src/services/api.ts
import axios from "axios";

// 1. Cấu hình đường dẫn Backend (Spring Boot chạy port 8080)
export const API_BASE_URL = "http://localhost:8080";

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// 2. Tự động gắn Token vào mỗi request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. Hàm xử lý hiển thị ảnh
// Nếu ảnh là link online (http...) thì giữ nguyên
// Nếu ảnh là file local (/images/...) thì nối thêm localhost:8080
export const getImageUrl = (path?: string) => {
    if (!path) return "https://placehold.co/300x450?text=No+Image";

    if (path.startsWith("http")) return path; // Ảnh online

    // NẾU PATH CHƯA CÓ /images/ THÌ THÊM VÀO
    // Giả sử trong DB bạn chỉ lưu tên file "abc.jpg"
    if (!path.startsWith("/images/")) {
        return `${API_BASE_URL}/images/${path}`;
    }

    // Nếu trong DB đã lưu "/images/abc.jpg"
    return `${API_BASE_URL}${path}`;
};