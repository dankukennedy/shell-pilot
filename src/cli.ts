#!/usr/bin/env node

import "dotenv/config";
import { execa, ExecaError } from "execa";
import chalk from "chalk";
import ora from "ora";
import stripAnsi from "strip-ansi";
import { runAIChat } from "./engine/aiChat"; 
import { 
  readFileSync, 
  writeFileSync, 
  existsSync, 
  mkdirSync, 
  readdirSync, 
  statSync, 
  unlinkSync 
} from "fs";
import { join } from "path";
import { createHash } from "crypto";
import { tmpdir } from "os";

// --- Configuration & Constants ---
const CACHE_DIR: string = join(tmpdir(), "shell-pilot-cache");
const CACHE_EXPIRATION_MS: number = 24 * 60 * 60 * 1000; 

if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}

// --- Helper Functions ---

const pruneCache = (): void => {
  const now = Date.now();
  try {
    const files = readdirSync(CACHE_DIR);
    for (const file of files) {
      const filePath = join(CACHE_DIR, file);
      // Use optional chaining/safety for file stats
      const stats = statSync(filePath);
      if (now - stats.mtimeMs > CACHE_EXPIRATION_MS) {
        unlinkSync(filePath);
      }
    }
  } catch (e) {
    /* Silent catch for IO errors */
  }
};

const clearCache = (): void => {
  try {
    const files = readdirSync(CACHE_DIR);
    files.forEach(file => unlinkSync(join(CACHE_DIR, file)));
    console.log(chalk.green("✔ Cache cleared successfully."));
  } catch (err) {
    console.error(chalk.red("✘ Could not clear cache."));
  }
};

const getCachePath = (cmd: string, output: string): string => {
  const hash = createHash("md5").update(cmd + output).digest("hex");
  return join(CACHE_DIR, `${hash}.txt`);
};

const printHelp = (): string => `${chalk.bold("shellPilot")} — AI terminal copilot

Usage:
  ${chalk.cyan("shellPilot <command> [args...]")}
  ${chalk.cyan("shellPilot --clear-cache")}

Examples:
  ${chalk.cyan("shellPilot npm run build")}
  ${chalk.cyan("shellPilot node index.js")}

Notes:
  - Requires ${chalk.yellow("OPENAI_API_KEY")} in your environment.
  - Repetitive errors are cached for 24h to save credits.
`;

const getVersion = (): string => {
  try {
    // Standard CommonJS: __dirname is available
    const pkgPath = join(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
    return pkg.version;
  } catch {
    return "unknown";
  }
};

// --- Main Execution Block ---

const main = async (): Promise<void> => {
  const args: string[] = process.argv.slice(2);

  pruneCache();

  if (args.includes("--clear-cache")) {
    clearCache();
    return; // Exit main
  }

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    console.log(printHelp());
    return;
  }

  if (args.includes("--version") || args.includes("-v")) {
    console.log(getVersion());
    return;
  }

  const [cmd, ...cmdArgs] = args;
  const fullCmd: string = `${cmd} ${cmdArgs.join(" ")}`;

  console.log(chalk.gray(`▶ shellPilot running: ${fullCmd}\n`));

  try {
    const subprocess = execa(cmd, cmdArgs, {
      shell: true,
      stdout: "pipe",
      stderr: "pipe",
    });

    subprocess.stdout?.pipe(process.stdout);
    subprocess.stderr?.pipe(process.stderr);

    await subprocess;
    console.log(chalk.green("\n✔ shellPilot: command completed successfully\n"));

  } catch (err: unknown) {
    // Type-safe error handling for Execa
    const error = err as ExecaError;
    const rawOutput: string = [error.stdout, error.stderr].filter(Boolean).join("\n");
    const output: string = stripAnsi(rawOutput).replace(/\r\n/g, "\n").trim();
    
    if (!output) {
      console.log(chalk.red("\n✖ Command failed with no output.\n"));
      process.exit(1);
    }

    const cachePath = getCachePath(fullCmd, output);
    console.log(chalk.red("\n✖ Command failed — shellPilot\n"));

    let response: string;

    if (existsSync(cachePath)) {
      response = readFileSync(cachePath, "utf-8");
      console.log(chalk.gray("🤖 shellPilot (Cached Explanation):"));
    } else {
      const spinner = ora({
        text: chalk.cyan("Consulting AI for a fix..."),
        color: "cyan"
      }).start();

      try {
        response = await runAIChat(fullCmd, output);
        writeFileSync(cachePath, response);
        spinner.succeed(chalk.green("AI analysis complete:"));
      } catch (aiErr) {
        spinner.fail(chalk.red("AI failed to respond. Check your API key."));
        process.exit(1);
      }
    }

    // Advanced Formatting Loop
    console.log(""); 
    const headers = ["Issue:", "Fix:", "Command:", "Solution:"];
    response.trim().split("\n").forEach((line: string) => {
      const isHeader = headers.some(h => line.startsWith(h));
      console.log(isHeader ? chalk.yellow.bold(line) : line);
    });

    process.exit(1);
  }
};

// Top-level catch for the async main
main().catch(err => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(chalk.red("Fatal Error:"), message);
  process.exit(1);
});