package com.mv.movie.repository;

import com.mv.movie.entity.User;
import com.mv.movie.entity.WatchRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchRoomRepository extends JpaRepository<WatchRoom, Integer> {
    Optional<WatchRoom> findByRoomCode(String roomCode);
    boolean existsByRoomCode(String roomCode);
    List<WatchRoom> findByHost(User host);
}
