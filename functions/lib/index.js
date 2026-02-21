"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoinBalance = exports.spendCoins = exports.addRewardCoin = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
(0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const DAILY_REWARD_LIMIT = 3;
const COINS_PER_AD = 1;
/** Returns today's date in UTC as YYYY-MM-DD */
function getServerDate() {
    return new Date().toISOString().split("T")[0];
}
/**
 * addRewardCoin – Callable function.
 * Called after the user watches a rewarded ad.
 * Uses a Firestore transaction to safely increment the coin balance
 * and enforce the daily reward limit based on server time.
 */
exports.addRewardCoin = (0, https_1.onCall)(async (request) => {
    // 1. Auth check
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be signed in.");
    }
    const uid = request.auth.uid;
    const userRef = db.collection("users").doc(uid);
    const today = getServerDate();
    // 2. Atomic transaction
    return db.runTransaction(async (tx) => {
        var _a, _b;
        const snap = await tx.get(userRef);
        let coins = 0;
        let reward = { lastRewardDate: "", rewardCountToday: 0 };
        if (snap.exists) {
            const data = snap.data();
            coins = (_a = data.coins) !== null && _a !== void 0 ? _a : 0;
            reward = (_b = data.reward) !== null && _b !== void 0 ? _b : { lastRewardDate: "", rewardCountToday: 0 };
        }
        // Reset counter if it's a new day (server-side)
        if (reward.lastRewardDate !== today) {
            reward.lastRewardDate = today;
            reward.rewardCountToday = 0;
        }
        // Enforce daily limit
        if (reward.rewardCountToday >= DAILY_REWARD_LIMIT) {
            throw new https_1.HttpsError("resource-exhausted", `Daily reward limit (${DAILY_REWARD_LIMIT}) reached. Try again tomorrow.`);
        }
        // Credit coins
        reward.rewardCountToday += 1;
        const newCoins = coins + COINS_PER_AD;
        tx.set(userRef, {
            coins: newCoins,
            reward,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
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
exports.spendCoins = (0, https_1.onCall)(async (request) => {
    var _a;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be signed in.");
    }
    const uid = request.auth.uid;
    const amount = (_a = request.data) === null || _a === void 0 ? void 0 : _a.amount;
    if (typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
        throw new https_1.HttpsError("invalid-argument", "amount must be a positive integer.");
    }
    const userRef = db.collection("users").doc(uid);
    return db.runTransaction(async (tx) => {
        var _a;
        const snap = await tx.get(userRef);
        if (!snap.exists) {
            throw new https_1.HttpsError("not-found", "User document not found.");
        }
        const data = snap.data();
        const coins = (_a = data.coins) !== null && _a !== void 0 ? _a : 0;
        if (coins < amount) {
            throw new https_1.HttpsError("failed-precondition", `Not enough coins. Have ${coins}, need ${amount}.`);
        }
        const newCoins = coins - amount;
        tx.update(userRef, {
            coins: newCoins,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        return { coins: newCoins };
    });
});
/**
 * getCoinBalance – Callable function.
 * Returns the user's current coin balance and today's reward count.
 */
exports.getCoinBalance = (0, https_1.onCall)(async (request) => {
    var _a, _b;
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be signed in.");
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
    const data = snap.data();
    const reward = (_a = data.reward) !== null && _a !== void 0 ? _a : { lastRewardDate: "", rewardCountToday: 0 };
    // If it's a new day, the count resets
    const rewardCountToday = reward.lastRewardDate === today ? reward.rewardCountToday : 0;
    return {
        coins: (_b = data.coins) !== null && _b !== void 0 ? _b : 0,
        rewardCountToday,
        dailyLimit: DAILY_REWARD_LIMIT,
    };
});
//# sourceMappingURL=index.js.map