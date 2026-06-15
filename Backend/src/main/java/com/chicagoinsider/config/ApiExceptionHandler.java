package com.chicagoinsider.config;

import com.chicagoinsider.dto.ErrorResponse;
import com.chicagoinsider.exceptions.ForbiddenOperationException;
import com.chicagoinsider.exceptions.ResourceNotFoundException;
import com.chicagoinsider.exceptions.UnauthenticatedException;
import jakarta.validation.ConstraintViolationException;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
  @ExceptionHandler(ResourceNotFoundException.class)
  ResponseEntity<ErrorResponse> notFound(ResourceNotFoundException exception) {
    return ResponseEntity.status(HttpStatus.NOT_FOUND)
        .body(ErrorResponse.of(404, "Not Found", exception.getMessage()));
  }

  @ExceptionHandler(ForbiddenOperationException.class)
  ResponseEntity<ErrorResponse> forbidden(ForbiddenOperationException exception) {
    return ResponseEntity.status(HttpStatus.FORBIDDEN)
        .body(ErrorResponse.of(403, "Forbidden", exception.getMessage()));
  }

  @ExceptionHandler(UnauthenticatedException.class)
  ResponseEntity<ErrorResponse> unauthenticated(UnauthenticatedException exception) {
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
        .body(ErrorResponse.of(401, "Unauthorized", exception.getMessage()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ErrorResponse> validation(MethodArgumentNotValidException exception) {
    List<String> details = exception.getBindingResult().getFieldErrors().stream()
        .map(error -> error.getField() + " " + error.getDefaultMessage())
        .toList();

    return ResponseEntity.badRequest().body(new ErrorResponse(
        Instant.now(),
        400,
        "Validation Error",
        "Request validation failed.",
        details
    ));
  }

  @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class})
  ResponseEntity<ErrorResponse> badRequest(RuntimeException exception) {
    return ResponseEntity.badRequest()
        .body(ErrorResponse.of(400, "Bad Request", exception.getMessage()));
  }
}
