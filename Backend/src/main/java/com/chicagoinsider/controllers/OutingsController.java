package com.chicagoinsider.controllers;

import com.chicagoinsider.dto.OutingDtos;
import com.chicagoinsider.services.OutingService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/outings")
public class OutingsController {
  private final OutingService outingService;

  public OutingsController(OutingService outingService) {
    this.outingService = outingService;
  }

  @GetMapping
  public List<OutingDtos.OutingDto> list() {
    return outingService.listVisible();
  }

  @GetMapping("/{outingId}")
  public OutingDtos.OutingDto get(@PathVariable UUID outingId) {
    return outingService.get(outingId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public OutingDtos.OutingDto create(@Valid @RequestBody OutingDtos.OutingRequest request) {
    return outingService.create(request);
  }

  @PatchMapping("/{outingId}")
  public OutingDtos.OutingDto update(
      @PathVariable UUID outingId,
      @Valid @RequestBody OutingDtos.OutingRequest request
  ) {
    return outingService.update(outingId, request);
  }

  @DeleteMapping("/{outingId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID outingId) {
    outingService.delete(outingId);
  }

  @PostMapping("/{outingId}/places")
  public OutingDtos.OutingDto addPlace(
      @PathVariable UUID outingId,
      @Valid @RequestBody OutingDtos.OutingPlaceRequest request
  ) {
    return outingService.addPlace(outingId, request);
  }

  @PatchMapping("/{outingId}/places/{outingPlaceId}")
  public OutingDtos.OutingDto updatePlace(
      @PathVariable UUID outingId,
      @PathVariable UUID outingPlaceId,
      @Valid @RequestBody OutingDtos.OutingPlaceUpdateRequest request
  ) {
    return outingService.updatePlace(outingId, outingPlaceId, request);
  }

  @DeleteMapping("/{outingId}/places/{outingPlaceId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removePlace(@PathVariable UUID outingId, @PathVariable UUID outingPlaceId) {
    outingService.removePlace(outingId, outingPlaceId);
  }

  @PostMapping("/{outingId}/contributors")
  public OutingDtos.OutingDto addContributor(
      @PathVariable UUID outingId,
      @Valid @RequestBody OutingDtos.ContributorRequest request
  ) {
    return outingService.addContributor(outingId, request);
  }

  @PatchMapping("/{outingId}/contributors/{userId}")
  public OutingDtos.OutingDto updateContributor(
      @PathVariable UUID outingId,
      @PathVariable UUID userId,
      @Valid @RequestBody OutingDtos.ContributorPermissionRequest request
  ) {
    return outingService.updateContributor(outingId, userId, request);
  }

  @DeleteMapping("/{outingId}/contributors/{userId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeContributor(@PathVariable UUID outingId, @PathVariable UUID userId) {
    outingService.removeContributor(outingId, userId);
  }
}
