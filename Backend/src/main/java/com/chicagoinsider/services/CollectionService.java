package com.chicagoinsider.services;

import com.chicagoinsider.dto.CollectionDtos;
import com.chicagoinsider.entities.CollectionPlace;
import com.chicagoinsider.entities.Place;
import com.chicagoinsider.entities.PlaceCollection;
import com.chicagoinsider.entities.UserProfile;
import com.chicagoinsider.exceptions.ResourceNotFoundException;
import com.chicagoinsider.mappers.ApiMapper;
import com.chicagoinsider.repositories.CollectionPlaceRepository;
import com.chicagoinsider.repositories.CollectionRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CollectionService {
  private static final Set<String> VISIBILITIES = Set.of("private", "shared", "public");

  private final AuthService authService;
  private final PlaceService placeService;
  private final CollectionRepository collectionRepository;
  private final CollectionPlaceRepository collectionPlaceRepository;
  private final ApiMapper mapper;

  public CollectionService(
      AuthService authService,
      PlaceService placeService,
      CollectionRepository collectionRepository,
      CollectionPlaceRepository collectionPlaceRepository,
      ApiMapper mapper
  ) {
    this.authService = authService;
    this.placeService = placeService;
    this.collectionRepository = collectionRepository;
    this.collectionPlaceRepository = collectionPlaceRepository;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<CollectionDtos.CollectionDto> listMine() {
    UUID userId = authService.currentUserId();
    return collectionRepository.findAllByOwnerIdOrderByUpdatedAtDesc(userId).stream()
        .map(this::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public CollectionDtos.CollectionDto get(UUID collectionId) {
    UUID userId = authService.currentUserId();
    return toDto(findOwned(collectionId, userId));
  }

  @Transactional
  public CollectionDtos.CollectionDto create(CollectionDtos.CollectionRequest request) {
    UserProfile owner = authService.currentUser();
    PlaceCollection collection = new PlaceCollection();
    collection.setOwner(owner);
    collection.setName(request.name().trim());
    collection.setDescription(request.description());
    collection.setVisibility(normalizeVisibility(request.visibility()));
    return toDto(collectionRepository.save(collection));
  }

  @Transactional
  public CollectionDtos.CollectionDto update(UUID collectionId, CollectionDtos.CollectionRequest request) {
    UUID userId = authService.currentUserId();
    PlaceCollection collection = findOwned(collectionId, userId);
    collection.setName(request.name().trim());
    collection.setDescription(request.description());
    collection.setVisibility(normalizeVisibility(request.visibility()));
    return toDto(collectionRepository.save(collection));
  }

  @Transactional
  public void delete(UUID collectionId) {
    UUID userId = authService.currentUserId();
    collectionRepository.delete(findOwned(collectionId, userId));
  }

  @Transactional
  public CollectionDtos.CollectionDto addPlace(UUID collectionId, CollectionDtos.CollectionPlaceRequest request) {
    UserProfile user = authService.currentUser();
    PlaceCollection collection = findOwned(collectionId, user.getId());
    Place place = placeService.getPlace(request.placeId());

    CollectionPlace collectionPlace = collectionPlaceRepository
        .findByCollectionIdAndPlaceId(collectionId, request.placeId())
        .orElseGet(CollectionPlace::new);
    collectionPlace.setCollection(collection);
    collectionPlace.setPlace(place);
    collectionPlace.setAddedBy(user);
    collectionPlace.setPosition(request.position() == null
        ? collectionPlaceRepository.countByCollectionId(collectionId)
        : request.position());
    collectionPlace.setNotes(request.notes());
    collectionPlaceRepository.save(collectionPlace);

    return toDto(collection);
  }

  @Transactional
  public void removePlace(UUID collectionId, UUID placeId) {
    UUID userId = authService.currentUserId();
    findOwned(collectionId, userId);
    collectionPlaceRepository.deleteByCollectionIdAndPlaceId(collectionId, placeId);
  }

  private PlaceCollection findOwned(UUID collectionId, UUID userId) {
    return collectionRepository.findByIdAndOwnerId(collectionId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Collection not found."));
  }

  private CollectionDtos.CollectionDto toDto(PlaceCollection collection) {
    List<CollectionPlace> places = collectionPlaceRepository.findAllByCollectionIdOrderByPositionAsc(collection.getId());
    return mapper.collection(collection, places);
  }

  private String normalizeVisibility(String visibility) {
    String normalized = visibility == null || visibility.isBlank()
        ? "private"
        : visibility.trim().toLowerCase();
    if (!VISIBILITIES.contains(normalized)) {
      throw new IllegalArgumentException("Visibility must be private, shared, or public.");
    }
    return normalized;
  }
}
