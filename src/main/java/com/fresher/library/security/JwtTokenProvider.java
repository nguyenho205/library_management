package com.fresher.library.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.log4j.Log4j2;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

/**
 * Sinh va validate JWT access token / refresh token.
 * Access token: thoi gian song ngan (vd 15 phut) - dung de goi API.
 * Refresh token: thoi gian song dai (vd 7 ngay) - dung de xin cap access token moi
 * ma khong can dang nhap lai (yeu cau "neu refresh token con han thi tu dong tao token moi").
 */
@Component
@Log4j2
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenExpirationMs;

    private Key signingKey;

    @PostConstruct
    public void init() {
        this.signingKey = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    public String generateAccessToken(String email, String role) {
        return buildToken(email, role, accessTokenExpirationMs, "ACCESS");
    }

    public String generateRefreshToken(String email, String role) {
        return buildToken(email, role, refreshTokenExpirationMs, "REFRESH");
    }

    private String buildToken(String email, String role, long expirationMs, String tokenKind) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("tokenKind", tokenKind)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(signingKey, SignatureAlgorithm.HS512)
                .compact();
    }

    public String getEmailFromToken(String token) {
        return parseClaims(token).getSubject();
    }

    public String getTokenKind(String token) {
        return (String) parseClaims(token).get("tokenKind");
    }

    public Date getExpiration(String token) {
        return parseClaims(token).getExpiration();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT het han: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("JWT khong hop le: {}", e.getMessage());
        }
        return false;
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
