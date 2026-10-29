package com.fresher.library.security;

import lombok.extern.log4j.Log4j2;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quan ly phien dang nhap (Single Active Session).
 * Quy tac nghiep vu:
 * 1 tai khoan chi co 1 phien dang nhap hoat dong tai mot thoi diem.
 * Neu dang nhap tai thiet bi B, phien dang nhap tai thiet bi A se bi da ra (invalidated).
 */
@Service
@Log4j2
public class SessionManagerService {

    // Cache phien hoat dong trong bo nho: email (lowercase) -> activeSessionId
    private final ConcurrentHashMap<String, String> activeSessions = new ConcurrentHashMap<>();

    /**
     * Tao session moi khi tai khoan dang nhap thanh cong.
     * Cuoc goi nay se ghi de bat ky session cu nao truoc do.
     */
    public String createSession(String email) {
        String newSessionId = UUID.randomUUID().toString();
        if (email != null) {
            activeSessions.put(email.toLowerCase(), newSessionId);
            log.info("Khoi tao phien dang nhap moi cho {}: {}", email, newSessionId);
        }
        return newSessionId;
    }

    /**
     * Kiem tra xem session cua token co con la session dang hoat dong hay khong.
     *
     * @param email                email cua chu tai khoan
     * @param tokenSessionId       session ID duoc gan ben trong JWT token
     * @param fallbackDbSessionId session ID duoc luu trong DB cua Account
     * @return true neu session hop le; false neu da bi da ra boi dang nhap o noi khac
     */
    public boolean isCurrentSession(String email, String tokenSessionId, String fallbackDbSessionId) {
        if (email == null) return false;

        // Neu token chua co sessionId (token cu phat hanh truoc khi co tinh nang nay),
        // cho phep su dung de tranh kick dot ngot cac phien dang test
        if (tokenSessionId == null) {
            return true;
        }

        String emailKey = email.toLowerCase();
        String active = activeSessions.get(emailKey);

        if (active == null) {
            // Neu server vua khoi dong lai, RAM chua co -> lay tu DB Account
            if (fallbackDbSessionId != null) {
                active = fallbackDbSessionId;
                activeSessions.put(emailKey, active);
            } else {
                // Neu ca DB cung chua co thi coi token nay la phien hop le dau tien
                activeSessions.put(emailKey, tokenSessionId);
                return true;
            }
        }

        return tokenSessionId.equals(active);
    }

    /**
     * Xoa session khi nguoi dung chu dong logout.
     */
    public void invalidate(String email) {
        if (email != null) {
            activeSessions.remove(email.toLowerCase());
            log.info("Da huy session hoat dong cua {}", email);
        }
    }
}
