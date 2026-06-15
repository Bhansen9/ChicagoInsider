package com.chicagoinsider.entities;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class OutingPermissionConverter implements AttributeConverter<OutingPermission, String> {
  @Override
  public String convertToDatabaseColumn(OutingPermission attribute) {
    return attribute == null ? null : attribute.value();
  }

  @Override
  public OutingPermission convertToEntityAttribute(String dbData) {
    return dbData == null ? null : OutingPermission.fromValue(dbData);
  }
}
