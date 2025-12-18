package com.mv.movie.entity;


import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "watch_rooms")
@Data
public class WatchRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Mã phòng (ví dụ: "Xy7Za") - Quan trọng để chia sẻ link
    @Column(name = "room_code", nullable = false, unique = true, length = 20)
    private String roomCode;
    @Column(name = "room_password") // Đổi tên khác 'password' để tránh từ khóa SQL
    private String roomPassword;
    // Trạng thái phòng riêng tư (cần mật khẩu) hay công khai
    @Column(name = "is_private")
    private Boolean isPrivate = false;

    // Trạng thái: Đang phát (true) hay Tạm dừng (false)
    @Column(name = "is_playing")
    private Boolean isPlaying = false;

    // Thời gian hiện tại của phim (giây) - Khớp với float trong SQL
    @Column(name = "`current_time`")
    private Float currentTime = 0.0f;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // --- CÁC KHÓA NGOẠI ---

    // Phim đang chiếu (Bắt buộc phải có)
    @ManyToOne
    @JoinColumn(name = "movie_id", nullable = false)
    private Movies movie;

    // Chủ phòng (Host) - Người tạo phòng
    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    public User getHost() {
        return host;
    }

    public void setHost(User host) {
        this.host = host;
    }

    public Movies getMovie() {
        return movie;
    }

    public void setMovie(Movies movie) {
        this.movie = movie;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Float getCurrentTime() {
        return currentTime;
    }

    public void setCurrentTime(Float currentTime) {
        this.currentTime = currentTime;
    }

    public Boolean getPlaying() {
        return isPlaying;
    }

    public void setPlaying(Boolean playing) {
        isPlaying = playing;
    }

    public Boolean getPrivate() {
        return isPrivate;
    }

    public void setPrivate(Boolean aPrivate) {
        isPrivate = aPrivate;
    }

    public String getRoomCode() {
        return roomCode;
    }

    public void setRoomCode(String roomCode) {
        this.roomCode = roomCode;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getRoomPassword() {
        return roomPassword;
    }

    public void setRoomPassword(String roomPassword) {
        this.roomPassword = roomPassword;
    }
}