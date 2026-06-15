package com.chicagoinsider.controllers;

import com.chicagoinsider.dto.PlaceDto;
import com.chicagoinsider.dto.SearchPlacesRequest;
import com.chicagoinsider.dto.SearchPlacesResponse;
import com.chicagoinsider.dto.TrendingPlaceDto;
import com.chicagoinsider.mappers.ApiMapper;
import com.chicagoinsider.services.PlaceService;
import com.chicagoinsider.services.TrendingService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/places")
public class PlacesController {
  private final PlaceService placeService;
  private final TrendingService trendingService;
  private final ApiMapper mapper;

  public PlacesController(PlaceService placeService, TrendingService trendingService, ApiMapper mapper) {
    this.placeService = placeService;
    this.trendingService = trendingService;
    this.mapper = mapper;
  }

  @PostMapping("/search")
  public SearchPlacesResponse search(@Valid @RequestBody SearchPlacesRequest request) {
    return placeService.search(request);
  }

  @GetMapping("/trending")
  public List<TrendingPlaceDto> trending(
      @RequestParam(required = false) LocalDate weekStart,
      @RequestParam(defaultValue = "false") boolean refresh
  ) {
    return trendingService.trending(weekStart, refresh);
  }

  @GetMapping("/{placeId}")
  public PlaceDto get(@PathVariable UUID placeId) {
    return mapper.place(placeService.getPlace(placeId));
  }
}
