package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.OutingPlace;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutingPlaceRepository extends JpaRepository<OutingPlace, UUID> {
  List<OutingPlace> findAllByOutingIdOrderByPositionAsc(UUID outingId);

  Optional<OutingPlace> findByIdAndOutingId(UUID id, UUID outingId);

  Optional<OutingPlace> findByOutingIdAndPlaceId(UUID outingId, UUID placeId);

  int countByOutingId(UUID outingId);
}
