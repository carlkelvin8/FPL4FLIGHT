/**
 * Analytics Module
 * 
 * Lightweight event tracking. In production, swap the `trackEvent` implementation
 * with Mixpanel, Amplitude, or any analytics provider.
 * 
 * For now, logs events locally and to Supabase for basic usage tracking.
 */

import { supabase } from "@core/network";

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: number;
}

const eventQueue: AnalyticsEvent[] = [];
let userId: string | null = null;

/** Set the current user for analytics */
export function identifyUser(id: string): void {
  userId = id;
}

/** Track an event */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  const event: AnalyticsEvent = {
    name,
    properties: { ...properties, userId },
    timestamp: Date.now(),
  };
  eventQueue.push(event);

  // Log in dev
  if (__DEV__) {
    console.log(`[Analytics] ${name}`, properties ?? "");
  }

  // Flush periodically
  if (eventQueue.length >= 10) {
    flushEvents();
  }
}

/** Flush events to backend */
async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue.length = 0;

  try {
    // Store analytics events in Supabase (fire-and-forget, non-blocking)
    await supabase.from("analytics_events").insert(
      events.map((e) => ({
        event_name: e.name,
        properties: e.properties ?? {},
        user_id: userId,
        created_at: new Date(e.timestamp).toISOString(),
      })),
    );
  } catch {
    // Re-queue on failure — will try again on next flush
    eventQueue.push(...events);
  }
}

/** Common tracked events */
export const Events = {
  // Auth
  SIGN_IN: "sign_in",
  SIGN_UP: "sign_up",
  SIGN_OUT: "sign_out",

  // Forms
  FORM_CREATED: "form_created",
  FORM_SUBMITTED: "form_submitted",
  FORM_EXPORTED_PDF: "form_exported_pdf",
  FORM_EMAILED: "form_emailed",

  // Flights
  FLIGHT_CREATED: "flight_created",
  FLIGHT_DELETED: "flight_deleted",

  // Aircraft
  AIRCRAFT_ADDED: "aircraft_added",

  // Chat
  MESSAGE_SENT: "message_sent",
  CHANNEL_CREATED: "channel_created",
  REACTION_ADDED: "reaction_added",
  IMAGE_SHARED: "image_shared",
  LOCATION_SHARED: "location_shared",

  // Tools
  E6B_CALCULATED: "e6b_calculated",
  WB_CALCULATED: "wb_calculated",
  NOTAM_SEARCHED: "notam_searched",
  LOGBOOK_ENTRY_ADDED: "logbook_entry_added",

  // Navigation
  SCREEN_VIEW: "screen_view",
  ONBOARDING_COMPLETED: "onboarding_completed",
} as const;
