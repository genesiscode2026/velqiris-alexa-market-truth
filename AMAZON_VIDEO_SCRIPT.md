# VELQIRIS — AMAZON ALEXA DEVELOPER HACKATHON VIDEO DEMO SCRIPT
**Project:** VELQIRIS Market Truth & Consensus MCP Server  
**Submission ID:** Devpost #1225753  
**Target Duration:** 2 minutes 50 seconds (under 3:00 minute hard limit)  
**Standard:** 100% Truth Standard · Explicit Simulation Labeling · No Alexa Certification Claims  

---

## SCENE-BY-SCENE DEMO TIMELINE

### [00:00 - 00:15] SCENE 1: THE REAL PROBLEM (VOICE ASSISTANT FINANCIAL HALLUCINATIONS)
- **Visual:** Screen showing a standard AI assistant answering *"What is Bitcoin trading at?"* with a confident but stale single-exchange price, juxtaposed with an exchange divergence warning.
- **On-Screen Text:** *Problem: Voice AI Confidently Hallucinates Stale Single-Exchange Data*
- **Voiceover:**
  > "Voice assistants like Alexa are increasingly trusted for fast answers. But in financial markets, standard models pull from single cached endpoints or hallucinate prices. When high volatility causes exchange prices to diverge by 2 to 4 percent, a single stale number leads to disastrous trades. We built VELQIRIS to solve this."

---

### [00:15 - 00:45] SCENE 2: THE PRODUCT WORKING (SIMULATED ALEXA+ EXPERIENCE)
- **Visual:** Browser showing `https://velqiris-acquisition.netlify.app/alexa-simulation.html` labeled visibly as *[DEVELOPER SIMULATION — ALEXA+ AGENTIC INTERACTION]*.
- **Interaction:**
  - User voice prompt: *"Alexa, what is the verified consensus price of Bitcoin?"*
  - UI streams real-time queries to independent exchanges: Coinbase, Binance, OKX.
  - Returns: Median price $68,510.40, 3 independent sources, spread 4 basis points.
  - Spoken response: *"The verified Bitcoin consensus is 68,510 dollars across three independent venues."*
- **Voiceover:**
  > "Here is our simulated Alexa+ web interface, built specifically for this hackathon track. When the user asks for Bitcoin's price, the agent doesn't guess. It dispatches concurrent requests to three independent exchanges, computes the statistical median, and confirms the price within basis-point precision."

---

### [00:45 - 01:30] SCENE 3: MULTI-VENUE CONSENSUS & FAIL-CLOSED INTEGRITY
- **Visual:** Split screen: One venue network connection dropped. Then prompt: *"Alexa, what is the market volatility regime for Bitcoin?"*
- **Interaction:**
  - System attempts to verify regime from a single snapshot.
  - Tool returns: `INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST`, `regime: null`.
  - Assistant responds: *"A single spot snapshot cannot establish a volatility regime without risk of hallucination."*
- **Voiceover:**
  > "Notice what happens when we ask for a volatility regime: instead of inventing a bullish or bearish narrative, the server enforces a fail-closed boundary. It explicitly returns a refusal status because point-in-time snapshots cannot prove a statistical regime. We never trade correctness for plausible narrative."

---

### [01:30 - 02:10] SCENE 4: REAL MCP 2025-11-25 STREAMABLE HTTP PROTOCOL
- **Visual:** Terminal running `node scripts/verify_amazon_mcp.js`. All 40 assertions passing live. Cut to `http_mcp_server.js` showing `Transfer-Encoding: chunked` and `Mcp-Session-Id` headers.
- **On-Screen Text:** *Specification: Model Context Protocol v2025-11-25 · Streamable HTTP*
- **Voiceover:**
  > "Under the hood, VELQIRIS is a self-hosted Model Context Protocol server implementing the modern November 2025 specification. It operates over Streamable HTTP with chunked streaming and session tracking. In our automated verifier, all 40 protocol assertions pass—from version negotiation to strict JSON-RPC error codes."

---

### [02:10 - 02:35] SCENE 5: TRUTH BEFORE CONVENIENCE (CODE REALITY)
- **Visual:** Architecture flow showing the multi-venue query fanout to Coinbase, Binance, and OKX, the mathematical median consensus calculation, and the 3500ms timeout bounds.
- **On-Screen Text:** *Core Architecture: Multi-Venue Fanout · Mathematical Median · Fail-Closed Bounds*
- **Voiceover:**
  > "Under the hood, the architecture is simple and uncompromised: it queries independent exchange endpoints concurrently, computes the mathematical median across responding venues, measures basis-point spread, and aborts if fewer than two sources answer. No mock fallbacks, no fabricated regimes."

---

### [02:35 - 02:50] SCENE 6: IMPACT & OPEN SOURCE REPOSITORY
- **Visual:** GitHub repository `genesiscode2026/velqiris-alexa-market-truth`, MIT License, and the developer Friction Log answering the six mandatory Amazon feedback questions.
- **On-Screen Text:** *Open Source (MIT) · Full Developer Friction Log for Amazon Engineering*
- **Voiceover:**
  > "VELQIRIS brings verified multi-venue market consensus into the Alexa agentic ecosystem. The repository is open-source under MIT with automated tests and our full developer friction log. Thank you."
