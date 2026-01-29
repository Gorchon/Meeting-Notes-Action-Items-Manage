import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export function hashNotes(notes: string): string {
  return crypto.createHash("sha256").update(notes).digest("hex");
}

export interface AIResponse {
  content: string;
  promptTokens: number;
  completionTokens: number;
  model: string;
}

export async function generateSummary(rawNotes: string): Promise<AIResponse> {
  // TODO: Add token limit enforcement
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Generate a structured summary of the following meeting notes. Be concise and focus on key points.\n\nNotes:\n${rawNotes}`,
        },
      ],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "";

    return {
      content: text,
      promptTokens: message.usage.input_tokens,
      completionTokens: message.usage.output_tokens,
      model: message.model,
    };
  } catch (error) {
    console.error("Anthropic API error in generateSummary:", error);
    throw error;
  }
}

export async function generateDecisions(rawNotes: string): Promise<AIResponse> {
  // TODO: Add token limit enforcement
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set in environment variables");
  }

  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `Extract all decisions made during this meeting. Return them as a JSON array of strings. If no decisions were made, return an empty array.\n\nNotes:\n${rawNotes}`,
        },
      ],
    });

    const content = message.content[0];
    const text = content.type === "text" ? content.text : "[]";

    return {
      content: text,
      promptTokens: message.usage.input_tokens,
      completionTokens: message.usage.output_tokens,
      model: message.model,
    };
  } catch (error) {
    console.error("Anthropic API error in generateDecisions:", error);
    throw error;
  }
}

export async function generateActions(rawNotes: string): Promise<AIResponse> {
  // TODO: Add token limit enforcement
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Extract all action items from this meeting. Return them as a JSON array of objects with fields: description (string), owner (string or null), dueDate (ISO date string or null). If no action items, return an empty array.\n\nNotes:\n${rawNotes}`,
      },
    ],
  });

  const content = message.content[0];
  const text = content.type === "text" ? content.text : "[]";

  return {
    content: text,
    promptTokens: message.usage.input_tokens,
    completionTokens: message.usage.output_tokens,
    model: message.model,
  };
}
