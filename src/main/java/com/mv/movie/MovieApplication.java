package com.mv.movie;

// Tên package của bạn

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

import javax.sql.DataSource;
import java.sql.Connection;

import static org.springframework.data.web.config.EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO;

@SpringBootApplication
@EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO)
public class MovieApplication {

    public static void main(String[] args) {
        SpringApplication.run(MovieApplication.class, args);
    }

    // --- THÊM ĐOẠN NÀY VÀO ĐỂ TEST KẾT NỐI ---
    @Bean
    public CommandLineRunner checkConnection(DataSource dataSource) {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                System.out.println("---------------------------------------");
                System.out.println("🎉 CHÚC MỪNG! KẾT NỐI DATABASE THÀNH CÔNG! 🎉");
                System.out.println("Tên DB: " + connection.getCatalog());
                System.out.println("---------------------------------------");
            } catch (Exception e) {
                System.out.println("---------------------------------------");
                System.out.println("❌ LỖI: KHÔNG THỂ KẾT NỐI DATABASE!");
                System.out.println("Chi tiết lỗi: " + e.getMessage());
                System.out.println("---------------------------------------");
            }
        };
    }
    // -----------------------------------------
}