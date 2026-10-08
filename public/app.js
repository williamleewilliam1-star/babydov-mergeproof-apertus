const $ = id => document.getElementById(id);
function el(tag, value, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = String(value ?? "");
  return element;
}
function row(left, value) {
  const item = el("div", "", "row");
  item.append(left, el("span", value));
  return item;
}
function safeLink(value, label) {
  try {
    const url = new URL(String(value));
    if (url.protocol === "https:" && url.hostname === "github.com") {
      const link = el("a", label);
      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      return link;
    }
  } catch {}
  return el("span", label);
}
function render(data) {
  const e = data.evidence;
  const a = data.analysis;
  $("result").classList.remove("hidden");
  $("status").replaceChildren(el("strong", data.mode), document.createTextNode(" · " + String(data.model || "no model configured")));
  $("title").textContent = String(e.pr.title || "");
  const facts = [
    ["Merged", e.pr.merged ? "yes" : "no"],
    ["Merged at", e.pr.merged_at || "—"],
    ["Files", e.pr.changed_files],
    ["Diff", "+" + e.pr.additions + " / -" + e.pr.deletions]
  ].map(([k,v]) => {
    const item = document.createElement("div");
    item.append(el("span", k), el("strong", v));
    return item;
  });
  $("facts").replaceChildren(...facts);
  $("portfolio").textContent = String(a.portfolio_statement || "");
  $("summary").textContent = String(a.technical_summary || "");
  $("claims").replaceChildren(...(a.claims || []).map(c => {
    const article = el("article", "", "claim");
    article.append(el("p", c.claim), el("small", (c.evidence_refs || []).join(" · ")));
    return article;
  }));
  $("files").replaceChildren(...(e.files || []).map(f =>
    row(el("code", f.filename), "+" + f.additions + " / -" + f.deletions)
  ));
  $("issues").replaceChildren(...((e.linked_issues || []).length
    ? e.linked_issues.map(i => row(safeLink(i.url, "#" + i.number + " " + i.title), i.state))
    : [el("p", "No linked issue reference found.", "fine")]));
  $("releases").replaceChildren(...((e.release_matches || []).length
    ? e.release_matches.map(r => row(safeLink(r.url, r.tag), r.published_at))
    : [el("p", "No fetched release explicitly references this PR.", "fine")]));
}
$("form").addEventListener("submit", async event => {
  event.preventDefault();
  $("run").disabled = true;
  $("status").textContent = "Collecting GitHub evidence…";
  $("result").classList.add("hidden");
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: $("url").value, language: $("language").value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Analysis failed.");
    render(data);
  } catch (error) {
    $("status").textContent = String(error.message);
  } finally {
    $("run").disabled = false;
  }
});
