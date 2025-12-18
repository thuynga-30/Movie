package com.mv.movie.controller.Admin;

import com.mv.movie.entity.Category;
import com.mv.movie.entity.Movies;
import com.mv.movie.repository.CategoryRepository;
import com.mv.movie.repository.MovieRepository;
import com.mv.movie.service.FileStorageService;
import com.mv.movie.service.TmdbService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URL;
import java.nio.file.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/movies")
public class AdminMovieController {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private TmdbService tmdbService;

    // Đường dẫn lưu ảnh
    private final Path uploadDir = Paths.get("uploads");

    // ✅ HÀM HỖ TRỢ: Tải ảnh từ URL về thư mục uploads
    private String downloadImageFromUrl(String imageUrl) {
        try {
            if (!Files.exists(uploadDir)) Files.createDirectories(uploadDir);

            // Tạo tên file ngẫu nhiên (VD: a1b2c3d4.jpg)
            String fileName = UUID.randomUUID().toString() + ".jpg";
            Path destination = uploadDir.resolve(fileName);

            // Tải từ mạng về và lưu vào ổ cứng
            try (InputStream in = new URL(imageUrl).openStream()) {
                Files.copy(in, destination, StandardCopyOption.REPLACE_EXISTING);
            }
            return fileName;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @GetMapping
    public List<Movies> getAllMovies() {
        return movieRepository.findAll();
    }

    @GetMapping("/fetch-tmdb")
    public ResponseEntity<?> fetchFromTmdb(@RequestParam String title) {
        Map<String, Object> data = tmdbService.fetchFullMetadata(title);
        if (data == null) return ResponseEntity.badRequest().body("Không tìm thấy dữ liệu");
        return ResponseEntity.ok(data);
    }

    // ✅ 1. THÊM PHIM MỚI (ĐÃ SỬA: Hỗ trợ tự tải Poster)
    @PostMapping
    public ResponseEntity<?> addMovie(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("releaseYear") int releaseYear,
            @RequestParam("duration") int duration,
            @RequestParam("categoryId") Long categoryId,

            // 👉 SỬA: Poster file không còn bắt buộc
            @RequestParam(value = "poster", required = false) MultipartFile posterFile,

            // 👉 THÊM: Link ảnh từ TMDB (nếu có)
            @RequestParam(value = "posterUrl", required = false) String posterUrl,

            @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
            @RequestParam(value = "videoUrl", required = false) String videoUrl
    ) {
        try {
            Movies movie = new Movies();
            movie.setTitle(title);
            movie.setDescription(description);
            movie.setReleaseYear(releaseYear);
            movie.setDuration(duration);

            // --- XỬ LÝ POSTER (QUAN TRỌNG) ---
            String savedPosterName = null;

            // Ưu tiên 1: Nếu Admin chọn file từ máy tính
            if (posterFile != null && !posterFile.isEmpty()) {
                savedPosterName = fileStorageService.storeFile(posterFile);
            }
            // Ưu tiên 2: Nếu không có file, nhưng có Link TMDB -> Tải về
            else if (posterUrl != null && !posterUrl.trim().isEmpty()) {
                savedPosterName = downloadImageFromUrl(posterUrl);
            }

            // Nếu cả 2 đều không có -> Báo lỗi
            if (savedPosterName == null) {
                return ResponseEntity.badRequest().body("Lỗi: Bạn chưa chọn ảnh Poster hoặc Link ảnh bị lỗi!");
            }
            movie.setPoster(savedPosterName);
            // ----------------------------------

            // Xử lý Video
            if (videoFile != null && !videoFile.isEmpty()) {
                String videoName = fileStorageService.storeFile(videoFile);
                movie.setVideoUrl(videoName);
            } else if (videoUrl != null && !videoUrl.isEmpty()) {
                movie.setVideoUrl(videoUrl);
            } else {
                return ResponseEntity.badRequest().body("Vui lòng nhập Link video hoặc Upload file!");
            }

            // Gán Category
            Category category = categoryRepository.findById(Math.toIntExact(categoryId))
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            movie.setCategory(category);

            movieRepository.save(movie);
            return ResponseEntity.ok(movie);
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi ra console để dễ debug
            return ResponseEntity.badRequest().body("Lỗi thêm phim: " + e.getMessage());
        }
    }

    // 2. CẬP NHẬT PHIM
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMovie(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("releaseYear") int releaseYear,
            @RequestParam("duration") int duration,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam(value = "poster", required = false) MultipartFile posterFile,

            // 👉 THÊM: Link ảnh cập nhật (nếu muốn update bằng link)
            @RequestParam(value = "posterUrl", required = false) String posterUrl,

            @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
            @RequestParam(value = "videoUrl", required = false) String videoUrl
    ) {
        try {
            Movies movie = movieRepository.findById(Math.toIntExact(id))
                    .orElseThrow(() -> new RuntimeException("Movie not found"));

            movie.setTitle(title);
            movie.setDescription(description);
            movie.setReleaseYear(releaseYear);
            movie.setDuration(duration);

            Category category = categoryRepository.findById(Math.toIntExact(categoryId))
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            movie.setCategory(category);

            // Update Poster Logic
            if (posterFile != null && !posterFile.isEmpty()) {
                String posterName = fileStorageService.storeFile(posterFile);
                movie.setPoster(posterName);
            } else if (posterUrl != null && !posterUrl.isEmpty()) {
                // Nếu muốn update bằng link
                String posterName = downloadImageFromUrl(posterUrl);
                if (posterName != null) movie.setPoster(posterName);
            }

            // Update Video Logic
            if (videoFile != null && !videoFile.isEmpty()) {
                String videoName = fileStorageService.storeFile(videoFile);
                movie.setVideoUrl(videoName);
            } else if (videoUrl != null && !videoUrl.isEmpty()) {
                movie.setVideoUrl(videoUrl);
            }

            movieRepository.save(movie);
            return ResponseEntity.ok(movie);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi cập nhật: " + e.getMessage());
        }
    }

    // 3. XÓA PHIM
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMovie(@PathVariable Integer id) {
        if (!movieRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        movieRepository.deleteById(id);
        return ResponseEntity.ok("Movie deleted successfully");
    }
}