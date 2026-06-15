package com.chicagoinsider.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public final class ReviewDtos {
  private ReviewDtos() {}

  public record ReviewRequest(
      @NotNull UUID placeId,
      @Min(1) @Max(5) int rating,
      String comment
  ) {}

  public record ReviewUpdateRequest(
      @Min(1) @Max(5) Integer rating,
      String comment
  ) {}

  public record ReviewDto(
      UUID id,
      UUID placeId,
      UUID userId,
      String displayName,
      int rating,
      String comment,
      Instant createdAt,
      Instant updatedAt
  ) {}
}
