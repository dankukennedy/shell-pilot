import readline from "readline";

/**
 * Prompt for OpenAI API key (session-only).
 * The key is kept in memory and never written to disk.
 */
export const promptForApiKey = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    // Hide input by overriding output
    const write = (rl as any)._writeToOutput;
    (rl as any)._writeToOutput =  (stringToWrite: string) =>{
      if (stringToWrite.trim() === "") return;
      write.call(rl, "*");
    };

    rl.question("Paste your OpenAI API key (input hidden):\n> ", (answer:string) => {
      rl.close();

      const key = answer.trim();

      if (!key) {
        reject(new Error("No API key provided"));
        return;
      }

      resolve(key);
    });

    rl.on("SIGINT", () => {
      rl.close();
      reject(new Error("Input cancelled"));
    });
  });
}
