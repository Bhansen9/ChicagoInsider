package com.chicagoinsider.entities;

import java.util.Arrays;

public enum OutingPermission {
  OWNER("owner", 4),
  WRITE("write", 3),
  SUGGEST("suggest", 2),
  READ("read", 1);

  private final String value;
  private final int rank;

  OutingPermission(String value, int rank) {
    this.value = value;
    this.rank = rank;
  }

  public String value() {
    return value;
  }

  public boolean atLeast(OutingPermission required) {
    return rank >= required.rank;
  }

  public static OutingPermission fromValue(String value) {
    return Arrays.stream(values())
        .filter(permission -> permission.value.equalsIgnoreCase(String.valueOf(value)))
        .findFirst()
        .orElseThrow(() -> new IllegalArgumentException("Unknown outing permission: " + value));
  }
}
