# Shell-Pilot

Shell-Pilot is an **AI terminal copilot**.

It runs your command, and **only if the command fails**, it explains what went wrong and tells you what to do next.

That includes things like:

Telling you when a package name is wrong (instead of telling you to install a non-existent one).

Pointing out deprecated or incorrect install methods.

Knowing when the fix is in your code, not your environment

---

## What Shell-Pilot is

- An AI assistant for failed terminal commands
- A wrapper around commands like `npm run build`, `npm run dev`, `pnpm install`, etc.
- Opinionated, concise, and terminal‑native
- Advisory only — it never auto‑runs fixes or modifies files

## What Shell-Pilot is NOT

- Not a compiler
- Not a linter
- Not a dev server
- Not a debugger
- Not a live log watcher
- Not an IDE replacement

**Mental model:**

> Shell-Pilot is the senior developer who looks at your terminal _after something crashes_ and tells you what to do next.

---

## Installation

### Global install (recommended)

```bash
npm install -g @shell-pilot/shell-pilot
```

After installation:

```bash
shell-pilot --version
```

---

## OpenAI API key

Shell-Pilot requires an OpenAI API key.

There is **no non‑AI mode**.

### How authentication works

Shell-Pilot resolves your API key in the following order:

1. `SHELLPILOT_OPENAI_KEY` environment variable (always wins)
2. A locally stored key in `~/.shellpilot/config.json`
3. Interactive prompt (first run only)

If no key is found, Shellpilot will prompt you once and securely store the key locally for reuse.

The key is:

- stored **outside** your projects
- never written to your repository
- never committed
- never auto‑shared

You can delete the file at any time to revoke access.

### Optional: set via environment variable

#### macOS / Linux

```bash
export SHELLPILOT_OPENAI_KEY=sk-xxxxxxxx
```

#### Windows (PowerShell)

```powershell
setx SHELLPILOT_OPENAI_KEY "sk-xxxxxxxx"
```

Restart your terminal after setting the variable.

---

## Usage

shell-pilot always wraps another command:

```bash
shell-pilot <command> [args...]
```

Examples:

```bash
shell-pilot npm run build
shell-pilot npm run dev
shell-pilot pnpm install
shell-pilot node index.js
```

What happens:

1. Shell-Pilot runs the command normally
2. Output is streamed as‑is
3. If the command succeeds → Shell-Pilot stays quiet
4. If the command fails → shell-pilot explains the failure

---

## Example

```bash
shell-pilot npm run build
```

```text
▶ Shell-Pilot running: npm run build

> shell-pilot@1.0.0 build
> tsc

src/cli.ts(2,20): error TS2307: Cannot find module 'open-ai' or its corresponding type declarations.

✖ Command failed — shell-pilot

🤖 shell-pilot:

Issue:
The module name 'open-ai' is incorrect; it should be 'openai'.

Fix:
Change the import statement in your code from 'open-ai' to 'openai'.

Command:
No command needed
```

shell-pilot:

- does not auto‑run commands
- does not modify files
- does not guess blindly

You stay in control.

---

## Using shell-pilot with React / Next.js

shell-pilot helps **only when a command fails or crashes**.

### When shell-pilot helps

- `npm run build` fails
- `npm run dev` fails to start
- Missing dependencies
- Invalid configuration
- Missing environment variables
- TypeScript compile errors that exit the process

Example:

```bash
shell-pilot npm run build
```

### When shell-pilot does NOT help (by design)

shell-pilot does not intervene when a dev server is already running.

This includes:

- React error overlays
- Runtime browser errors
- Hot‑reload warnings
- Client‑side exceptions

These errors do not crash the process, so shell-pilot stays silent.

---

## Data & Privacy

shell-pilot sends **only the failed command output** to OpenAI.

It does NOT:

- scan your repository
- read files
- upload source code (unless it appears in the error output)
- execute commands on your behalf (everything is in your control)

If you are not comfortable sending terminal error output to OpenAI, do not use Shellpilot.

---

## Development

### Local development

```bash
git clone https://github.com/shell-pilot/shell-pilot
cd shell-pilot
npm install
npm run build
npm install -g .
```

Run locally:

```bash
shell-pilot npm run build
```

---

## Contributing

Shell-Pilot is early‑stage and intentionally minimal.

Contributions are welcome, especially:

- Prompt improvements
- Better issue summarisation
- UX refinements
- Documentation fixes
- Real‑world failure examples

### Please note

- There is no strict roadmap yet
- There are no tests yet
- Breaking changes may happen
- This tool is still rough

If something feels wrong, open an issue — feedback is valuable.

---

## Philosophy

Shell-Pilot is deliberately restrained.

It speaks **only when a command fails**.

That restraint is the feature.

---

## License

MIT
