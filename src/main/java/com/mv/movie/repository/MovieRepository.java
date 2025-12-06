package com.mv.movie.repository;

import com.mv.movie.entity.Movies;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MovieRepository extends JpaRepository<Movies, Integer>, JpaSpecificationExecutor<Movies> {
    Page<Movies> findByTitleContainingIgnoreCase(String title, Pageable pageable);
}