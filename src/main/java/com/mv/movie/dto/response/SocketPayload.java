package com.mv.movie.dto.response;

import lombok.Data;

@Data
public class SocketPayload {
    // Loại tin nhắn: CHAT, JOIN, LEAVE, PLAY, PAUSE, SEEK
    private String type;

    // Dữ liệu Chat
    private String message;
    private String senderName;
    private String avatar;

    // Dữ liệu Sync Video
    private Float seekTime; // Thời gian video hiện tại (giây)
}