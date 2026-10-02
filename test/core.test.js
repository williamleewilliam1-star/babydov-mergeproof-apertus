import test from "node:test";
import assert from "node:assert/strict";
import { extractIssueRefs, fallbackAnalysis, parseJsonText, parsePullRequestUrl } from "../src/core.js";

test("parses public GitHub PR URLs", () => {
  assert.deepEqual(
    parsePullRequestUrl("https://github.com/risa-labs-inc/BossConsole/pull/1681"),
    { owner: "risa-labs-inc", repo: "BossConsole", number: 1681 }
  );
  assert.throws(() => parsePullRequestUrl("https://example.com/x"), /Only public GitHub/);
});

test("extracts closing and reference issue numbers", () => {
  assert.deepEqual(extractIssueRefs("Fixes #1632 and refs #100"), [1632, 100]);
});

test("parses fenced model JSON", () => {
  assert.deepEqual(parseJsonText("```json\n{\"ok\":true}\n```"), { ok: true });
});

test("fallback never calls an unmerged PR accepted", () => {
  const analysis = fallbackAnalysis({
    pr: { merged: false, owner: "o", repo: "r", title: "t", changed_files: 1, additions: 2, deletions: 1 },
    release_matches: []
  });
  assert.equal(analysis.status, "NOT_MERGED");
  assert.match(analysis.portfolio_statement, /^Open contribution/);
});
