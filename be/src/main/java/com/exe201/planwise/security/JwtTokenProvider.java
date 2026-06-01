package com.exe201.planwise.security;

import com.exe201.planwise.config.AppProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
@Slf4j
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final AppProperties appProperties;

    // ── Generate ──────────────────────────────────────────────────────────────

    /**
     * Tạo Access Token (15 phút) từ UserPrincipal.
     */
    public String generateAccessToken(UserPrincipal userPrincipal) {
        return buildToken(userPrincipal.getId().toString(),
                appProperties.getJwt().getAccessTokenExpirationMs());
    }

    /**
     * Tạo Refresh Token (7 ngày) - lưu token ID vào claim để revoke.
     */
    public String generateRefreshToken(UserPrincipal userPrincipal) {
        return Jwts.builder()
                .subject(userPrincipal.getId().toString())
                .id(UUID.randomUUID().toString())          // jti – dùng để revoke
                .claim("type", "refresh")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()
                        + appProperties.getJwt().getRefreshTokenExpirationMs()))
                .signWith(getSigningKey())
                .compact();
    }

    // ── Parse ─────────────────────────────────────────────────────────────────

    public UUID getUserIdFromToken(String token) {
        String subject = parseClaims(token).getSubject();
        return UUID.fromString(subject);
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("JWT unsupported: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("JWT malformed: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims empty: {}", e.getMessage());
        }
        return false;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    private String buildToken(String subject, long expirationMs) {
        return Jwts.builder()
                .subject(subject)
                .claim("type", "access")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(appProperties.getJwt().getSecret());
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
