import OpenAI from "openai";
import { promptForApiKey } from "./promptApiKey";

let sessionApiKey: string | null = null;

export async function getOpenAIClient(): Promise<OpenAI> {
  // 1️⃣ Env var wins (no prompting)
  if (process.env.SHELLPILOT_OPENAI_KEY) {
    return new OpenAI({
      apiKey: process.env.SHELLPILOT_OPENAI_KEY,
    });
  }

  // 2️⃣ Prompt once per session if missing
  if (!sessionApiKey) {
    console.log(`
❌ SHELLPILOT_OPENAI_KEY not found

Shellpilot needs an OpenAI API key to run.
The key will be used for this session only and will not be saved.
`);

    sessionApiKey = await promptForApiKey();
  }

  // 3️⃣ Validate key with a lightweight call
  try {
    const client = new OpenAI({ apiKey: sessionApiKey });

    // Minimal validation request
    await client.models.list();

    return client;
  } catch {
    // 4️⃣ Invalid key → re-prompt ONCE
    console.error("\n❌ Invalid OpenAI API key. Please try again.\n");

    sessionApiKey = await promptForApiKey();

    const client = new OpenAI({ apiKey: sessionApiKey });

    // If this fails again, let it throw and exit
    await client.models.list();

    return client;
  }
}
