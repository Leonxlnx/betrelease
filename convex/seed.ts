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
      // ─── DeepSeek v4 Launch ───
      {
        title: "DeepSeek v4 drops this week?",
        description:
          "Will DeepSeek officially release or announce v4 during the current week of March 15-21, 2026?",
        category: "DeepSeek",
        endDate: new Date("2026-03-21").getTime(),
        imageEmoji: "DS",
      },
      {
        title: "DeepSeek v4 released in March?",
        description:
          "Will DeepSeek release v4 before the end of March 2026?",
        category: "DeepSeek",
        endDate: new Date("2026-03-31").getTime(),
        imageEmoji: "DS",
      },
      {
        title: "DeepSeek v4 released in Q2 2026?",
        description:
          "Will DeepSeek release v4 during Q2 (April-June) 2026?",
        category: "DeepSeek",
        endDate: new Date("2026-06-30").getTime(),
        imageEmoji: "DS",
      },
      {
        title: "DeepSeek v4 beats GPT-5 on MMLU?",
        description:
          "If both DeepSeek v4 and GPT-5 are released, will DeepSeek v4 score higher on the MMLU benchmark?",
        category: "DeepSeek",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "DS",
      },

      // ─── GPT-5 Launch ───
      {
        title: "GPT-5 released before May 2026?",
        description:
          "Will OpenAI release GPT-5 (a full new model, not GPT-4o/4.5 updates) before May 1, 2026?",
        category: "OpenAI",
        endDate: new Date("2026-05-01").getTime(),
        imageEmoji: "OA",
      },
      {
        title: "GPT-5 released before July 2026?",
        description:
          "Will OpenAI release GPT-5 before July 1, 2026?",
        category: "OpenAI",
        endDate: new Date("2026-07-01").getTime(),
        imageEmoji: "OA",
      },
      {
        title: "GPT-5 is multimodal at launch?",
        description:
          "Will GPT-5 support text, image, audio, and video input/output at launch?",
        category: "OpenAI",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "OA",
      },
      {
        title: "OpenAI releases AI Agent product in 2026?",
        description:
          "Will OpenAI release a standalone AI agent product (not just ChatGPT plugins) during 2026?",
        category: "OpenAI",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "OA",
      },

      // ─── Claude 4 Launch ───
      {
        title: "Claude 4 released before June 2026?",
        description:
          "Will Anthropic release Claude 4 (major version upgrade, not 3.5 updates) before June 1, 2026?",
        category: "Anthropic",
        endDate: new Date("2026-06-01").getTime(),
        imageEmoji: "AN",
      },
      {
        title: "Claude 4 released before September 2026?",
        description:
          "Will Anthropic release Claude 4 before September 1, 2026?",
        category: "Anthropic",
        endDate: new Date("2026-09-01").getTime(),
        imageEmoji: "AN",
      },
      {
        title: "Anthropic valued at $100B+ by end of 2026?",
        description:
          "Will Anthropic's valuation reach or exceed $100 billion by December 31, 2026?",
        category: "Anthropic",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "AN",
      },

      // ─── Gemini 3.0 / Google ───
      {
        title: "Gemini 3.0 before September 2026?",
        description:
          "Will Google DeepMind release Gemini 3.0 (not 2.x updates) before September 1, 2026?",
        category: "Google",
        endDate: new Date("2026-09-01").getTime(),
        imageEmoji: "GG",
      },
      {
        title: "Gemini UX 2.0 Update this quarter?",
        description:
          "Will Google release the Gemini UX 2.0 major interface update during Q1 2026?",
        category: "Google",
        endDate: new Date("2026-03-31").getTime(),
        imageEmoji: "GG",
      },
      {
        title: "Gemini UX 2.0 Update in Q2?",
        description:
          "Will Google release the Gemini UX 2.0 major interface update during Q2 (Apr-Jun) 2026?",
        category: "Google",
        endDate: new Date("2026-06-30").getTime(),
        imageEmoji: "GG",
      },

      // ─── Meta / Llama ───
      {
        title: "Llama 5 open-source release in 2026?",
        description:
          "Will Meta release Llama 5 (fully open-source/open-weight) during calendar year 2026?",
        category: "Meta",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "MT",
      },
      {
        title: "Llama 5 beats Claude 4 on coding benchmarks?",
        description:
          "If both are released, will Llama 5 outscore Claude 4 on HumanEval and SWE-Bench?",
        category: "Meta",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "MT",
      },

      // ─── xAI / Grok ───
      {
        title: "Grok 4 before August 2026?",
        description:
          "Will xAI release Grok 4 before August 1, 2026?",
        category: "xAI",
        endDate: new Date("2026-08-01").getTime(),
        imageEmoji: "XA",
      },
      {
        title: "Grok gets image generation in 2026?",
        description:
          "Will xAI ship native image generation (not via Aurora) in Grok during 2026?",
        category: "xAI",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "XA",
      },

      // ─── Apple ───
      {
        title: "Apple releases its own LLM before Oct 2026?",
        description:
          "Will Apple release a standalone large language model (not on-device Apple Intelligence updates) before October 1, 2026?",
        category: "Apple",
        endDate: new Date("2026-10-01").getTime(),
        imageEmoji: "AP",
      },
      {
        title: "Apple Intelligence gets coding assistant?",
        description:
          "Will Apple ship a dedicated coding assistant (like Copilot) in Xcode by end of 2026?",
        category: "Apple",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "AP",
      },

      // ─── AGI / Industry ───
      {
        title: "Any model surpasses 95% on ARC-AGI?",
        description:
          "Will any AI model achieve above 95% accuracy on the ARC-AGI benchmark before January 1, 2027?",
        category: "AGI",
        endDate: new Date("2027-01-01").getTime(),
        imageEmoji: "AG",
      },
      {
        title: "First $1 trillion AI company by end of 2026?",
        description:
          "Will any pure-play AI company (not big tech) reach a $1 trillion market cap or valuation by Dec 31, 2026?",
        category: "AGI",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "AG",
      },
      {
        title: "AI passes the Turing Test in a formal study?",
        description:
          "Will an AI system pass a peer-reviewed, formal Turing Test with >70% of judges fooled by end of 2026?",
        category: "AGI",
        endDate: new Date("2026-12-31").getTime(),
        imageEmoji: "AG",
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
