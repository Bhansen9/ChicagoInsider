package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.PlaceCollection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectionRepository extends JpaRepository<PlaceCollection, UUID> {
  List<PlaceCollection> findAllByOwnerIdOrderByUpdatedAtDesc(UUID ownerId);

  Optional<PlaceCollection> findByIdAndOwnerId(UUID id, UUID ownerId);
}
