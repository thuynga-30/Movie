package com.mv.movie.repository;

import com.mv.movie.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Integer> {
    // Lấy bình luận của phim, sắp xếp mới nhất lên đầu
    List<Comment> findByMovieIdOrderByCreatedAtDesc(Integer movieId);
}