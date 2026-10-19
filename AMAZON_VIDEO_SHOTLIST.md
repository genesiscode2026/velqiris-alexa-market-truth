# VELQIRIS — AMAZON ALEXA DEMO VIDEO SHOTLIST & PRODUCTION ASSETS
**Hackathon Target:** Amazon Alexa Developer Hackathon (Devpost #1225753)  
**Aspect Ratio:** 16:9 (1920x1080 Full HD / 60fps)  
**Maximum File Size:** Under 100MB (H.264 / AAC)  
**Output Target:** `velqiris_alexa_mcp_demo.mp4`  

---

## SHOTLIST TABLE

| Shot # | Timestamp | Framing / Setup | Visual Content | Audio / Speech Cue | Source File / Asset |
|---|---|---|---|---|---|
| **S01** | 00:00 - 00:10 | Title Card & Split Screen | Title card: "VELQIRIS Market Truth & Consensus MCP Server". Warning graphic on hallucinated prices. | Intro voiceover starts: "Voice-first assistants..." | Graphic / Title slide |
| **S02** | 00:10 - 00:25 | Screen Capture (Browser/Exchange) | Market depth view showing spread disparity across exchanges. Red alert on single-source failure. | "...a stale single price can trigger catastrophic bad trades." | Exchange UI or synthetic mock |
| **S03** | 00:25 - 00:45 | Terminal Capture (Full Screen) | Execution of `node scripts/verify_amazon_mcp.js`. Rapid green checkmarks scrolling (1 through 40). | "VELQIRIS implements the Model Context Protocol 2025-11-25 standard, validated against our internal verification test suite..." | Local Terminal |
| **S04** | 00:45 - 01:05 | Architecture Slide | Clean diagram: Alexa Core -> MCP JSON-RPC 2.0 -> VELQIRIS Gateway -> Multi-Venue Engine (Coinbase, Binance, OKX). | "...calculates the statistical median and cross-venue dispersion..." | Architecture graphic |
| **S05** | 01:05 - 01:30 | Browser Capture (`alexa-simulation.html`) | User inputs "What is the consensus price of Bitcoin?". Loading state (<400ms) -> Rich consensus card renders. | "Watch this live interaction in our Alexa simulation..." | `sale_site/alexa-simulation.html` |
| **S06** | 01:30 - 01:50 | Code / JSON Payload Zoom | Zoom in on returned JSON payload: `status: VERIFIED_MULTI_VENUE_SNAPSHOT`, `consensus_price_usd: 68510.40`. | "...multi-venue telemetry: source count, timestamp, dispersion..." | Browser DevTools / Inspector |
| **S07** | 01:50 - 02:15 | Browser Capture (`alexa-simulation.html`) | User inputs "What is the market volatility regime?". Red indicator badge renders: `INSUFFICIENT_TIME_SERIES`. | "Here is our most critical engineering principle: Fail-Closed Safety..." | `sale_site/alexa-simulation.html` |
| **S08** | 02:15 - 02:30 | Code View (`mcp_server.js`) | Code snippet showing strict refusal handler when time-series depth is insufficient. | "...we deliberately return an explicit refusal status." | VS Code / IDE screen |
| **S09** | 02:30 - 02:45 | GitHub & Smithery Overview | Browsing `genesiscode2026/velqiris-alexa-market-truth`, `smithery.yaml`, and MIT license. | "Open source, containerized, and indexed on Smithery..." | GitHub & Smithery Web UI |

---

## PRODUCTION RECORDING INSTRUCTIONS

1. **Terminal Capture:**
   ```bash
   cd competition_submissions/amazon_alexa
   node scripts/verify_amazon_mcp.js
   ```
2. **Simulation Server:**
   The simulation page is deployed at `https://velqiris.netlify.app/alexa-simulation.html` or locally at `sale_site/alexa-simulation.html`.
3. **Voice Track Generation:**
   Can be recorded via high-quality mic or synthesized via elevenlabs/Amazon Polly standard studio voice using the exact script in `AMAZON_VIDEO_SCRIPT.md`.
