package com.chicagoinsider.services;

import com.chicagoinsider.dto.PlaybookDtos;
import com.chicagoinsider.entities.Place;
import com.chicagoinsider.entities.Playbook;
import com.chicagoinsider.entities.PlaybookPlace;
import com.chicagoinsider.entities.UserProfile;
import com.chicagoinsider.exceptions.ResourceNotFoundException;
import com.chicagoinsider.mappers.ApiMapper;
import com.chicagoinsider.repositories.PlaybookPlaceRepository;
import com.chicagoinsider.repositories.PlaybookRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlaybookService {
  private static final Set<String> VISIBILITIES = Set.of("private", "shared", "public");

  private final AuthService authService;
  private final PlaceService placeService;
  private final PlaybookRepository playbookRepository;
  private final PlaybookPlaceRepository playbookPlaceRepository;
  private final ApiMapper mapper;

  public PlaybookService(
      AuthService authService,
      PlaceService placeService,
      PlaybookRepository playbookRepository,
      PlaybookPlaceRepository playbookPlaceRepository,
      ApiMapper mapper
  ) {
    this.authService = authService;
    this.placeService = placeService;
    this.playbookRepository = playbookRepository;
    this.playbookPlaceRepository = playbookPlaceRepository;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<PlaybookDtos.PlaybookDto> listMine() {
    UUID userId = authService.currentUserId();
    return playbookRepository.findAllByOwnerIdOrderByUpdatedAtDesc(userId).stream()
        .map(this::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public PlaybookDtos.PlaybookDto get(UUID playbookId) {
    UUID userId = authService.currentUserId();
    return toDto(findOwned(playbookId, userId));
  }

  @Transactional
  public PlaybookDtos.PlaybookDto create(PlaybookDtos.PlaybookRequest request) {
    UserProfile owner = authService.currentUser();
    Playbook playbook = new Playbook();
    playbook.setOwner(owner);
    playbook.setTitle(request.title().trim());
    playbook.setDescription(request.description());
    playbook.setVisibility(normalizeVisibility(request.visibility()));
    return toDto(playbookRepository.save(playbook));
  }

  @Transactional
  public PlaybookDtos.PlaybookDto update(UUID playbookId, PlaybookDtos.PlaybookRequest request) {
    UUID userId = authService.currentUserId();
    Playbook playbook = findOwned(playbookId, userId);
    playbook.setTitle(request.title().trim());
    playbook.setDescription(request.description());
    playbook.setVisibility(normalizeVisibility(request.visibility()));
    return toDto(playbookRepository.save(playbook));
  }

  @Transactional
  public void delete(UUID playbookId) {
    UUID userId = authService.currentUserId();
    playbookRepository.delete(findOwned(playbookId, userId));
  }

  @Transactional
  public PlaybookDtos.PlaybookDto addPlace(UUID playbookId, PlaybookDtos.PlaybookPlaceRequest request) {
    UUID userId = authService.currentUserId();
    Playbook playbook = findOwned(playbookId, userId);
    Place place = placeService.getPlace(request.placeId());

    PlaybookPlace playbookPlace = playbookPlaceRepository
        .findByPlaybookIdAndPlaceId(playbookId, request.placeId())
        .orElseGet(PlaybookPlace::new);
    playbookPlace.setPlaybook(playbook);
    playbookPlace.setPlace(place);
    playbookPlace.setPosition(request.position() == null
        ? playbookPlaceRepository.countByPlaybookId(playbookId)
        : request.position());
    playbookPlace.setNotes(request.notes());
    playbookPlaceRepository.save(playbookPlace);
    return toDto(playbook);
  }

  @Transactional
  public PlaybookDtos.PlaybookDto updatePlace(
      UUID playbookId,
      UUID playbookPlaceId,
      PlaybookDtos.PlaybookPlaceUpdateRequest request
  ) {
    UUID userId = authService.currentUserId();
    Playbook playbook = findOwned(playbookId, userId);
    PlaybookPlace place = playbookPlaceRepository.findByIdAndPlaybookId(playbookPlaceId, playbookId)
        .orElseThrow(() -> new ResourceNotFoundException("Playbook place not found."));
    if (request.position() != null) {
      place.setPosition(request.position());
    }
    if (request.notes() != null) {
      place.setNotes(request.notes());
    }
    playbookPlaceRepository.save(place);
    return toDto(playbook);
  }

  @Transactional
  public void removePlace(UUID playbookId, UUID playbookPlaceId) {
    UUID userId = authService.currentUserId();
    findOwned(playbookId, userId);
    PlaybookPlace place = playbookPlaceRepository.findByIdAndPlaybookId(playbookPlaceId, playbookId)
        .orElseThrow(() -> new ResourceNotFoundException("Playbook place not found."));
    playbookPlaceRepository.delete(place);
  }

  private Playbook findOwned(UUID playbookId, UUID userId) {
    return playbookRepository.findByIdAndOwnerId(playbookId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Playbook not found."));
  }

  private PlaybookDtos.PlaybookDto toDto(Playbook playbook) {
    List<PlaybookPlace> places = playbookPlaceRepository.findAllByPlaybookIdOrderByPositionAsc(playbook.getId());
    return mapper.playbook(playbook, places);
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
