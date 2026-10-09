# VELQIRIS — DEVELOPER FRICTION LOG & AMAZON PRODUCT FEEDBACK
**Competition:** Amazon Alexa Developer Hackathon (Devpost #1225753)  
**Track:** Alexa+ / Model Context Protocol (MCP)  
**Evaluation Target:** 10% Official Judging Bonus for Technical Product Feedback  
**Date:** October 2026  

---

## PART 1: STRUCTURED FRICTION LOG

### Incident 1: Protocol Version Asymmetry & Lack of Backward Compatibility in Early MCP Clients
- **Exact Task:** Negotiating MCP capabilities between client and server via `initialize` RPC handshake.
- **Exact Product / Tool:** Model Context Protocol Specification (`protocolVersion: 2025-11-25` vs `2024-11-05`) & Amazon MCP testing harnesses.
- **Reproduction Steps:**
  1. Client sends JSON-RPC `initialize` request with `protocolVersion: "2024-11-05"`.
  2. Server configured for modern Streamable HTTP spec (`2025-11-25`) rejects or down-negotiates.
  3. Client disconnects with unhandled exception rather than attempting protocol fallback.
- **Expected Result:** MCP specification should define a formal version negotiation array (`supportedProtocolVersions: ["2025-11-25", "2024-11-05"]`) similar to TLS cipher suites, allowing automatic graceful fallback.
- **Actual Result:** Client assumes static single string match, causing immediate session abort.
- **Severity:** High (blocks cross-generation agent interoperability).
- **Workaround:** Implemented explicit client protocol version inspection in `http_mcp_server.js` and structured `-32602` error payloads explaining exact version requirements.
- **Engineering Impact:** Increased server boilerplate by ~40 lines to manage multi-version handshake edge cases.
- **Actionable Recommendation:** Update the official MCP schema to allow `protocolVersion` to be an array of acceptable versions, with the server returning the highest mutual version in `result.protocolVersion`.

---

### Incident 2: Streamable HTTP vs Serverless Execution Deadlocks
- **Exact Task:** Streaming chunked tool output (`Transfer-Encoding: chunked`) from a serverless Lambda / Netlify function to an Alexa agent turn.
- **Exact Product / Tool:** AWS Lambda Node.js runtime / Netlify Functions with Streamable HTTP.
- **Reproduction Steps:**
  1. MCP server begins streaming tool execution progress via chunked HTTP stream.
  2. Function runtime buffers output until function completion instead of flushing TCP segments immediately.
  3. Alexa voice client times out after 1,200ms awaiting conversational stream.
- **Expected Result:** Immediate chunk flushing allows voice agent to emit conversational fillers while tool executes.
- **Actual Result:** Edge proxy buffers until response finishes, defeating the purpose of streaming.
- **Severity:** Medium.
- **Workaround:** Implemented dual transport in `mcp_server.js`: stateless single-turn JSON-RPC for serverless edge functions and native chunked Node.js HTTP server for dedicated hosts.
- **Engineering Impact:** Required maintaining dual transport adapters.
- **Actionable Recommendation:** Amazon should provide official guidance and pre-configured Lambda Response Streaming templates (`awslabs/mcp-lambda-streaming`) for MCP servers.

---

### Incident 3: Fail-Closed Semantic Drift in Conversational LLM Synthesis
- **Exact Task:** Returning explicit market uncertainty / refusal to predict volatility regime (`verify_risk_regime`).
- **Exact Product / Tool:** Conversational LLM reasoning engines consuming MCP `tools/call` JSON outputs.
- **Reproduction Steps:**
  1. MCP tool returns `{ "status": "INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST", "regime": null }`.
  2. LLM receives the tool response and synthesizes a speculative answer to the user anyway: *"Bitcoin seems stable right now based on current prices."*
- **Expected Result:** Model strictly communicates that the regime cannot be calculated and refrains from narrative invention.
- **Actual Result:** Model hallucinates qualitative regime adjectives because standard MCP schema lacks an invariant assertion signal.
- **Severity:** Critical (in financial and medical domains).
- **Workaround:** Injected explicit `safety_instruction` text into the tool output payload commanding the model not to quote speculative estimates.
- **Engineering Impact:** Prompts and responses must carry defensive guardrails to prevent agent overconfidence.
- **Actionable Recommendation:** Add a native `failClosed: true` flag to the official MCP `CallToolResult` schema that instructs host agent orchestrators to treat the response as a non-extrapolatable boundary.

---

## PART 2: FORMAL AMAZON PRODUCT FEEDBACK

### 1. Tools, APIs, and SDKs Used
- Model Context Protocol (v2025-11-25) specification and JSON-RPC 2.0 schema.
- Node.js Streamable HTTP runtime (`http_mcp_server.js`).
- Alexa+ simulated conversational environment (`public/index.html` + `netlify/functions/consensus.js`).
- Smithery / Glama containerized deployment manifests.

### 2. Purpose
To build a zero-hallucination market truth verification server that gives Alexa+ and agentic AI models real-time, multi-venue cryptocurrency spot consensus and fails closed against ungrounded regime extrapolation.

### 3. What Worked Well
- **Standardized Tool Discovery:** `tools/list` provides an extraordinarily clean, decoupled contract for declaring tool signatures via JSON Schema.
- **Streamable HTTP Specification:** The move toward Streamable HTTP in the 2025 specification is a major improvement over raw stdio for cloud-native deployment.
- **Simulated Alexa Path:** The competition's inclusion of a simulated web experience path made prototype testing feasible without hardware consumer device provisioning.

### 4. What Needs Work
- **Lack of Standard MCP Client CLI for Testing:** Developers currently have to write custom test runners (`verify_amazon_mcp.js`) to validate their servers. Amazon/Anthropic should release an official `mcp-lint` or `mcp-verify` CLI that verifies protocol compliance in CI.
- **Voice Turn Latency Budgets:** No native audio filler protocol exists for tools that take >800ms.

### 5. Onboarding Experience
The conceptual documentation for MCP is excellent, but developer tooling is fragmented across different GitHub repositories and discord channels. Consolidating the official 2025 specification, test suites, and Streamable HTTP reference implementations in a single Amazon Developer portal would save developers significant ramp-up time.

### 6. Would We Use Them Again and Why?
**Yes, absolutely.** The Model Context Protocol is rapidly becoming the universal standard for AI tool invocation. By adopting MCP, our verification engine can serve Amazon Alexa, Claude, open-source agents, and IDE tools with a single unified codebase.
