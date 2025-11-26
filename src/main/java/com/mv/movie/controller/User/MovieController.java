package com.mv.movie.controller.User;

import com.mv.movie.entity.Movies;
import com.mv.movie.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/movies/")
public class MovieController {

    @Autowired
    private MovieRepository movieRepository;
    /**
     * GET /api/movies?keyword=tenphim&categoryId=1&releaseYear=2024&page=0&size=10
     * @param keyword: Tìm kiếm theo tên hoặc mô tả
     * @param categoryId: Lọc theo ID thể loại
     * @param releaseYear: Lọc theo năm phát hành
     * @param page: Trang hiện tại (default 0)
     * @param size: Số lượng phim trên 1 trang (default 10)
     * @param sortBy: Sắp xếp theo cột nào (default: createdAt)
     */
    @GetMapping
    public Page<Movies> getMovies(
            @RequestParam Optional<String> keyword,
            @RequestParam Optional<Integer> categoryId,
            @RequestParam Optional<Integer> releaseYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
            ) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);
        Specification<Movies> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            // A. Lọc theo TỪ KHÓA (Tìm trong title HOẶC description)
            if (keyword.isPresent() && !keyword.get().isEmpty()) {
                String likeKeyword = "%" + keyword.get().toLowerCase() + "%";
                Predicate titlePredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), likeKeyword);
                Predicate descriptionPredicate = criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), likeKeyword);

                // Kết hợp 2 điều kiện tìm kiếm bằng OR
                predicates.add(criteriaBuilder.or(titlePredicate, descriptionPredicate));
            }
            if (categoryId.isPresent()) {
                predicates.add(criteriaBuilder.equal(root.get("category").get("id"), categoryId.get()));
            }
            // C. Lọc theo NĂM PHÁT HÀNH (releaseYear)
            if (releaseYear.isPresent()) {
                predicates.add(criteriaBuilder.equal(root.get("releaseYear"), releaseYear.get()));
            }
            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
        return movieRepository.findAll(specification, pageable);
        }

    @GetMapping("/{id}")
    public ResponseEntity<Movies> getMovieDetail(@PathVariable int id) {
        Optional<Movies> movie = movieRepository.findById(id);
        return movie.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
