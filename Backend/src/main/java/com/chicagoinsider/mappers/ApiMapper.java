package com.chicagoinsider.mappers;

import com.chicagoinsider.dto.CollectionDtos;
import com.chicagoinsider.dto.OutingDtos;
import com.chicagoinsider.dto.PlaceDto;
import com.chicagoinsider.dto.PlaybookDtos;
import com.chicagoinsider.dto.ReviewDtos;
import com.chicagoinsider.dto.TrendingPlaceDto;
import com.chicagoinsider.entities.CollectionPlace;
import com.chicagoinsider.entities.Outing;
import com.chicagoinsider.entities.OutingContributor;
import com.chicagoinsider.entities.OutingPlace;
import com.chicagoinsider.entities.Place;
import com.chicagoinsider.entities.PlaceCollection;
import com.chicagoinsider.entities.Playbook;
import com.chicagoinsider.entities.PlaybookPlace;
import com.chicagoinsider.entities.Review;
import com.chicagoinsider.entities.TrendingPlace;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ApiMapper {
  public PlaceDto place(Place place) {
    return new PlaceDto(
        place.getId(),
        place.getGooglePlaceId(),
        place.getName(),
        place.getFormattedAddress(),
        place.getCategory(),
        place.getPrimaryType(),
        place.getPriceLevel(),
        place.getLatitude(),
        place.getLongitude(),
        place.getGeohash(),
        place.getWebsiteUrl(),
        place.getGoogleMapsUrl(),
        place.getPhotoReferences(),
        place.getMetadata(),
        place.getRatingAverage(),
        place.getReviewCount(),
        place.getSearchCount(),
        place.getSaveCount(),
        place.getOutingUsageCount(),
        place.getCreatedAt(),
        place.getUpdatedAt()
    );
  }

  public CollectionDtos.CollectionDto collection(
      PlaceCollection collection,
      List<CollectionPlace> places
  ) {
    return new CollectionDtos.CollectionDto(
        collection.getId(),
        collection.getOwner().getId(),
        collection.getName(),
        collection.getDescription(),
        collection.getVisibility(),
        places.stream().map(this::collectionPlace).toList(),
        collection.getCreatedAt(),
        collection.getUpdatedAt()
    );
  }

  public CollectionDtos.CollectionPlaceDto collectionPlace(CollectionPlace collectionPlace) {
    return new CollectionDtos.CollectionPlaceDto(
        collectionPlace.getId(),
        place(collectionPlace.getPlace()),
        collectionPlace.getPosition(),
        collectionPlace.getNotes(),
        collectionPlace.getCreatedAt()
    );
  }

  public OutingDtos.OutingDto outing(
      Outing outing,
      List<OutingPlace> places,
      List<OutingContributor> contributors
  ) {
    return new OutingDtos.OutingDto(
        outing.getId(),
        outing.getOwner().getId(),
        outing.getTitle(),
        outing.getDescription(),
        outing.getStartsAt(),
        outing.getEndsAt(),
        outing.getStatus(),
        places.stream().map(this::outingPlace).toList(),
        contributors.stream().map(this::contributor).toList(),
        outing.getCreatedAt(),
        outing.getUpdatedAt()
    );
  }

  public OutingDtos.OutingPlaceDto outingPlace(OutingPlace outingPlace) {
    return new OutingDtos.OutingPlaceDto(
        outingPlace.getId(),
        place(outingPlace.getPlace()),
        outingPlace.getPosition(),
        outingPlace.getEstimatedDurationMinutes(),
        outingPlace.getNotes(),
        outingPlace.getPlannedTime(),
        outingPlace.getCreatedAt()
    );
  }

  public OutingDtos.ContributorDto contributor(OutingContributor contributor) {
    return new OutingDtos.ContributorDto(
        contributor.getId(),
        contributor.getUser().getId(),
        contributor.getUser().getDisplayName(),
        contributor.getPermission().value(),
        contributor.getCreatedAt()
    );
  }

  public PlaybookDtos.PlaybookDto playbook(Playbook playbook, List<PlaybookPlace> places) {
    return new PlaybookDtos.PlaybookDto(
        playbook.getId(),
        playbook.getOwner().getId(),
        playbook.getTitle(),
        playbook.getDescription(),
        playbook.getVisibility(),
        places.stream().map(this::playbookPlace).toList(),
        playbook.getCreatedAt(),
        playbook.getUpdatedAt()
    );
  }

  public PlaybookDtos.PlaybookPlaceDto playbookPlace(PlaybookPlace playbookPlace) {
    return new PlaybookDtos.PlaybookPlaceDto(
        playbookPlace.getId(),
        place(playbookPlace.getPlace()),
        playbookPlace.getPosition(),
        playbookPlace.getNotes(),
        playbookPlace.getCreatedAt()
    );
  }

  public ReviewDtos.ReviewDto review(Review review) {
    return new ReviewDtos.ReviewDto(
        review.getId(),
        review.getPlace().getId(),
        review.getUser().getId(),
        review.getUser().getDisplayName(),
        review.getRating(),
        review.getComment(),
        review.getCreatedAt(),
        review.getUpdatedAt()
    );
  }

  public TrendingPlaceDto trendingPlace(TrendingPlace trendingPlace) {
    return new TrendingPlaceDto(
        trendingPlace.getId(),
        trendingPlace.getWeekStart(),
        place(trendingPlace.getPlace()),
        trendingPlace.getSearchCount(),
        trendingPlace.getSaves(),
        trendingPlace.getOutingUsage(),
        trendingPlace.getReviews(),
        trendingPlace.getTrendScore(),
        trendingPlace.getCalculatedAt()
    );
  }
}
