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

    @PostMapping
    public ResponseEntity<?> addMovie(@RequestParam("title") String title,
                                      @RequestParam(value = "description",required = false) String description,
                                      @RequestParam("videoUrl") String videoUrl, // Link phim (Copy paste link)
                                      @RequestParam("releaseYear") Integer releaseYear,
                                      @RequestParam("duration") Integer duration,
                                      @RequestParam("categoryId") Integer categoryId, // Nhận ID thể loại
                                      @RequestParam(value = "poster", required = false) MultipartFile posterFile
    ) {
        Category category = categoryRepository.findById(categoryId).orElse(null);
        if (category == null) {
            return ResponseEntity.badRequest().body("Category not found");
        }
        Movies movies = new Movies();
        movies.setTitle(title);
        movies.setDescription(description);
        movies.setVideoUrl(videoUrl);
        movies.setReleaseYear(releaseYear);
        movies.setDuration(duration);
        movies.setCategory(category);

        if (posterFile != null && !posterFile.isEmpty()) {
            String fileName = fileStorageService.storeFile(posterFile);
            movies.setPoster(fileName);
        } else {
            movies.setPoster("/images/posters/default_poster.jpg");
        }
        return ResponseEntity.ok(movieRepository.save(movies));
    }
    //update
    @PutMapping("/{id}")
    public ResponseEntity<?> updateMovie(@PathVariable Integer id,
                                         @RequestParam(value = "title", required = false) String title,
                                         @RequestParam(value = "description", required = false) String description,
                                         @RequestParam(value = "videoUrl", required = false) String videoUrl,
                                         @RequestParam(value = "releaseYear", required = false) Integer releaseYear,
                                         @RequestParam(value = "duration", required = false) Integer duration,
                                         @RequestParam(value = "categoryId", required = false) Integer categoryId,
                                         @RequestParam(value = "poster", required = false) MultipartFile posterFile
    ) {
        Movies movie = movieRepository.findById(id).orElse(null);
        if (movie == null) {
            return ResponseEntity.badRequest().body("Movie not found");
        }
        if (posterFile != null && !posterFile.isEmpty()) {
            String fileName = fileStorageService.storeFile(posterFile);
            movie.setPoster(fileName);
        }
        if (title != null && !title.isEmpty()) {
            movie.setTitle(title);
        }
        if (description != null && !description.isEmpty()) {
            movie.setDescription(description);
        }
        if (videoUrl != null && !videoUrl.isEmpty()) {
            movie.setVideoUrl(videoUrl);
        }
        if (releaseYear != null) movie.setReleaseYear(releaseYear);
        if (duration != null) movie.setDuration(duration);

        // Cập nhật thể loại nếu có chọn mới
        if (categoryId != null) {
            Category category = categoryRepository.findById(categoryId).orElse(null);
            if (category != null) movie.setCategory(category);
        }
        return ResponseEntity.ok(movieRepository.save(movie));
    }
    //Xóa
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMovie(@PathVariable Integer id) {
        if (!movieRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        movieRepository.deleteById(id);
        return ResponseEntity.ok("Movie deleted successfully");
    }
    @PutMapping("/movies/{id}")
    public ResponseEntity<?> updateMovie(
            @PathVariable Integer id,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("videoUrl") String videoUrl,
            @RequestParam("releaseYear") int releaseYear,
            @RequestParam("duration") int duration,
            @RequestParam(value = "poster", required = false) MultipartFile posterFile // Poster không bắt buộc
    ) {
        try {
            Movies movie = movieRepository.findById(id).orElseThrow(() -> new RuntimeException("Movie not found"));

            movie.setTitle(title);
            movie.setDescription(description);
            movie.setVideoUrl(videoUrl);
            movie.setReleaseYear(releaseYear);
            movie.setDuration(duration);

            // Nếu có gửi ảnh mới lên thì mới thay đổi, không thì giữ nguyên ảnh cũ
            if (posterFile != null && !posterFile.isEmpty()) {
                String posterPath = fileStorageService.storeFile(posterFile); // Hàm lưu file của bạn
                movie.setPoster(posterPath);
            }

            movieRepository.save(movie);
            return ResponseEntity.ok(movie);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi cập nhật: " + e.getMessage());
        }
    }

}
