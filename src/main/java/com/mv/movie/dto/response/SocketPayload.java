package com.mv.movie.dto.response;

import lombok.Data;

@Data
public class SocketPayload {
    private String type;       // "CHAT", "PLAY", "PAUSE", "SEEK"
    private String message;    // Nội dung chat
    private String senderName; // Tên người gửi (Username)
    private String avatar;     // Avatar người gửi

    private Double seekTime;   // Thời gian video (cho chức năng Sync)
}