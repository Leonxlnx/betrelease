import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Seed market data for AI model predictions
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
      {
        title: "GPT-5 released before July 2026?",
        description: "Will OpenAI release GPT-5 (not GPT-4.5 or GPT-4o updates, but a full GPT-5 model) before July 1, 2026?",
        category: "OpenAI",
        endDate: new Date("2026-07-01").getTime(),
        imageEmoji: "🧠",
      },
      {
        title: "Claude 4 released before June 2026?",
        description: "Will Anthropic release Claude 4 (a major version upgrade, not Claude 3.5 sonnet/haiku updates) before June 1, 2026?",
        category: "Anthropic",
        endDate: new Date("2026-06-01").getTime(),
        imageEmoji: "🤖",
      },
      {
        title: "Gemini 3.0 before September 2026?",
        description: "Will Google DeepMind release Gemini 3.0 (not 2.x updates) before September 1, 2026?",
        category: "Google",
        endDate: new Date("2026-09-01").getTime(),
        imageEmoji: "💎",
      },
      {
        title: "Llama 5 open-source release in 2026?",
        description: "Will Meta release Llama 5 (fully open-source/open-weight) during the calendar year 2026?",
        category: "Meta",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "🦙",
      },
      {
        title: "Grok 4 before August 2026?",
        description: "Will xAI release Grok 4 before August 1, 2026?",
        category: "xAI",
        endDate: new Date("2026-08-01").getTime(),
        imageEmoji: "⚡",
      },
      {
        title: "Mistral releases a GPT-4 competitor in 2026?",
        description: "Will Mistral release a model that scores above GPT-4 Turbo on MMLU benchmarks during 2026?",
        category: "Mistral",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "🌊",
      },
      {
        title: "OpenAI releases an AI Agent product before May 2026?",
        description: "Will OpenAI release a standalone AI agent product (not just ChatGPT plugins) before May 1, 2026?",
        category: "OpenAI",
        endDate: new Date("2026-05-01").getTime(),
        imageEmoji: "🕵️",
      },
      {
        title: "Any AI model surpasses 95% on ARC-AGI before 2027?",
        description: "Will any AI model achieve above 95% accuracy on the ARC-AGI benchmark before January 1, 2027?",
        category: "AGI",
        endDate: new Date("2027-01-01").getTime(),
        imageEmoji: "🏆",
      },
      {
        title: "Google releases Gemini Robotics model in 2026?",
        description: "Will Google DeepMind release a public Gemini model specifically designed for robotics during 2026?",
        category: "Google",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "🤖",
      },
      {
        title: "Apple releases its own LLM before October 2026?",
        description: "Will Apple release a standalone large language model (not on-device Apple Intelligence updates) before October 1, 2026?",
        category: "Apple",
        endDate: new Date("2026-10-01").getTime(),
        imageEmoji: "🍎",
      },
      {
        title: "Anthropic valued at $100B+ by end of 2026?",
        description: "Will Anthropic's valuation reach or exceed $100 billion by December 31, 2026?",
        category: "Anthropic",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "📈",
      },
      {
        title: "DeepSeek R2 released before July 2026?",
        description: "Will DeepSeek release their R2 reasoning model before July 1, 2026?",
        category: "DeepSeek",
        endDate: new Date("2026-07-01").getTime(),
        imageEmoji: "🔍",
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
