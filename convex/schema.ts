import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    passwordHash: v.string(),
    displayName: v.string(),
    coins: v.number(),
    lastCoinClaim: v.number(), // timestamp
    createdAt: v.number(),
  }).index("by_username", ["username"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  markets: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    endDate: v.number(),
    resolved: v.boolean(),
    outcome: v.optional(v.boolean()), // true = YES won, false = NO won
    totalYesShares: v.number(),
    totalNoShares: v.number(),
    totalYesCoins: v.number(),
    totalNoCoins: v.number(),
    createdBy: v.id("users"),
    imageEmoji: v.string(), // emoji icon for the market
    createdAt: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_resolved", ["resolved"]),

  bets: defineTable({
    userId: v.id("users"),
    marketId: v.id("markets"),
    side: v.string(), // "yes" or "no"
    amount: v.number(), // coins spent
    shares: v.number(), // shares received
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_market", ["marketId"])
    .index("by_user_market", ["userId", "marketId"]),

  transactions: defineTable({
    userId: v.id("users"),
    type: v.string(), // "signup_bonus", "daily_claim", "bet", "payout", "refund"
    amount: v.number(), // positive = gain, negative = spend
    description: v.string(),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),
});
