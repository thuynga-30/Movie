package com.mv.movie.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class TmdbService {
    private final String API_KEY = "397ec866a74cbe8bf105508358bb569d";
    private final String BASE_URL = "https://api.themoviedb.org/3";

    public Map<String, Object> fetchFullMetadata(String title) {
        RestTemplate restTemplate = new RestTemplate();

        // BƯỚC 1: Tìm phim để lấy ID
        String searchUrl = BASE_URL + "/search/movie?api_key=" + API_KEY + "&query=" + title + "&language=vi-VN";
        Map<String, Object> searchResponse = restTemplate.getForObject(searchUrl, Map.class);

        List<Map<String, Object>> results = (List<Map<String, Object>>) searchResponse.get("results");
        if (results == null || results.isEmpty()) return null;

        // Lấy ID của phim đầu tiên
        Integer tmdbId = (Integer) results.get(0).get("id");

        // BƯỚC 2: Gọi lấy chi tiết kèm video (trailer)
        String detailsUrl = BASE_URL + "/movie/" + tmdbId + "?api_key=" + API_KEY + "&append_to_response=videos&language=vi-VN";
        return restTemplate.getForObject(detailsUrl, Map.class);
    }
}