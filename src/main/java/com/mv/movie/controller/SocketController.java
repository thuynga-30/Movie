package com.mv.movie.controller;

import com.mv.movie.dto.response.SocketPayload;
import com.mv.movie.entity.WatchRoom;
import com.mv.movie.repository.WatchRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class SocketController {

    @Autowired
    private WatchRoomRepository roomRepository;

    // 1. XỬ LÝ CHAT
    // Client gửi tới: /app/chat/{roomId}
    // Server phát ra: /topic/room/{roomId}
    @MessageMapping("/chat/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public SocketPayload handleChat(@DestinationVariable String roomId, @Payload SocketPayload payload) {
        // Bạn có thể lưu tin nhắn vào DB ở đây nếu muốn (Optional)
        return payload; // Server nhận gì thì phát lại y hệt cho mọi người
    }

    // 2. XỬ LÝ ĐỒNG BỘ VIDEO (Play/Pause/Seek)
    // Client gửi tới: /app/sync/{roomId}
    // Server phát ra: /topic/room/{roomId}
    @MessageMapping("/sync/{roomId}")
    @SendTo("/topic/room/{roomId}")
    public SocketPayload handleSync(@DestinationVariable String roomId, @Payload SocketPayload payload) {

        // Cập nhật trạng thái phòng vào Database để người vào sau biết phim đang chiếu đến đâu
        WatchRoom room = roomRepository.findByRoomCode(roomId).orElse(null);
        if (room != null) {
            if ("PLAY".equals(payload.getType())) {
                room.setIsPlaying(true);
            } else if ("PAUSE".equals(payload.getType())) {
                room.setIsPlaying(false);
            }
            // Lưu thời gian hiện tại
            if (payload.getSeekTime() != null) {
                room.setCurrentTime(payload.getSeekTime().floatValue());
            }
            roomRepository.save(room);
        }

        return payload;
    }
}