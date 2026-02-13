import readline from "readline";
import chalk from "chalk";

/**
 * Interface to safely access internal Readline methods
 * without using the 'any' keyword.
 */
interface ReadlineInternal extends readline.Interface {
  _writeToOutput: (stringToWrite: string) => void;
}

/**
 * Prompt for OpenAI API key with a hidden input (stars).
 */
export const promptForApiKey = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // We create the interface and cast it once to our internal type
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    }) as ReadlineInternal;

    const originalWrite = rl._writeToOutput;

    /**
     * Override the internal write method to mask the API key.
     * We use '*' to show the user that their typing is being registered.
     */
    rl._writeToOutput = (stringToWrite: string) => {
      // Allow the prompt text and newlines to pass through normally
      if (stringToWrite.includes("Paste your") || stringToWrite === "\n" || stringToWrite === "\r\n") {
        originalWrite.call(rl, stringToWrite);
      } else {
        // Mask actual user input
        originalWrite.call(rl, chalk.gray("*"));
      }
    };

    rl.question(chalk.cyan("Paste your OpenAI API key (input hidden):\n> "), (answer: string) => {
      rl.close();
      const key = answer.trim();

      if (!key) {
        reject(new Error("No API key provided."));
        return;
      }

      resolve(key);
    });

    // Handle Ctrl+C gracefully during the prompt
    rl.on("SIGINT", () => {
      rl.close();
      console.log(chalk.yellow("\n\nInput cancelled by user."));
      process.exit(0);
    });
  });
};