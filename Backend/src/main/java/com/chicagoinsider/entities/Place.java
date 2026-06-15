package com.chicagoinsider.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "places")
public class Place extends BaseEntity {
  @Column(name = "google_place_id", nullable = false, unique = true)
  private String googlePlaceId;

  @Column(nullable = false)
  private String name;

  @Column(name = "formatted_address")
  private String formattedAddress;

  private String category;

  @Column(name = "primary_type")
  private String primaryType;

  @Column(name = "price_level")
  private Integer priceLevel;

  @Column(precision = 9, scale = 6)
  private BigDecimal latitude;

  @Column(precision = 9, scale = 6)
  private BigDecimal longitude;

  private String geohash;

  @Column(name = "website_url")
  private String websiteUrl;

  @Column(name = "google_maps_url")
  private String googleMapsUrl;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "photo_references", columnDefinition = "jsonb")
  private List<String> photoReferences = new ArrayList<>();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "raw_google_payload", columnDefinition = "jsonb")
  private Map<String, Object> rawGooglePayload = new HashMap<>();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(columnDefinition = "jsonb")
  private Map<String, Object> metadata = new HashMap<>();

  @Column(name = "rating_average", precision = 3, scale = 2)
  private BigDecimal ratingAverage = BigDecimal.ZERO;

  @Column(name = "rating_count")
  private int ratingCount;

  @Column(name = "review_count")
  private int reviewCount;

  @Column(name = "search_count")
  private int searchCount;

  @Column(name = "save_count")
  private int saveCount;

  @Column(name = "outing_usage_count")
  private int outingUsageCount;

  public String getGooglePlaceId() {
    return googlePlaceId;
  }

  public void setGooglePlaceId(String googlePlaceId) {
    this.googlePlaceId = googlePlaceId;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getFormattedAddress() {
    return formattedAddress;
  }

  public void setFormattedAddress(String formattedAddress) {
    this.formattedAddress = formattedAddress;
  }

  public String getCategory() {
    return category;
  }

  public void setCategory(String category) {
    this.category = category;
  }

  public String getPrimaryType() {
    return primaryType;
  }

  public void setPrimaryType(String primaryType) {
    this.primaryType = primaryType;
  }

  public Integer getPriceLevel() {
    return priceLevel;
  }

  public void setPriceLevel(Integer priceLevel) {
    this.priceLevel = priceLevel;
  }

  public BigDecimal getLatitude() {
    return latitude;
  }

  public void setLatitude(BigDecimal latitude) {
    this.latitude = latitude;
  }

  public BigDecimal getLongitude() {
    return longitude;
  }

  public void setLongitude(BigDecimal longitude) {
    this.longitude = longitude;
  }

  public String getGeohash() {
    return geohash;
  }

  public void setGeohash(String geohash) {
    this.geohash = geohash;
  }

  public String getWebsiteUrl() {
    return websiteUrl;
  }

  public void setWebsiteUrl(String websiteUrl) {
    this.websiteUrl = websiteUrl;
  }

  public String getGoogleMapsUrl() {
    return googleMapsUrl;
  }

  public void setGoogleMapsUrl(String googleMapsUrl) {
    this.googleMapsUrl = googleMapsUrl;
  }

  public List<String> getPhotoReferences() {
    return photoReferences;
  }

  public void setPhotoReferences(List<String> photoReferences) {
    this.photoReferences = photoReferences == null ? new ArrayList<>() : photoReferences;
  }

  public Map<String, Object> getRawGooglePayload() {
    return rawGooglePayload;
  }

  public void setRawGooglePayload(Map<String, Object> rawGooglePayload) {
    this.rawGooglePayload = rawGooglePayload == null ? new HashMap<>() : rawGooglePayload;
  }

  public Map<String, Object> getMetadata() {
    return metadata;
  }

  public void setMetadata(Map<String, Object> metadata) {
    this.metadata = metadata == null ? new HashMap<>() : metadata;
  }

  public BigDecimal getRatingAverage() {
    return ratingAverage;
  }

  public void setRatingAverage(BigDecimal ratingAverage) {
    this.ratingAverage = ratingAverage;
  }

  public int getRatingCount() {
    return ratingCount;
  }

  public void setRatingCount(int ratingCount) {
    this.ratingCount = ratingCount;
  }

  public int getReviewCount() {
    return reviewCount;
  }

  public void setReviewCount(int reviewCount) {
    this.reviewCount = reviewCount;
  }

  public int getSearchCount() {
    return searchCount;
  }

  public void setSearchCount(int searchCount) {
    this.searchCount = searchCount;
  }

  public int getSaveCount() {
    return saveCount;
  }

  public void setSaveCount(int saveCount) {
    this.saveCount = saveCount;
  }

  public int getOutingUsageCount() {
    return outingUsageCount;
  }

  public void setOutingUsageCount(int outingUsageCount) {
    this.outingUsageCount = outingUsageCount;
  }
}
