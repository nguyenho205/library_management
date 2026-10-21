package com.fresher.library.security;

import com.fresher.library.entity.Account;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final String role;
    private final boolean enabled;
    private final Set<GrantedAuthority> authorities = new HashSet<>();

    public UserPrincipal(Account account) {
        this.id = account.getId();
        this.email = account.getEmail();
        this.password = account.getPassword();
        this.role = account.getRole().name();
        this.enabled = account.isEnabled();

        // Authority = role + toan bo ma quyen (BOOK_CREATE...) cua cac nhom quyen duoc gan
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        if (account.getPermissionGroup() != null) {
            account.getPermissionGroup().getPermissions().forEach(p ->
                    authorities.add(new SimpleGrantedAuthority(p.getCode())));
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
