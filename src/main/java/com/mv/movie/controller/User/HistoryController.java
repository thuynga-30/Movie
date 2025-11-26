package com.mv.movie.controller.User;

import com.mv.movie.dto.request.HistoryRequest;
import com.mv.movie.entity.History;
import com.mv.movie.entity.Movies;
import com.mv.movie.entity.User;
import com.mv.movie.repository.HistoryRepository;
import com.mv.movie.repository.MovieRepository;
import com.mv.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/history")
public class HistoryController {
    @Autowired
    public UserRepository userRepository;
    @Autowired
    public MovieRepository movieRepository;
    @Autowired
    private HistoryRepository historyRepository;

    // Hàm tiện ích để lấy User đang đăng nhập
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username).orElseThrow();
    }

    @GetMapping
    public ResponseEntity<?> getHistory() {
        User user = getCurrentUser();
        List<History> histories = historyRepository.findByUserOrderByWatchedAtDesc(user);
        return ResponseEntity.ok(histories);
    }
    @PostMapping
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
}