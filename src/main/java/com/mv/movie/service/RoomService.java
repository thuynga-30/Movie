package com.mv.movie.service;



import com.mv.movie.entity.Movies;
import com.mv.movie.entity.User;
import com.mv.movie.entity.WatchRoom;
import com.mv.movie.repository.MovieRepository;
import com.mv.movie.repository.UserRepository;
import com.mv.movie.repository.WatchRoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class RoomService {

    @Autowired private WatchRoomRepository roomRepository;
    @Autowired private MovieRepository movieRepository;
    @Autowired private UserRepository userRepository;

    // Hàm tạo mã phòng ngẫu nhiên 6 ký tự
    public String generateRoomCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();
        Random rnd = new Random();
        while (code.length() < 6) {
            int index = (int) (rnd.nextFloat() * chars.length());
            code.append(chars.charAt(index));
        }
        return code.toString();
    }

    public WatchRoom createRoom(Integer hostId, Integer movieId, Boolean isPrivate) {
        User host = userRepository.findById(Long.valueOf(hostId)).orElseThrow(() -> new RuntimeException("User not found"));
        Movies movie = movieRepository.findById(movieId).orElseThrow(() -> new RuntimeException("Movie not found"));

        WatchRoom room = new WatchRoom();
        room.setHost(host);
        room.setMovie(movie);
        room.setIsPrivate(isPrivate);
        room.setRoomCode(generateRoomCode());
        room.setIsPlaying(false); // Mặc định là đang Pause
        room.setCurrentTime(0.0f); // Bắt đầu từ 0s

        return roomRepository.save(room);
    }
}