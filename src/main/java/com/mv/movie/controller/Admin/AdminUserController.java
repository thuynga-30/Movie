package com.mv.movie.controller.Admin;

import com.mv.movie.entity.User;
import com.mv.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/users")
public class AdminUserController {
    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    //tìm kiếm theo tên
    @GetMapping("/search")
    public ResponseEntity<?> getUsersByName(@RequestParam String name) {
        return ResponseEntity.ok(userRepository.findByUsername(name));
    }
    //xóa
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable int id) {
        if (!userRepository.existsById(Long.valueOf(id))) {
            return ResponseEntity.badRequest().body("Không tìm thấy user để xóa!");
        }
        userRepository.deleteById(Long.valueOf(id));
        return ResponseEntity.ok("Đã xóa người dùng thành công");
    }

}
