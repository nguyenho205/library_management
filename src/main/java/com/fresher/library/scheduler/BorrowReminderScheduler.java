package com.fresher.library.scheduler;

import com.fresher.library.service.BorrowService;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Tác vụ định kỳ quét và tự động gửi email nhắc nhở bạn đọc khi sách tới hạn hoặc quá hạn hoàn trả.
 */
@Component
@RequiredArgsConstructor
@Log4j2
public class BorrowReminderScheduler {

    private final BorrowService borrowService;

    /**
     * Mặc định quét tự động hàng ngày vào lúc 08:00 sáng.
     * Có thể cấu hình lại qua app.borrow.reminder.cron trong application.yml
     */
    @Scheduled(cron = "${app.borrow.reminder.cron:0 0 8 * * *}")
    public void runDailyBorrowDueReminder() {
        log.info("[CRON] Bắt đầu tác vụ tự động gửi email nhắc nhở hạn trả sách...");
        try {
            int sent = borrowService.sendDueRemindersBatch();
            log.info("[CRON] Hoàn tất tác vụ nhắc nhở hạn trả sách, đã gửi: {} email", sent);
        } catch (Exception e) {
            log.error("[CRON] Lỗi trong quá trình gửi email nhắc nhở hạn trả: {}", e.getMessage(), e);
        }
    }
}
