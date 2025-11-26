package com.mv.movie.dto.response;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CommentResponse {
    private Integer id;
    private String content;
    private LocalDateTime createdAt;

    // Thông tin người bình luận
    private String username;
    private String avatar;

    public CommentResponse(Integer id, String content, LocalDateTime createdAt, String username,  String avatar) {
        this.id = id;
        this.content = content;
        this.createdAt = createdAt;
        this.username = username;
        this.avatar = avatar;
    }
}