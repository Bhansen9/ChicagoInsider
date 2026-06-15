package com.chicagoinsider.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "place_search_cache")
public class PlaceSearchCache extends BaseEntity {
  @Column(name = "cache_key", nullable = false, unique = true)
  private String cacheKey;

  @Column(nullable = false)
  private String query;

  private String category;

  @Column(name = "location_geohash")
  private String locationGeohash;

  @Column(name = "request_hash", nullable = false)
  private String requestHash;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "results", columnDefinition = "jsonb")
  private List<UUID> placeIds = new ArrayList<>();

  @Column(name = "expires_at", nullable = false)
  private Instant expiresAt;

  @Column(name = "hit_count")
  private int hitCount;

  @Column(name = "last_hit_at")
  private Instant lastHitAt;

  public String getCacheKey() {
    return cacheKey;
  }

  public void setCacheKey(String cacheKey) {
    this.cacheKey = cacheKey;
  }

  public String getQuery() {
    return query;
  }

  public void setQuery(String query) {
    this.query = query;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getLocationGeohash() {
    return locationGeohash;
  }

  public void setLocationGeohash(String locationGeohash) {
    this.locationGeohash = locationGeohash;
  }

  public String getRequestHash() {
    return requestHash;
  }

  public void setRequestHash(String requestHash) {
    this.requestHash = requestHash;
  }

  public List<UUID> getPlaceIds() {
    return placeIds;
  }

  public void setPlaceIds(List<UUID> placeIds) {
    this.placeIds = placeIds == null ? new ArrayList<>() : placeIds;
  }

  public Instant getExpiresAt() {
    return expiresAt;
  }

  public void setExpiresAt(Instant expiresAt) {
    this.expiresAt = expiresAt;
  }

  public int getHitCount() {
    return hitCount;
  }

  public void setHitCount(int hitCount) {
    this.hitCount = hitCount;
  }

  public Instant getLastHitAt() {
    return lastHitAt;
  }

  public void setLastHitAt(Instant lastHitAt) {
    this.lastHitAt = lastHitAt;
  }
}
