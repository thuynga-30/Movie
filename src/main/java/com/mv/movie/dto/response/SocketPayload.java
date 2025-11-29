package com.mv.movie.dto.response;

import lombok.Data;

@Data
public class SocketPayload {
    private String type;       // "CHAT", "PLAY", "PAUSE", "SEEK", "JOIN", "LEAVE"
    private String message;    // Nội dung chat
    private String senderName; // Tên người gửi
    private String avatar;     // Avatar người gửi

    private Double seekTime;   // Thời gian video (cho lệnh sync)
}