package com.fresher.library.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SocialLoginRequest(@NotBlank String credential) {
}
