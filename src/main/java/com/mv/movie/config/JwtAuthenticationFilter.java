package com.mv.movie.config;

import com.mv.movie.util.JwtUntils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUntils jwtUtils;
    @Autowired
    private UserDetailsService userDetailsService;
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        String token = null;
        String username = null;

        // --- LOG DEBUG ---
        System.out.println("------------------------------------------------");
        System.out.println("DEBUG JWT FILTER: Đang xử lý request: " + request.getRequestURI());

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            System.out.println("1. Tìm thấy Token: " + token.substring(0, 10) + "..."); // In 10 ký tự đầu
            try {
                username = jwtUtils.getUsername(token);
                System.out.println("2. Giải mã Username: " + username);
            } catch (Exception e) {
                System.out.println("❌ LỖI GIẢI MÃ TOKEN: " + e.getMessage());
            }
        } else {
            System.out.println("❌ KHÔNG TÌM THẤY HEADER 'Authorization: Bearer...'");
            System.out.println("   Header nhận được: " + authHeader);
        }
        // -----------------

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtUtils.validate(token)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
                System.out.println("✅ XÁC THỰC THÀNH CÔNG CHO USER: " + username);
            } else {
                System.out.println("❌ TOKEN KHÔNG HỢP LỆ (Hết hạn hoặc sai chữ ký)");
            }
        }

        filterChain.doFilter(request, response);
    }
}
