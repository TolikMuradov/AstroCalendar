import { onCall, HttpsError } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp();
const db = getFirestore();

const DAILY_REWARD_LIMIT = 3;
const COINS_PER_AD = 1;

/** Returns today's date in UTC as YYYY-MM-DD */
function getServerDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * addRewardCoin – Callable function.
 * Called after the user watches a rewarded ad.
 * Uses a Firestore transaction to safely increment the coin balance
 * and enforce the daily reward limit based on server time.
 */
export const addRewardCoin = onCall(async (request) => {
  // 1. Auth check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be signed in.");
  }

  const uid = request.auth.uid;
  const userRef = db.collection("users").doc(uid);
  const today = getServerDate();

  // 2. Atomic transaction
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);

    let coins = 0;
    let reward = { lastRewardDate: "", rewardCountToday: 0 };

    if (snap.exists) {
      const data = snap.data()!;
      coins = data.coins ?? 0;
      reward = data.reward ?? { lastRewardDate: "", rewardCountToday: 0 };
    }

    // Reset counter if it's a new day (server-side)
    if (reward.lastRewardDate !== today) {
      reward.lastRewardDate = today;
      reward.rewardCountToday = 0;
    }

    // Enforce daily limit
    if (reward.rewardCountToday >= DAILY_REWARD_LIMIT) {
      throw new HttpsError(
        "resource-exhausted",
        `Daily reward limit (${DAILY_REWARD_LIMIT}) reached. Try again tomorrow.`
      );
    }

    // Credit coins
    reward.rewardCountToday += 1;
    const newCoins = coins + COINS_PER_AD;

    tx.set(
      userRef,
      {
        coins: newCoins,
        reward,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      coins: newCoins,
      rewardCountToday: reward.rewardCountToday,
      dailyLimit: DAILY_REWARD_LIMIT,
    };
  });
});

/**
 * spendCoins – Callable function.
 * Deducts a specified amount of coins from the user's balance.
 * Validates that the user has enough coins.
 */
export const spendCoins = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be signed in.");
  }

  const uid = request.auth.uid;
  const amount = request.data?.amount;

  if (typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
    throw new HttpsError("invalid-argument", "amount must be a positive integer.");
  }

  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);

    if (!snap.exists) {
      throw new HttpsError("not-found", "User document not found.");
    }

    const data = snap.data()!;
    const coins: number = data.coins ?? 0;

    if (coins < amount) {
      throw new HttpsError(
        "failed-precondition",
        `Not enough coins. Have ${coins}, need ${amount}.`
      );
    }

    const newCoins = coins - amount;

    tx.update(userRef, {
      coins: newCoins,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { coins: newCoins };
  });
});

/**
 * getCoinBalance – Callable function.
 * Returns the user's current coin balance and today's reward count.
 */
export const getCoinBalance = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be signed in.");
  }

  const uid = request.auth.uid;
  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();
  const today = getServerDate();

  if (!snap.exists) {
    return {
      coins: 0,
      rewardCountToday: 0,
      dailyLimit: DAILY_REWARD_LIMIT,
    };
  }

  const data = snap.data()!;
  const reward = data.reward ?? { lastRewardDate: "", rewardCountToday: 0 };

  // If it's a new day, the count resets
  const rewardCountToday =
    reward.lastRewardDate === today ? reward.rewardCountToday : 0;

  return {
    coins: data.coins ?? 0,
    rewardCountToday,
    dailyLimit: DAILY_REWARD_LIMIT,
  };
});
