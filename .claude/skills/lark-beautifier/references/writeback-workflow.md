# Write-Back Workflow

Use this reference when reading or writing a real Feishu/Lark document.

## Dry-Run First

The write-back helper accepts either an input Markdown file or a Feishu doc URL.

Beautify a local file and produce a dry-run plan:

```bash
node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input output.md \
  --mode structured \
  --plan-output plan.json
```

Read the current Feishu doc, beautify its raw content, and produce a dry-run plan:

```bash
LARK_MCP_APP_ID=<app_id> node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --mode structured \
  --plan-output plan.json
```

The plan includes:

- source kind (`file` or `doc`);
- before/after heading and block summaries;
- native block counts;
- likely changes;
- confirmation checklist;
- write strategy (`replace` or `append`).

## Apply

Apply only after the user confirms the dry-run plan:

```bash
LARK_MCP_APP_ID=<app_id> node skills/lark-beautifier/scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --mode structured \
  --apply
```

Use `--append` to preserve existing top-level content. Default behavior is replace.

For `bold` mode, pass `--confirm-bold` only after the user explicitly approves the bold checklist.

## Verification

After applying:

1. Re-read top-level blocks.
2. Verify expected headings, native tables, and callouts.
3. Report changed block counts and any unsupported placeholders.
4. Do not print OAuth tokens, app secrets, or raw local token-store data.
