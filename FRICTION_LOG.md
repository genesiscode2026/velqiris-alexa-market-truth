# VELQIRIS — DEVELOPER FRICTION LOG & PRODUCT FEEDBACK

- **Competition:** Build, Ship, Shape: Amazon Developer Hackathon
- **Submission:** Devpost #1225753
- **Primary track:** Alexa+
- **Evidence date:** October 19, 2026
- **Purpose:** Optional friction-log evidence for the judging bonus of up to 10%

Every observation below comes from building or testing this repository. Suggested improvements are proposals, not claims about unpublished Amazon systems.

## Friction 1 — No public Alexa+ validation client for hackathon entrants

- **Task attempted:** Connect and validate a self-hosted MCP server against the Alexa+ development environment.
- **Steps taken:** Reviewed the hackathon rules, resources, and FAQ; checked the listed Alexa+ Category SDK, MCP Toolkit, CLI, and Web Simulator access path.
- **Expected result:** A public test client or simulator that could run the MCP lifecycle against a participant endpoint.
- **Actual result:** The official FAQ states that these tools are preview-only for selected partners. Hackathon entrants are directed to demonstrate a self-hosted MCP server through their own web client or simulator.
- **Severity:** High. It prevents device-runtime validation and makes participant-built test harnesses part of the critical path.
- **Workaround used:** Built a browser MCP client that performs `initialize`, `notifications/initialized`, `tools/list`, and `tools/call` over Streamable HTTP. The demo labels itself as a developer simulation and makes no consumer Alexa connection or certification claim.
- **Actionable suggestion:** Publish a read-only Alexa+ reference client for hackathons with request/response traces and a small conformance fixture. It should test lifecycle messages, protocol headers, Origin handling, tool discovery, calls, notifications, and structured errors.

## Friction 2 — Stateful MCP sessions do not map cleanly to stateless functions

- **Task attempted:** Keep the MCP endpoint usable both as a self-hosted Node.js server and as a public serverless endpoint.
- **Steps taken:** Implemented a stateful local Streamable HTTP server with `Mcp-Session-Id`, then exercised the same lifecycle through the Netlify function used by the browser demo.
- **Expected result:** One transport design that behaves predictably in both long-lived and distributed serverless runtimes.
- **Actual result:** Session state is natural in the long-lived Node.js server, while a serverless function cannot assume that later requests reach the same process. Reusing the in-memory session design would create unreliable sticky-state behavior.
- **Severity:** High for hosted evaluation because a successful handshake could be followed by a request handled by another instance.
- **Workaround used:** Kept the local server stateful and made the Netlify endpoint explicitly stateless. The public endpoint never emits or requires `Mcp-Session-Id`; deterministic tests assert that behavior across the full client sequence.
- **Actionable suggestion:** Add side-by-side official examples for stateful and stateless Streamable HTTP deployments, including when session identifiers are optional and how clients should continue without them.

## Friction 3 — Browser security and MCP transport rules must be implemented together

- **Task attempted:** Call the MCP endpoint directly from a browser-based Alexa+ simulation.
- **Steps taken:** Sent JSON-RPC POST requests from the public demo, added the MCP protocol-version header, implemented the initialized notification, and tested trusted and untrusted `Origin` values.
- **Expected result:** A documented browser recipe covering CORS preflight, allowed request headers, exposed response headers, and MCP Origin validation.
- **Actual result:** MCP security guidance and browser CORS behavior must be combined manually. Allowing every Origin weakens DNS-rebinding protection, while omitting CORS headers prevents the real browser client from completing the handshake.
- **Severity:** Medium. Incorrect configuration either blocks the demo or broadens the endpoint's browser attack surface.
- **Workaround used:** Added an explicit Origin allowlist, HTTP 403 for untrusted origins, narrow CORS methods and headers, HTTP 202 with an empty body for notifications, and negative tests for each boundary.
- **Actionable suggestion:** Publish a browser-client security checklist and reference implementation that treats Origin validation and CORS as one end-to-end configuration.

## Friction 4 — Public venue observations have different semantics

- **Task attempted:** Produce one multi-venue spot snapshot from Coinbase, Binance, and OKX.
- **Steps taken:** Called Coinbase's USD spot endpoint and Binance/OKX USDT endpoints, normalized asset symbols, rejected non-positive values, required two successful venues, computed the median, and reported dispersion in basis points.
- **Expected result:** Comparable venue observations with consistent quote currency and timestamp semantics.
- **Actual result:** The public endpoints differ in symbols and response shape, and USD and USDT are not identical units. The current public APIs also do not provide one uniform per-venue timestamp field through these selected calls.
- **Severity:** Medium for interpretation. The result is useful as an indicative snapshot but cannot be presented as a tradeable quote or a cryptographically attested market truth.
- **Workaround used:** The UI and submission explicitly call the result an indicative USD/USDT snapshot, disclose the venues, return the contributing values, and avoid staleness, attestation, or execution claims.
- **Actionable suggestion:** Encourage hackathon examples to show unit normalization, per-source timestamps, staleness policy, provenance, and explicit limitations whenever agents aggregate third-party data.

## Product feedback

### Tools, APIs, and SDKs used

- Model Context Protocol version `2025-11-25` and JSON-RPC 2.0 for lifecycle, discovery, and tool calls.
- Node.js 20 native HTTP and `fetch` for the stateful server and venue adapters.
- Netlify Functions for the public stateless endpoint.
- Coinbase, Binance, and OKX public REST endpoints for indicative spot observations.
- A browser client for the simulated Alexa+ interaction.

### What worked well

MCP tool schemas made discovery and input validation explicit. JSON-RPC errors were straightforward to exercise with deterministic tests. Node.js native APIs kept the runtime small. The hackathon's simulated-experience path allowed a complete end-to-end browser demonstration despite the restricted Alexa+ partner tooling.

### What needs work

Participants would benefit from an official public Alexa+ reference client, a transport conformance fixture, and paired stateful/serverless deployment examples. Browser Origin and CORS guidance should be presented as one recipe. Third-party-data examples should model unit and timestamp differences explicitly.

### Onboarding experience

The protocol concepts were understandable, but a reliable end-to-end implementation required reading the transport details, building a client harness, separating stateful and stateless behavior, and writing negative tests. The hackathon FAQ was essential because it clarified that participants cannot access the gated Alexa+ tools and may use their own web client.

### Would we build with these tools again?

**Yes.** MCP gives agent tools a clear, inspectable contract, and the simulated Alexa+ path supports meaningful prototyping. For production financial use, the next iteration would add authenticated sources, per-venue timestamps, staleness rejection, longer time-series evidence, and operational monitoring.
