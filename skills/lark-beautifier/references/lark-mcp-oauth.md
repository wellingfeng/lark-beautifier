# Lark MCP OAuth Write-Back

Use this reference when creating, reading, or updating real Feishu/Lark documents after beautifying content.

## Preferred Authentication

Prefer the `@larksuiteoapi/lark-mcp` OAuth authorization-code flow:

```bash
npx -y @larksuiteoapi/lark-mcp login -a <app_id> -s <app_secret> -p 8765 --host 127.0.0.1
```

This opens a browser-based OAuth authorization flow and receives the callback at `localhost:8765/callback`.

Avoid `lark-cli auth login` unless the user explicitly requests it. That path may use device-code authorization and can trigger enterprise approval in environments where OAuth authorization-code login does not.

## Token Handling

- Do not hardcode app secrets, user access tokens, or refresh tokens in committed files.
- Do not print tokens in logs, final answers, or generated documents.
- Prefer environment variables, secure OS storage, or the encrypted local storage used by `lark-mcp`.
- If a permission page appears, stop and let the user confirm in the browser.

## Write-Back Flow

1. Parse the Feishu doc URL and extract the document token.
2. Use the local OAuth token from `lark-mcp`.
3. Read the current document with Feishu OpenAPI.
4. Generate a conservative edit plan first when the requested changes are bold.
5. Write back through Feishu OpenAPI using document blocks, tables, and images rather than flattening everything to plain Markdown when native blocks are available.
6. Re-read or inspect the document after updating to verify the expected headings, blocks, and table counts.

Use native Feishu tables for matrices, checklists, comparison grids, timelines, owner/status lists, and prioritization views. Use whiteboards for architecture, process, dependency, org, and cause-analysis diagrams.

## Bundled Script

Use `scripts/lark-doc-writeback.mjs` for repeatable write-back work:

```bash
node scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input output.md \
  --mode structured \
  --plan-output plan.json
```

The script defaults to dry-run and prints a block plan. Add `--apply` only after confirming the plan:

```bash
LARK_MCP_APP_ID=<app_id> node scripts/lark-doc-writeback.mjs \
  --doc "https://example.feishu.cn/docx/..." \
  --input output.md \
  --mode structured \
  --apply
```

Use `--append` instead of the default replace behavior when preserving existing document content.
