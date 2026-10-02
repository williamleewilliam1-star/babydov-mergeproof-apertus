import {
  buildApertusPrompt,
  extractIssueRefs,
  fallbackAnalysis,
  parseJsonText,
  parsePullRequestUrl,
  sanitizeAnalysis
} from "../src/core.js";

function json(res, status, payload) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(payload));
}

async function gh(path, accept = "application/vnd.github+json") {
  const headers = {
    accept,
    "user-agent": "BABYDOV-MergeProof/0.1",
    "x-github-api-version": "2022-11-28"
  };
  const token = String(process.env.GITHUB_TOKEN || "").trim();
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch("https://api.github.com" + path, {
    headers,
    signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`GitHub API failed: HTTP ${response.status}`);
  return response.json();
}
async function collectEvidence(ref) {
  const prefix = `/repos/${ref.owner}/${ref.repo}`;
  const pr = await gh(`${prefix}/pulls/${ref.number}`);
  const files = await gh(`${prefix}/pulls/${ref.number}/files?per_page=100`);
  const issueRefs = extractIssueRefs(pr.body);
  const linked_issues = [];
  for (const number of issueRefs.slice(0, 10)) {
    try {
      const issue = await gh(`${prefix}/issues/${number}`);
      linked_issues.push({
        number,
        title: issue.title,
        state: issue.state,
        url: issue.html_url
      });
    } catch {}
  }

  let releases = [];
  try { releases = await gh(`${prefix}/releases?per_page=30`); } catch {}
  const needleA = `#${ref.number}`;
  const needleB = `/${ref.repo}/pull/${ref.number}`;
  const release_matches = releases.filter(r => {
    const body = String(r.body || "");
    return body.includes(needleA) || body.includes(needleB);
  }).map(r => ({
    tag: r.tag_name,
    name: r.name,
    published_at: r.published_at,
    url: r.html_url
  }));
  return {
    fetched_at: new Date().toISOString(),
    pr: {
      owner: ref.owner,
      repo: ref.repo,
      number: ref.number,
      url: pr.html_url,
      title: pr.title,
      body: String(pr.body || "").slice(0, 12000),
      author: pr.user?.login || null,
      merged: Boolean(pr.merged),
      merged_at: pr.merged_at,
      base: pr.base?.ref || null,
      head: pr.head?.ref || null,
      merge_commit_sha: pr.merge_commit_sha || null,
      additions: pr.additions,
      deletions: pr.deletions,
      changed_files: pr.changed_files
    },
    files: files.map(f => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes
    })),
    linked_issues,
    release_matches
  };
}
export async function apertureAnalyze(evidence, language) {
  const base = String(process.env.APERTUS_BASE_URL || "").replace(/\/$/, "");
  const model = String(process.env.APERTUS_MODEL || "swiss-ai/Apertus-v1.5-8B");
  if (!base) return {
    mode: "deterministic-fallback",
    model: null,
    analysis: fallbackAnalysis(evidence, language)
  };

  const headers = { "content-type": "application/json" };
  const key = String(process.env.APERTUS_API_KEY || "").trim();
  if (key) headers.authorization = `Bearer ${key}`;
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: "Return evidence-grounded JSON only." },
        { role: "user", content: buildApertusPrompt(evidence, language) }
      ]
    }),
    signal: AbortSignal.timeout(60000)
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Apertus endpoint failed: HTTP ${response.status} — ${raw.slice(0, 300)}`);
  const payload = JSON.parse(raw);
  const content = payload?.choices?.[0]?.message?.content;
  return {
    mode: "apertus",
    model: payload.model || model,
    analysis: sanitizeAnalysis(parseJsonText(content), evidence, language)
  };
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    return json(res, 200, {
      ok: true,
      service: "MergeProof",
      apertus_configured: Boolean(process.env.APERTUS_BASE_URL),
      version: "0.1.0"
    });
  }
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const ref = parsePullRequestUrl(req.body?.url);
    const language = String(req.body?.language || "English").slice(0, 80);
    const evidence = await collectEvidence(ref);
    const modelResult = await apertureAnalyze(evidence, language);
    return json(res, 200, { product: "MergeProof", evidence, ...modelResult });
  } catch (error) {
    return json(res, 400, { error: error.message });
  }
}

export { collectEvidence };
