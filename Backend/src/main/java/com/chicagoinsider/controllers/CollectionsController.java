package com.chicagoinsider.controllers;

import com.chicagoinsider.dto.CollectionDtos;
import com.chicagoinsider.services.CollectionService;
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
@RequestMapping("/api/collections")
public class CollectionsController {
  private final CollectionService collectionService;

  public CollectionsController(CollectionService collectionService) {
    this.collectionService = collectionService;
  }

  @GetMapping
  public List<CollectionDtos.CollectionDto> list() {
    return collectionService.listMine();
  }

  @GetMapping("/{collectionId}")
  public CollectionDtos.CollectionDto get(@PathVariable UUID collectionId) {
    return collectionService.get(collectionId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CollectionDtos.CollectionDto create(@Valid @RequestBody CollectionDtos.CollectionRequest request) {
    return collectionService.create(request);
  }

  @PatchMapping("/{collectionId}")
  public CollectionDtos.CollectionDto update(
      @PathVariable UUID collectionId,
      @Valid @RequestBody CollectionDtos.CollectionRequest request
  ) {
    return collectionService.update(collectionId, request);
  }

  @DeleteMapping("/{collectionId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID collectionId) {
    collectionService.delete(collectionId);
  }

  @PostMapping("/{collectionId}/places")
  public CollectionDtos.CollectionDto addPlace(
      @PathVariable UUID collectionId,
      @Valid @RequestBody CollectionDtos.CollectionPlaceRequest request
  ) {
    return collectionService.addPlace(collectionId, request);
  }

  @DeleteMapping("/{collectionId}/places/{placeId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removePlace(@PathVariable UUID collectionId, @PathVariable UUID placeId) {
    collectionService.removePlace(collectionId, placeId);
  }
}
