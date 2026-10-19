# JUDGE START HERE — VELQIRIS MARKET TRUTH & CONSENSUS MCP SERVER
**Hackathon:** Build, Ship, Shape: Amazon Developer Hackathon (Devpost #1225753)

**Tracks entered:** Alexa+ and Open Source Mini Challenge
**Verification Time:** about 2 minutes

---

## 1. What Is This Project?
A **Model Context Protocol (MCP)** server and **simulated Alexa+ web interface** that gives an agent request-time, multi-venue spot observations and refuses unsupported market-regime claims.

It operates under two complementary paths:
1. **Interactive Demo:** A browser MCP client that runs `initialize`, `notifications/initialized`, `tools/list`, and `tools/call`, then renders text-formatted results from Coinbase USD plus Binance and OKX USDT indications.
2. **Self-Hosted Streamable HTTP MCP Server:** A Model Context Protocol server targeting **v2025-11-25**, with a stateful local transport and a stateless serverless transport.

---

## 2. Quick Verification

```bash
# 1. Run 23 deterministic unit, negative, and integration tests
npm test

# 2. Run internal Streamable HTTP & Serverless MCP Protocol Test Suite (40 assertions)
npm run verify:mcp

# 3. Optional: Run live smoke test against external exchanges
npm run test:live
```

### Expected Output:
```
✔ All 23 tests across 4 test files PASSED.

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

- [MCP Behavior Report (40/40 Project-Owned Assertions)](./AMAZON_MCP_COMPLIANCE_REPORT.md)
- [Developer Friction Log & Product Feedback (Optional Bonus of up to 10%)](./FRICTION_LOG.md)
- [Video Demo Script & Shotlist](./AMAZON_VIDEO_SCRIPT.md) | [Shotlist](./AMAZON_VIDEO_SHOTLIST.md)
- [Pre-Existing Technology Disclosure](./PREEXISTING_TECHNOLOGY.md)
- [Verification Evidence Log](./VERIFICATION_EVIDENCE.md)
- [Smithery Registry Manifest](./smithery.yaml)
