#!/usr/bin/env node
import fs from "node:fs/promises";
import { apertureAnalyze, collectEvidence } from "../api/analyze.js";
import { parsePullRequestUrl } from "../src/core.js";

const prUrl = process.argv[2] || "https://github.com/risa-labs-inc/BossConsole/pull/1681";
const outputPath = process.argv[3] || "";
const languages = ["English", "German", "French", "Russian"];

if (!process.env.APERTUS_BASE_URL) {
  console.error("APERTUS_BASE_URL is required for a live evaluation.");
  process.exit(2);
}

const ref = parsePullRequestUrl(prUrl);
const evidence = await collectEvidence(ref);
const rows = [];

for (const language of languages) {
  const started = Date.now();
  const result = await apertureAnalyze(evidence, language);
  const analysis = result.analysis || {};
  const claims = Array.isArray(analysis.claims) ? analysis.claims : [];
  const invalid = claims.filter(claim =>
    !Array.isArray(claim.evidence_refs) || claim.evidence_refs.length === 0
  );

  rows.push({
    language,
    mode: result.mode,
    model: result.model,
    duration_ms: Date.now() - started,
    status: analysis.status,
    claim_count: claims.length,
    unsupported_claims_after_sanitizer: invalid.length,
    grounding: analysis.grounding || null,
    evidence_refs: claims.map(claim => claim.evidence_refs || [])
  });
}

const expectedStatus = evidence.pr.merged ? "MERGED" : "NOT_MERGED";
const report = {
  schema: "mergeproof.live_eval.v1",
  generated_at: new Date().toISOString(),
  pr: {
    url: evidence.pr.url,
    merged: evidence.pr.merged,
    merged_at: evidence.pr.merged_at,
    changed_files: evidence.pr.changed_files,
    linked_issue_count: evidence.linked_issues.length,
    release_match_count: evidence.release_matches.length
  },
  invariant: {
    expected_status: expectedStatus,
    all_languages_status_stable: rows.every(row => row.status === expectedStatus),
    all_claims_have_refs: rows.every(row => row.unsupported_claims_after_sanitizer === 0)
  },
  runs: rows
};

const rendered = JSON.stringify(report, null, 2) + "\n";
if (outputPath) {
  await fs.writeFile(outputPath, rendered, { encoding: "utf8", flag: "wx" });
  console.error(`Wrote redacted live evaluation to ${outputPath}`);
}
process.stdout.write(rendered);

if (!report.invariant.all_languages_status_stable || !report.invariant.all_claims_have_refs) {
  process.exitCode = 3;
}
