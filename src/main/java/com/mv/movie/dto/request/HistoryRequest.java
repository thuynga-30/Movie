package com.mv.movie.dto.request;

import lombok.Data;

@Data
public class HistoryRequest {
    private Integer movieId;
    private Float progress; // Thời gian đã xem (giây)
}