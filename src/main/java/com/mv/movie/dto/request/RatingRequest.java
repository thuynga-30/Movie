package com.mv.movie.dto.request;

import lombok.Data;

@Data
public class RatingRequest {
    private Integer movieId;
    private Integer star; // 1 đến 5
}