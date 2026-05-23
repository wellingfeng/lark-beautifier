# Contributing

## Development

```bash
npm install
npm test
npm run check
npm run lint:md
```

Run the standalone skill self-check:

```bash
node skills/lark-beautifier/scripts/self-check.mjs
```

Validate the skill metadata:

```bash
python <path-to-skill-creator>/scripts/quick_validate.py skills/lark-beautifier
```

## Security

- Do not commit Feishu app secrets, user access tokens, refresh tokens, or local OAuth storage.
- Use `.env` locally and keep `.env.example` as the committed template.
- Write-back helpers must default to dry-run and require an explicit `--apply`.
