package com.mv.movie.repository;

import com.mv.movie.entity.Favorite;
import com.mv.movie.entity.Movies;
import com.mv.movie.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Integer> {
    Optional<Favorite> findByUserAndMovie(User user, Movies movie);
    List<Favorite> findByUserOrderByCreatedAtDesc(User user);
    void deleteByUserAndMovie(User user, Movies movie);
}
