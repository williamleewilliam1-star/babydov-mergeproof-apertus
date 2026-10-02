import test from "node:test";
import assert from "node:assert/strict";
import { extractIssueRefs, fallbackAnalysis, parseJsonText, parsePullRequestUrl, sanitizeAnalysis } from "../src/core.js";

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
test("sanitizer overrides model status and drops unsupported claims", () => {
  const evidence = {
    pr: {
      merged: true,
      merged_at: "2026-09-25T06:11:47Z",
      owner: "o",
      repo: "r",
      title: "fix",
      changed_files: 1,
      additions: 2,
      deletions: 1
    },
    files: [{ filename: "src/a.js" }],
    linked_issues: [],
    release_matches: []
  };
  const analysis = sanitizeAnalysis({
    status: "NOT_MERGED",
    language: "German",
    technical_summary: "Model summary",
    portfolio_statement: "Model portfolio line",
    claims: [
      { claim: "Merged", evidence_refs: ["pr.merged"] },
      { claim: "Paid bounty", evidence_refs: ["payments.confirmed"] }
    ],
    caveats: []
  }, evidence, "German");

  assert.equal(analysis.status, "MERGED");
  assert.equal(analysis.claims.length, 1);
  assert.equal(analysis.claims[0].claim, "Merged");
  assert.equal(analysis.grounding.rejected_claims, 1);
  assert.match(analysis.caveats.join(" "), /removed/i);
});
