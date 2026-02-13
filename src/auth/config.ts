import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".shellpilot");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

export const readStoredApiKey = async(): Promise<string | null> => {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed.openaiKey || null;
  } catch(err: any) {
    return null;
  }
}

export const saveApiKey = async(key: string): Promise<void> => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify({ openaiKey: key }, null, 2), {
    mode: 0o600,
  });
}
