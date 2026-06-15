package com.chicagoinsider.services;

import com.chicagoinsider.entities.Outing;
import com.chicagoinsider.entities.OutingPermission;
import com.chicagoinsider.exceptions.ForbiddenOperationException;
import com.chicagoinsider.repositories.OutingContributorRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PermissionService {
  private final OutingContributorRepository contributorRepository;

  public PermissionService(OutingContributorRepository contributorRepository) {
    this.contributorRepository = contributorRepository;
  }

  public OutingPermission outingPermissionFor(Outing outing, UUID userId) {
    if (outing.getOwner().getId().equals(userId)) {
      return OutingPermission.OWNER;
    }

    return contributorRepository.findByOutingIdAndUserId(outing.getId(), userId)
        .map(contributor -> contributor.getPermission())
        .orElse(null);
  }

  public void requireOutingPermission(Outing outing, UUID userId, OutingPermission required) {
    OutingPermission actual = outingPermissionFor(outing, userId);
    if (actual == null || !actual.atLeast(required)) {
      throw new ForbiddenOperationException("You do not have permission to perform this outing action.");
    }
  }

  public void requireOutingOwner(Outing outing, UUID userId) {
    if (!outing.getOwner().getId().equals(userId)) {
      throw new ForbiddenOperationException("Only the outing owner can perform this action.");
    }
  }
}
