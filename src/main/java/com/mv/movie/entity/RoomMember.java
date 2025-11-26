package com.mv.movie.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "room_members")
@Data
public class RoomMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "is_host")
    private Boolean isHost = false; // Có phải chủ phòng không?

    @CreationTimestamp
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

    // Thành viên thuộc về phòng nào
    @ManyToOne
    @JoinColumn(name = "room_id", nullable = false)
    private WatchRoom room;

    // Thành viên là user nào
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Boolean getHost() {
        return isHost;
    }

    public void setHost(Boolean host) {
        isHost = host;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public WatchRoom getRoom() {
        return room;
    }

    public void setRoom(WatchRoom room) {
        this.room = room;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}