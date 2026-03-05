# AGENTS.md

## Mission
Always improve code with: Performance, Compatibility, Clean Code.
Prefer small, safe changes. Avoid unrelated refactors.

## Quality Gates (must do)
### Performance
- Identify hot paths and render loops.
- Avoid unnecessary re-renders, repeated DOM queries, excessive allocations.
- Consider bundle size: avoid new deps unless justified.
- If you change a performance-sensitive area, provide before/after measurement plan (how to measure).

### Compatibility
- Target: ES5+ compatible output where required.
- No usage of APIs that break on older browsers without polyfill plan.
- Keep build toolchain constraints (tsconfig/babel targets) consistent.
- If you introduce a modern API, add fallback or guard.

### Clean Code
- Keep functions small; prefer pure functions where possible.
- Naming: descriptive, consistent; avoid ambiguous booleans.
- Remove dead code, tighten types, reduce duplication.
- Add/adjust tests when behavior changes.

## Workflow (always follow)
1) Explain plan in 3-7 bullets.
2) Apply minimal diff.
3) Run checks:
   - lint: run configured lint command if present
   - test: `npm run test`
   - build: `npm run build`
4) Summarize changes + risks + rollback steps.

## Repo context
- Stack: Gatsby 5 + React + TypeScript + MDX + Tailwind CSS
- Deploy/runtime: Netlify (`netlify.toml`, `netlify/functions`, `netlify/edge-functions`)
- Key app paths:
  - pages: `src/pages`
  - templates: `src/templates`
  - shared components: `src/components`
  - content: `content/blog`

## Repo commands (this project)
- Install: `npm install`
- Dev server: `npm run dev` (or `npm run start`)
- Dev with MDX watcher: `npm run dev:watch`
- Build: `npm run build` (CI build: `npm run build:ci`)
- Serve built site: `npm run serve`
- Clean Gatsby/cache artifacts: `npm run clean`
- Content index generation: `npm run index`
- Test (placeholder in current repo): `npm run test`

## Notes for checks
- If a check command is missing in this repository, use the closest available equivalent and state what was run.
- Keep command choices aligned with `package.json` scripts.
