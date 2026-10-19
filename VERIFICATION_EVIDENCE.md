# VERIFICATION EVIDENCE

**Project:** VELQIRIS Market Truth & Consensus MCP Server

**Last clean run:** October 19, 2026

The commands below are project-owned verification. They do not represent Amazon or MCP certification.

## Deterministic test suite

Command:

```bash
npm test
```

Result:

```text
tests 23
suites 1
pass 23
fail 0
cancelled 0
skipped 0
todo 0
```

Covered behaviors include:

- no `Mcp-Session-Id` in serverless responses;
- stateless `tools/list` and full browser-client workflow;
- GET and DELETE rejected with HTTP 405 on the public MCP endpoint;
- notifications accepted with HTTP 202 and an empty body;
- untrusted Origin rejected with HTTP 403;
- incompatible protocol-version header rejected with HTTP 400;
- missing and unsupported symbols rejected before external calls;
- `initialize` returns MCP version `2025-11-25` and capabilities;
- deterministic multi-venue median and fail-closed regime refusal;
- local stateful session, lifecycle, tool, resource, and negative cases.

## Project verifier

Command:

```bash
npm run verify:mcp
```

Result:

```text
INTERNAL VERIFICATION COMPLETE: 40/40 ASSERTIONS PASSED
SPECIFICATION TARGET: Model Context Protocol v2025-11-25
TRANSPORTS: Streamable HTTP (local stateful) and Netlify HTTP (stateless)
```

## Public browser walkthrough

URL: https://velqiris-acquisition.netlify.app/alexa-simulation.html

Observed sequence:

1. The page displays `MCP Connected` and two available tools after `initialize`, `notifications/initialized`, and `tools/list`.
2. `get_market_truth_consensus` returns an indicative multi-venue snapshot when at least two venue calls succeed.
3. `verify_risk_regime` returns `REGIME_VERIFICATION_REFUSED`, `risk_status: INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST`, `regime: null`, and `confidence: 0`.

## Published submission evidence

- Devpost: https://devpost.com/software/velqiris-alexa-market-truth-agent
- Video: https://youtu.be/McAWFS6xotU
- Source: https://github.com/genesiscode2026/velqiris-alexa-market-truth
