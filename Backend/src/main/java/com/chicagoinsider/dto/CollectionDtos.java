package com.chicagoinsider.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class CollectionDtos {
  private CollectionDtos() {}

  public record CollectionRequest(
      @NotBlank String name,
      String description,
      String visibility
  ) {}

  public record CollectionPlaceRequest(
      @NotNull UUID placeId,
      @PositiveOrZero Integer position,
      String notes
  ) {}

  public record CollectionPlaceDto(
      UUID id,
      PlaceDto place,
      int position,
      String notes,
      Instant createdAt
  ) {}

  public record CollectionDto(
      UUID id,
      UUID ownerId,
      String name,
      String description,
      String visibility,
      List<CollectionPlaceDto> places,
      Instant createdAt,
      Instant updatedAt
  ) {}
}
