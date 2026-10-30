package com.fresher.library.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path frontendAnhBia = Paths.get("frontend/public/anhbia").toAbsolutePath().normalize();
        Path frontendBiaSach = Paths.get("frontend/public/biasach").toAbsolutePath().normalize();
        Path rootAnhBia = Paths.get("public/anhbia").toAbsolutePath().normalize();

        String anhBiaUri1 = toLocationUri(frontendAnhBia);
        String anhBiaUri2 = toLocationUri(rootAnhBia);
        String biaSachUri = toLocationUri(frontendBiaSach);

        registry.addResourceHandler("/anhbia/**")
                .addResourceLocations(anhBiaUri1, anhBiaUri2);

        registry.addResourceHandler("/biasach/**")
                .addResourceLocations(biaSachUri);
    }

    private String toLocationUri(Path path) {
        String uri = path.toUri().toString();
        return uri.endsWith("/") ? uri : uri + "/";
    }
}

