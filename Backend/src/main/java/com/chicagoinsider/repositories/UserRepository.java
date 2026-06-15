package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.UserProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<UserProfile, UUID> {
  Optional<UserProfile> findByEmailIgnoreCase(String email);
}
