package com.chicagoinsider.services;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record GooglePlaceCandidate(
    String googlePlaceId,
    String name,
    String formattedAddress,
    String category,
    String primaryType,
    Integer priceLevel,
    BigDecimal latitude,
    BigDecimal longitude,
    String websiteUrl,
    String googleMapsUrl,
    List<String> photoReferences,
    Map<String, Object> rawPayload
) {}
