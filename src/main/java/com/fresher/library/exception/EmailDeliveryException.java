package com.fresher.library.exception;

public class EmailDeliveryException extends RuntimeException {
    public EmailDeliveryException(Throwable cause) {
        super("Không gửi được email. Vui lòng kiểm tra địa chỉ nhận và cấu hình SMTP rồi thử lại.", cause);
    }
}
