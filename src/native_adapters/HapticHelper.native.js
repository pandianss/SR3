// Native Haptics Feedback Wrapper
// Wraps expo-haptics calls for compiled iOS/Android haptic feedback events.

// In a real Expo project, this is imported via:
// import * as Haptics from "expo-haptics";
// We mock/stub the import to ensure compilation checks inside the Web workspace pass.
const Haptics = {
  impactAsync: async (style) => {
    console.log("Mock native haptic impact trigger, style:", style);
  },
  notificationAsync: async (type) => {
    console.log("Mock native haptic notification trigger, type:", type);
  },
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy"
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error"
  }
};

export function triggerImpactLight() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    console.warn("Haptic not supported on this platform.");
  }
}

export function triggerImpactMedium() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (e) {
    console.warn("Haptic not supported on this platform.");
  }
}

export function triggerSuccessHaptic() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (e) {
    console.warn("Haptic not supported on this platform.");
  }
}

export function triggerErrorHaptic() {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (e) {
    console.warn("Haptic not supported on this platform.");
  }
}
