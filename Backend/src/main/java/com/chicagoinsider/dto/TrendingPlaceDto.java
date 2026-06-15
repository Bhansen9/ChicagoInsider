package com.chicagoinsider.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TrendingPlaceDto(
    UUID id,
    LocalDate weekStart,
    PlaceDto place,
    int searchCount,
    int saves,
    int outingUsage,
    int reviews,
    BigDecimal trendScore,
    Instant calculatedAt
) {}
