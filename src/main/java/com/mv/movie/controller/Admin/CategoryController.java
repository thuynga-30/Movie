package com.mv.movie.controller.Admin;

import com.mv.movie.entity.Category;
import com.mv.movie.repository.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*") // Cho phép Frontend gọi
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @GetMapping
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }
    @PostMapping
    public ResponseEntity<?> createCategory(@RequestBody Category category) {
        try {
            // Kiểm tra trùng tên (Optional)
            if (categoryRepository.findAll().stream().anyMatch(c -> c.getName().equalsIgnoreCase(category.getName()))) {
                return ResponseEntity.badRequest().body("Thể loại này đã tồn tại!");
            }
            Category savedCategory = categoryRepository.save(category);
            return ResponseEntity.ok(savedCategory);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi tạo thể loại: " + e.getMessage());
        }
    }
}