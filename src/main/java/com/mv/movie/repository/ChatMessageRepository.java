package com.mv.movie.repository;

import com.mv.movie.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    // Tìm tin nhắn theo Mã phòng (RoomCode), sắp xếp cũ trước -> mới sau
    List<ChatMessage> findByRoom_RoomCodeOrderBySentAtAsc(String roomCode);
}