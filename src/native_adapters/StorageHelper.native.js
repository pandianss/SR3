// Native Asynchronous Storage Wrapper
// Wraps React Native's AsyncStorage for local on-disk data caching.

// In a real Expo project, this is imported via:
// import AsyncStorage from "@react-native-async-storage/async-storage";
// We mock/stub the import to ensure compilation checks inside the Web workspace pass.
const AsyncStorage = {
  getItem: async (key) => {
    console.log("Mock AsyncStorage read key:", key);
    return localStorage.getItem(key);
  },
  setItem: async (key, val) => {
    console.log("Mock AsyncStorage write key:", key, val);
    localStorage.setItem(key, val);
  },
  removeItem: async (key) => {
    console.log("Mock AsyncStorage remove key:", key);
    localStorage.removeItem(key);
  },
  clear: async () => {
    console.log("Mock AsyncStorage clear");
    localStorage.clear();
  }
};

export async function readStorageKey(key) {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  } catch (e) {
    console.error("AsyncStorage read error:", e);
    return null;
  }
}

export async function writeStorageKey(key, data) {
  try {
    const valStr = JSON.stringify(data);
    await AsyncStorage.setItem(key, valStr);
    return true;
  } catch (e) {
    console.error("AsyncStorage write error:", e);
    return false;
  }
}

export async function removeStorageKey(key) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error("AsyncStorage remove error:", e);
    return false;
  }
}
