import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listMarkets = query({
  args: {
    category: v.optional(v.string()),
    showResolved: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let markets;

    if (args.category) {
      markets = await ctx.db
        .query("markets")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      markets = await ctx.db.query("markets").collect();
    }

    // Filter resolved/unresolved
    if (!args.showResolved) {
      markets = markets.filter((m) => !m.resolved);
    }

    // Sort by end date (soonest first)
    markets.sort((a, b) => a.endDate - b.endDate);

    // Calculate probability for each market
    return markets.map((m) => {
      const totalCoins = m.totalYesCoins + m.totalNoCoins;
      const yesProb = totalCoins > 0 ? Math.round((m.totalYesCoins / totalCoins) * 100) : 50;
      return {
        ...m,
        yesProbability: yesProb,
        noProbability: 100 - yesProb,
        totalVolume: totalCoins,
      };
    });
  },
});

export const getMarket = query({
  args: {
    marketId: v.id("markets"),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const market = await ctx.db.get(args.marketId);
    if (!market) return null;

    const totalCoins = market.totalYesCoins + market.totalNoCoins;
    const yesProb = totalCoins > 0 ? Math.round((market.totalYesCoins / totalCoins) * 100) : 50;

    // Get all bets for this market
    const bets = await ctx.db
      .query("bets")
      .withIndex("by_market", (q) => q.eq("marketId", args.marketId))
      .collect();

    // Get creator info
    const creator = await ctx.db.get(market.createdBy);

    // Get current user's bets on this market
    let userBets: typeof bets = [];
    if (args.token) {
      const session = await ctx.db
        .query("sessions")
        .withIndex("by_token", (q) => q.eq("token", args.token!))
        .first();
      if (session) {
        userBets = bets.filter((b) => b.userId === session.userId);
      }
    }

    return {
      ...market,
      yesProbability: yesProb,
      noProbability: 100 - yesProb,
      totalVolume: totalCoins,
      totalBets: bets.length,
      creatorName: creator?.displayName || "Unknown",
      userBets,
    };
  },
});

export const createMarket = mutation({
  args: {
    token: v.string(),
    title: v.string(),
    description: v.string(),
    category: v.string(),
    endDate: v.number(),
    imageEmoji: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Not authenticated");

    const marketId = await ctx.db.insert("markets", {
      title: args.title,
      description: args.description,
      category: args.category,
      endDate: args.endDate,
      resolved: false,
      totalYesShares: 0,
      totalNoShares: 0,
      totalYesCoins: 0,
      totalNoCoins: 0,
      createdBy: session.userId,
      imageEmoji: args.imageEmoji,
      createdAt: Date.now(),
    });

    return marketId;
  },
});

export const resolveMarket = mutation({
  args: {
    token: v.string(),
    marketId: v.id("markets"),
    outcome: v.boolean(), // true = YES, false = NO
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session) throw new Error("Not authenticated");

    const market = await ctx.db.get(args.marketId);
    if (!market) throw new Error("Market not found");
    if (market.resolved) throw new Error("Market already resolved");

    // Only creator can resolve
    if (market.createdBy !== session.userId) {
      throw new Error("Only the market creator can resolve it");
    }

    // Resolve the market
    await ctx.db.patch(args.marketId, {
      resolved: true,
      outcome: args.outcome,
    });

    // Pay out winners
    const bets = await ctx.db
      .query("bets")
      .withIndex("by_market", (q) => q.eq("marketId", args.marketId))
      .collect();

    const winningSide = args.outcome ? "yes" : "no";
    const totalPool = market.totalYesCoins + market.totalNoCoins;
    const winningSideCoins = args.outcome ? market.totalYesCoins : market.totalNoCoins;

    for (const bet of bets) {
      if (bet.side === winningSide && winningSideCoins > 0) {
        // Calculate payout proportional to bet size
        const payout = Math.floor((bet.amount / winningSideCoins) * totalPool);
        const user = await ctx.db.get(bet.userId);
        if (user) {
          await ctx.db.patch(bet.userId, {
            coins: user.coins + payout,
          });
          await ctx.db.insert("transactions", {
            userId: bet.userId,
            type: "payout",
            amount: payout,
            description: `Won on "${market.title}"`,
            timestamp: Date.now(),
          });
        }
      }
    }

    return { resolved: true, outcome: args.outcome };
  },
});
