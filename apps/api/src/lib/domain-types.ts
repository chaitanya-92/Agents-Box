export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN"
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const SUBSCRIPTION_STATUS = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
  EXPIRED: "EXPIRED"
} as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const PAYMENT_STATUS = {
  CREATED: "CREATED",
  CAPTURED: "CAPTURED",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
