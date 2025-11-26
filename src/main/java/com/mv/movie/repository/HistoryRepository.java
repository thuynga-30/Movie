package com.mv.movie.repository;

import com.mv.movie.entity.History;
import com.mv.movie.entity.Movies;
import com.mv.movie.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HistoryRepository extends JpaRepository<History, Integer> {
    Optional<History> findByUserAndMovie(User user, Movies movie);
    List<History> findByUserOrderByWatchedAtDesc(User user);
}
