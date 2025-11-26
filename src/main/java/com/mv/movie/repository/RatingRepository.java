package com.mv.movie.repository;
import com.mv.movie.entity.Movies;
import com.mv.movie.entity.Rating;
import com.mv.movie.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Integer> {
    // Tìm xem user này đã đánh giá phim này chưa (để update lại, không tạo mới)
    Optional<Rating> findByUserAndMovie(User user, Movies movie);
    // Tính điểm trung bình cộng của 1 bộ phim (Trả về số thực, vd: 4.5)
    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.movie.id = :movieId")
    Double getAverageRating(Integer movieId);
}