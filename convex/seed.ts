import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Clear all existing markets and bets
export const clearAll = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session) throw new Error("Not authenticated");

    // Delete all bets
    const bets = await ctx.db.query("bets").collect();
    for (const bet of bets) {
      await ctx.db.delete(bet._id);
    }

    // Delete all markets
    const markets = await ctx.db.query("markets").collect();
    for (const market of markets) {
      await ctx.db.delete(market._id);
    }

    // Delete all transactions
    const transactions = await ctx.db.query("transactions").collect();
    for (const tx of transactions) {
      await ctx.db.delete(tx._id);
    }

    return { deleted: { bets: bets.length, markets: markets.length, transactions: transactions.length } };
  },
});

// Seed market data — organized by model, not company
export const seedMarkets = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session) throw new Error("Not authenticated");

    const now = Date.now();
    const userId = session.userId;

    const markets = [
      // ─── Gemini ───
      {
        title: "Gemini 3.5 released by Q3 2026?",
        description:
          "Will Google DeepMind release Gemini 3.5 (focused on efficiency) before the end of Q3 2026?",
        category: "Gemini",
        endDate: new Date("2026-09-30").getTime(),
        imageEmoji: "GM",
      },
      {
        title: "Gemini 4.0 released by end of 2026?",
        description:
          "Will Google DeepMind release Gemini 4.0 — the next major architecture leap — before December 31, 2026?",
        category: "Gemini",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "GM",
      },
      {
        title: "Gemini 4 Ultra ships by Q1 2027?",
        description:
          "Will Google DeepMind release Gemini 4 Ultra — the new heavyweight model — before March 31, 2027?",
        category: "Gemini",
        endDate: new Date("2027-03-31").getTime(),
        imageEmoji: "GM",
      },

      // ─── GPT ───
      {
        title: "GPT-5.5 released by Summer 2026?",
        description:
          "Will OpenAI release GPT-5.5 — an intermediate update focused on error reduction — before August 31, 2026?",
        category: "GPT",
        endDate: new Date("2026-08-31").getTime(),
        imageEmoji: "GP",
      },
      {
        title: "Sora 2.0 / full video integration by Fall 2026?",
        description:
          "Will OpenAI ship Sora 2.0 or integrate full video multimodality into the core GPT model before November 30, 2026?",
        category: "GPT",
        endDate: new Date("2026-11-30").getTime(),
        imageEmoji: "GP",
      },
      {
        title: "GPT-6 released by Spring 2027?",
        description:
          "Will OpenAI release GPT-6 — the next generation focused on autonomous agents — before May 31, 2027?",
        category: "GPT",
        endDate: new Date("2027-05-31").getTime(),
        imageEmoji: "GP",
      },

      // ─── Claude ───
      {
        title: "Claude 4.7 released by Q3 2026?",
        description:
          "Will Anthropic release Claude 4.7 — fine-tuned for coding — before September 30, 2026?",
        category: "Claude",
        endDate: new Date("2026-09-30").getTime(),
        imageEmoji: "CL",
      },
      {
        title: "Claude 5 Sonnet released by end of 2026?",
        description:
          "Will Anthropic release Claude 5 Sonnet — the fast, everyday model of the next generation — before December 31, 2026?",
        category: "Claude",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "CL",
      },
      {
        title: "Claude 5 Opus ships by Q1 2027?",
        description:
          "Will Anthropic release Claude 5 Opus — the maximum reasoning model — before March 31, 2027?",
        category: "Claude",
        endDate: new Date("2027-03-31").getTime(),
        imageEmoji: "CL",
      },

      // ─── Llama ───
      {
        title: "Llama 4.1 released by Summer 2026?",
        description:
          "Will Meta release Llama 4.1 as an open-source update before August 31, 2026?",
        category: "Llama",
        endDate: new Date("2026-08-31").getTime(),
        imageEmoji: "LL",
      },
      {
        title: "Llama 4 Vision released by Fall 2026?",
        description:
          "Will Meta release Llama 4 Vision with extended image/video capabilities before November 30, 2026?",
        category: "Llama",
        endDate: new Date("2026-11-30").getTime(),
        imageEmoji: "LL",
      },
      {
        title: "Llama 5 released by mid 2027?",
        description:
          "Will Meta release Llama 5 — the next major base model — before June 30, 2027?",
        category: "Llama",
        endDate: new Date("2027-06-30").getTime(),
        imageEmoji: "LL",
      },

      // ─── Grok ───
      {
        title: "Grok 4.5 released by Q3 2026?",
        description:
          "Will xAI release Grok 4.5 before September 30, 2026?",
        category: "Grok",
        endDate: new Date("2026-09-30").getTime(),
        imageEmoji: "GK",
      },
      {
        title: "Grok 5 released by early 2027?",
        description:
          "Will xAI release Grok 5 before March 31, 2027?",
        category: "Grok",
        endDate: new Date("2027-03-31").getTime(),
        imageEmoji: "GK",
      },

      // ─── DeepSeek ───
      {
        title: "DeepSeek Coder V3 released by mid 2026?",
        description:
          "Will DeepSeek release Coder V3 before June 30, 2026?",
        category: "DeepSeek",
        endDate: new Date("2026-06-30").getTime(),
        imageEmoji: "DS",
      },
      {
        title: "DeepSeek V4 released by early 2027?",
        description:
          "Will DeepSeek release V4 before March 31, 2027?",
        category: "DeepSeek",
        endDate: new Date("2027-03-31").getTime(),
        imageEmoji: "DS",
      },
    ];

    const ids = [];
    for (const market of markets) {
      const id = await ctx.db.insert("markets", {
        ...market,
        resolved: false,
        totalYesShares: 0,
        totalNoShares: 0,
        totalYesCoins: 0,
        totalNoCoins: 0,
        createdBy: userId,
        createdAt: now,
      });
      ids.push(id);
    }

    return { created: ids.length };
  },
});
