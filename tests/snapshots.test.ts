import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { beautifyMarkdown } from "../src/index.js";

describe("example snapshot", () => {
  it("matches the checked-in example output", async () => {
    const raw = await readFile(join(process.cwd(), "examples", "raw.md"), "utf8");
    const expected = await readFile(join(process.cwd(), "examples", "beautified.md"), "utf8");

    expect(beautifyMarkdown(raw)).toBe(expected);
  });
});
