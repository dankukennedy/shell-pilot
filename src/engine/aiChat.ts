import OpenAI from "openai";
import { getOpenAIClient } from "../auth/getOpenAIClient";

/**
 * Sends the failed command and terminal output to OpenAI.
 * Returns a formatted string containing Issue, Fix, and Command.
 */
export const runAIChat = async (
  command: string,
  errorText: string,
): Promise<string> => {
  // getOpenAIClient handles the validation and prompt logic internally
  const client: OpenAI = await getOpenAIClient();

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 500, // Safety limit for credit management
      messages: [
        {
          role: "system",
          content: `
You are a terminal copilot for experienced developers.
You see a command that just failed. Your job is to tell the developer what to do next.

You MUST respond in this exact format:

Issue:
<one clear sentence explaining the real problem>

Fix:
<one clear sentence describing the correct fix>

Command:
<one shell command OR "No command needed">

Critical rules:
- Do NOT blindly trust the error message.
- If a module name looks incorrect, outdated, or fake, say so.
- If the suggested package does not exist or is commonly mistaken, correct it.
- Prefer correcting the import over installing the wrong dependency.
- Be decisive, not obedient.
- Do NOT explain theory.
- Do NOT give multiple options.
- Do NOT use markdown code blocks.
`,
        },
        {
          role: "user",
          content: `Command run: ${command}\n\nError output: ${errorText}`,
        },
      ],
    });

    // Type-safe extraction of the message content
    const aiMessage: string | null = response.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error("OpenAI returned an empty response.");
    }

    return aiMessage.trim();

  } catch (err: unknown) {
    // Specific handling for OpenAI API Errors
    if (err instanceof OpenAI.APIError) {
      const status = err.status; // e.g., 401, 429
      const message = err.message;
      throw new Error(`OpenAI API Error (${status}): ${message}`);
    }

    // Fallback for general errors (network, etc.)
    const errorMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to consult AI: ${errorMessage}`);
  }
};