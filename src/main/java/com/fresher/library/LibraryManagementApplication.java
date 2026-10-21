package com.fresher.library;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Ung dung quan ly thu vien - Bai tap 1
 * Yeu cau: Spring Boot + JPA, Login/Logout (JWT), Quan ly Sach, Quan ly Member,
 * Muon/Tra sach, Config he thong (maintenance mode).
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class LibraryManagementApplication {

    public static void main(String[] args) {
        SpringApplication.run(LibraryManagementApplication.class, args);
    }
}
