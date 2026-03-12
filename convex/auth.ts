import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Simple hash function (we'll use this since bcryptjs needs Node.js runtime)
// For a fun game with fake currency, this is perfectly fine
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "betrelease_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateToken() {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export const signup = mutation({
  args: {
    username: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    // Check username length
    if (args.username.length < 3 || args.username.length > 20) {
      throw new Error("Username must be between 3 and 20 characters");
    }
    if (args.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Check if username already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .first();

    if (existing) {
      throw new Error("Username already taken");
    }

    const passwordHash = await hashPassword(args.password);
    const now = Date.now();

    // Create user with 1000 starting coins
    const userId = await ctx.db.insert("users", {
      username: args.username.toLowerCase(),
      passwordHash,
      displayName: args.displayName,
      coins: 1000,
      lastCoinClaim: 0,
      createdAt: now,
    });

    // Record signup bonus transaction
    await ctx.db.insert("transactions", {
      userId,
      type: "signup_bonus",
      amount: 1000,
      description: "Welcome bonus",
      timestamp: now,
    });

    // Create session
    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId,
      token,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return { token, userId };
  },
});

export const login = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username.toLowerCase()))
      .first();

    if (!user) {
      throw new Error("Invalid username or password");
    }

    const passwordHash = await hashPassword(args.password);
    if (user.passwordHash !== passwordHash) {
      throw new Error("Invalid username or password");
    }

    // Create session
    const token = generateToken();
    const now = Date.now();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      expiresAt: now + 30 * 24 * 60 * 60 * 1000,
    });

    return { token, userId: user._id };
  },
});

export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }
  },
});

export const deleteAccount = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Not authenticated");

    const userId = session.userId;

    // Delete all user sessions
    const sessions = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();
    for (const s of sessions) {
      await ctx.db.delete(s._id);
    }

    // Delete all user bets
    const bets = await ctx.db
      .query("bets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const bet of bets) {
      await ctx.db.delete(bet._id);
    }

    // Delete all user transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const tx of transactions) {
      await ctx.db.delete(tx._id);
    }

    // Delete user
    await ctx.db.delete(userId);

    return { deleted: true };
  },
});

export const getMe = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return null;

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || session.expiresAt < Date.now()) {
      return null;
    }

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    return {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      coins: user.coins,
      lastCoinClaim: user.lastCoinClaim,
      createdAt: user.createdAt,
    };
  },
});

