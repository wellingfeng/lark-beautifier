---
name: aligned-screenshot-compare
description: Create paragraph-aligned side-by-side visual comparisons for two document versions, especially raw vs lark-beautifier Feishu/Lark docs where added callouts, diagrams, tables, or section dividers make ordinary long screenshots drift out of sync. Use when the user asks for screenshot comparison, long-image comparison, before/after document QA, aligned paragraphs, matching sections, visual diff, or Feishu doc comparison screenshots.
---

# Aligned Screenshot Compare

Use this skill when two document versions have mostly the same content but different visual treatment. Do not split every paragraph into a bordered diff row by default. Preserve the original document flow as much as possible, and add blank space only when matching anchors drift far apart.

## Workflow

1. Get comparable text sources for both sides.
   - Preferred: Markdown from `lark-cli docs +fetch`, exported Markdown, or the local pre-write Markdown files.
   - Acceptable: HTML text extraction when Markdown is not available.
   - Avoid using screenshots as the only source unless OCR is explicitly requested.
2. Run the aligner:

   ```bash
   node skills/aligned-screenshot-compare/scripts/align-compare.mjs \
     --left tmp/raw.md \
     --right tmp/beautified.md \
     --left-title "原始版" \
     --right-title "美化版" \
     --out-html tmp/aligned-compare.html \
     --out-png tmp/aligned-compare.png
   ```

3. Inspect the HTML or PNG. Confirm that the output still looks like two normal document screenshots, with minimal blank spacer blocks inserted only where later content would otherwise be more than about half a page out of sync.
4. Tune spacer behavior only when needed:

   ```bash
   node skills/aligned-screenshot-compare/scripts/align-compare.mjs \
     --left tmp/raw.md \
     --right tmp/beautified.md \
     --align-threshold-px 700 \
     --target-residual-px 32 \
     --out-html tmp/aligned-compare.html \
     --out-png tmp/aligned-compare.png
   ```

5. Use `--mode rows` only for debugging bad matches. It intentionally adds per-block separators and is not the presentation mode.

## Alignment Rules

- Align by normalized block text, but render both sides as continuous documents.
- Treat headings, longer paragraphs, tables, and code blocks as candidate anchors.
- Treat visual-only blocks (`<callout>`, `<whiteboard>`, `<grid>`, `<image>`, horizontal rules) as insertions unless their text strongly matches a source paragraph.
- Preserve inserted visual blocks in the right document flow; do not force every insertion into a separate comparison row.
- Insert blank spacer height only when a matched anchor drifts by more than `--align-threshold-px`. Use the smallest spacer that reduces the drift to `--target-residual-px`.
- Prefer order-preserving fuzzy matches. Never reorder content only to improve alignment.
- Avoid visible spacer styling unless debugging with `--show-spacers`.

## Feishu-Specific Notes

- For real Feishu docs, first fetch both docs:

  ```bash
  lark-cli docs +fetch --doc <raw_doc> --format pretty > tmp/raw-fetch.md
  lark-cli docs +fetch --doc <beautified_doc> --format pretty > tmp/beautified-fetch.md
  ```

- If Feishu web pages require login, export PDFs for evidence but still align from fetched Markdown. PDF screenshots prove final rendering; Markdown alignment proves paragraph correspondence.
- Keep all screenshots, HTML previews, fetched Markdown, and debug outputs under `tmp/`.

## Output

Return:

- paths to the aligned HTML and PNG;
- spacer stats from the script output: `spacerCount`, `totalSpacerPx`, and `maxDriftPx`;
- any alignment warnings, especially unmatched paragraphs that may indicate content drift;
- whether the comparison used live web screenshots, exported Feishu PDFs, or Markdown-rendered preview.
