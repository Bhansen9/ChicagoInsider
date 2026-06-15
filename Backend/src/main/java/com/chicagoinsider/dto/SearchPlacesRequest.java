package com.chicagoinsider.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public record SearchPlacesRequest(
    @NotBlank String query,
    String category,
    String locationGeohash,
    BigDecimal latitude,
    BigDecimal longitude,
    @Min(1) @Max(25) Integer limit
) {
  public int resolvedLimit() {
    return limit == null ? 12 : limit;
  }
}
