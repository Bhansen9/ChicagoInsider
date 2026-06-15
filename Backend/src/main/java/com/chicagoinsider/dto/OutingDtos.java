package com.chicagoinsider.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public final class OutingDtos {
  private OutingDtos() {}

  public record OutingRequest(
      @NotBlank String title,
      String description,
      Instant startsAt,
      Instant endsAt,
      String status
  ) {}

  public record OutingPlaceRequest(
      @NotNull UUID placeId,
      @PositiveOrZero Integer position,
      @Min(1) Integer estimatedDurationMinutes,
      String notes,
      Instant plannedTime
  ) {}

  public record OutingPlaceUpdateRequest(
      @PositiveOrZero Integer position,
      @Min(1) Integer estimatedDurationMinutes,
      String notes,
      Instant plannedTime
  ) {}

  public record ContributorRequest(
      @NotNull UUID userId,
      @NotBlank String permission
  ) {}

  public record ContributorPermissionRequest(
      @NotBlank String permission
  ) {}

  public record ContributorDto(
      UUID id,
      UUID userId,
      String displayName,
      String permission,
      Instant createdAt
  ) {}

  public record OutingPlaceDto(
      UUID id,
      PlaceDto place,
      int position,
      Integer estimatedDurationMinutes,
      String notes,
      Instant plannedTime,
      Instant createdAt
  ) {}

  public record OutingDto(
      UUID id,
      UUID ownerId,
      String title,
      String description,
      Instant startsAt,
      Instant endsAt,
      String status,
      List<OutingPlaceDto> places,
      List<ContributorDto> contributors,
      Instant createdAt,
      Instant updatedAt
  ) {}
}
