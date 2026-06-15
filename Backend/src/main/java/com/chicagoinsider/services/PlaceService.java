package com.chicagoinsider.services;

import com.chicagoinsider.dto.PlaceDto;
import com.chicagoinsider.dto.SearchPlacesRequest;
import com.chicagoinsider.dto.SearchPlacesResponse;
import com.chicagoinsider.entities.Place;
import com.chicagoinsider.entities.PlaceSearchCache;
import com.chicagoinsider.exceptions.ResourceNotFoundException;
import com.chicagoinsider.mappers.ApiMapper;
import com.chicagoinsider.repositories.PlaceRepository;
import com.chicagoinsider.repositories.PlaceSearchCacheRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PlaceService {
  private static final char[] GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz".toCharArray();

  private final GooglePlacesClient googlePlacesClient;
  private final PlaceRepository placeRepository;
  private final PlaceSearchCacheRepository cacheRepository;
  private final ApiMapper mapper;
  private final ObjectMapper objectMapper;
  private final Duration cacheTtl;

  public PlaceService(
      GooglePlacesClient googlePlacesClient,
      PlaceRepository placeRepository,
      PlaceSearchCacheRepository cacheRepository,
      ApiMapper mapper,
      ObjectMapper objectMapper,
      @Value("${app.cache.search-ttl-minutes}") long cacheTtlMinutes
  ) {
    this.googlePlacesClient = googlePlacesClient;
    this.placeRepository = placeRepository;
    this.cacheRepository = cacheRepository;
    this.mapper = mapper;
    this.objectMapper = objectMapper;
    this.cacheTtl = Duration.ofMinutes(cacheTtlMinutes);
  }

  @Transactional(readOnly = true)
  public Place getPlace(UUID placeId) {
    return placeRepository.findById(placeId)
        .orElseThrow(() -> new ResourceNotFoundException("Place not found."));
  }

  @Transactional
  public SearchPlacesResponse search(SearchPlacesRequest request) {
    String requestHash = requestHash(request);
    String cacheKey = "google-places:" + requestHash;
    Instant now = Instant.now();

    var cached = cacheRepository.findByCacheKeyAndExpiresAtAfter(cacheKey, now);
    if (cached.isPresent()) {
      PlaceSearchCache entry = cached.get();
      entry.setHitCount(entry.getHitCount() + 1);
      entry.setLastHitAt(now);
      cacheRepository.save(entry);

      List<Place> places = orderedPlaces(entry.getPlaceIds());
      incrementSearchCounts(places);
      return new SearchPlacesResponse(places.stream().map(mapper::place).toList(), true, entry.getExpiresAt());
    }

    List<Place> places = googlePlacesClient.search(request).stream()
        .collect(LinkedHashMap<String, GooglePlaceCandidate>::new,
            (map, candidate) -> map.putIfAbsent(candidate.googlePlaceId(), candidate),
            LinkedHashMap::putAll)
        .values()
        .stream()
        .map(this::upsertGooglePlace)
        .toList();

    incrementSearchCounts(places);

    PlaceSearchCache entry = new PlaceSearchCache();
    entry.setCacheKey(cacheKey);
    entry.setRequestHash(requestHash);
    entry.setQuery(request.query().trim());
    entry.setCategory(blankToNull(request.category()));
    entry.setLocationGeohash(blankToNull(request.locationGeohash()));
    entry.setPlaceIds(places.stream().map(Place::getId).toList());
    entry.setExpiresAt(now.plus(cacheTtl));
    cacheRepository.save(entry);

    List<PlaceDto> responsePlaces = places.stream().map(mapper::place).toList();
    return new SearchPlacesResponse(responsePlaces, false, entry.getExpiresAt());
  }

  private Place upsertGooglePlace(GooglePlaceCandidate candidate) {
    Place place = placeRepository.findByGooglePlaceId(candidate.googlePlaceId()).orElseGet(Place::new);
    place.setGooglePlaceId(candidate.googlePlaceId());
    place.setName(candidate.name());
    place.setFormattedAddress(candidate.formattedAddress());
    place.setCategory(candidate.category());
    place.setPrimaryType(candidate.primaryType());
    place.setPriceLevel(candidate.priceLevel());
    place.setLatitude(candidate.latitude());
    place.setLongitude(candidate.longitude());
    place.setGeohash(geohash(candidate.latitude(), candidate.longitude()));
    place.setWebsiteUrl(candidate.websiteUrl());
    place.setGoogleMapsUrl(candidate.googleMapsUrl());
    place.setPhotoReferences(candidate.photoReferences());
    place.setRawGooglePayload(candidate.rawPayload());
    place.setMetadata(Map.of("source", "google_places"));
    return placeRepository.save(place);
  }

  private List<Place> orderedPlaces(List<UUID> placeIds) {
    Map<UUID, Integer> positionById = new LinkedHashMap<>();
    for (int index = 0; index < placeIds.size(); index += 1) {
      positionById.put(placeIds.get(index), index);
    }

    return placeRepository.findByIdIn(placeIds).stream()
        .sorted(Comparator.comparingInt(place -> positionById.getOrDefault(place.getId(), Integer.MAX_VALUE)))
        .toList();
  }

  private void incrementSearchCounts(List<Place> places) {
    List<UUID> placeIds = places.stream().map(Place::getId).toList();
    if (!placeIds.isEmpty()) {
      placeRepository.incrementSearchCounts(placeIds);
    }
  }

  private String requestHash(SearchPlacesRequest request) {
    try {
      String canonical = objectMapper.writeValueAsString(Map.of(
          "query", request.query().trim().toLowerCase(),
          "category", normalize(request.category()),
          "locationGeohash", normalize(request.locationGeohash()),
          "latitude", request.latitude() == null ? "" : request.latitude().toPlainString(),
          "longitude", request.longitude() == null ? "" : request.longitude().toPlainString(),
          "limit", request.resolvedLimit()
      ));
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hash = digest.digest(canonical.getBytes(StandardCharsets.UTF_8));
      StringBuilder builder = new StringBuilder();
      for (byte item : hash) {
        builder.append(String.format("%02x", item));
      }
      return builder.toString();
    } catch (JsonProcessingException | NoSuchAlgorithmException exception) {
      throw new IllegalStateException("Could not hash place search request.", exception);
    }
  }

  private String geohash(BigDecimal latitude, BigDecimal longitude) {
    if (latitude == null || longitude == null) {
      return null;
    }

    double[] latRange = {-90.0, 90.0};
    double[] lonRange = {-180.0, 180.0};
    boolean even = true;
    int bit = 0;
    int ch = 0;
    StringBuilder geohash = new StringBuilder();

    while (geohash.length() < 8) {
      if (even) {
        double mid = (lonRange[0] + lonRange[1]) / 2;
        if (longitude.doubleValue() >= mid) {
          ch |= 1 << (4 - bit);
          lonRange[0] = mid;
        } else {
          lonRange[1] = mid;
        }
      } else {
        double mid = (latRange[0] + latRange[1]) / 2;
        if (latitude.doubleValue() >= mid) {
          ch |= 1 << (4 - bit);
          latRange[0] = mid;
        } else {
          latRange[1] = mid;
        }
      }

      even = !even;
      if (bit < 4) {
        bit += 1;
      } else {
        geohash.append(GEOHASH_BASE32[ch]);
        bit = 0;
        ch = 0;
      }
    }

    return geohash.toString();
  }

  private String normalize(String value) {
    return value == null ? "" : value.trim().toLowerCase();
  }

  private String blankToNull(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }
}
