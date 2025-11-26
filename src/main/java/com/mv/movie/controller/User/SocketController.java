package com.mv.movie.controller.User;

import com.mv.movie.dto.response.SocketPayload;
import com.mv.movie.entity.ChatMessage;
import com.mv.movie.entity.WatchRoom;
import com.mv.movie.repository.ChatMessageRepository;
import com.mv.movie.repository.UserRepository;
import com.mv.movie.repository.WatchRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller // Lưu ý: Dùng @Controller, KHÔNG dùng @RestController
public class SocketController {

    @Autowired private ChatMessageRepository chatMessageRepository;
    @Autowired private WatchRoomRepository roomRepository;
    @Autowired private UserRepository userRepository;

    /**
     * 1. XỬ LÝ CHAT
     * Client gửi đến: /app/chat/{roomCode}
     * Server phát lại tại: /topic/room/{roomCode}
     */
    @MessageMapping("/chat/{roomCode}")
    @SendTo("/topic/room/{roomCode}")
    public SocketPayload handleChat(@DestinationVariable String roomCode,
                                    @Payload SocketPayload payload) {
        // Lưu tin nhắn vào Database để xem lại lịch sử
        WatchRoom room = roomRepository.findByRoomCode(roomCode).orElse(null);
        // Giả sử payload.senderName là username, ta tìm user để lưu
        // (Trong thực tế nên gửi userId trong payload để chính xác hơn)

        if (room != null) {
            ChatMessage chat = new ChatMessage();
            chat.setRoom(room);
            chat.setMessage(payload.getMessage());
            // Cần set User cho chat (Logic tìm user tạm bỏ qua để code gọn, bạn tự thêm nhé)
            // chatMessageRepository.save(chat);
        }

        // Trả về chính payload đó cho mọi người cùng thấy
        return payload;
    }

    /**
     * 2. XỬ LÝ ĐỒNG BỘ VIDEO (Play, Pause, Seek)
     * Client gửi đến: /app/sync/{roomCode}
     */
    @MessageMapping("/sync/{roomCode}")
    @SendTo("/topic/room/{roomCode}")
    public SocketPayload handleSync(@DestinationVariable String roomCode,
                                    @Payload SocketPayload payload) {

        // Cập nhật trạng thái mới nhất vào Database
        // Để người vào sau biết phim đang chạy đến đâu
        WatchRoom room = roomRepository.findByRoomCode(roomCode).orElse(null);

        if (room != null) {
            if ("PLAY".equals(payload.getType())) {
                room.setIsPlaying(true);
                room.setCurrentTime(payload.getSeekTime());
            } else if ("PAUSE".equals(payload.getType())) {
                room.setIsPlaying(false);
                room.setCurrentTime(payload.getSeekTime());
            } else if ("SEEK".equals(payload.getType())) {
                room.setCurrentTime(payload.getSeekTime());
            }
            roomRepository.save(room);
        }

        // Phát tín hiệu cho tất cả client khác thực thi theo
        return payload;
    }
}