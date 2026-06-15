package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.OutingContributor;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OutingContributorRepository extends JpaRepository<OutingContributor, UUID> {
  List<OutingContributor> findAllByOutingId(UUID outingId);

  Optional<OutingContributor> findByOutingIdAndUserId(UUID outingId, UUID userId);

  void deleteByOutingIdAndUserId(UUID outingId, UUID userId);
}
