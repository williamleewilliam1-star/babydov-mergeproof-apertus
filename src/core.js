export function parsePullRequestUrl(value) {
  const url = new URL(String(value || "").trim());
  if (url.hostname !== "github.com") throw new Error("Only public GitHub PR URLs are supported.");
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 4 || parts[2] !== "pull" || !/^\d+$/.test(parts[3])) {
    throw new Error("Expected a GitHub pull request URL.");
  }
  return { owner: parts[0], repo: parts[1], number: Number(parts[3]) };
}

export function extractIssueRefs(body) {
  const text = String(body || "");
  const refs = new Set();
  const patterns = [
    /\b(?:fix(?:e[sd])?|close[sd]?|resolve[sd]?)\s+#(\d+)/gi,
    /\brefs?\s+#(\d+)/gi
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) refs.add(Number(match[1]));
  }
  return [...refs];
}

export function parseJsonText(text) {
  const clean = String(text || "").replace(/^\s*```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try { return JSON.parse(clean); } catch {}
  const a = clean.indexOf("{");
  const b = clean.lastIndexOf("}");
  if (a >= 0 && b > a) return JSON.parse(clean.slice(a, b + 1));
  throw new Error("Apertus returned non-JSON output.");
}
export function compactEvidence(evidence) {
  return {
    pr: {
      url: evidence.pr.url,
      title: evidence.pr.title,
      merged: evidence.pr.merged,
      merged_at: evidence.pr.merged_at,
      author: evidence.pr.author,
      base: evidence.pr.base,
      head: evidence.pr.head,
      additions: evidence.pr.additions,
      deletions: evidence.pr.deletions,
      changed_files: evidence.pr.changed_files
    },
    files: evidence.files.slice(0, 40),
    linked_issues: evidence.linked_issues.slice(0, 10),
    release_matches: evidence.release_matches.slice(0, 10)
  };
}

export function fallbackAnalysis(evidence, language = "English") {
  const released = evidence.release_matches.length > 0;
  return {
    status: evidence.pr.merged ? "MERGED" : "NOT_MERGED",
    language,
    technical_summary: evidence.pr.merged
      ? `Merged contribution touching ${evidence.pr.changed_files} file(s), with ${evidence.pr.additions} additions and ${evidence.pr.deletions} deletions.`
      : "The pull request is not merged, so MergeProof does not present it as an accepted contribution.",
    portfolio_statement: evidence.pr.merged
      ? `Merged contributor to ${evidence.pr.owner}/${evidence.pr.repo}: ${evidence.pr.title}`
      : `Open contribution to ${evidence.pr.owner}/${evidence.pr.repo}: ${evidence.pr.title}`,
    claims: [
      {
        claim: evidence.pr.merged ? "The contribution was merged." : "The contribution has not been merged.",
        evidence_refs: ["pr.merged", "pr.merged_at"]
      },
      {
        claim: released
          ? "The PR is referenced by at least one fetched release note."
          : "No fetched release note explicitly references this PR.",
        evidence_refs: ["release_matches"]
      }
    ],
    caveats: [
      "Fallback mode is deterministic and does not infer unobserved technical impact.",
      "Enable Apertus to produce multilingual synthesis while preserving evidence references."
    ]
  };
}

export function buildApertusPrompt(evidence, language) {
  return [
    "You are MergeProof, an evidence-first open-source contribution analyst.",
    "Use ONLY the supplied JSON evidence. Do not infer impact not supported by it.",
    `Write the output in ${language || "English"}.`,
    "Return ONLY JSON with keys: status, language, technical_summary, portfolio_statement, claims, caveats.",
    "claims must be an array of objects {claim, evidence_refs}.",
    "Each evidence_refs entry must point to a concrete path such as pr.merged, files[0], linked_issues[0], release_matches[0].",
    "If evidence is missing, say unknown instead of guessing.",
    "Do not claim payment, bounty status, security impact, release inclusion, or authorship unless evidence supports it.",
    "",
    JSON.stringify(compactEvidence(evidence))
  ].join("\n");
}
