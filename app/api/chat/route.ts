import { openai } from "@ai-sdk/openai";
import { LanguageModelV1, streamText } from "ai";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4-turbo") as LanguageModelV1,
    messages,
  });

  return result.toAIStreamResponse();
}
