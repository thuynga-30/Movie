package com.mv.movie.controller.Admin;

import com.mv.movie.entity.Category;
import com.mv.movie.entity.Movies;
import com.mv.movie.repository.CategoryRepository;
import com.mv.movie.repository.MovieRepository;
import com.mv.movie.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/movies")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*")
public class AdminMovieController {

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public List<Movies> getAllMovies() {
        return movieRepository.findAll();
    }

    // 1. THÊM PHIM MỚI
    @PostMapping
    public ResponseEntity<?> addMovie(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("releaseYear") int releaseYear,
            @RequestParam("duration") int duration,
            @RequestParam("categoryId") Long categoryId, // Có nhận Category ID
            @RequestParam("poster") MultipartFile posterFile,
            @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
            @RequestParam(value = "videoUrl", required = false) String videoUrl
    ) {
        try {
            Movies movie = new Movies();
            movie.setTitle(title);
            movie.setDescription(description);
            movie.setReleaseYear(releaseYear);
            movie.setDuration(duration);

            String posterName = fileStorageService.storeFile(posterFile);
            movie.setPoster(posterName);

            if (videoFile != null && !videoFile.isEmpty()) {
                String videoName = fileStorageService.storeFile(videoFile);
                movie.setVideoUrl(videoName);
            } else if (videoUrl != null && !videoUrl.isEmpty()) {
                movie.setVideoUrl(videoUrl);
            } else {
                return ResponseEntity.badRequest().body("Vui lòng nhập Link video hoặc Upload file!");
            }

            // Tìm và gán Category
            Category category = categoryRepository.findById(Math.toIntExact(categoryId))
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            movie.setCategory(category);

            movieRepository.save(movie);
            return ResponseEntity.ok(movie);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi thêm phim: " + e.getMessage());
        }
    }

    // 2. CẬP NHẬT PHIM (ĐÃ SỬA LỖI THIẾU CATEGORY)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMovie(
            @PathVariable Long id, // Lưu ý: dùng Long hoặc Integer tùy thuộc vào ID trong Entity của bạn
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("releaseYear") int releaseYear,
            @RequestParam("duration") int duration,

            // ✅ QUAN TRỌNG: Thêm tham số này để nhận ID thể loại mới
            @RequestParam("categoryId") Long categoryId,

            @RequestParam(value = "poster", required = false) MultipartFile posterFile,
            @RequestParam(value = "videoFile", required = false) MultipartFile videoFile,
            @RequestParam(value = "videoUrl", required = false) String videoUrl
    ) {
        try {
            // Lưu ý: Chuyển đổi ID cho khớp với Repository của bạn (nếu Repo dùng Integer thì ép kiểu, nếu Long thì để nguyên)
            Movies movie = movieRepository.findById(Math.toIntExact(id))
                    .orElseThrow(() -> new RuntimeException("Movie not found"));

            movie.setTitle(title);
            movie.setDescription(description);
            movie.setReleaseYear(releaseYear);
            movie.setDuration(duration);

            // ✅ LOGIC CẬP NHẬT THỂ LOẠI (BỊ THIẾU TRONG CODE CŨ)
            Category category = categoryRepository.findById(Math.toIntExact(categoryId))
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            movie.setCategory(category);

            // Update Poster
            if (posterFile != null && !posterFile.isEmpty()) {
                String posterName = fileStorageService.storeFile(posterFile);
                movie.setPoster(posterName);
            }

            // Update Video
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