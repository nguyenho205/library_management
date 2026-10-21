package com.fresher.library.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fresher.library.dto.request.LoginRequest;
import com.fresher.library.dto.request.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration test THAT o tang API (goi qua HTTP/MockMvc, chay qua toan bo Spring Security
 * filter chain thuc su), dap ung dung nghia yeu cau de bai "Viet JUnit test cho cac API da lam"
 * (khac voi unit test o service/*Test.java chi mock repository).
 * Dung profile "test" (H2 in-memory, xem application-test.yml).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void register_thieuEmail_phaiTra400VaBaoLoiValidate() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail(""); // thieu email -> vi pham @NotBlank/@Email
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");
        request.setFullName("Nguyen Van A");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.fieldErrors.email").exists());
    }

    @Test
    void register_hopLe_phaiTra200() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("newuser@test.com");
        request.setPassword("Password@123");
        request.setConfirmPassword("Password@123");
        request.setFullName("Nguyen Van B");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void login_truocKhiVerifyEmail_phaiTra401() throws Exception {
        // Dang ky truoc (tai khoan moi mac dinh emailVerified = false)
        RegisterRequest register = new RegisterRequest();
        register.setEmail("notverified@test.com");
        register.setPassword("Password@123");
        register.setConfirmPassword("Password@123");
        register.setFullName("Chua Verify");
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(register)))
                .andExpect(status().isOk());

        // Dang nhap ngay khi chua verify email -> phai bi tu choi 401
        LoginRequest login = new LoginRequest();
        login.setEmail("notverified@test.com");
        login.setPassword("Password@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(login)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("xác thực email")));
    }

    @Test
    void changePassword_khongCoToken_phaiTra401() throws Exception {
        // Yeu cau bao mat: /api/auth/change-password BAT BUOC phai dang nhap (khong duoc permitAll)
        mockMvc.perform(post("/api/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"oldPassword\":\"a\",\"newPassword\":\"Password@123\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bookSearch_khongCoToken_phaiTra401() throws Exception {
        // /api/books yeu cau da dang nhap (authenticated), khong phai public
        mockMvc.perform(get("/api/books"))
                .andExpect(status().isUnauthorized());
    }
}
