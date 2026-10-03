# MergeProof — Devpost submission draft

## Project title
MergeProof

## Track
Apertus Adoption — Own Project (Track 2B)

## One-line summary
An evidence-first multilingual contributor dossier generator that lets Apertus explain public GitHub contributions without letting the model rewrite repository facts.

## Problem
A merged pull request is a strong reputation signal, but badges and profile activity rarely explain what a contribution actually proves. Non-maintainers often cannot tell the difference between opened vs merged work, linked issues vs assumed impact, release inclusion vs repository activity, technical evidence vs payment evidence, or source facts vs persuasive model prose.

MergeProof turns one public GitHub PR into a compact, evidence-linked dossier.
## What it does
1. Accepts a public GitHub pull-request URL.
2. Collects deterministic GitHub evidence: merge state, changed files, linked issues and release references.
3. Builds a bounded evidence packet instead of sending an entire repository to a model.
4. Sends that packet to Apertus through an OpenAI-compatible endpoint.
5. Requires every model claim to include evidence references.
6. Requires technical summary and portfolio statement to carry their own supporting refs.
7. Rejects invalid references and unsupported high-risk claims.
8. Overrides model merge status with GitHub source truth.
9. Produces the same grounded dossier logic in English, German, French and Russian.

## Why Apertus is essential
Apertus performs the multilingual explanation step. GitHub is the factual source; Apertus is the communication layer. The model is useful because the reader may not read code or may prefer another language. It is intentionally not trusted to decide whether a PR merged, whether it shipped, or whether it was paid.

## Demonstrated contribution
Input: `https://github.com/risa-labs-inc/BossConsole/pull/1681`

Observed evidence:
- merged: true
- changed files: 2
- linked issues: 1 (#1632)
- release references: 1 (BOSS v9.5.25)
## Real Apertus evaluation
Model: `m1rkocasu/Apertus-v1.5-8B-text-MLX-mxfp4`

Runtime:
- local Apple Silicon
- mlx-lm 0.31.3
- OpenAI-compatible loopback server
- thinking disabled for structured JSON completion

Languages tested: English, German, French, Russian.

Observed invariants:
- MERGED status stable in 4/4 languages
- invalid accepted evidence refs: 0
- unsupported accepted narrative fields after sanitizer: 0
- grounded technical summary + portfolio statement: 4/4
- format repair required: 0/4 in the committed final run

Latency in the committed live run:
- English: 17,498 ms
- German: 13,373 ms
- French: 12,807 ms
- Russian: 20,286 ms
- median: 15,435.5 ms

Machine-readable artifact: `artifacts/live-eval-local-apertus-mxfp4-20261003.json`
## Evidence benchmark
Five anonymous GitHub evidence collections against BossConsole #1681 produced stable facts in every run.

Measured latency:
- min: 990.58 ms
- median: 1,127.70 ms
- p90: 1,144.74 ms
- max: 4,568.08 ms

Compact evidence packet size: 1,060 bytes.
Artifact: `artifacts/benchmark-bossconsole-1681.json`

## Track 2B judging alignment
### Purposeful use of AI
Apertus converts technical evidence into multilingual human-readable output while the deterministic layer retains authority over facts.

### Technical rigour
Evidence references are validated down to the cited field. Merge and release claims are source-gated. Unsupported payment/bounty claims are rejected. Multilingual grounding behavior is tested.

### Value, cost & scalability
MergeProof is stateless, requires no database, and sends a bounded evidence packet rather than a full repository to the model.

### Sovereign deployability
The model boundary is OpenAI-compatible. The same application can use local, sovereign-hosted, CSCS-managed or compatible Apertus infrastructure without changing the evidence pipeline.

### Implementation feasibility
The end-to-end evidence path and real local Apertus inference have already been exercised against an external merged PR.
## Reproducibility
From a clean checkout:

```bash
npm test
npm run benchmark:evidence -- "https://github.com/risa-labs-inc/BossConsole/pull/1681" "artifacts/benchmark-local.json"
npm run submission:check
```

For live Apertus:

```bash
APERTUS_BASE_URL=http://127.0.0.1:8000/v1
APERTUS_MODEL=m1rkocasu/Apertus-v1.5-8B-text-MLX-mxfp4
APERTUS_ENABLE_THINKING=false
npm run verify:apertus
npm run eval:live -- "https://github.com/risa-labs-inc/BossConsole/pull/1681"
```

## Open-source licensing
- Code: Apache License 2.0
- Documentation/design text: CC-BY-4.0
- No training dataset is submitted.

## Known limitations
- The committed model benchmark uses a community MLX quantization of Apertus 1.5 8B, not the official CSCS managed endpoint.
- Final organizer-facing hosted inference should be repeated on the intended official/hosted Apertus endpoint if credentials are available before submission.
- Public GitHub API access is rate-limited; an optional server-side token can raise limits.
- MergeProof proves only what its evidence schema contains. It intentionally does not establish payment, bounty acceptance, security severity, or business impact.
## Repository
https://github.com/williamleewilliam1-star/babydov-mergeproof-apertus

## Suggested demo flow
1. Paste BossConsole PR #1681.
2. Show deterministic GitHub evidence.
3. Switch output language.
4. Show Apertus synthesis with evidence refs.
5. Point out that merge status stays source-controlled.
6. Open the machine-readable live evaluation artifact.
7. Show the sovereign deployment path and local Apertus model ID.

## Submission checklist
- [x] Public code repository
- [x] Apache-2.0 source license
- [x] CC-BY-4.0 non-code notice
- [x] Technical report
- [x] Reproducible benchmark artifact
- [x] Real Apertus live-eval artifact
- [x] Multilingual grounding tests
- [x] Sovereign deployment documentation
- [x] Automated submission preflight
- [ ] Final hosted/official Apertus run, if credentials become available
