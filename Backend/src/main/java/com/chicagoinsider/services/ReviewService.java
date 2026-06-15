package com.chicagoinsider.services;

import com.chicagoinsider.dto.ReviewDtos;
import com.chicagoinsider.entities.Place;
import com.chicagoinsider.entities.Review;
import com.chicagoinsider.entities.UserProfile;
import com.chicagoinsider.exceptions.ForbiddenOperationException;
import com.chicagoinsider.exceptions.ResourceNotFoundException;
import com.chicagoinsider.mappers.ApiMapper;
import com.chicagoinsider.repositories.ReviewRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {
  private final AuthService authService;
  private final PlaceService placeService;
  private final ReviewRepository reviewRepository;
  private final ApiMapper mapper;

  public ReviewService(
      AuthService authService,
      PlaceService placeService,
      ReviewRepository reviewRepository,
      ApiMapper mapper
  ) {
    this.authService = authService;
    this.placeService = placeService;
    this.reviewRepository = reviewRepository;
    this.mapper = mapper;
  }

  @Transactional(readOnly = true)
  public List<ReviewDtos.ReviewDto> listForPlace(UUID placeId) {
    return reviewRepository.findAllByPlaceIdOrderByCreatedAtDesc(placeId).stream()
        .map(mapper::review)
        .toList();
  }

  @Transactional
  public ReviewDtos.ReviewDto createOrUpdate(ReviewDtos.ReviewRequest request) {
    UserProfile user = authService.currentUser();
    Place place = placeService.getPlace(request.placeId());
    Review review = reviewRepository.findByPlaceIdAndUserId(request.placeId(), user.getId())
        .orElseGet(Review::new);
    review.setPlace(place);
    review.setUser(user);
    review.setRating(request.rating());
    review.setComment(request.comment());
    return mapper.review(reviewRepository.save(review));
  }

  @Transactional
  public ReviewDtos.ReviewDto update(UUID reviewId, ReviewDtos.ReviewUpdateRequest request) {
    UUID userId = authService.currentUserId();
    Review review = findOwn(reviewId, userId);
    if (request.rating() != null) {
      review.setRating(request.rating());
    }
    if (request.comment() != null) {
      review.setComment(request.comment());
    }
    return mapper.review(reviewRepository.save(review));
  }

  @Transactional
  public void delete(UUID reviewId) {
    UUID userId = authService.currentUserId();
    reviewRepository.delete(findOwn(reviewId, userId));
  }

  private Review findOwn(UUID reviewId, UUID userId) {
    Review review = reviewRepository.findById(reviewId)
        .orElseThrow(() -> new ResourceNotFoundException("Review not found."));
    if (!review.getUser().getId().equals(userId)) {
      throw new ForbiddenOperationException("You can only modify your own reviews.");
    }
    return review;
  }
}
