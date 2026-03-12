import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const placeBet = mutation({
  args: {
    token: v.string(),
    marketId: v.id("markets"),
    side: v.string(), // "yes" or "no"
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.side !== "yes" && args.side !== "no") {
      throw new Error("Side must be 'yes' or 'no'");
    }
    if (args.amount < 1) {
      throw new Error("Must bet at least 1 coin");
    }
    if (!Number.isInteger(args.amount)) {
      throw new Error("Bet amount must be a whole number");
    }

    // Auth check
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session) throw new Error("Not authenticated");

    const user = await ctx.db.get(session.userId);
    if (!user) throw new Error("User not found");

    // Check balance
    if (user.coins < args.amount) {
      throw new Error("Not enough coins! You have " + user.coins + " coins.");
    }

    // Check market is open
    const market = await ctx.db.get(args.marketId);
    if (!market) throw new Error("Market not found");
    if (market.resolved) throw new Error("Market is already resolved");
    if (market.endDate < Date.now()) throw new Error("Market has ended");

    // Calculate shares using CPMM (Constant Product Market Maker) simplified
    // More coins on one side = fewer shares you get (price goes up)
    const currentSideCoins = args.side === "yes" ? market.totalYesCoins : market.totalNoCoins;
    const otherSideCoins = args.side === "yes" ? market.totalNoCoins : market.totalYesCoins;

    // Simple share calculation: shares decrease as more money is on your side
    // Base: 1 coin = 1 share when 50/50
    // Premium: price increases with more bets on your side
    let shares;
    const totalCoins = currentSideCoins + otherSideCoins;
    if (totalCoins === 0) {
      shares = args.amount; // First bet: 1:1
    } else {
      // Price = proportion of coins on your side
      const price = Math.max(0.05, Math.min(0.95, (currentSideCoins + args.amount / 2) / (totalCoins + args.amount)));
      shares = Math.round(args.amount / price);
    }

    const now = Date.now();

    // Deduct coins from user
    await ctx.db.patch(user._id, {
      coins: user.coins - args.amount,
    });

    // Update market totals
    if (args.side === "yes") {
      await ctx.db.patch(args.marketId, {
        totalYesShares: market.totalYesShares + shares,
        totalYesCoins: market.totalYesCoins + args.amount,
      });
    } else {
      await ctx.db.patch(args.marketId, {
        totalNoShares: market.totalNoShares + shares,
        totalNoCoins: market.totalNoCoins + args.amount,
      });
    }

    // Record bet
    await ctx.db.insert("bets", {
      userId: user._id,
      marketId: args.marketId,
      side: args.side,
      amount: args.amount,
      shares,
      timestamp: now,
    });

    // Record transaction
    await ctx.db.insert("transactions", {
      userId: user._id,
      type: "bet",
      amount: -args.amount,
      description: `Bet ${args.amount} coins ${args.side.toUpperCase()} on "${market.title}"`,
      timestamp: now,
    });

    return {
      shares,
      newBalance: user.coins - args.amount,
    };
  },
});

export const getUserBets = query({
  args: {
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.token) return [];

    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session) return [];

    const bets = await ctx.db
      .query("bets")
      .withIndex("by_user", (q) => q.eq("userId", session.userId))
      .collect();

    // Enrich with market data
    const enriched = await Promise.all(
      bets.map(async (bet) => {
        const market = await ctx.db.get(bet.marketId);
        return {
          ...bet,
          marketTitle: market?.title || "Unknown Market",
          marketResolved: market?.resolved || false,
          marketOutcome: market?.outcome,
          marketEmoji: market?.imageEmoji || "🎯",
        };
      })
    );

    // Sort newest first
    enriched.sort((a, b) => b.timestamp - a.timestamp);

    return enriched;
  },
});
