package com.chicagoinsider.controllers;

import com.chicagoinsider.dto.ReviewDtos;
import com.chicagoinsider.services.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class ReviewsController {
  private final ReviewService reviewService;

  public ReviewsController(ReviewService reviewService) {
    this.reviewService = reviewService;
  }

  @GetMapping("/place/{placeId}")
  public List<ReviewDtos.ReviewDto> listForPlace(@PathVariable UUID placeId) {
    return reviewService.listForPlace(placeId);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public ReviewDtos.ReviewDto create(@Valid @RequestBody ReviewDtos.ReviewRequest request) {
    return reviewService.createOrUpdate(request);
  }

  @PatchMapping("/{reviewId}")
  public ReviewDtos.ReviewDto update(
      @PathVariable UUID reviewId,
      @Valid @RequestBody ReviewDtos.ReviewUpdateRequest request
  ) {
    return reviewService.update(reviewId, request);
  }

  @DeleteMapping("/{reviewId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable UUID reviewId) {
    reviewService.delete(reviewId);
  }
}
