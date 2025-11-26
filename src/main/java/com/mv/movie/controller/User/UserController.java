package com.mv.movie.controller.User;


import com.mv.movie.dto.request.ChangePasswordRequest;
import com.mv.movie.entity.User;
import com.mv.movie.repository.UserRepository;
import com.mv.movie.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map; // Dùng Map để trả về JSON đơn giản

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private FileStorageService fileStorageService;

    // --- API ĐĂNG KÝ ---

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
                                           @RequestParam(value = "email", required = false) String email,
                                           @RequestParam(value = "avatar", required = false) MultipartFile avatarFile ) {
        System.out.println("=================================");
        System.out.println("1. Đã vào Controller updateProfile");

        if (avatarFile == null) {
            System.out.println("3. LỖI: avatarFile đang bị NULL (Postman chưa gửi hoặc sai tên key)");
        } else {
            System.out.println("3. Có nhận được file!");
            System.out.println("   - Tên file: " + avatarFile.getOriginalFilename());
            System.out.println("   - Kích thước: " + avatarFile.getSize());
            System.out.println("   - Có rỗng không?: " + avatarFile.isEmpty());
        }
        System.out.println("=================================");
        User user = userRepository.findById(Long.valueOf(id)).orElse(null);
        if (user == null) return ResponseEntity.badRequest().body("User không tồn tại");
        if (avatarFile != null && !avatarFile.isEmpty()) {
            String imagePath = fileStorageService.storeFile(avatarFile);
            user.setAvatar(imagePath); // Lưu đường dẫn vào DB (vd: /images/xyz.jpg)
        }
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body("Email đã tồn tại!");
            }
            user.setEmail(email);
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
