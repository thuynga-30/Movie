package com.mv.movie.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter; // Filter vừa tạo
    //Cấu hình quyền truy cập
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // Tắt CSRF để test API dễ dàng hơn
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/user/**").permitAll()

                        // 3. Cho phép các API Admin (Test CRUD phim, user)
                        .requestMatchers("/api/admin/**").permitAll()

                        // 4. Cho phép các API Phim (Test hiển thị danh sách phim)
                        .requestMatchers("/api/movies/**").permitAll()

                        // 5. QUAN TRỌNG: Cho phép xem ảnh đã upload
                        .requestMatchers("/images/**").permitAll()
                        .requestMatchers("/api/movie/**").permitAll()
                        .requestMatchers("admin/movie/**").permitAll()
                        .requestMatchers("/api/rooms/**").permitAll()
//                        .requestMatchers("/movies/**").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                        .requestMatchers("/*.html").permitAll()
                        // Cho phép ai cũng truy cập link đăng ký/đăng nhập
                        .anyRequest().authenticated() // Các link khác phải đăng nhập mới xem được
                ) .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}

