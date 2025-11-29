package com.mv.movie.controller;

import com.mv.movie.dto.response.SocketPayload;
import com.mv.movie.entity.ChatMessage;
import com.mv.movie.entity.User;
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

@Controller
public class SocketController {

    @Autowired private WatchRoomRepository roomRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private ChatMessageRepository chatMessageRepository;

    /**
     * 1. XỬ LÝ CHAT
     * Nhận từ: /app/chat/{roomId}
     * Phát ra: /topic/room/{roomId}
     */
    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public SocketPayload handleChat(@DestinationVariable String roomId, @Payload SocketPayload payload) {

        if ("CHAT".equals(payload.getType())) {
            // 1. Tìm Phòng
            WatchRoom room = roomRepository.findByRoomCode(roomId).orElse(null);

            // 2. Tìm Người gửi (Dựa vào username gửi lên từ Frontend)
            User sender = userRepository.findByUsername(payload.getSenderName()).orElse(null);

            if (room != null && sender != null) {
                // 3. Tạo và Lưu tin nhắn vào DB
                ChatMessage chat = new ChatMessage();
                chat.setRoom(room);
                chat.setUser(sender); // Gán Entity User
                chat.setMessage(payload.getMessage());

                chatMessageRepository.save(chat);
            }
        }
        return payload; // Phát lại tin nhắn cho cả phòng
    }

    /**
     * 2. XỬ LÝ ĐỒNG BỘ VIDEO
     * Nhận từ: /app/sync/{roomId}
     * Phát ra: /topic/room/{roomId}
     */
    @MessageMapping("/sync/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public SocketPayload handleSync(@DestinationVariable String roomId, @Payload SocketPayload payload) {

        WatchRoom room = roomRepository.findByRoomCode(roomId).orElse(null);
        if (room != null) {
            // Cập nhật trạng thái Play/Pause
            if ("PLAY".equals(payload.getType())) {
                room.setIsPlaying(true);
            } else if ("PAUSE".equals(payload.getType())) {
                room.setIsPlaying(false);
            }

            // Cập nhật thời gian hiện tại
            if (payload.getSeekTime() != null) {
                room.setCurrentTime(payload.getSeekTime().floatValue());
            }
            roomRepository.save(room); // Lưu trạng thái mới nhất vào DB
        }
        return payload;
    }
    /**
     * 3. XỬ LÝ KHI CÓ NGƯỜI MỚI VÀO PHÒNG
     * Nhận từ: /app/join/{roomId}
     * Phát ra: /topic/room/{roomId}
     */
    @MessageMapping("/join/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public SocketPayload handleJoin(@DestinationVariable String roomId, @Payload SocketPayload payload) {
        // Chỉ đơn giản là phát lại thông báo "Có người mới vào" cho cả phòng
        // Để Máy Chủ Phòng (Host) biết đường mà gửi đồng bộ thời gian
        return payload;
    }
}