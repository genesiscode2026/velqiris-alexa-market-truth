# VELQIRIS — FINAL DEMO NARRATIVE

- **Submission:** Devpost #1225753
- **Published video:** https://youtu.be/McAWFS6xotU
- **Runtime:** approximately 2 minutes 20 seconds
- **Status:** Public YouTube demonstration, under the three-minute limit

## 00:00–00:20 — Problem and boundary

Financial assistants need source-aware answers. One venue cannot establish a market-wide price, and one spot snapshot cannot establish a market regime. VELQIRIS demonstrates an Alexa+ interaction concept that reports the available evidence and refuses unsupported conclusions.

## 00:20–01:05 — Real browser MCP client

The browser shows a developer simulation, not a consumer Alexa connection. On load it performs the MCP lifecycle against the public endpoint: `initialize`, `notifications/initialized`, `tools/list`, and `tools/call`.

The consensus tool requests Coinbase USD plus Binance and OKX USDT observations. When at least two venues respond, it returns their values, the statistical median, the source count, and dispersion in basis points. The result is an indicative USD/USDT snapshot, not a tradeable quote.

## 01:05–01:30 — Fail-closed regime tool

The second tool demonstrates the safety boundary. A point-in-time observation cannot establish a market regime, so the public endpoint returns `REGIME_VERIFICATION_REFUSED`, `risk_status: INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST`, `regime: null`, and `confidence: 0`.

## 01:30–01:58 — Tested MCP implementation

The repository includes a stateful local Streamable HTTP server and a stateless serverless transport, both targeting MCP `2025-11-25`. The terminal demonstration shows the project-owned verifier and deterministic test suite. These checks cover lifecycle requests, tools, input validation, Origin rejection, protocol-version handling, notification responses, quorum behavior, and refusal behavior. They are internal engineering evidence, not Amazon certification.

## 01:58–02:20 — Architecture and open-source delivery

The final architecture view shows the browser client, MCP endpoint, venue adapters, median calculation, dispersion reporting, and fail-closed boundary. The public GitHub repository contains the MIT license, complete source, setup instructions, tests, disclosure of pre-existing technology, and the developer friction log.

## Truth disclosures

- The browser is a simulated Alexa+ experience permitted by the competition rules.
- The project is not connected to a consumer Alexa account and is not certified or endorsed by Amazon.
- USD and USDT observations are disclosed as indicative and are not treated as identical tradeable quotes.
- The project does not claim per-venue timestamps, staleness rejection, cryptographic attestations, order execution, or a verified market regime.
