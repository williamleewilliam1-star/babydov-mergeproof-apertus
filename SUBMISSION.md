# MergeProof — Hack Apertus submission dossier

## Track

Apertus Adoption — Own Project (Track 2B)

## Problem

A merged pull request is a strong reputation signal, but it is difficult for non-maintainers to understand what that contribution actually proves.
Profiles and achievement badges show activity; they do not reliably separate:

- merged vs merely opened work,
- issue linkage vs assumed impact,
- release inclusion vs repository activity,
- technical evidence vs payment evidence,
- facts vs persuasive model prose.

MergeProof converts a public GitHub pull request into an evidence-linked multilingual contribution dossier.

## Why Apertus

GitHub supplies the factual substrate. Apertus supplies the multilingual explanation.

The system deliberately constrains Apertus:

1. Fetch public PR metadata, changed files, linked issues, and release references.
2. Compact that evidence into a bounded JSON packet.
3. Ask Apertus for a structured multilingual explanation.
4. Require every model claim to carry one or more `evidence_refs`.
5. Reject model claims whose evidence reference does not exist.
6. Override model merge status with the GitHub source of truth.

The model is useful because the audience may speak another language or may not read code.
The model is not trusted to rewrite repository history.

## Demonstrated example

Input:

```
https://github.com/risa-labs-inc/BossConsole/pull/1681
```

MergeProof independently found:

- PR merged: true
- linked issue: #1632
- changed files: 2
- release reference: BOSS v9.5.25

This is the same real contribution that earned the GitHub Pull Shark achievement.

## Architecture

```text
public GitHub PR URL
        |
 URL allowlist / parser
        |
 GitHub REST evidence collector
        |-- PR state
        |-- changed files
        |-- linked issues
        '-- releases
        |
 compact evidence packet
        |
 Apertus OpenAI-compatible endpoint
        |
 structured JSON claims
        |
 evidence-ref validator
        |
 multilingual dossier
```

## Track 2B judging fit

### Purposeful use of AI
Apertus translates technical repository evidence into a contributor dossier for humans without letting the model become the evidence source.

### Technical rigour
- GitHub is the source of truth.
- Invalid model evidence references are rejected.
- Merge status is deterministic.
- Optional server-side GitHub token raises rate limits without exposing credentials.
- Network calls use explicit timeouts.
- Unit, integration, and live public-PR tests exist.

### Value, cost & scalability
- Stateless request/response architecture.
- No database required for the MVP.
- Public GitHub calls can run anonymously; a server token is optional.
- 8B Apertus is sufficient for constrained synthesis because evidence collection is deterministic.
- Model prompt receives compact evidence rather than full repositories.

### Sovereign deployability
- Apertus endpoint is configurable.
- No dependency on a proprietary LLM API.
- Can run against a locally or sovereign-hosted OpenAI-compatible Apertus deployment.
- Deterministic fallback still exposes the evidence bundle when no model is configured.

### Implementation feasibility
The GitHub evidence pipeline is already working on a real external repository.
The remaining deployment task is connecting an Apertus inference endpoint and publishing the web demo.

## Current status

- Public GitHub repository: ready.
- Apache-2.0 code license: ready.
- CC-BY-4.0 documentation/design notice: ready.
- Real BossConsole PR evidence test: passing.
- Hack Apertus Devpost registration: complete.
- Apertus inference endpoint: pending access/configuration.
- External live deployment: pending.
