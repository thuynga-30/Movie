package com.mv.movie.controller;


import com.mv.movie.dto.request.ChangePasswordRequest;
import com.mv.movie.dto.request.UpdateProfileRequest;
import com.mv.movie.entity.User;
import com.mv.movie.repository.UserRepository;
import com.mv.movie.util.JwtUntils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map; // Dùng Map để trả về JSON đơn giản

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUntils jwtUntils;
    // --- API ĐĂNG KÝ ---
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody User user) {
        // 1. Kiểm tra tên đăng nhập đã tồn tại chưa
        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body("Lỗi: Tên đăng nhập đã tồn tại!");
        }

        // 2. Mã hóa mật khẩu trước khi lưu
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        // 3. Lưu vào Database
        userRepository.save(user);

        return ResponseEntity.ok("Đăng ký thành công!");
    }

    // --- API ĐĂNG NHẬP ---
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody Map<String, String> loginData) {
        String loginInput = loginData.get("username");
        String password = loginData.get("password");

        User user = userRepository.findByUsernameOrEmail(loginInput,loginInput)
                .orElse(null);

        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            String token = jwtUntils.token(user.getUsername());

            // Trả về JSON chứa Token và Info
            Map<String, Object> response = new HashMap<>();
            response.put("token", token);
            response.put("username", user.getUsername());
            response.put("avatar", user.getAvatar());
            response.put("id", user.getId());
            response.put("role", user.getRole()); // Trả về role (ví dụ: "ADMIN" hoặc "USER")
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.badRequest().body("Sai tên đăng nhập hoặc mật khẩu!");
        }
    }
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserProfile(@PathVariable Integer id) {
        User user = userRepository.findById(Long.valueOf(id)).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Người dùng không tồn tại!");
        }
        return ResponseEntity.ok(user);
    }
    @PutMapping("/{id}/update")
    public ResponseEntity<?> updateProfile(@PathVariable Integer id,
                                           @RequestBody UpdateProfileRequest request) {
        User user = userRepository.findById(Long.valueOf(id)).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User không tồn tại");

        // Chỉ cập nhật những trường có gửi lên
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar());
        // Nếu đổi email, cần check xem email mới có trùng với ai khác không
        if (request.getEmail() != null && !request.getEmail().equals(user.getEmail())) {
            if (userRepository.existsByEmail(request.getEmail())) {
                return ResponseEntity.badRequest().body("Email này đã được sử dụng bởi người khác!");
            }
            user.setEmail(request.getEmail());
        }

        userRepository.save(user);
        return ResponseEntity.ok("Cập nhật thành công!");
    }
    @PutMapping("/{id}/change-pasword")
    public ResponseEntity<?> changePassword(@PathVariable Integer id,
                                            @RequestBody ChangePasswordRequest request) {
        User user = userRepository.findById(Long.valueOf(id)).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User không tồn tại");
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body("Mật khẩu cũ không chính xác");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return ResponseEntity.ok("Đổi mật khẩu thành công");
    }
    //Xóa tài khoản (Yêu cầu nhập mật khẩu xác nhận)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAccount(@PathVariable Integer id,
                                           @RequestBody Map<String, String> request) {

        String passwordConfirm = request.get("password");

        User user = userRepository.findById(Long.valueOf(id)).orElse(null);
        if (user == null) {
            return ResponseEntity.badRequest().body("Tài khoản không tồn tại!");
        }

        if (passwordConfirm == null || !passwordEncoder.matches(passwordConfirm, user.getPassword())) {
            return ResponseEntity.badRequest().body("Mật khẩu xác nhận không đúng! Không thể xóa tài khoản.");
        }

        try {
            userRepository.deleteById(Long.valueOf(id));
            return ResponseEntity.ok("Đã xóa tài khoản vĩnh viễn. Hẹn gặp lại!");
        } catch (Exception e) {
            // Lỗi này thường xảy ra nếu User đang làm chủ 1 Room hoặc có dữ liệu ràng buộc khóa ngoại
            return ResponseEntity.badRequest().body("Lỗi: Không thể xóa tài khoản do đang liên kết dữ liệu khác.");
        }
    }
}
