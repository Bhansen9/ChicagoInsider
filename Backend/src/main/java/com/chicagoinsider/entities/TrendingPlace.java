package com.chicagoinsider.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "trending_places")
public class TrendingPlace extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "place_id")
  private Place place;

  @Column(name = "week_start", nullable = false)
  private LocalDate weekStart;

  @Column(name = "search_count")
  private int searchCount;

  private int saves;

  @Column(name = "outing_usage")
  private int outingUsage;

  private int reviews;

  @Column(name = "trend_score", precision = 12, scale = 4)
  private BigDecimal trendScore = BigDecimal.ZERO;

  @Column(name = "calculated_at")
  private Instant calculatedAt;

  public Place getPlace() {
    return place;
  }

  public void setPlace(Place place) {
    this.place = place;
  }

  public LocalDate getWeekStart() {
    return weekStart;
  }

  public void setWeekStart(LocalDate weekStart) {
    this.weekStart = weekStart;
  }

  public int getSearchCount() {
    return searchCount;
  }

  public void setSearchCount(int searchCount) {
    this.searchCount = searchCount;
  }

  public int getSaves() {
    return saves;
  }

  public void setSaves(int saves) {
    this.saves = saves;
  }

  public int getOutingUsage() {
    return outingUsage;
  }

  public void setOutingUsage(int outingUsage) {
    this.outingUsage = outingUsage;
  }

  public int getReviews() {
    return reviews;
  }

  public void setReviews(int reviews) {
    this.reviews = reviews;
  }

  public BigDecimal getTrendScore() {
    return trendScore;
  }

  public void setTrendScore(BigDecimal trendScore) {
    this.trendScore = trendScore;
  }

  public Instant getCalculatedAt() {
    return calculatedAt;
  }

  public void setCalculatedAt(Instant calculatedAt) {
    this.calculatedAt = calculatedAt;
  }
}
