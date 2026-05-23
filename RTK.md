# RTK.md

Project working rules for AI coding agents. Adapted from the [Karpathy Guidelines 12 Rules gist](https://gist.github.com/Planxnx/64b173bacf2c8c43435c4333d0b9bd94).

These rules apply to every task in this repository unless the user or a higher-priority instruction says otherwise. For very small tasks, use judgment, but do not skip verification silently.

## 1. Think before coding

- State important assumptions when they affect the implementation.
- If the request has multiple plausible meanings, clarify or name the interpretation you are using.
- Surface tradeoffs when a simpler or safer path exists.
- Stop and ask when uncertainty would make the change risky.

## 2. Prefer the simplest working change

- Build only what was requested.
- Avoid one-off abstractions, speculative configuration, and unused extension points.
- Do not add defensive code for scenarios the project cannot actually reach.
- If the solution is growing large, look for a smaller change that still satisfies the goal.

## 3. Keep edits surgical

- Touch only files and lines that are needed for the task.
- Match the existing style, naming, module boundaries, and formatting.
- Clean up unused imports, variables, and helpers introduced by your own change.
- Mention unrelated issues you notice instead of fixing them opportunistically.

## 4. Work from verifiable goals

- Convert vague work into a concrete success condition before implementing.
- For bug fixes, reproduce the failure when feasible, then make the reproduction pass.
- For new behavior, add focused tests when the risk or surface area justifies them.
- For multi-step work, track what is done, what is verified, and what remains.

## 5. Use model judgment only where it belongs

- Use LLM judgment for drafting, summarizing, classifying, and extracting from ambiguous text.
- Use deterministic code for routing, retries, status handling, parsing, and mechanical transforms.
- When data or a status code answers the question, let code handle it.

## 6. Respect context and token budgets

- Keep context small and load only the files needed for the current decision.
- Summarize and reset direction when the thread is getting too large to reason about safely.
- Prefer concise progress updates over dumping large intermediate outputs.

## 7. Surface conflicts instead of blending them

- If project conventions conflict, choose the better-supported or more recent pattern and say why.
- Do not invent a hybrid style that makes both patterns harder to maintain.
- Flag the losing pattern as cleanup material when relevant.

## 8. Read before writing

- Before editing a file, inspect its exports, callers, tests, and nearby helpers when applicable.
- Understand why the current structure exists before adding code to it.
- Prefer existing utilities and local patterns over new mechanisms.

## 9. Make tests encode intent

- Tests should fail when the behavior that matters to the project changes.
- Avoid tests that only prove hardcoded output without explaining the scenario.
- Name or structure tests around the reason the behavior exists.

## 10. Checkpoint after significant steps

- After each meaningful step, know what changed, how it was verified, and what is next.
- If you lose track of the working state, stop and restate it before continuing.
- Keep the user informed during longer tasks.

## 11. Conform before expressing preference

- Follow the repository's conventions even if another style would be personally preferable.
- Raise harmful conventions as a separate concern instead of quietly forking the code style.
- Preserve established public APIs and workflows unless the task explicitly changes them.

## 12. Fail loudly

- Do not claim success for work that was not verified.
- Say exactly which checks ran and which did not.
- Surface skipped records, partial migrations, missing edge-case coverage, and uncertain outcomes.
