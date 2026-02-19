# AI_WORKFLOW.md

## How AI should operate

When asked to build a feature:

1. Read:
   - docs/PRD-MVP.md
   - docs/ARCHITECTURE.md
   - ai-context/PROJECT_RULES.md

2. Confirm scope:
   - Implement ONLY the requested feature.
   - Do not add extra features.

3. Implementation order:
   - Types/interfaces
   - Backend API
   - Frontend integration
   - Basic UI
   - Error handling

4. Output expectations:
   - Provide file paths.
   - Provide complete code blocks.
   - Keep changes minimal and focused.

## If requirements are unclear
- Make a reasonable MVP assumption.
- Do NOT redesign architecture.

## Definition of success
- Feature works.
- Code is readable.
- Matches project rules.
