package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.Review;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, UUID> {
  List<Review> findAllByPlaceIdOrderByCreatedAtDesc(UUID placeId);

  Optional<Review> findByPlaceIdAndUserId(UUID placeId, UUID userId);
}
