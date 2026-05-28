// WARNING (prototype only): sessionStorage is readable by every script on this page.
// Before any shared or production deployment, proxy all AI requests through a backend
// so the API key never reaches the browser at all.
const STORAGE_KEY = "gemini_api_key";

export function getStoredApiKey() {
  return sessionStorage.getItem(STORAGE_KEY) || "";
}

export function setStoredApiKey(key) {
  if (key) {
    sessionStorage.setItem(STORAGE_KEY, key);
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
