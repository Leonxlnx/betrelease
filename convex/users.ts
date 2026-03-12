import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DAILY_COINS = 50;
const CLAIM_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in ms

export const claimDailyCoins = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Get session
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(session.userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const timeSinceLastClaim = now - user.lastCoinClaim;

    if (timeSinceLastClaim < CLAIM_COOLDOWN) {
      const remaining = CLAIM_COOLDOWN - timeSinceLastClaim;
      const hours = Math.floor(remaining / (60 * 60 * 1000));
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
      throw new Error(`Come back in ${hours}h ${minutes}m to claim again!`);
    }

    // Add coins
    await ctx.db.patch(user._id, {
      coins: user.coins + DAILY_COINS,
      lastCoinClaim: now,
    });

    // Record transaction
    await ctx.db.insert("transactions", {
      userId: user._id,
      type: "daily_claim",
      amount: DAILY_COINS,
      description: "Daily coin claim 🪙",
      timestamp: now,
    });

    return { newBalance: user.coins + DAILY_COINS };
  },
});

export const getProfile = query({
  args: {
    token: v.optional(v.string()),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let targetUserId = args.userId;

    if (!targetUserId && args.token) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.token))
        .first();
      if (session) targetUserId = session.userId;
    }

    if (!targetUserId) return null;

    const user = await ctx.db.get(targetUserId);
    if (!user) return null;

    // Get user's bet count
    const bets = await ctx.db
      .query("bets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    // Get recent transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      coins: user.coins,
      lastCoinClaim: user.lastCoinClaim,
      createdAt: user.createdAt,
      totalBets: bets.length,
      transactions,
    };
  },
});

export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();

    // Sort by coins descending
    const sorted = users
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 50)
      .map((u, i) => ({
        rank: i + 1,
        _id: u._id,
        username: u.username,
        displayName: u.displayName,
        coins: u.coins,
      }));

    return sorted;
  },
});
