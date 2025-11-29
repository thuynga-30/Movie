package com.mv.movie.controller.User;

import com.mv.movie.dto.response.SocketPayload;
import com.mv.movie.entity.ChatMessage;
import com.mv.movie.entity.User;
import com.mv.movie.entity.WatchRoom;
import com.mv.movie.repository.ChatMessageRepository;
import com.mv.movie.repository.MovieRepository;
import com.mv.movie.repository.UserRepository;
import com.mv.movie.repository.WatchRoomRepository;
import com.mv.movie.service.RoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
    @Autowired
    private MovieRepository movieRepository;
    @Autowired
    private RoomService roomService;
    @Autowired
    private WatchRoomRepository roomRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;
    @Autowired private SimpMessagingTemplate messagingTemplate; // Dùng để gửi tin nhắn Socket
    // Tạo phòng mới: POST /api/rooms?hostId=1&movieId=2&isPrivate=false
    // Cập nhật API POST /api/rooms
    @PostMapping
    public ResponseEntity<?> createRoom(
            @RequestParam Integer movieId,
            @RequestParam(defaultValue = "false") Boolean isPrivate,
            @RequestParam(required = false) String password
    ) {
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User host = userRepository.findByUsername(currentUsername).orElseThrow();

        WatchRoom room = new WatchRoom();
        room.setHost(host);
        room.setMovie(movieRepository.findById(movieId).orElseThrow());
        room.setIsPrivate(isPrivate);
        room.setRoomCode(roomService.generateRoomCode());

        // Nếu Private -> Bắt buộc có mật khẩu
        if (isPrivate) {
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Phòng riêng tư bắt buộc phải có mật khẩu!");
            }
            room.setRoomPassword(password);
        }

        roomRepository.save(room);

        // Trả về JSON chứa cả Link mời
        Map<String, Object> response = new HashMap<>();
        response.put("id", room.getId());
        response.put("roomCode", room.getRoomCode());
        response.put("isPrivate", room.getIsPrivate());
        // Tạo link mời chuẩn
        response.put("joinUrl", "http://localhost:8080/watch-room.html?code=" + room.getRoomCode());

        return ResponseEntity.ok(response);
    }

    // Lấy thông tin phòng để vào: GET /api/rooms/CODE123
    @GetMapping("/{roomCode}")
    public ResponseEntity<?> getRoomByCode(@PathVariable String roomCode) {
        WatchRoom room = roomRepository.findByRoomCode(roomCode)
                .orElse(null);
        if (room == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(room);
    }
//    @DeleteMapping("/{roomCode}")
//    public ResponseEntity<?> deleteRoom(@PathVariable String roomCode) {
//        // 1. Lấy User đang đăng nhập
//        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
//
//        // 2. Tìm phòng
//        WatchRoom room = roomRepository.findByRoomCode(roomCode).orElse(null);
//        if (room == null) return ResponseEntity.badRequest().body("Phòng không tồn tại!");
//
//        // 3. Kiểm tra quyền chủ phòng
//        if (!room.getHost().getUsername().equals(currentUsername)) {
//            return ResponseEntity.status(403).body("Bạn không phải chủ phòng này!");
//        }
//
//        // 4. Gửi thông báo Socket cho tất cả thành viên: "Phòng đã giải tán"
//        // Frontend nhận được tin này sẽ tự động chuyển hướng về trang chủ
//        SocketPayload kickMessage = new SocketPayload();
//        kickMessage.setType("ROOM_DELETED");
//        kickMessage.setMessage("Chủ phòng đã giải tán phòng này!");
//        messagingTemplate.convertAndSend("/topic/room/" + roomCode, kickMessage);
//
//        // 5. Xóa phòng trong Database
//        roomRepository.delete(room);
//
//        return ResponseEntity.ok("Đã giải tán phòng thành công!");
//    }
    // POST /api/rooms/join
    @PostMapping("/check-join")
    public ResponseEntity<?> checkJoinRoom(@RequestBody Map<String, String> request) {
        String roomCode = request.get("roomCode");
        String password = request.get("password"); // Người dùng gửi lên

        WatchRoom room = roomRepository.findByRoomCode(roomCode).orElse(null);
        if (room == null) return ResponseEntity.badRequest().body("Phòng không tồn tại!");

        // Nếu là phòng riêng tư -> Check password
        if (room.getIsPrivate()) {
            if (password == null || !password.equals(room.getRoomPassword())) {
                // Trả về mã lỗi 403 để Frontend biết mà hiện ô nhập pass
                return ResponseEntity.status(403).body("Mật khẩu phòng không đúng hoặc còn thiếu!");
            }
        }

        return ResponseEntity.ok("Mật khẩu đúng, cho phép vào!");
    }
    @GetMapping("/{roomCode}/messages")
    public ResponseEntity<?> getRoomMessages(@PathVariable String roomCode) {
        // 1. Lấy danh sách tin nhắn từ DB
        List<ChatMessage> messages = chatMessageRepository.findByRoom_RoomCodeOrderBySentAtAsc(roomCode);

        // 2. Chuyển đổi từ Entity sang DTO (SocketPayload) để Frontend dễ dùng
        List<SocketPayload> response = messages.stream().map(msg -> {
            SocketPayload dto = new SocketPayload();
            dto.setType("CHAT");
            dto.setMessage(msg.getMessage());

            // Lấy thông tin từ quan hệ User để hiển thị Avatar/Tên
            if (msg.getUser() != null) {
                dto.setSenderName(msg.getUser().getUsername());
                dto.setAvatar(msg.getUser().getAvatar());
            }
            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
    @GetMapping("/my-rooms")
    public ResponseEntity<?> getMyRooms() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User host = userRepository.findByUsername(username).orElseThrow();

        List<WatchRoom> rooms = roomRepository.findByHost(host);
        return ResponseEntity.ok(rooms);
    }

    // 2. API XÓA PHÒNG (Chỉ Host mới xóa được)
    @DeleteMapping("/{roomCode}")
    public ResponseEntity<?> deleteRoom(@PathVariable String roomCode) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        WatchRoom room = roomRepository.findByRoomCode(roomCode)
                .orElseThrow(() -> new RuntimeException("Phòng không tồn tại"));

        // Kiểm tra quyền: Chỉ Host mới được xóa
        if (!room.getHost().getUsername().equals(username)) {
            return ResponseEntity.status(403).body("Bạn không phải chủ phòng!");
        }

        // Xóa phòng
        roomRepository.delete(room);

        // (Nâng cao) Gửi thông báo Socket để đá tất cả mọi người ra khỏi phòng
        // Bạn cần tạo class SocketPayload type = "ROOM_DELETED"
        // messagingTemplate.convertAndSend("/topic/room/" + roomCode, new SocketPayload("ROOM_DELETED", ...));

        return ResponseEntity.ok("Đã giải tán phòng.");
    }
}