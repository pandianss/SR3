// Push notification setup via Capacitor PushNotifications.
// Falls back gracefully in web/dev environment.
//
// Flow:
//   1. requestPermission()      — called after onboarding complete
//   2. getFCMToken()             — store token in Firestore for server-side sends
//   3. scheduleDailyReminder()   — local notification at 8am for due cards
//   4. Server uses FCM tokens to send "X cards due today" notifications

import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

let PushPlugin = null;
let LocalPlugin = null;

async function getPushPlugin() {
  if (PushPlugin) return PushPlugin;
  try {
    // eslint-disable-next-line no-new-func
    const mod = await new Function('return import("@capacitor/push-notifications")')();
    PushPlugin = mod.PushNotifications;
    return PushPlugin;
  } catch {
    return null;
  }
}

async function getLocalPlugin() {
  if (LocalPlugin) return LocalPlugin;
  try {
    // eslint-disable-next-line no-new-func
    const mod = await new Function('return import("@capacitor/local-notifications")')();
    LocalPlugin = mod.LocalNotifications;
    return LocalPlugin;
  } catch {
    return null;
  }
}

/**
 * Request push notification permission and register with FCM.
 * Call once after onboarding is complete.
 * @param {string} uid - Firebase UID to store the token against
 */
export async function requestPushPermission(uid) {
  const Push = await getPushPlugin();
  if (!Push) return false; // not in Capacitor

  const { receive } = await Push.checkPermissions();
  let status = receive;

  if (status === "prompt" || status === "prompt-with-rationale") {
    const result = await Push.requestPermissions();
    status = result.receive;
  }

  if (status !== "granted") return false;

  await Push.register();

  // Capture the FCM token and save to Firestore
  Push.addListener("registration", async ({ value: token }) => {
    if (!uid || !db) return;
    try {
      await setDoc(
        doc(db, "users", uid, "fcmTokens", token.slice(-20)), // use last 20 chars as doc ID
        { token, registeredAt: serverTimestamp(), platform: "android" },
        { merge: true }
      );
    } catch (err) {
      console.warn("[Push] Failed to save FCM token:", err.message);
    }
  });

  Push.addListener("registrationError", (err) => {
    console.error("[Push] Registration error:", err);
  });

  // Handle foreground notification tap
  Push.addListener("pushNotificationActionPerformed", (action) => {
    const tab = action.notification.data?.tab;
    if (tab && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("caiib:navigate", { detail: { tab } }));
    }
  });

  return true;
}

/**
 * Schedule a daily local notification at 8:00 AM reminding the user
 * of cards due for revision. Uses Capacitor LocalNotifications.
 * @param {number} dueCount - number of cards currently due
 */
export async function scheduleDailyReminder(dueCount = 0) {
  const Local = await getLocalPlugin();
  if (!Local) return;

  const { display } = await Local.checkPermissions();
  if (display !== "granted") {
    const res = await Local.requestPermissions();
    if (res.display !== "granted") return;
  }

  // Cancel any existing daily reminder before rescheduling
  await Local.cancel({ notifications: [{ id: 1001 }] }).catch(() => {});

  const now  = new Date();
  const next = new Date(now);
  next.setHours(8, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1); // push to tomorrow if past 8am

  const body = dueCount > 0
    ? `${dueCount} card${dueCount > 1 ? "s" : ""} are due for revision today. Keep your streak alive!`
    : "Time for your daily CAIIB revision session. Stay consistent!";

  await Local.schedule({
    notifications: [{
      id:       1001,
      title:    "📚 CAIIB Prep — Review Time",
      body,
      schedule: { at: next, repeats: true, every: "day" },
      sound:    "default",
      extra:    { tab: "revision" },
    }],
  });
}

/**
 * Cancel all scheduled local notifications (e.g. if user unsubscribes).
 */
export async function cancelAllReminders() {
  const Local = await getLocalPlugin();
  if (!Local) return;
  const { notifications } = await Local.getPending();
  if (notifications.length) {
    await Local.cancel({ notifications: notifications.map(n => ({ id: n.id })) });
  }
}
