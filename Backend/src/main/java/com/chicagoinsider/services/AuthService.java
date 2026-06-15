package com.chicagoinsider.services;

import com.chicagoinsider.entities.UserProfile;
import com.chicagoinsider.exceptions.UnauthenticatedException;
import com.chicagoinsider.repositories.UserRepository;
import java.util.Map;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
  private final UserRepository userRepository;

  public AuthService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public UUID currentUserId() {
    return currentJwt()
        .map(jwt -> UUID.fromString(jwt.getSubject()))
        .orElseThrow(() -> new UnauthenticatedException("A Supabase access token is required."));
  }

  @Transactional
  public UserProfile currentUser() {
    Jwt jwt = currentJwt()
        .orElseThrow(() -> new UnauthenticatedException("A Supabase access token is required."));
    UUID userId = UUID.fromString(jwt.getSubject());

    return userRepository.findById(userId).orElseGet(() -> {
      UserProfile profile = new UserProfile();
      profile.setId(userId);
      profile.setEmail(jwt.getClaimAsString("email"));
      profile.setDisplayName(displayNameFrom(jwt));
      profile.setAvatarUrl(metadataString(jwt, "avatar_url"));
      return userRepository.save(profile);
    });
  }

  private java.util.Optional<Jwt> currentJwt() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication instanceof JwtAuthenticationToken token) {
      return java.util.Optional.of(token.getToken());
    }
    return java.util.Optional.empty();
  }

  private String displayNameFrom(Jwt jwt) {
    String name = metadataString(jwt, "full_name");
    if (name != null && !name.isBlank()) {
      return name;
    }
    String email = jwt.getClaimAsString("email");
    if (email == null || email.isBlank()) {
      return "Chicago Insider User";
    }
    return email.split("@")[0];
  }

  @SuppressWarnings("unchecked")
  private String metadataString(Jwt jwt, String key) {
    Object metadata = jwt.getClaim("user_metadata");
    if (!(metadata instanceof Map<?, ?> map)) {
      return null;
    }
    Object value = ((Map<String, Object>) map).get(key);
    return value == null ? null : String.valueOf(value);
  }
}
