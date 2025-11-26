package com.mv.movie.controller.User;

import com.mv.movie.dto.request.RatingRequest;
import com.mv.movie.dto.response.CommentResponse;
import com.mv.movie.entity.*;
import com.mv.movie.repository.CommentRepository;
import com.mv.movie.repository.MovieRepository;
import com.mv.movie.repository.RatingRepository;
import com.mv.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired private CommentRepository commentRepository;
    @Autowired private RatingRepository ratingRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private MovieRepository movieRepository;

    // --- PHẦN BÌNH LUẬN (COMMENT) ---

    // 1. Gửi bình luận (Cần đăng nhập)
    @PostMapping("/comments")
    public ResponseEntity<?> addComment(@RequestBody Map<String, String> request) {
        String content = request.get("content");
        Integer movieId = Integer.parseInt(request.get("movieId"));

        // Lấy User đang đăng nhập từ Token
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        Movies movie = movieRepository.findById(movieId).orElse(null);

        if (movie == null) return ResponseEntity.badRequest().body("Phim không tồn tại");

        Comment comment = new Comment();
        comment.setContent(content);
        comment.setUser(user);
        comment.setMovie(movie);
        commentRepository.save(comment);

        return ResponseEntity.ok("Đã gửi bình luận!");
    }

    // 2. Xem danh sách bình luận của 1 phim (Công khai)
    // GET /api/reviews/comments/1 (1 là ID phim)
    @GetMapping("/comments/{movieId}")
    public List<CommentResponse> getComments(@PathVariable Integer movieId) {
        List<Comment> comments = commentRepository.findByMovieIdOrderByCreatedAtDesc(movieId);

        // Chuyển đổi từ Entity sang DTO để lấy tên và avatar đẹp hơn
        return comments.stream().map(c -> new CommentResponse(
                c.getId(),
                c.getContent(),
                c.getCreatedAt(),
                c.getUser().getUsername(),
                c.getUser().getAvatar()
        )).collect(Collectors.toList());
    }

    // --- PHẦN ĐÁNH GIÁ (RATING) ---

    // 3. Gửi đánh giá sao (Cần đăng nhập)
    @PostMapping("/ratings")
    public ResponseEntity<?> addRating(@RequestBody RatingRequest request) {
        if (request.getStar() < 1 || request.getStar() > 5) {
            return ResponseEntity.badRequest().body("Điểm đánh giá phải từ 1 đến 5!");
        }

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username).orElseThrow();
        Movies movie = movieRepository.findById(request.getMovieId()).orElse(null);

        if (movie == null) return ResponseEntity.badRequest().body("Phim không tồn tại");

        // Kiểm tra xem user đã đánh giá chưa. Nếu rồi thì cập nhật, chưa thì tạo mới
        Rating rating = ratingRepository.findByUserAndMovie(user, movie)
                .orElse(new Rating());

        rating.setUser(user);
        rating.setMovie(movie);
        rating.setRating(request.getStar()); // Cập nhật số sao mới

        ratingRepository.save(rating);
        return ResponseEntity.ok("Đã đánh giá " + request.getStar() + " sao!");
    }

    // 4. Lấy điểm trung bình của phim (Công khai)
    @GetMapping("/ratings/{movieId}/average")
    public ResponseEntity<?> getAverageRating(@PathVariable Integer movieId) {
        Double avg = ratingRepository.getAverageRating(movieId);
        // Nếu chưa ai đánh giá thì trả về 0
        return ResponseEntity.ok(avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0); // Làm tròn 1 chữ số thập phân
    }
}
