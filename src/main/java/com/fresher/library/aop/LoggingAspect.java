package com.fresher.library.aop;

import lombok.extern.log4j.Log4j2;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Arrays;

/**
 * AOP: tu dong log Request (method + args) va Response (ket qua tra ve + thoi gian xu ly)
 * cho TAT CA cac API trong package controller.
 * Dap ung yeu cau: "Su dung log4j de dat log cho tat ca cac chuc nang (Request va Response),
 * log console va log file" + "Su dung AOP: vi du xu ly cho chuc nang chung thuc, hoac ghi log".
 */
@Aspect
@Component
@Log4j2
public class LoggingAspect {

    @Around("execution(* com.fresher.library.controller..*(..))")
    public Object logApiCall(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();

        String httpMethod = "N/A";
        String uri = "N/A";
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            httpMethod = attrs.getRequest().getMethod();
            uri = attrs.getRequest().getRequestURI();
        }

        String signature = joinPoint.getSignature().toShortString();
        log.info(">> REQUEST  [{} {}] {} - args={}", httpMethod, uri, signature, safeArgs(joinPoint.getArgs()));

        try {
            Object result = joinPoint.proceed();
            long took = System.currentTimeMillis() - start;
            log.info("<< RESPONSE [{} {}] {} - {}ms - result={}", httpMethod, uri, signature, took, safeResult(result));
            return result;
        } catch (Exception ex) {
            long took = System.currentTimeMillis() - start;
            log.error("xx ERROR    [{} {}] {} - {}ms - exception={}", httpMethod, uri, signature, took, ex.toString());
            throw ex;
        }
    }

    /** Chi ghi kiểu dữ liệu, không ghi nội dung request/response có thể chứa mật khẩu, token hoặc dữ liệu cá nhân. */
    private String safeArgs(Object[] args) {
        if (args == null) return "[]";
        Object[] masked = Arrays.stream(args)
                .map(a -> {
                    if (a == null) return "null";
                    String cls = a.getClass().getSimpleName();
                    if (cls.contains("MultipartFile")) return "<file>";
                    return cls + "(<đã ẩn>)";
                })
                .toArray();
        return Arrays.toString(masked);
    }

    private String safeResult(Object result) {
        if (result == null) return "null";
        return result.getClass().getSimpleName() + "(<đã ẩn>)";
    }
}
