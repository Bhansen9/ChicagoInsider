package com.chicagoinsider.controllers;

import com.chicagoinsider.dto.PlaybookDtos;
import com.chicagoinsider.services.PlaybookService;
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
@RequestMapping("/api/playbooks")
public class PlaybooksController {
  private final PlaybookService playbookService;

  public PlaybooksController(PlaybookService playbookService) {
    this.playbookService = playbookService;
  }

  @GetMapping
  public List<PlaybookDtos.PlaybookDto> list() {
    return playbookService.listMine();
  }

  @GetMapping("/{playbookId}")
  public PlaybookDtos.PlaybookDto get(@PathVariable UUID playbookId) {
    return playbookService.get(playbookId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public PlaybookDtos.PlaybookDto create(@Valid @RequestBody PlaybookDtos.PlaybookRequest request) {
    return playbookService.create(request);
  }

  @PatchMapping("/{playbookId}")
  public PlaybookDtos.PlaybookDto update(
      @PathVariable UUID playbookId,
      @Valid @RequestBody PlaybookDtos.PlaybookRequest request
  ) {
    return playbookService.update(playbookId, request);
  }

  @DeleteMapping("/{playbookId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID playbookId) {
    playbookService.delete(playbookId);
  }

  @PostMapping("/{playbookId}/places")
  public PlaybookDtos.PlaybookDto addPlace(
      @PathVariable UUID playbookId,
      @Valid @RequestBody PlaybookDtos.PlaybookPlaceRequest request
  ) {
    return playbookService.addPlace(playbookId, request);
  }

  @PatchMapping("/{playbookId}/places/{playbookPlaceId}")
  public PlaybookDtos.PlaybookDto updatePlace(
      @PathVariable UUID playbookId,
      @PathVariable UUID playbookPlaceId,
      @Valid @RequestBody PlaybookDtos.PlaybookPlaceUpdateRequest request
  ) {
    return playbookService.updatePlace(playbookId, playbookPlaceId, request);
  }

  @DeleteMapping("/{playbookId}/places/{playbookPlaceId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removePlace(@PathVariable UUID playbookId, @PathVariable UUID playbookPlaceId) {
    playbookService.removePlace(playbookId, playbookPlaceId);
  }
}
