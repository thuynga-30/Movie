package com.mv.movie.controller.User;

import com.mv.movie.dto.request.HistoryRequest;
import com.mv.movie.entity.Favorite;
import com.mv.movie.entity.History;
import com.mv.movie.entity.Movies;
import com.mv.movie.entity.User;
import com.mv.movie.repository.FavoriteRepository;
import com.mv.movie.repository.HistoryRepository;
import com.mv.movie.repository.MovieRepository;
import com.mv.movie.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/interactions")
public class InteractionController {
    @Autowired
    public UserRepository userRepository;
    @Autowired
    public MovieRepository movieRepository;
    @Autowired
    private HistoryRepository historyRepository;

    @Autowired
    private FavoriteRepository favoriteRepository;

    // Hàm tiện ích để lấy User đang đăng nhập
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).orElseThrow();
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        User user = getCurrentUser();
        List<History> histories = historyRepository.findByUserOrderByWatchedAtDesc(user);
        return ResponseEntity.ok(histories);
    }
    @PostMapping("/history")
    public ResponseEntity<?> addHistory(@RequestBody HistoryRequest request) {
        User user = getCurrentUser();
        Movies movies = movieRepository.findById(request.getMovieId()).orElse(null);
        if (movies == null) {
            return ResponseEntity.badRequest().body("Movie not found");
        }
        History history = historyRepository.findByUserAndMovie(user,movies).orElse(new History());
        history.setUser(user);
        history.setMovie(movies);
        history.setProgress(request.getProgress());
        history.setWatchedAt(LocalDateTime.now()); // Cập nhật thời gian xem mới nhất

        historyRepository.save(history);
        return ResponseEntity.ok("Đã lưu tiến độ xem!");
    }
    @PostMapping("/favorites/{movieId}")
    public ResponseEntity<?> addFavorite(@PathVariable Integer movieId) {
        User user = getCurrentUser();
        Movies movie = movieRepository.findById(movieId).orElse(null);
        if (movie == null) return ResponseEntity.badRequest().body("Phim không tồn tại");

        // Kiểm tra đã thích chưa
        if (favoriteRepository.findByUserAndMovie(user, movie).isPresent()) {
            return ResponseEntity.badRequest().body("Phim này đã có trong danh sách yêu thích!");
        }

        Favorite favorite = new Favorite();
        favorite.setUser(user);
        favorite.setMovie(movie);
        favoriteRepository.save(favorite);

        return ResponseEntity.ok("Đã thêm vào danh sách yêu thích!");
    }

    // Bỏ thích (DELETE)
    @DeleteMapping("/favorites/{movieId}")
    @Transactional // Bắt buộc có dòng này khi thực hiện Xóa (Delete)
    public ResponseEntity<?> removeFavorite(@PathVariable Integer movieId) {
        User user = getCurrentUser();
        Movies movie = movieRepository.findById(movieId).orElse(null);
        if (movie == null) return ResponseEntity.badRequest().body("Phim không tồn tại");

        favoriteRepository.deleteByUserAndMovie(user, movie);
        return ResponseEntity.ok("Đã xóa khỏi danh sách yêu thích!");
    }

    // Xem danh sách yêu thích (GET)
    @GetMapping("/favorites")
    public ResponseEntity<?> getFavorites() {
        User user = getCurrentUser();
        List<Favorite> favorites = favoriteRepository.findByUserOrderByCreatedAtDesc(user);

        // Chỉ trả về danh sách các Movie object
        List<Movies> movies = favorites.stream().map(Favorite::getMovie).collect(Collectors.toList());
        return ResponseEntity.ok(movies);
    }
}
