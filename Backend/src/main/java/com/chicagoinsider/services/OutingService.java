package com.chicagoinsider.services;

import com.chicagoinsider.dto.OutingDtos;
import com.chicagoinsider.entities.Outing;
import com.chicagoinsider.entities.OutingContributor;
import com.chicagoinsider.entities.OutingPermission;
import com.chicagoinsider.entities.OutingPlace;
import com.chicagoinsider.entities.Place;
import com.chicagoinsider.entities.UserProfile;
import com.chicagoinsider.exceptions.ForbiddenOperationException;
import com.chicagoinsider.exceptions.ResourceNotFoundException;
import com.chicagoinsider.mappers.ApiMapper;
import com.chicagoinsider.repositories.OutingContributorRepository;
import com.chicagoinsider.repositories.OutingPlaceRepository;
import com.chicagoinsider.repositories.OutingRepository;
import com.chicagoinsider.repositories.UserRepository;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OutingService {
  private static final Set<String> STATUSES = Set.of("draft", "planned", "completed", "archived");

  private final AuthService authService;
  private final PermissionService permissionService;
  private final PlaceService placeService;
  private final OutingRepository outingRepository;
  private final OutingPlaceRepository outingPlaceRepository;
  private final OutingContributorRepository contributorRepository;
  private final UserRepository userRepository;
  private final ApiMapper mapper;

  public OutingService(
      AuthService authService,
      PermissionService permissionService,
      PlaceService placeService,
      OutingRepository outingRepository,
      OutingPlaceRepository outingPlaceRepository,
      OutingContributorRepository contributorRepository,
      UserRepository userRepository,
      ApiMapper mapper
  ) {
    this.authService = authService;
    this.permissionService = permissionService;
    this.placeService = placeService;
    this.outingRepository = outingRepository;
    this.outingPlaceRepository = outingPlaceRepository;
    this.contributorRepository = contributorRepository;
    this.userRepository = userRepository;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<OutingDtos.OutingDto> listVisible() {
    UUID userId = authService.currentUserId();
    return outingRepository.findVisibleToUser(userId).stream()
        .map(this::toDto)
        .toList();
  }

  @Transactional(readOnly = true)
  public OutingDtos.OutingDto get(UUID outingId) {
    UUID userId = authService.currentUserId();
    Outing outing = findReadable(outingId, userId);
    return toDto(outing);
  }

  @Transactional
  public OutingDtos.OutingDto create(OutingDtos.OutingRequest request) {
    UserProfile owner = authService.currentUser();
    Outing outing = new Outing();
    applyRequest(outing, request);
    outing.setOwner(owner);
    outing = outingRepository.save(outing);

    OutingContributor ownerContributor = new OutingContributor();
    ownerContributor.setOuting(outing);
    ownerContributor.setUser(owner);
    ownerContributor.setInvitedBy(owner);
    ownerContributor.setPermission(OutingPermission.OWNER);
    contributorRepository.save(ownerContributor);

    return toDto(outing);
  }

  @Transactional
  public OutingDtos.OutingDto update(UUID outingId, OutingDtos.OutingRequest request) {
    UUID userId = authService.currentUserId();
    Outing outing = findReadable(outingId, userId);
    permissionService.requireOutingPermission(outing, userId, OutingPermission.WRITE);
    applyRequest(outing, request);
    return toDto(outingRepository.save(outing));
  }

  @Transactional
  public void delete(UUID outingId) {
    UUID userId = authService.currentUserId();
    Outing outing = findReadable(outingId, userId);
    permissionService.requireOutingOwner(outing, userId);
    outingRepository.delete(outing);
  }

  @Transactional
  public OutingDtos.OutingDto addPlace(UUID outingId, OutingDtos.OutingPlaceRequest request) {
    UserProfile user = authService.currentUser();
    Outing outing = findReadable(outingId, user.getId());
    permissionService.requireOutingPermission(outing, user.getId(), OutingPermission.SUGGEST);
    Place place = placeService.getPlace(request.placeId());

    OutingPlace outingPlace = outingPlaceRepository
        .findByOutingIdAndPlaceId(outingId, request.placeId())
        .orElseGet(OutingPlace::new);
    outingPlace.setOuting(outing);
    outingPlace.setPlace(place);
    outingPlace.setAddedBy(user);
    outingPlace.setPosition(request.position() == null
        ? outingPlaceRepository.countByOutingId(outingId)
        : request.position());
    outingPlace.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
    outingPlace.setNotes(request.notes());
    outingPlace.setPlannedTime(request.plannedTime());
    outingPlaceRepository.save(outingPlace);

    return toDto(outing);
  }

  @Transactional
  public OutingDtos.OutingDto updatePlace(
      UUID outingId,
      UUID outingPlaceId,
      OutingDtos.OutingPlaceUpdateRequest request
  ) {
    UUID userId = authService.currentUserId();
    Outing outing = findReadable(outingId, userId);
    permissionService.requireOutingPermission(outing, userId, OutingPermission.WRITE);
    OutingPlace outingPlace = outingPlaceRepository.findByIdAndOutingId(outingPlaceId, outingId)
        .orElseThrow(() -> new ResourceNotFoundException("Outing place not found."));

    if (request.position() != null) {
      outingPlace.setPosition(request.position());
    }
    if (request.estimatedDurationMinutes() != null) {
      outingPlace.setEstimatedDurationMinutes(request.estimatedDurationMinutes());
    }
    if (request.notes() != null) {
      outingPlace.setNotes(request.notes());
    }
    if (request.plannedTime() != null) {
      outingPlace.setPlannedTime(request.plannedTime());
    }
    outingPlaceRepository.save(outingPlace);
    return toDto(outing);
  }

  @Transactional
  public void removePlace(UUID outingId, UUID outingPlaceId) {
    UUID userId = authService.currentUserId();
    Outing outing = findReadable(outingId, userId);
    permissionService.requireOutingPermission(outing, userId, OutingPermission.WRITE);
    OutingPlace outingPlace = outingPlaceRepository.findByIdAndOutingId(outingPlaceId, outingId)
        .orElseThrow(() -> new ResourceNotFoundException("Outing place not found."));
    outingPlaceRepository.delete(outingPlace);
  }

  @Transactional
  public OutingDtos.OutingDto addContributor(UUID outingId, OutingDtos.ContributorRequest request) {
    UserProfile owner = authService.currentUser();
    Outing outing = findReadable(outingId, owner.getId());
    permissionService.requireOutingOwner(outing, owner.getId());
    UserProfile user = userRepository.findById(request.userId())
        .orElseThrow(() -> new ResourceNotFoundException("Contributor user profile not found."));
    OutingPermission permission = parseContributorPermission(outing, request.userId(), request.permission());

    OutingContributor contributor = contributorRepository
        .findByOutingIdAndUserId(outingId, request.userId())
        .orElseGet(OutingContributor::new);
    contributor.setOuting(outing);
    contributor.setUser(user);
    contributor.setInvitedBy(owner);
    contributor.setPermission(permission);
    contributorRepository.save(contributor);

    return toDto(outing);
  }

  @Transactional
  public OutingDtos.OutingDto updateContributor(
      UUID outingId,
      UUID userId,
      OutingDtos.ContributorPermissionRequest request
  ) {
    UUID ownerId = authService.currentUserId();
    Outing outing = findReadable(outingId, ownerId);
    permissionService.requireOutingOwner(outing, ownerId);
    OutingContributor contributor = contributorRepository.findByOutingIdAndUserId(outingId, userId)
        .orElseThrow(() -> new ResourceNotFoundException("Contributor not found."));
    contributor.setPermission(parseContributorPermission(outing, userId, request.permission()));
    contributorRepository.save(contributor);
    return toDto(outing);
  }

  @Transactional
  public void removeContributor(UUID outingId, UUID userId) {
    UUID ownerId = authService.currentUserId();
    Outing outing = findReadable(outingId, ownerId);
    permissionService.requireOutingOwner(outing, ownerId);
    if (outing.getOwner().getId().equals(userId)) {
      throw new ForbiddenOperationException("The outing owner cannot be removed as a contributor.");
    }
    contributorRepository.deleteByOutingIdAndUserId(outingId, userId);
  }

  private Outing findReadable(UUID outingId, UUID userId) {
    Outing outing = outingRepository.findById(outingId)
        .orElseThrow(() -> new ResourceNotFoundException("Outing not found."));
    permissionService.requireOutingPermission(outing, userId, OutingPermission.READ);
    return outing;
  }

  private void applyRequest(Outing outing, OutingDtos.OutingRequest request) {
    outing.setTitle(request.title().trim());
    outing.setDescription(request.description());
    outing.setStartsAt(request.startsAt());
    outing.setEndsAt(request.endsAt());
    outing.setStatus(normalizeStatus(request.status()));
  }

  private String normalizeStatus(String status) {
    String normalized = status == null || status.isBlank() ? "draft" : status.trim().toLowerCase();
    if (!STATUSES.contains(normalized)) {
      throw new IllegalArgumentException("Status must be draft, planned, completed, or archived.");
    }
    return normalized;
  }

  private OutingPermission parseContributorPermission(Outing outing, UUID targetUserId, String value) {
    OutingPermission permission = OutingPermission.fromValue(value);
    if (permission == OutingPermission.OWNER && !outing.getOwner().getId().equals(targetUserId)) {
      throw new ForbiddenOperationException("Owner permission is reserved for the outing owner.");
    }
    return permission;
  }

  private OutingDtos.OutingDto toDto(Outing outing) {
    List<OutingPlace> places = outingPlaceRepository.findAllByOutingIdOrderByPositionAsc(outing.getId());
    List<OutingContributor> contributors = contributorRepository.findAllByOutingId(outing.getId());
    return mapper.outing(outing, places, contributors);
  }
}
