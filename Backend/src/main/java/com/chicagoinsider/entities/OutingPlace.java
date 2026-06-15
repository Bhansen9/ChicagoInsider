package com.chicagoinsider.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "outing_places")
public class OutingPlace extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "outing_id")
  private Outing outing;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "place_id")
  private Place place;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "added_by")
  private UserProfile addedBy;

  @Column(nullable = false)
  private int position;

  @Column(name = "estimated_duration_minutes")
  private Integer estimatedDurationMinutes;

  private String notes;

  @Column(name = "planned_time")
  private Instant plannedTime;

  public Outing getOuting() {
    return outing;
  }

  public void setOuting(Outing outing) {
    this.outing = outing;
  }

  public Place getPlace() {
    return place;
  }

  public void setPlace(Place place) {
    this.place = place;
  }

  public UserProfile getAddedBy() {
    return addedBy;
  }

  public void setAddedBy(UserProfile addedBy) {
    this.addedBy = addedBy;
  }

  public int getPosition() {
    return position;
  }

  public void setPosition(int position) {
    this.position = position;
  }

  public Integer getEstimatedDurationMinutes() {
    return estimatedDurationMinutes;
  }

  public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) {
    this.estimatedDurationMinutes = estimatedDurationMinutes;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public Instant getPlannedTime() {
    return plannedTime;
  }

  public void setPlannedTime(Instant plannedTime) {
    this.plannedTime = plannedTime;
  }
}
