package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.PlaybookPlace;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaybookPlaceRepository extends JpaRepository<PlaybookPlace, UUID> {
  List<PlaybookPlace> findAllByPlaybookIdOrderByPositionAsc(UUID playbookId);

  Optional<PlaybookPlace> findByIdAndPlaybookId(UUID id, UUID playbookId);

  Optional<PlaybookPlace> findByPlaybookIdAndPlaceId(UUID playbookId, UUID placeId);

  int countByPlaybookId(UUID playbookId);
}
