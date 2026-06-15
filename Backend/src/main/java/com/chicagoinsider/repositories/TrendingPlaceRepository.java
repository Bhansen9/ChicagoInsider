package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.TrendingPlace;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TrendingPlaceRepository extends JpaRepository<TrendingPlace, UUID> {
  List<TrendingPlace> findTop25ByWeekStartOrderByTrendScoreDesc(LocalDate weekStart);
}
