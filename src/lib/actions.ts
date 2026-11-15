"use server";

import { headers } from "next/headers";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { closeSession, denyUnless, openSession } from "@/lib/auth";
import {
  clearBannerImage,
  clearRegistrations,
  clearSiteLogo,
  createField,
  createNotification,
  createOwner,
  createStaff,
  deleteField,
  deleteNotification,
  deleteRegistration,
  deleteStaff,
  moveField,
  registerGuest,
  setBannerImage,
  setSiteLogo,
  updateBanner,
  updateField,
  updateHero,
  updateSocialLinks,
  verifyLogin,
} from "@/lib/event-store";
import { clientIp } from "@/lib/rate-limit";
import type { FormState, RegisterResult } from "@/lib/types";
import { isRole } from "@/lib/types";

export async function registerAction(_prev: RegisterResult, formData: FormData): Promise<RegisterResult> {
  const headerList = await headers();
  const raw: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("f_") && typeof value === "string") raw[key.slice(2)] = value;
  }
  return registerGuest(raw, clientIp(headerList));
}

export async function setupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const error = await createOwner(
    String(formData.get("name") ?? ""),
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
  );
  if (error) return { error };
  const staff = await verifyLogin(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (!staff) return { error: "The owner account was created, but sign-in failed. Try signing in." };
  await openSession(staff.id);
  redirect("/admin/registrations");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const staff = await verifyLogin(String(formData.get("email") ?? ""), String(formData.get("password") ?? ""));
  if (!staff) return { error: "That email and password do not match a staff account." };
  await openSession(staff.id);
  redirect("/admin/registrations");
}

export async function logoutAction() {
  await closeSession();
  redirect("/admin");
}

export async function updateHeroAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return { error: denied.error };
  const error = await updateHero({
    eventName: String(formData.get("eventName") ?? ""),
    eventDate: String(formData.get("eventDate") ?? ""),
    eventPlace: String(formData.get("eventPlace") ?? ""),
    eventStatus: String(formData.get("eventStatus") ?? ""),
    closesAtLocal: String(formData.get("closesAtLocal") ?? ""),
    clearTimer: formData.get("clearTimer") === "yes",
  });
  if (error) return { error };
  refresh();
  return { ok: "The event and timer are saved." };
}

export async function updateBannerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return { error: denied.error };
  const error = await updateBanner({
    eyebrow: String(formData.get("eyebrow") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    buttonLabel: String(formData.get("buttonLabel") ?? ""),
    buttonUrl: String(formData.get("buttonUrl") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
  });
  if (error) return { error };

  if (formData.get("removeImage") === "yes") await clearBannerImage();

  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const imageError = await setBannerImage(new Uint8Array(await file.arrayBuffer()), file.type);
    if (imageError) return { error: imageError };
  }

  refresh();
  return { ok: "The banner is updated." };
}

export async function createFieldAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return { error: denied.error };
  const error = await createField(readFieldInput(formData));
  if (error) return { error };
  refresh();
  return { ok: "Field added." };
}

export async function updateFieldAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return { error: denied.error };
  const error = await updateField(String(formData.get("id") ?? ""), readFieldInput(formData));
  if (error) return { error };
  refresh();
  return { ok: "Field saved." };
}

export async function deleteFieldAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return { error: denied.error };
  const error = await deleteField(String(formData.get("id") ?? ""));
  if (error) return { error };
  refresh();
  return { ok: "Field removed." };
}

export async function moveFieldAction(formData: FormData) {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return;
  const direction = formData.get("direction") === "up" ? -1 : formData.get("direction") === "down" ? 1 : 0;
  if (direction === 0) return;
  await moveField(String(formData.get("id") ?? ""), direction);
  refresh();
}

export async function deleteRegistrationAction(formData: FormData) {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return;
  await deleteRegistration(String(formData.get("id") ?? ""));
  refresh();
}

export async function clearRegistrationsAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await denyUnless(["owner"]);
  if (denied.error) return { error: denied.error };
  if (String(formData.get("confirm") ?? "") !== "CLEAR") {
    return { error: "Type CLEAR to delete every registration." };
  }
  await clearRegistrations();
  refresh();
  return { ok: "Every registration has been removed." };
}

export async function inviteStaffAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await denyUnless(["owner"]);
  if (denied.error) return { error: denied.error };
  const role = String(formData.get("role") ?? "");
  if (!isRole(role) || role === "owner") return { error: "Choose manager or assistant." };
  const error = await createStaff(
    String(formData.get("name") ?? ""),
    String(formData.get("email") ?? ""),
    String(formData.get("password") ?? ""),
    role,
  );
  if (error) return { error };
  refresh();
  return { ok: "Staff access saved. Share the password you set. It is not shown again." };
}

export async function removeStaffAction(formData: FormData) {
  const denied = await denyUnless(["owner"]);
  if (denied.error) return;
  await deleteStaff(String(formData.get("id") ?? ""));
  refresh();
}

export async function updateSiteBrandAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return { error: denied.error };

  if (formData.get("removeLogo") === "yes") await clearSiteLogo();
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const logoError = await setSiteLogo(new Uint8Array(await file.arrayBuffer()), file.type);
    if (logoError) return { error: logoError };
  }

  const socialError = await updateSocialLinks({
    discord: String(formData.get("discord") ?? ""),
    instagram: String(formData.get("instagram") ?? ""),
    youtube: String(formData.get("youtube") ?? ""),
    facebook: String(formData.get("facebook") ?? ""),
  });
  if (socialError) return { error: socialError };

  refresh();
  return { ok: "Logo and social links are saved." };
}

export async function createNotificationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return { error: denied.error };
  const error = await createNotification(String(formData.get("title") ?? ""), String(formData.get("body") ?? ""));
  if (error) return { error };
  refresh();
  return { ok: "Notification published." };
}

export async function deleteNotificationAction(formData: FormData) {
  const denied = await denyUnless(["owner", "manager"]);
  if (denied.error) return;
  await deleteNotification(String(formData.get("id") ?? ""));
  refresh();
}

function readFieldInput(formData: FormData) {
  return {
    label: String(formData.get("label") ?? ""),
    fieldType: String(formData.get("fieldType") ?? ""),
    required: formData.get("required") === "yes",
    placeholder: String(formData.get("placeholder") ?? ""),
    optionsText: String(formData.get("options") ?? ""),
  };
}
