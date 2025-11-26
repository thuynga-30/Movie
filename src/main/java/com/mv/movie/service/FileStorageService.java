package com.mv.movie.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    // Đường dẫn đến thư mục chứa ảnh
    private final Path storageLocation = Paths.get("uploads");

    public FileStorageService() {
        try {
            // Tự động tạo thư mục uploads nếu chưa có
            Files.createDirectories(storageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Không thể khởi tạo thư mục lưu trữ", e);
        }
    }

    public String storeFile(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("File rỗng!");
            }

            // 1. Lấy đuôi file (vd: .jpg, .png)
            String originalFilename = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFilename != null && originalFilename.contains(".")) {
                fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // 2. Tạo tên file ngẫu nhiên để tránh trùng (vd: a1b2-c3d4.jpg)
            String newFileName = UUID.randomUUID().toString() + fileExtension;

            // 3. Lưu file vào thư mục uploads
            Path destinationFile = this.storageLocation.resolve(newFileName);

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
                System.out.println("✅ ĐÃ LƯU FILE TẠI: " + destinationFile.toAbsolutePath());
            }

            // 4. Trả về đường dẫn URL để lưu vào DB
            // Ví dụ: /images/a1b2-c3d4.jpg
            return "/images/" + newFileName;

        } catch (IOException e) {
            throw new RuntimeException("Lỗi khi lưu file", e);
        }
    }
}
