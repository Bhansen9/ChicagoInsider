package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.CollectionPlace;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectionPlaceRepository extends JpaRepository<CollectionPlace, UUID> {
  List<CollectionPlace> findAllByCollectionIdOrderByPositionAsc(UUID collectionId);

  Optional<CollectionPlace> findByCollectionIdAndPlaceId(UUID collectionId, UUID placeId);

  int countByCollectionId(UUID collectionId);

  void deleteByCollectionIdAndPlaceId(UUID collectionId, UUID placeId);
}
