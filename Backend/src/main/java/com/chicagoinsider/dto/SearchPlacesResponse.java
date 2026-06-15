package com.chicagoinsider.dto;

import java.time.Instant;
import java.util.List;

public record SearchPlacesResponse(
    List<PlaceDto> places,
    boolean cached,
    Instant expiresAt
) {}
