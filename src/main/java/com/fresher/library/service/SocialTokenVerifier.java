package com.fresher.library.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fresher.library.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;

@Service
public class SocialTokenVerifier {
    public record Identity(String provider, String subject, String email, String name, boolean authoritativeEmail) {}

    private final RestClient http = createHttpClient();
    private final NimbusJwtDecoder googleDecoder = NimbusJwtDecoder
            .withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs").build();

    @Value("${app.social.google.web-client-id:}") private String googleWebClientId;
    @Value("${app.social.google.android-client-id:}") private String googleAndroidClientId;
    @Value("${app.social.google.ios-client-id:}") private String googleIosClientId;
    @Value("${app.social.facebook.app-id:}") private String facebookAppId;
    @Value("${app.social.facebook.app-secret:}") private String facebookAppSecret;

    public Identity verify(String provider, String credential) {
        if (!StringUtils.hasText(credential) || credential.length() > 10000) {
            throw new UnauthorizedException("Mã đăng nhập mạng xã hội không hợp lệ");
        }
        return switch (provider.toLowerCase()) {
            case "google" -> verifyGoogle(credential);
            case "facebook" -> verifyFacebook(credential);
            default -> throw new UnauthorizedException("Nhà cung cấp đăng nhập không được hỗ trợ");
        };
    }

    private Identity verifyGoogle(String credential) {
        if (!StringUtils.hasText(googleWebClientId)) {
            throw new UnauthorizedException("Đăng nhập Google chưa được cấu hình");
        }
        try {
            Jwt jwt = googleDecoder.decode(credential);
            String issuer = jwt.getIssuer() == null ? "" : jwt.getIssuer().toString();
            List<String> accepted = List.of(googleWebClientId, googleAndroidClientId, googleIosClientId);
            boolean validAudience = jwt.getAudience().stream().anyMatch(aud -> StringUtils.hasText(aud)
                    && accepted.stream().anyMatch(id -> StringUtils.hasText(id) && id.equals(aud)));
            boolean verified = Boolean.parseBoolean(String.valueOf(jwt.getClaims().get("email_verified")));
            String email = jwt.getClaimAsString("email");
            String subject = jwt.getSubject();
            if (!("https://accounts.google.com".equals(issuer) || "accounts.google.com".equals(issuer))
                    || !validAudience || !verified || !StringUtils.hasText(email) || !StringUtils.hasText(subject)) {
                throw new UnauthorizedException("Tài khoản Google không hợp lệ hoặc email chưa xác thực");
            }
            boolean authoritative = email.toLowerCase().endsWith("@gmail.com")
                    || StringUtils.hasText(jwt.getClaimAsString("hd"));
            return new Identity("GOOGLE", subject, email, jwt.getClaimAsString("name"), authoritative);
        } catch (JwtException ex) {
            throw new UnauthorizedException("Mã đăng nhập Google đã hết hạn hoặc không hợp lệ");
        }
    }

    private Identity verifyFacebook(String credential) {
        if (!StringUtils.hasText(facebookAppId) || !StringUtils.hasText(facebookAppSecret)) {
            throw new UnauthorizedException("Đăng nhập Facebook chưa được cấu hình");
        }
        try {
            URI debugUri = UriComponentsBuilder.fromHttpUrl("https://graph.facebook.com/debug_token")
                    .queryParam("input_token", credential)
                    .queryParam("access_token", facebookAppId + "|" + facebookAppSecret).build().encode().toUri();
            JsonNode data = http.get().uri(debugUri).retrieve().body(JsonNode.class).path("data");
            if (!data.path("is_valid").asBoolean() || !facebookAppId.equals(data.path("app_id").asText())
                    || !StringUtils.hasText(data.path("user_id").asText())) {
                throw new UnauthorizedException("Mã đăng nhập Facebook không hợp lệ");
            }
            URI profileUri = UriComponentsBuilder.fromHttpUrl("https://graph.facebook.com/me")
                    .queryParam("fields", "id,name,email")
                    .queryParam("access_token", credential).build().encode().toUri();
            JsonNode profile = http.get().uri(profileUri).accept(MediaType.APPLICATION_JSON)
                    .retrieve().body(JsonNode.class);
            if (!data.path("user_id").asText().equals(profile.path("id").asText())) {
                throw new UnauthorizedException("Mã đăng nhập Facebook không khớp tài khoản");
            }
            String email = profile.path("email").asText();
            if (!StringUtils.hasText(email)) {
                throw new UnauthorizedException("Facebook chưa cung cấp email. Hãy cấp quyền email rồi thử lại.");
            }
            return new Identity("FACEBOOK", profile.path("id").asText(), email,
                    profile.path("name").asText(), false);
        } catch (RestClientException | NullPointerException ex) {
            throw new UnauthorizedException("Không thể xác thực với Facebook. Vui lòng thử lại.");
        }
    }

    public String googleWebClientId() { return googleWebClientId; }
    public String facebookAppId() { return facebookAppId; }

    private static RestClient createHttpClient() {
        var factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5)).build());
        factory.setReadTimeout(Duration.ofSeconds(8));
        return RestClient.builder().requestFactory(factory).build();
    }
}
