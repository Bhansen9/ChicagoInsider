package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.PlaceSearchCache;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaceSearchCacheRepository extends JpaRepository<PlaceSearchCache, UUID> {
  Optional<PlaceSearchCache> findByCacheKeyAndExpiresAtAfter(String cacheKey, Instant now);
}
