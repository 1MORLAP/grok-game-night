import { NextRequest, NextResponse } from "next/server";

const XAI_BASE = "https://api.x.ai/v1";
const DEFAULT_MODEL = process.env.XAI_MODEL || "grok-3";

interface GenerateRequest {
  type: "trivia" | "charades" | "would-you-rather" | "custom";
  params?: {
    count?: number;
    category?: string;
    players?: number;
    vibe?: string;
    prompt?: string;
  };
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.XAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "XAI_API_KEY not configured. Add it to .env.local to enable Grok generation." },
      { status: 400 }
    );
  }

  let body: GenerateRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, params = {} } = body;

  let systemPrompt = "You are Grok, a helpful and fun game master for game night. Always respond with valid JSON only. No markdown fences.";
  let userPrompt = "";

  if (type === "trivia") {
    const count = Math.min(Math.max(params.count || 5, 3), 10);
    const category = params.category || "general knowledge and pop culture";
    systemPrompt += " Generate fun, high-quality multiple choice trivia questions. Each question must have 4 options and exactly one correct index (0-3).";
    userPrompt = `Create ${count} trivia questions in category: ${category}. Return JSON: { "questions": [{ "q": string, "options": string[4], "correct": number, "fact": string? }] }`;
  } else if (type === "charades") {
    const count = Math.min(Math.max(params.count || 8, 5), 12);
    const category = params.category || "random fun";
    systemPrompt += " Generate hilarious, guessable charades / prompt party actions. Mix easy and creative.";
    userPrompt = `Generate ${count} charades prompts for "${category}". Return JSON: { "prompts": string[] }`;
  } else if (type === "would-you-rather") {
    const count = Math.min(Math.max(params.count || 6, 4), 8);
    systemPrompt += " Create balanced, funny or thought-provoking Would You Rather dilemmas suitable for game night with friends.";
    userPrompt = `Create ${count} Would You Rather questions. Return JSON: { "questions": [{ "a": string, "b": string }] }`;
  } else if (type === "custom") {
    const p = params.prompt || "a fun icebreaker game";
    userPrompt = `Design a short, playable game night activity around: ${p}. Describe the rules briefly and give 5 example prompts/cards. Return JSON: { "title": string, "rules": string, "examples": string[] }`;
  } else {
    return NextResponse.json({ error: "Unknown generation type" }, { status: 400 });
  }

  try {
    const res = await fetch(`${XAI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.9,
        max_tokens: 1200,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Grok API error: ${res.status} ${errText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    // Try to parse JSON from the model (it may wrap or have extra text)
    let parsed;
    try {
      // Strip possible ```json ... ```
      const cleaned = content.replace(/```json\s*|\s*```/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      // Fallback: return raw for client to handle or show
      return NextResponse.json({ raw: content, note: "Model returned non-JSON. Try again." });
    }

    return NextResponse.json({ type, data: parsed });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Generation failed" }, { status: 500 });
  }
}
