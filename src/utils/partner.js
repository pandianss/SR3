// Study Partner Engine — pairing, nudges, leaderboard.
// All Firestore paths follow the existing users/{uid}/{collection}/data pattern.

import { db } from "./firebase";
import {
  doc, getDoc, setDoc, collection,
  addDoc, getDocs, deleteDoc, serverTimestamp
} from "firebase/firestore";

async function resolvePartnerCode(code) {
  if (!db || !code) return null;
  try {
    const snap = await getDoc(doc(db, "referralCodes", code.toUpperCase().trim()));
    return snap.exists() ? snap.data() : null;
  } catch {
    return null;
  }
}

async function fetchPartnerProfile(partnerUid) {
  if (!db || !partnerUid) return null;
  try {
    const snap = await getDoc(doc(db, "users", partnerUid, "profile", "data"));
    if (!snap.exists()) return null;
    const d = snap.data();
    return {
      uid: partnerUid,
      name: d.name || "Study Partner",
      role: d.role || "",
      elective: d.elective || "",
      streak: d.streak || 0,
      xp: d.xp || 0,
      level: d.level || 1,
      careerTitle: d.careerTitle || "Novice",
    };
  } catch {
    return null;
  }
}

export async function getStudyPartners(userProfile) {
  if (!userProfile?.partnerIds?.length) return [];
  const profiles = await Promise.all(userProfile.partnerIds.map(fetchPartnerProfile));
  return profiles.filter(Boolean);
}

/**
 * Pair the current user with a study buddy by their referral/study code.
 * Returns { ok: true, partnerProfile, newPartnerIds } on success,
 * or { error: "message" } on failure.
 */
export async function pairWithPartner(uid, partnerCode, currentProfile) {
  if (!db) return { error: "Offline — sign in to pair with study partners." };
  const codeData = await resolvePartnerCode(partnerCode);
  if (!codeData) return { error: "No account found for that code." };
  if (codeData.ownerUid === uid) return { error: "That's your own code." };

  const existingIds = currentProfile.partnerIds || [];
  if (existingIds.includes(codeData.ownerUid)) return { error: "Already linked." };

  const partnerProfile = await fetchPartnerProfile(codeData.ownerUid);
  const newPartnerIds = [...existingIds, codeData.ownerUid];

  await setDoc(
    doc(db, "users", uid, "profile", "data"),
    { partnerIds: newPartnerIds },
    { merge: true }
  );

  return { ok: true, partnerProfile, newPartnerIds };
}

/**
 * Write a nudge document into the partner's nudges subcollection.
 * The recipient reads and clears unread nudges on next app open.
 */
export async function sendNudge(fromUid, partnerId) {
  if (!db || !fromUid || !partnerId) return;
  try {
    await addDoc(collection(db, "users", partnerId, "nudges"), {
      fromUid,
      sentAt: serverTimestamp(),
      read: false,
    });
  } catch (e) {
    console.warn("[partner] nudge write failed:", e.message);
  }
}

/**
 * Fetch all unread nudges for the current user, then mark them read.
 * Returns an array of nudge objects (may be empty).
 */
export async function checkAndClearNudges(uid) {
  if (!db || !uid) return [];
  try {
    const snap = await getDocs(collection(db, "users", uid, "nudges"));
    const unread = snap.docs.filter(d => !d.data().read);
    // Delete all fetched docs (read + unread) to keep the subcollection bounded.
    snap.docs.forEach(d => deleteDoc(d.ref).catch(() => {}));
    return unread.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

/**
 * Returns all paired partners + the current user, sorted by XP descending.
 */
export async function getWeeklyLeaderboard(userProfile) {
  const partners = await getStudyPartners(userProfile);
  const self = {
    uid: "self",
    name: `${userProfile.name || "You"} (You)`,
    xp: userProfile.xp || 0,
    careerTitle: userProfile.careerTitle || "Novice",
    streak: userProfile.streak || 0,
    isSelf: true,
  };
  return [...partners.map(p => ({ ...p, isSelf: false })), self].sort((a, b) => b.xp - a.xp);
}
