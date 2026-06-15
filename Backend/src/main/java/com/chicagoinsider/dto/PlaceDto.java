package com.chicagoinsider.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record PlaceDto(
    UUID id,
    String googlePlaceId,
    String name,
    String formattedAddress,
    String category,
    String primaryType,
    Integer priceLevel,
    BigDecimal latitude,
    BigDecimal longitude,
    String geohash,
    String websiteUrl,
    String googleMapsUrl,
    List<String> photoReferences,
    Map<String, Object> metadata,
    BigDecimal ratingAverage,
    int reviewCount,
    int searchCount,
    int saveCount,
    int outingUsageCount,
    Instant createdAt,
    Instant updatedAt
) {}
