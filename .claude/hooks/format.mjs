// PostToolUse hook: auto-format the file Claude just edited.
// Receives hook JSON on stdin; exits 0 always so formatting never blocks work.
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

let filePath
try {
  filePath = JSON.parse(readFileSync(0, 'utf8'))?.tool_input?.file_path
} catch {
  process.exit(0)
}

if (!filePath || !/\.(ts|tsx|js|jsx|mjs|cjs|json|md|css)$/.test(filePath)) {
  process.exit(0)
}

try {
  execFileSync(
    'pnpm',
    ['exec', 'prettier', '--write', '--ignore-unknown', filePath],
    {
      cwd: process.env.CLAUDE_PROJECT_DIR ?? process.cwd(),
      stdio: 'ignore',
      timeout: 15_000,
    }
  )
} catch {
  // Formatting is best-effort; never fail the edit.
}
process.exit(0)
