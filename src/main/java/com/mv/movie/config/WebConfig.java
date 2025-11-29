package com.mv.movie.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    // 1. CẤU HÌNH ĐỂ HIỂN THỊ ẢNH TỪ THƯ MỤC UPLOADS
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Khi gọi http://localhost:8080/images/abc.jpg
        // -> Nó sẽ tìm file trong thư mục "uploads" nằm ngay gốc dự án
        registry.addResourceHandler("/images/**")
                .addResourceLocations("file:./uploads/");
    }

    // 2. CẤU HÌNH CORS (CHO PHÉP FRONTEND GỌI API)
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // Áp dụng cho toàn bộ API
                .allowedOriginPatterns("*") // Cho phép MỌI nguồn (8081, 3000, 5173...)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Cho phép mọi hành động
                .allowedHeaders("*")
                .allowCredentials(true) // Cho phép gửi kèm Cookie/Token (Quan trọng cho Socket)
                .maxAge(3600);
    }
}