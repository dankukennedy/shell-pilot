import OpenAI from "openai";
import { promptForApiKey } from "./promptApiKey";
import { readStoredApiKey, saveApiKey } from "./config";

export async function getOpenAIClient(): Promise<OpenAI> {
  // 1️⃣ Env var always wins
  const envKey = process.env.SHELLPILOT_OPENAI_KEY;
  if (envKey) {
    return new OpenAI({ apiKey: envKey });
  }

  // 2️⃣ Try stored key
  let apiKey = readStoredApiKey();

  // 3️⃣ Prompt if missing
  if (!apiKey) {
    console.log(`
Shellpilot needs an OpenAI API key to run.
The key will be stored locally on your device at:

  ~/.shellpilot/config.json

You can delete it anytime.
`);

    apiKey = await promptForApiKey();
    saveApiKey(apiKey);
  }

  // 4️⃣ Validate key
  try {
    const client = new OpenAI({ apiKey });
    await client.models.list();
    return client;
  } catch {
    // 5️⃣ Invalid key → re-auth
    console.error("\n❌ Invalid OpenAI API key. Please try again.\n");

    const newKey = await promptForApiKey();
    saveApiKey(newKey);

    const client = new OpenAI({ apiKey: newKey });
    await client.models.list();

    return client;
  }
}
