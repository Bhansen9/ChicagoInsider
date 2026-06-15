package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.Outing;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OutingRepository extends JpaRepository<Outing, UUID> {
  @Query("""
      select distinct o
      from Outing o
      left join OutingContributor c on c.outing = o
      where o.owner.id = :userId or c.user.id = :userId
      order by o.updatedAt desc
      """)
  List<Outing> findVisibleToUser(@Param("userId") UUID userId);

  Optional<Outing> findByIdAndOwnerId(UUID id, UUID ownerId);
}
