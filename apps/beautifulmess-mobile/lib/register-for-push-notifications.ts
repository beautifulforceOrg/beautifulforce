import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Test-mode only: this fetches an Expo push token (works from Expo Go and
// any development build, no APNs/FCM enrollment needed) and hands it to
// the caller to register via api-client's registerPushToken(). Production
// push (a real client's standalone app, its own APNs key/FCM project) is
// an explicit follow-up in the mobile plan, not built here.
//
// `expo-notifications` is imported dynamically, not statically, because
// merely loading that module now throws in Expo Go on SDK 53+ (remote-
// notification support was removed from Expo Go itself) -- a static
// top-level import would crash the whole app before this function's own
// try/catch (in the caller) ever gets a chance to run.
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push tokens aren't issued to simulators/emulators.
    return null;
  }

  const Notifications = await import("expo-notifications");

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return data;
}
