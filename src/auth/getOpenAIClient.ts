import OpenAI from "openai";
import { promptForApiKey } from "./promptApiKey";
import { readStoredApiKey, saveApiKey } from "./config";
import chalk from "chalk";

/**
 * Orchestrates API key retrieval and validation.
 * Order of operations: Environment Variable -> Local Config -> User Prompt.
 */
export const getOpenAIClient = async (): Promise<OpenAI> => {
  // 1. Environment Variable Check (Highest Priority)
  const envKey: string | undefined = process.env.SHELLPILOT_OPENAI_KEY || process.env.OPENAI_API_KEY;
  if (envKey) {
    return new OpenAI({ apiKey: envKey });
  }

  // 2. Local Storage Check
  let apiKey: string | null = await readStoredApiKey();

  // 3. User Prompt if missing
  if (!apiKey) {
    console.log(chalk.cyan(`
Shellpilot needs an OpenAI API key to run.
The key will be stored locally on your device at: ${chalk.bold("~/.shellpilot/config.json")}
You can delete it anytime.
`));

    apiKey = await promptForApiKey();
    await saveApiKey(apiKey);
  }

  // 4. Recursive Validation Logic
  return validateAndReturnClient(apiKey);
};

/**
 * Validates the key by hitting a lightweight OpenAI endpoint.
 * If invalid, it recurses once to allow the user to fix it.
 */
async function validateAndReturnClient(key: string, isRetry = false): Promise<OpenAI> {
  const client = new OpenAI({ apiKey: key });

  try {
    // We use models.list() as a "no-op" check to verify the key
    await client.models.list();
    return client;
  } catch (err: unknown) {
    console.error(chalk.red("\n❌ Invalid or expired OpenAI API key."));

    if (isRetry) {
      console.error(chalk.yellow("Second attempt failed. Please check your billing status or key permissions."));
      process.exit(1);
    }

    const newKey = await promptForApiKey();
    await saveApiKey(newKey);
    
    // Recurse with isRetry = true to prevent infinite loops
    return validateAndReturnClient(newKey, true);
  }
}