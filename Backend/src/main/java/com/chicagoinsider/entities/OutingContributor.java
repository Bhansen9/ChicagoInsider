package com.chicagoinsider.entities;

import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "outing_contributors")
public class OutingContributor extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "outing_id")
  private Outing outing;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id")
  private UserProfile user;

  @Convert(converter = OutingPermissionConverter.class)
  private OutingPermission permission;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "invited_by")
  private UserProfile invitedBy;

  public Outing getOuting() {
    return outing;
  }

  public void setOuting(Outing outing) {
    this.outing = outing;
  }

  public UserProfile getUser() {
    return user;
  }

  public void setUser(UserProfile user) {
    this.user = user;
  }

  public OutingPermission getPermission() {
    return permission;
  }

  public void setPermission(OutingPermission permission) {
    this.permission = permission;
  }

  public UserProfile getInvitedBy() {
    return invitedBy;
  }

  public void setInvitedBy(UserProfile invitedBy) {
    this.invitedBy = invitedBy;
  }
}
