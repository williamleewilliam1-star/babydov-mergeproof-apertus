const $ = id => document.getElementById(id);

async function readJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${path}: HTTP ${response.status}`);
  return response.json();
}

function metric(label, value) {
  const node = document.createElement("div");
  node.className = "metric";
  const strong = document.createElement("strong");
  strong.textContent = String(value);
  const span = document.createElement("span");
  span.textContent = label;
  node.append(strong, span);
  return node;
}

function invariant(label, ok) {
  const node = document.createElement("div");
  node.className = ok ? "invariant ok" : "invariant bad";
  const badge = document.createElement("strong");
  badge.textContent = ok ? "PASS" : "FAIL";
  const text = document.createElement("span");
  text.textContent = label;
  node.append(badge, text);
  return node;
}

function languageCard(run) {
  const node = document.createElement("article");
  node.className = "language-card";
  const head = document.createElement("div");
  head.className = "language-head";
  const name = document.createElement("strong");
  name.textContent = run.language;
  const status = document.createElement("span");
  status.className = run.status === "MERGED" ? "pass-pill" : "warn-pill";
  status.textContent = run.status;
  head.append(name, status);

  const ms = document.createElement("div");
  ms.className = "latency";
  ms.textContent = `${Number(run.duration_ms).toLocaleString()} ms`;

  const refs = document.createElement("small");
  refs.textContent = `claims: ${run.claim_count} · invalid refs: ${run.invalid_evidence_refs.length} · unsupported narratives: ${run.unsupported_narratives_after_sanitizer.length}`;

  node.append(head, ms, refs);
  return node;
}

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[i];
}

async function main() {
  const [live, benchmark] = await Promise.all([
    readJson("./live-eval.json"),
    readJson("./benchmark.json")
  ]);

  $("pr-facts").append(
    metric("merged", live.pr.merged ? "YES" : "NO"),
    metric("changed files", live.pr.changed_files),
    metric("linked issues", live.pr.linked_issue_count),
    metric("release matches", live.pr.release_match_count)
  );

  for (const run of live.runs || []) $("languages").append(languageCard(run));
  $("model").textContent = `Model: ${live.runtime.model} · endpoint: ${live.runtime.endpoint_class} · thinking: ${live.runtime.thinking_enabled ? "on" : "off"}`;

  const inv = live.invariant || {};
  $("invariants").append(
    invariant("Status stable across all four languages", inv.all_languages_status_stable === true),
    invariant("Every accepted claim has evidence refs", inv.all_claims_have_refs === true),
    invariant("Every accepted narrative has evidence refs", inv.all_narratives_have_refs === true)
  );

  const observations = Array.isArray(benchmark.observations) ? benchmark.observations : [];
  const durations = observations.map(x => Number(x.duration_ms)).filter(Number.isFinite).sort((a,b)=>a-b);
  const compactBytes = benchmark.compact_evidence_bytes?.median ?? observations[0]?.compact_evidence_bytes ?? "—";
  const medianMs = Number(benchmark.latency_ms?.median);
  const maxMs = Number(benchmark.latency_ms?.max);
  $("benchmark").append(
    metric("runs", benchmark.run_count ?? observations.length),
    metric("packet bytes", compactBytes),
    metric("median latency", Number.isFinite(medianMs) ? `${medianMs.toFixed(2)} ms` : "—"),
    metric("max latency", Number.isFinite(maxMs) ? `${maxMs.toFixed(2)} ms` : "—")
  );
}

main().catch(error => {
  document.body.insertAdjacentHTML("afterbegin", `<div class="fatal">Demo evidence failed to load: ${String(error.message)}</div>`);
});
