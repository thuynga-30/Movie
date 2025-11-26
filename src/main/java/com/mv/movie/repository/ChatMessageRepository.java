package com.mv.movie.repository;

import com.mv.movie.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {

    // Hàm tìm tất cả tin nhắn trong một phòng và sắp xếp theo thời gian gửi (Cũ -> Mới)
    // Dùng để load lịch sử chat khi vừa vào phòng
    List<ChatMessage> findByRoomIdOrderBySentAtAsc(Integer roomId);
}