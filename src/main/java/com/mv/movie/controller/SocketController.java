package com.mv.movie.controller;

import com.mv.movie.dto.response.SocketPayload;
import com.mv.movie.entity.*;
import com.mv.movie.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Controller
public class SocketController {

    // --- REPOSITORIES CHO WATCH PARTY ---
    @Autowired private WatchRoomRepository roomRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;

    // --- REPOSITORIES CHO REVIEW & RATING ---
    @Autowired private MovieRepository movieRepository;
    @Autowired private CommentRepository commentRepository;
    @Autowired private RatingRepository ratingRepository;

    //XỬ LÝ CHAT TRONG PHÒNG WATCH PARTY
    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public SocketPayload handleChat(@DestinationVariable String roomId, @Payload SocketPayload payload) {
        if ("CHAT".equals(payload.getType())) {
            WatchRoom room = roomRepository.findByRoomCode(roomId).orElse(null);

            // Lưu tin nhắn vào DB
            if (room != null) {
                User user = userRepository.findByUsername(payload.getSenderName()).orElse(null);
                if (user != null) {
                    ChatMessage chat = new ChatMessage();
                    chat.setRoom(room);
                    chat.setUser(user);
                    chat.setMessage(payload.getMessage());
                    chat.setSentAt(LocalDateTime.now());
                    chatMessageRepository.save(chat);

                    // Gán thêm avatar và senderName chuẩn từ DB để Frontend hiển thị
                    payload.setAvatar(user.getAvatar());
                    payload.setSenderName(user.getUsername());
                }
            }
        }
        return payload;
    }

    //2. XỬ LÝ ĐỒNG BỘ VIDEO (SYNC)
    @MessageMapping("/sync/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public SocketPayload handleSync(@DestinationVariable String roomId, @Payload SocketPayload payload) {
        WatchRoom room = roomRepository.findByRoomCode(roomId).orElse(null);

        if (room != null) {
            // Cập nhật trạng thái vào DB
            if ("PLAY".equals(payload.getType())) {
                room.setIsPlaying(true);
            } else if ("PAUSE".equals(payload.getType())) {
                room.setIsPlaying(false);
            }

            // Cập nhật thời gian hiện tại
            if (payload.getSeekTime() != null) {
                room.setCurrentTime(payload.getSeekTime().floatValue());
            }
            roomRepository.save(room);
        }

        // Trả về payload để các client khác đồng bộ theo
        return payload;
    }

    /**
     * 3. XỬ LÝ KHI CÓ NGƯỜI VÀO PHÒNG (JOIN)
     * URL: /app/join/{roomId} -> /topic/room/{roomId}
     */
    @MessageMapping("/join/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public SocketPayload handleJoin(@DestinationVariable String roomId, @Payload SocketPayload payload) {
        payload.setMessage(payload.getSenderName() + " đã tham gia phòng.");
        payload.setType("JOIN_NOTIFY");
        return payload;
    }

    /**
     * 4. XỬ LÝ BÌNH LUẬN & ĐÁNH GIÁ PHIM (REAL-TIME REVIEW)
     * URL: /app/movie/{movieId}/review -> /topic/movie/{movieId}/reviews
     * Lưu ý: Payload đầu vào dùng Map để linh hoạt (tránh lỗi thiếu field star trong SocketPayload cũ)
     */
    @MessageMapping("/movie/{movieId}/review")
    @SendTo("/topic/movie/{movieId}/reviews")
    public Map<String, Object> handleMovieReview(@DestinationVariable Integer movieId, @Payload Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 1. Lấy dữ liệu từ Payload
            String username = (String) payload.get("username");
            String content = (String) payload.get("content");
            Integer star = (Integer) payload.get("star"); // Số sao đánh giá (nếu có)

            User user = userRepository.findByUsername(username).orElse(null);
            Movies movie = movieRepository.findById(movieId).orElse(null);

            if (user != null && movie != null) {
                // 2. Xử lý Lưu Comment (Nếu có nội dung)
                Comment savedComment = null;
                if (content != null && !content.trim().isEmpty()) {
                    Comment comment = new Comment();
                    comment.setMovie(movie);
                    comment.setUser(user);
                    comment.setContent(content);
                    comment.setCreatedAt(LocalDateTime.now());
                    savedComment = commentRepository.save(comment);
                }

                // 3. Xử lý Lưu Rating (Nếu có sao > 0)
                if (star != null && star > 0) {
                    // Kiểm tra xem user đã đánh giá chưa, nếu rồi thì cập nhật
                    Rating existingRating = ratingRepository.findByUserAndMovie(user, movie).orElse(new Rating());
                    existingRating.setMovie(movie);
                    existingRating.setUser(user);
                    existingRating.setRating(star);
                    ratingRepository.save(existingRating);
                }

                // 4. Tính lại điểm trung bình mới nhất của phim
                Double newAvg = ratingRepository.getAverageRating(Long.valueOf(movieId));
                if (newAvg == null) newAvg = 0.0;

                // 5. Đóng gói dữ liệu trả về cho Frontend
                if (savedComment != null) {
                    response.put("comment", convertToCommentDTO(savedComment, star));
                }
                response.put("newAvgRating", newAvg);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return response;
    }
    @MessageMapping("/movie/{movieId}/delete-review")
    @SendTo("/topic/movie/{movieId}/reviews")
    public Map<String, Object> handleDeleteReview(@DestinationVariable Integer movieId, @Payload Map<String, Object> payload) {
        Map<String, Object> response = new HashMap<>();

        try {
            Integer commentId = (Integer) payload.get("commentId");
            String username = (String) payload.get("username"); // Người yêu cầu xóa

            Comment comment = commentRepository.findById(commentId).orElse(null);

            // Kiểm tra: Comment tồn tại VÀ Người yêu cầu chính là người viết comment
            if (comment != null && comment.getUser().getUsername().equals(username)) {

                // Xóa comment khỏi DB
                commentRepository.delete(comment);

                 Rating rating = ratingRepository.findByUserAndMovie(comment.getUser(),comment.getMovie()).orElse(null);
                 if(rating != null) ratingRepository.delete(rating);

                // Tính lại điểm trung bình (phòng trường hợp có xóa rating)
                Double newAvg = ratingRepository.getAverageRating(Long.valueOf(movieId));
                if (newAvg == null) newAvg = 0.0;

                // Trả về ID đã xóa để frontend filter bỏ đi
                response.put("deletedCommentId", commentId);
                response.put("newAvgRating", newAvg);
                response.put("message", "Đã xóa thành công");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return response;
    }
    // --- HÀM PHỤ TRỢ: Chuyển Entity Comment sang DTO đơn giản để trả về JSON ---
    private Map<String, Object> convertToCommentDTO(Comment comment, Integer star) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", comment.getId());
        dto.put("content", comment.getContent());
        dto.put("createdAt", comment.getCreatedAt().toString());
        dto.put("username", comment.getUser().getUsername());
//        dto.put("fullName", comment.getUser().getFullName());
        dto.put("avatar", comment.getUser().getAvatar());
        dto.put("star", star); // Trả kèm số sao người này vừa đánh giá (để hiện bên cạnh comment)
        return dto;
    }
}