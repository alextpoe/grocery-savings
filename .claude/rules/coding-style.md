# Coding Style

- **Immutability**: return new objects (`{ ...user, name }`); never mutate function arguments or state.
- **Validation**: external input goes through Zod schemas in `@grocery-savings/utils/schemas`; export inferred types with `z.infer`.
- **Errors**: throw inside queries/mutations (TanStack Query surfaces them); catch in forms/screens and show a user-friendly message. Never swallow errors silently.
- **Size**: files under ~400 lines, functions under ~50; organize by feature, not by type.
- No `console.log` in committed code.
- **Tests**: this repo uses **Vitest** (`vi.fn()`, `vi.mock()`) — never jest. New logic in `packages/api` or `packages/utils` gets a test next to the existing ones in `src/__tests__/`.

## Strict TypeScript gotchas in this repo

- `array[i]`, `record[key]`, `.split('T')[0]` are all `T | undefined` under strict indexing — use `?? fallback` or a deliberate `!`.
- `Uint8Array.buffer` is `ArrayBufferLike`; WebCrypto wants `ArrayBuffer` — cast `iv.buffer as ArrayBuffer`.
- When adding a new barrel export to a package (e.g. `constants/`), you MUST add the subpath to that package's `package.json` `exports` map or imports won't resolve.
