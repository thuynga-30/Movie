package com.mv.movie.controller;

import com.mv.movie.entity.User;
import com.mv.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    // Helper: Lấy User từ Token (An toàn tuyệt đối)
    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // 1. LẤY INFO (GET /api/user/me)
    @GetMapping("/me")
    public ResponseEntity<?> getMyProfile() {
        return ResponseEntity.ok(getCurrentUser());
    }

    // 2. UPLOAD AVATAR (POST /api/user/avatar)
    @PostMapping("/avatar")
    public ResponseEntity<?> uploadAvatar(@RequestParam("avatar") MultipartFile file) {
        if (file.isEmpty()) return ResponseEntity.badRequest().body("File lỗi");

        try {
            User user = getCurrentUser();

            // Tạo tên file ngẫu nhiên để tránh trùng
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

            // Lưu vào thư mục "uploads" ở gốc dự án
            Path uploadPath = Paths.get("uploads");
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Lưu đường dẫn vào DB
            String dbPath = "/images/" + fileName;
            user.setAvatar(dbPath);
            userRepository.save(user);

            // Trả về link ảnh mới
            Map<String, String> res = new HashMap<>();
            res.put("avatar", dbPath);
            return ResponseEntity.ok(res);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Lỗi upload: " + e.getMessage());
        }
    }

    // 3. CẬP NHẬT EMAIL & PASS (PUT /api/user/update)
    @PutMapping("/update")
    public ResponseEntity<?> updateProfile(@RequestBody Map<String, String> request) {
        User user = getCurrentUser();

        // Cập nhật Email (Nếu có gửi lên)
        if (request.containsKey("email")) {
            String newEmail = request.get("email");
            // Nếu email khác email cũ thì check trùng
            if (!newEmail.equals(user.getEmail()) && userRepository.existsByEmail(newEmail)) {
                return ResponseEntity.badRequest().body("Email này đã được sử dụng!");
            }
            user.setEmail(newEmail);
        }

        // Cập nhật Mật khẩu (Nếu có gửi lên)
        if (request.containsKey("password") && !request.get("password").isBlank()) {
            user.setPassword(passwordEncoder.encode(request.get("password")));
        }

        userRepository.save(user);
        return ResponseEntity.ok(user);
    }
}