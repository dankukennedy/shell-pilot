import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";

// Define an interface for your configuration object
interface ShellPilotConfig {
  openaiKey: string;
}

const CONFIG_DIR: string = path.join(os.homedir(), ".shellpilot");
const CONFIG_FILE: string = path.join(CONFIG_DIR, "config.json");

/**
 * Reads the stored API key from the config file.
 * Returns null if the file doesn't exist or is invalid.
 */
export const readStoredApiKey = async (): Promise<string | null> => {
  try {
    // Using promise-based fs for better async flow
    const raw = await readFile(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ShellPilotConfig;
    
    return parsed.openaiKey || null;
  } catch (err: unknown) {
    // In TS "Full", we treat errors as unknown and check their properties
    return null;
  }
};

/**
 * Saves the API key to a local JSON file with restricted permissions.
 */
export const saveApiKey = async (key: string): Promise<void> => {
  try {
    // Ensure the directory exists
    if (!existsSync(CONFIG_DIR)) {
      await mkdir(CONFIG_DIR, { recursive: true });
    }

    const configContent: ShellPilotConfig = { openaiKey: key };

    // Mode 0o600 ensures only the owner can read/write this file (security best practice)
    await writeFile(CONFIG_FILE, JSON.stringify(configContent, null, 2), {
      encoding: "utf-8",
      mode: 0o600,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to save API key: ${message}`);
  }
};