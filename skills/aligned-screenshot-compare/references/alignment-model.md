# Alignment Model

The aligner uses a conservative document-block model.

## Blocks

- `heading`: Markdown headings or heading-like fetched lines.
- `paragraph`: prose blocks.
- `list`: contiguous list items.
- `code`: fenced code blocks.
- `table`: Markdown tables or Lark table blocks.
- `callout`: Lark callouts. Text inside may match a source paragraph, but visual-only callouts should remain insertions.
- `visual`: whiteboards, images, grid wrappers, horizontal rules.

## Matching

1. Normalize text:
   - lowercase Latin text;
   - collapse whitespace;
   - remove Markdown emphasis and common Lark XML tags;
   - keep CJK characters, identifiers, and code tokens.
2. Score blocks:
   - exact normalized text: strongest;
   - Jaccard token overlap for long prose;
   - prefix/substring match for headings;
   - low or zero score for visual-only blocks.
3. Use order-preserving dynamic programming:
   - match blocks when score is above threshold;
   - otherwise emit insert/delete rows;
   - never cross-match later content before earlier content.

## Presentation Modes

### Soft Spacer Mode

Default mode. It renders both documents as normal continuous columns. It measures matched anchor positions in the browser after fonts/layout settle. If an anchor differs by more than the threshold, the script inserts one blank spacer before the earlier side's anchor.

Use this for final screenshots.

Parameters:

- `--align-threshold-px`: default `700`; roughly half a page at the default screenshot viewport.
- `--target-residual-px`: default `32`; the remaining tolerated drift after spacing.
- `--min-anchor-chars`: default `120`; avoids aligning every tiny paragraph.
- `--show-spacers`: makes blank spacers visible for debugging.

### Rows Mode

`--mode rows` renders each aligned block as a table row. It is useful for debugging matching, but it is too visually noisy for final before/after screenshots.

## Reading Rows Mode

- Same row: content is matched and should be compared visually.
- Left-only row: content removed or moved out of the beautified version.
- Right-only row: visual enhancement or new content inserted by the beautifier.
- Low-confidence row: possible match; inspect manually.
