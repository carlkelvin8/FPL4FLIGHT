/**
 * Push Notifications Module
 * 
 * Handles registration, token storage, and notification listeners.
 * Uses Expo Push Notifications service.
 */

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "@core/network";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Register for push notifications and store token in DB */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    if (__DEV__) console.log("[Push] Must use physical device for push notifications");
    return null;
  }

  // Check permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    if (__DEV__) console.log("[Push] Permission not granted");
    return null;
  }

  // Get Expo push token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "f22e6c2e-fe6e-4b23-af2e-0b8768dda46d", // From app.config.ts
    });
    const token = tokenData.data;
    if (__DEV__) console.log("[Push] Token:", token);

    // Store token in database
    await saveTokenToDatabase(token);

    // Set up Android notification channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#6366f1",
      });

      await Notifications.setNotificationChannelAsync("chat", {
        name: "Chat Messages",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: "#6366f1",
      });

      await Notifications.setNotificationChannelAsync("flights", {
        name: "Flight Alerts",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#ef4444",
      });
    }

    return token;
  } catch (error) {
    if (__DEV__) console.error("[Push] Error getting token:", error);
    return null;
  }
}

/** Save push token to Supabase for the current user */
async function saveTokenToDatabase(token: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("push_tokens").upsert(
      {
        user_id: user.id,
        token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  } catch (error) {
    if (__DEV__) console.error("[Push] Failed to save token:", error);
  }
}

/** Remove push token (on logout) */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("push_tokens").delete().eq("user_id", user.id);
  } catch { /* ignore */ }
}

/** Listen for incoming notifications */
export function addNotificationListener(
  onReceived: (notification: Notifications.Notification) => void,
  onResponse: (response: Notifications.NotificationResponse) => void,
): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener(onReceived);
  const responseSub = Notifications.addNotificationResponseReceivedListener(onResponse);

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

/** Schedule a local notification (e.g., flight reminder) */
export async function scheduleFlightReminder(
  flightNumber: string,
  departureTime: string,
  minutesBefore: number = 60,
): Promise<string | undefined> {
  const trigger = new Date(departureTime);
  trigger.setMinutes(trigger.getMinutes() - minutesBefore);

  if (trigger.getTime() <= Date.now()) return undefined; // Already passed

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: `✈️ Flight ${flightNumber} Departure`,
      body: `Your flight departs in ${minutesBefore} minutes. Time to prepare!`,
      sound: true,
      data: { type: "flight_reminder", flightNumber },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger },
  });

  return id;
}

/** Cancel a scheduled notification */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/** Get badge count */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/** Set badge count */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}
