package com.chicagoinsider.services;

import com.chicagoinsider.dto.SearchPlacesRequest;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class GooglePlacesClient {
  private static final Map<String, String> CATEGORY_TYPES = Map.of(
      "food", "restaurant",
      "restaurant", "restaurant",
      "bar", "bar",
      "bars", "bar",
      "museum", "museum",
      "landmark", "tourist_attraction",
      "activity", "tourist_attraction"
  );

  private final RestClient restClient;
  private final ObjectMapper objectMapper;
  private final String apiKey;
  private final String textSearchUrl;
  private final String fieldMask;

  public GooglePlacesClient(
      RestClient.Builder restClientBuilder,
      ObjectMapper objectMapper,
      @Value("${google.places.api-key}") String apiKey,
      @Value("${google.places.text-search-url}") String textSearchUrl,
      @Value("${google.places.field-mask}") String fieldMask
  ) {
    this.restClient = restClientBuilder.build();
    this.objectMapper = objectMapper;
    this.apiKey = apiKey;
    this.textSearchUrl = textSearchUrl;
    this.fieldMask = fieldMask;
  }

  public List<GooglePlaceCandidate> search(SearchPlacesRequest request) {
    if (apiKey == null || apiKey.isBlank()) {
      return List.of();
    }

    JsonNode root = restClient.post()
        .uri(textSearchUrl)
        .contentType(MediaType.APPLICATION_JSON)
        .header("X-Goog-Api-Key", apiKey)
        .header("X-Goog-FieldMask", fieldMask)
        .body(searchBody(request))
        .retrieve()
        .body(JsonNode.class);

    if (root == null || !root.has("places")) {
      return List.of();
    }

    List<GooglePlaceCandidate> candidates = new ArrayList<>();
    for (JsonNode placeNode : root.path("places")) {
      String googlePlaceId = text(placeNode, "id");
      String name = placeNode.path("displayName").path("text").asText(null);
      if (googlePlaceId == null || name == null) {
        continue;
      }

      JsonNode location = placeNode.path("location");
      candidates.add(new GooglePlaceCandidate(
          googlePlaceId,
          name,
          text(placeNode, "formattedAddress"),
          inferCategory(placeNode),
          text(placeNode, "primaryType"),
          priceLevel(placeNode),
          location.has("latitude") ? BigDecimal.valueOf(location.path("latitude").asDouble()) : null,
          location.has("longitude") ? BigDecimal.valueOf(location.path("longitude").asDouble()) : null,
          text(placeNode, "websiteUri"),
          text(placeNode, "googleMapsUri"),
          photoReferences(placeNode),
          objectMapper.convertValue(placeNode, new TypeReference<Map<String, Object>>() {})
      ));
    }

    return candidates;
  }

  private Map<String, Object> searchBody(SearchPlacesRequest request) {
    Map<String, Object> body = new LinkedHashMap<>();
    body.put("textQuery", searchText(request));
    body.put("pageSize", request.resolvedLimit());
    body.put("regionCode", "US");
    body.put("languageCode", "en");

    String includedType = CATEGORY_TYPES.get(normalize(request.category()));
    if (includedType != null) {
      body.put("includedType", includedType);
    }

    if (request.latitude() != null && request.longitude() != null) {
      body.put("locationBias", Map.of(
          "circle", Map.of(
              "center", Map.of(
                  "latitude", request.latitude(),
                  "longitude", request.longitude()
              ),
              "radius", 12000.0
          )
      ));
    }

    return body;
  }

  private String searchText(SearchPlacesRequest request) {
    String query = request.query().trim();
    if (query.toLowerCase().contains("chicago")) {
      return query;
    }
    return query + " Chicago IL";
  }

  private List<String> photoReferences(JsonNode placeNode) {
    List<String> references = new ArrayList<>();
    for (JsonNode photo : placeNode.path("photos")) {
      String name = text(photo, "name");
      if (name != null) {
        references.add(name);
      }
    }
    return references;
  }

  private String inferCategory(JsonNode placeNode) {
    String primaryType = text(placeNode, "primaryType");
    String typeText = (primaryType + " " + placeNode.path("types")).toLowerCase();

    if (typeText.contains("restaurant") || typeText.contains("cafe") || typeText.contains("meal")) {
      return "Food";
    }
    if (typeText.contains("bar") || typeText.contains("night_club")) {
      return "Bar";
    }
    if (typeText.contains("museum") || typeText.contains("art_gallery")) {
      return "Museum";
    }
    if (typeText.contains("tourist_attraction") || typeText.contains("park")) {
      return "Activity";
    }
    return placeNode.path("primaryTypeDisplayName").path("text").asText("Activity");
  }

  private Integer priceLevel(JsonNode placeNode) {
    String value = text(placeNode, "priceLevel");
    if (value == null || value.isBlank() || value.equals("PRICE_LEVEL_UNSPECIFIED")) {
      return null;
    }

    return switch (value) {
      case "PRICE_LEVEL_FREE" -> 0;
      case "PRICE_LEVEL_INEXPENSIVE" -> 1;
      case "PRICE_LEVEL_MODERATE" -> 2;
      case "PRICE_LEVEL_EXPENSIVE" -> 3;
      case "PRICE_LEVEL_VERY_EXPENSIVE" -> 4;
      default -> {
        try {
          yield Integer.parseInt(value);
        } catch (NumberFormatException exception) {
          yield null;
        }
      }
    };
  }

  private String text(JsonNode node, String fieldName) {
    JsonNode value = node.get(fieldName);
    return value == null || value.isNull() ? null : value.asText();
  }

  private String normalize(String value) {
    return value == null ? "" : value.trim().toLowerCase();
  }
}
