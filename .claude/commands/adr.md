---
description: Record an architectural decision in docs/adr/
---

Record this architectural decision: $ARGUMENTS

1. Find the highest-numbered file in `docs/adr/` and use the next number (zero-padded to 4 digits).
2. Copy `docs/adr/template.md` to `docs/adr/NNNN-<kebab-case-title>.md`.
3. Fill it in: Status = Accepted, Context (problem + options considered), Decision (past tense: "We chose X because..."), Consequences (trade-offs accepted). Keep it under 50 lines.
4. If this supersedes an earlier ADR, set that ADR's Status to `Superseded by ADR-NNNN`.
5. Never delete or renumber existing ADRs.
