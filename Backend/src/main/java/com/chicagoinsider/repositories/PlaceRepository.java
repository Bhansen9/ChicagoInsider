package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.Place;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlaceRepository extends JpaRepository<Place, UUID> {
  Optional<Place> findByGooglePlaceId(String googlePlaceId);

  List<Place> findByGooglePlaceIdIn(Collection<String> googlePlaceIds);

  List<Place> findByIdIn(Collection<UUID> ids);

  @Modifying
  @Query("update Place p set p.searchCount = p.searchCount + 1 where p.id in :ids")
  void incrementSearchCounts(@Param("ids") Collection<UUID> ids);
}
