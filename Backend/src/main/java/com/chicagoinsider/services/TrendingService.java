package com.chicagoinsider.services;

import com.chicagoinsider.dto.TrendingPlaceDto;
import com.chicagoinsider.mappers.ApiMapper;
import com.chicagoinsider.repositories.TrendingPlaceRepository;
import jakarta.persistence.EntityManager;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TrendingService {
  private final TrendingPlaceRepository trendingPlaceRepository;
  private final EntityManager entityManager;
  private final ApiMapper mapper;

  public TrendingService(
      TrendingPlaceRepository trendingPlaceRepository,
      EntityManager entityManager,
      ApiMapper mapper
  ) {
    this.trendingPlaceRepository = trendingPlaceRepository;
    this.entityManager = entityManager;
    this.mapper = mapper;
  }

  @Transactional
  public List<TrendingPlaceDto> trending(LocalDate weekStart, boolean refresh) {
    LocalDate targetWeek = weekStart == null ? currentWeekStart() : weekStart;
    if (refresh || trendingPlaceRepository.findTop25ByWeekStartOrderByTrendScoreDesc(targetWeek).isEmpty()) {
      refresh(targetWeek);
    }

    return trendingPlaceRepository.findTop25ByWeekStartOrderByTrendScoreDesc(targetWeek).stream()
        .map(mapper::trendingPlace)
        .toList();
  }

  @Transactional
  public void refresh(LocalDate weekStart) {
    entityManager
        .createNativeQuery("select public.refresh_weekly_trending(:weekStart)")
        .setParameter("weekStart", weekStart)
        .getSingleResult();
  }

  private LocalDate currentWeekStart() {
    return LocalDate.now().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
  }
}
