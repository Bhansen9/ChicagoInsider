package com.chicagoinsider.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class PlaybookDtos {
  private PlaybookDtos() {}

  public record PlaybookRequest(
      @NotBlank String title,
      String description,
      String visibility
  ) {}

  public record PlaybookPlaceRequest(
      @NotNull UUID placeId,
      @PositiveOrZero Integer position,
      String notes
  ) {}

  public record PlaybookPlaceUpdateRequest(
      @PositiveOrZero Integer position,
      String notes
  ) {}

  public record PlaybookPlaceDto(
      UUID id,
      PlaceDto place,
      int position,
      String notes,
      Instant createdAt
  ) {}

  public record PlaybookDto(
      UUID id,
      UUID ownerId,
      String title,
      String description,
      String visibility,
      List<PlaybookPlaceDto> places,
      Instant createdAt,
      Instant updatedAt
  ) {}
}
