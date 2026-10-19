# JUDGE START HERE — VELQIRIS MARKET TRUTH & CONSENSUS MCP SERVER
**Hackathon:** Amazon Alexa Developer Hackathon (Devpost #1225753)  
**Tracks:** Alexa+ Agentic Flow / Model Context Protocol (MCP)  
**Verification Time:** < 30 seconds  

---

## 1. What Is This Project?
An institutional-grade **Model Context Protocol (MCP)** server and **Simulated Alexa+ Interface** that connects voice and agentic AI models with real-time multi-venue market consensus.

It operates under two complementary paths:
1. **Interactive Demo (Visual / Spoken):** A simulated Alexa+ voice assistant web application that queries multi-venue consensus across Coinbase, Binance, and OKX, enforcing basis-point dispersion thresholds.
2. **Self-Hosted Streamable HTTP MCP Server:** A Model Context Protocol server compliant with specification **v2025-11-25 or later**, operating over Streamable HTTP with chunked streaming and session handling.

---

## 2. Quick Verification (Run in 1 Command)

```bash
# 1. Run unit and acceptance test suites (23 assertions)
npm test

# 2. Run internal Streamable HTTP & Serverless MCP Protocol Test Suite (40 assertions)
npm run verify:mcp

# 3. Optional: Run live smoke test against external exchanges
npm run test:live
```

### Expected Output:
```
✔ All 23 test assertions across 4 test suites PASSED.

========================================================================
INTERNAL VERIFICATION COMPLETE: 40/40 ASSERTIONS PASSED
SPECIFICATION: Model Context Protocol (v2025-11-25)
TRANSPORTS: Streamable HTTP (Local Stateful) & Netlify HTTP (Stateless)
STATUS: ALL ASSERTIONS PASSED
========================================================================
```

---

## 3. Public Interactive Demo (Simulated Experience)

- **Live URL:** [https://velqiris-acquisition.netlify.app/alexa-simulation.html](https://velqiris-acquisition.netlify.app/alexa-simulation.html)
- *Note:* Labeled explicitly as a developer simulation per the competition guidelines. This project is not certified by Amazon and does not claim production consumer device deployment.

---

## 4. Key Deliverables & Documentation

- [Amazon MCP Compliance Report (40/40 Steps)](./AMAZON_MCP_COMPLIANCE_REPORT.md)
- [Developer Friction Log & Product Feedback (10% Bonus Track)](./FRICTION_LOG.md)
- [Video Demo Script & Shotlist](./AMAZON_VIDEO_SCRIPT.md) | [Shotlist](./AMAZON_VIDEO_SHOTLIST.md)
- [Pre-Existing Technology Disclosure](./PREEXISTING_TECHNOLOGY.md)
- [Verification Evidence Log](./VERIFICATION_EVIDENCE.md)
- [Smithery Registry Manifest](./smithery.yaml)
