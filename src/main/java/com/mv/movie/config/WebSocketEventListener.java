package com.mv.movie.config;

import com.mv.movie.dto.response.SocketPayload;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketEventListener {

    @Autowired
    private SimpMessageSendingOperations messagingTemplate;

    // Lưu trữ: RoomID -> Số lượng người
    // (Trong thực tế nên dùng Redis, ở đây dùng Map cho đơn giản)
    private static final Map<String, Integer> roomOnlineCount = new ConcurrentHashMap<>();

    // 1. KHI CÓ NGƯỜI VÀO (Subscribe vào phòng)
    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination();

        // Destination dạng: /topic/room/{roomId}
        if (destination != null && destination.contains("/topic/room/")) {
            String roomId = destination.substring(destination.lastIndexOf("/") + 1);

            // Tăng số lượng
            roomOnlineCount.put(roomId, roomOnlineCount.getOrDefault(roomId, 0) + 1);

            // Gửi thông báo số lượng mới cho cả phòng
            sendCountUpdate(roomId);

            // Lưu roomId vào session để lúc disconnect biết mà trừ
            headerAccessor.getSessionAttributes().put("room_id", roomId);
        }
    }

    // 2. KHI CÓ NGƯỜI RỜI ĐI (Tắt tab / Mất mạng)
    @EventListener
    public void handleSessionDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String roomId = (String) headerAccessor.getSessionAttributes().get("room_id");

        if (roomId != null) {
            // Giảm số lượng
            int currentCount = roomOnlineCount.getOrDefault(roomId, 1);
            if (currentCount > 0) {
                roomOnlineCount.put(roomId, currentCount - 1);
            }

            // Gửi thông báo cập nhật
            sendCountUpdate(roomId);
        }
    }

    private void sendCountUpdate(String roomId) {
        SocketPayload payload = new SocketPayload();
        payload.setType("COUNT"); // Loại tin nhắn mới: Đếm người
        payload.setMessage(String.valueOf(roomOnlineCount.getOrDefault(roomId, 0)));

        messagingTemplate.convertAndSend("/topic/room/" + roomId, payload);
    }
}