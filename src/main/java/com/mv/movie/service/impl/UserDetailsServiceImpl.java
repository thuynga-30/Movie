package com.mv.movie.service.impl;

import com.mv.movie.entity.User;
import com.mv.movie.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List; // Import thêm List

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // 1. Tìm user từ DB
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy user: " + username));

        // 2. Lấy Role từ DB và chuyển thành Authority của Spring Security
        // Nếu role null thì mặc định là USER
        String roleName = user.getRole() != null ? String.valueOf(user.getRole()) : "USER";
        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(roleName));

        // 3. Trả về đối tượng User của Spring Security KÈM QUYỀN HẠN
        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                authorities // <--- TRUYỀN LIST QUYỀN VÀO ĐÂY (Thay vì để trống như cũ)
        );
    }
}