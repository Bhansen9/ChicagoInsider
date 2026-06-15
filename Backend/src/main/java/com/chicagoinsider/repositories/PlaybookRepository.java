package com.chicagoinsider.repositories;

import com.chicagoinsider.entities.Playbook;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaybookRepository extends JpaRepository<Playbook, UUID> {
  List<Playbook> findAllByOwnerIdOrderByUpdatedAtDesc(UUID ownerId);

  Optional<Playbook> findByIdAndOwnerId(UUID id, UUID ownerId);
}
