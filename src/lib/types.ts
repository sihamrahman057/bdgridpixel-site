export const ROLES = ["owner", "manager", "assistant"] as const;
export type Role = (typeof ROLES)[number];

export const FIELD_TYPES = [
  "text",
  "textarea",
  "phone",
  "email",
  "select",
  "boolean",
] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  phone: "Phone number",
  email: "Email",
  select: "Dropdown",
  boolean: "Yes or no",
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type EventSettings = {
  eventName: string;
  eventDate: string;
  eventPlace: string;
  eventStatus: string;
  bannerEyebrow: string;
  bannerTitle: string;
  bannerBody: string;
  bannerButtonLabel: string;
  bannerButtonUrl: string;
  bannerImageUrl: string;
  hasBannerImage: boolean;
  updatedAt: string;
};

export type FormField = {
  id: string;
  label: string;
  fieldType: FieldType;
  required: boolean;
  placeholder: string;
  options: string[];
  position: number;
};

export type Registration = {
  id: string;
  answers: Record<string, string>;
  createdAt: string;
};

export type RegisterResult =
  | { ok: true; name: string }
  | { ok: false; message: string; fieldErrors: Record<string, string> };

export type FormState = {
  error?: string;
  ok?: string;
};

export function isRole(value: string): value is Role {
  return ROLES.includes(value as Role);
}

export function isFieldType(value: string): value is FieldType {
  return FIELD_TYPES.includes(value as FieldType);
}

export function canEditContent(role: Role) {
  return role === "owner" || role === "manager";
}

export function canDeleteRegistration(role: Role) {
  return role === "owner" || role === "manager";
}

export function canClearRegistrations(role: Role) {
  return role === "owner";
}

export function canManageStaff(role: Role) {
  return role === "owner";
}
