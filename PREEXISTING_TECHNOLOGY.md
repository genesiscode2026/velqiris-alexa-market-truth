# PRE-EXISTING TECHNOLOGY & IP DISCLOSURE
**Competition:** Amazon Alexa Developer Hackathon (Devpost #1225753)  
**Project:** VELQIRIS Market Truth & Consensus MCP Server  

---

## 1. PRE-EXISTING FOUNDATIONAL TECHNOLOGY
- **VELQIRIS Market Consensus Formula:** Mathematical formulation for multi-venue dispersion analysis and fail-closed median extraction derived from the VELQIRIS core quantitative engine.
- **Open Source Dependencies:** Node.js standard libraries (`node:test`, `node:assert`, `node:readline`), MIT licensed.

---

## 2. WORK CREATED SPECIFICALLY FOR THIS HACKATHON
- **Full Model Context Protocol (MCP) Server Implementation (`mcp_server.js` & `http_mcp_server.js`):** Engineered specifically for this hackathon conforming to protocol specification `2025-11-25` with JSON-RPC 2.0 stdio and modern Streamable HTTP chunked transport modes (`Transfer-Encoding: chunked`, `Mcp-Session-Id`).
- **Amazon MCP Compliance Verification Suite (`scripts/verify_amazon_mcp.js`):** Built to validate all 40 handshake, Streamable HTTP, tool discovery, execution, and error handling phases.
- **Developer Friction Log (`FRICTION_LOG.md`):** Real-world observations on integrating voice AI with MCP runtimes, answering all six mandatory Amazon feedback questions.
- **Alexa+ Web Simulation (`public/index.html` + `netlify/functions/consensus.js`):** Interactive voice simulation UI for non-device evaluation.
- **Containerization & Registry Configuration (`Dockerfile` & `smithery.yaml`):** Created for Smithery / Glama and Dockerized evaluation.
- **Dedicated Demo Video (`velqiris_alexa_mcp_demo.mp4`):** Real working application demonstration recorded on 2026-10-19.

---

## 3. CONTEST PERIOD UPDATES DISCLOSURE (AUGUST 31 – OCTOBER 23, 2026)
In adherence to the hackathon transparency rules, all updates to this repository were authored within the official competition window:
- **Phase 1 (October 1–8, 2026):** Initial MCP server stdio scaffolding, Alexa+ web simulation, spot consensus aggregator, and unit test suite.
- **Phase 2 (October 9, 2026):** Upgraded to Model Context Protocol specification v2025-11-25; added Streamable HTTP server (`http_mcp_server.js`); implemented 40-step protocol compliance verifier (`scripts/verify_amazon_mcp.js`); authored formal Developer Friction Log for Amazon engineers.
- **Phase 3 (October 14, 2026):** Added Dockerfile containerization and Smithery registry manifest (`smithery.yaml`) for zero-friction judge evaluation.
- **Phase 4 (October 19, 2026):** Pre-flight audit remediation; aligned all technical claims strictly to code reality (multi-venue median consensus, verified venue provenance, explicit fail-closed regime refusal); generated dedicated working application video demo (`velqiris_alexa_mcp_demo.mp4`).

---

## 4. COMPLIANCE & ELIGIBILITY ATTESTATION
All hackathon-specific integrations, scripts, and MCP wrappers were authored during the official hackathon submission window. All code is licensed under the permissive MIT open-source license.
