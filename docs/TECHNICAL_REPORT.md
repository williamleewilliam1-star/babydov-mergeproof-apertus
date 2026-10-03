# MergeProof — technical report

## System claim

MergeProof separates repository facts from model synthesis.

The deterministic layer collects a public GitHub pull request, changed files, linked issues and release references. Apertus receives only a compact evidence packet. Model claims are accepted only when their `evidence_refs` resolve to real fields in that packet.

This design keeps merge state and release evidence outside the language model.

## Real external benchmark

Benchmark target:

`https://github.com/risa-labs-inc/BossConsole/pull/1681`

Command:

```bash
BENCH_RUNS=5 npm run benchmark:evidence -- \
  "https://github.com/risa-labs-inc/BossConsole/pull/1681" \
  "artifacts/benchmark-bossconsole-1681.json"
```

No GitHub token was used for the recorded run.
### Observed result

Across 5 independent evidence collections:

- stable result: **yes**
- merged: **true**
- changed files: **2**
- linked issues: **1**
- matching release references: **1**
- compact evidence size: **1,060 bytes** in every run
- latency min: **990.58 ms**
- latency median: **1,127.70 ms**
- latency p90: **1,144.74 ms**
- latency max: **4,568.08 ms**

The slow maximum is retained rather than discarded. It reflects public-network/API variability and is why MergeProof uses explicit request timeouts.

Machine-readable evidence: `artifacts/benchmark-bossconsole-1681.json`.

## Grounding controls

The automated suite verifies that:

1. an unmerged PR cannot be promoted to MERGED by model output;
2. model claims without evidence refs are removed;
3. refs to nonexistent paths are removed;
4. a ref such as `files[0].nonexistent` is invalid even when `files[0]` exists;
5. the same grounding rules hold for English, German, French and Russian.
## Apertus deployment

MergeProof supports three OpenAI-compatible Apertus paths without changing application logic:

- CSCS managed inference;
- Public AI for lightweight hosted testing;
- local or sovereign OpenAI-compatible Apertus serving.

`npm run verify:apertus` checks the provider's `/v1/models` response before a live demo. API keys remain server-side.

## Cost and scalability observations

The GitHub evidence collector needs no database and the measured evidence packet for the demonstrated PR is only 1,060 bytes.

The language model does not ingest a full repository. It receives a bounded packet of PR metadata, at most 40 changed-file summaries, at most 10 linked issues and at most 10 release matches. This bounds prompt growth independently of repository size.

Public GitHub access works without credentials for low-volume demos; an optional server token can raise API rate limits without changing browser code.

## Current limitation

The evidence pipeline and deterministic grounding tests are complete and measured.

Live Apertus multilingual latency/quality measurements remain **pending provider API access**. They will be recorded separately with `npm run eval:live`; this report does not fabricate model benchmark numbers before that run exists.
