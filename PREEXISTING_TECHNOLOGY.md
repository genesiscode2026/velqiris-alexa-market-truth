# PRE-EXISTING TECHNOLOGY & IP DISCLOSURE
**Competition:** Build, Ship, Shape: Amazon Developer Hackathon (Devpost #1225753)

**Project:** VELQIRIS Market Truth & Consensus MCP Server  

---

## 1. PRE-EXISTING FOUNDATIONAL TECHNOLOGY
- **VELQIRIS Market Consensus Formula:** Mathematical formulation for multi-venue dispersion analysis and fail-closed median extraction derived from the VELQIRIS core quantitative engine.
- **Open Source Dependencies:** Node.js standard libraries (`node:test`, `node:assert`, `node:readline`), MIT licensed.

---

## 2. WORK CREATED SPECIFICALLY FOR THIS HACKATHON
- **Model Context Protocol (MCP) Server Implementation (`mcp_server.js` & `http_mcp_server.js`):** Engineered specifically for this hackathon, targeting protocol version `2025-11-25` with JSON-RPC 2.0 stdio and Streamable HTTP behavior (`Transfer-Encoding: chunked`, `Mcp-Session-Id`).
- **Project-Owned MCP Verification Suite (`scripts/verify_amazon_mcp.js`):** Built to exercise 40 handshake, Streamable HTTP, tool-discovery, execution, and error-handling assertions. It is not an Amazon certification suite.
- **Developer Friction Log (`FRICTION_LOG.md`):** Reproducible observations from building and testing the MCP transports and browser client, plus the required Amazon product-feedback answers.
- **Alexa+ Web Simulation (`public/index.html` + `netlify/functions/amazon-mcp.js`):** Interactive text-formatted simulation and real browser MCP client for non-device evaluation.
- **Containerization & Registry Configuration (`Dockerfile` & `smithery.yaml`):** Created for Smithery / Glama and Dockerized evaluation.
- **Dedicated Demo Video (`velqiris_alexa_mcp_real_demo.mp4`):** Working application demonstration recorded on 2026-10-19 and published at `https://youtu.be/McAWFS6xotU`.

---

## 3. CONTEST PERIOD UPDATES DISCLOSURE (AUGUST 31 – OCTOBER 23, 2026)
In adherence to the hackathon transparency rules, all updates to this repository were authored within the official competition window:
- **Phase 1 (October 8, 2026):** Initial MCP server stdio scaffolding, Alexa+ web simulation, spot consensus aggregator, and unit test suite. The repository's first commit is dated October 8, 2026.
- **Phase 2 (October 9, 2026):** Upgraded to Model Context Protocol specification v2025-11-25; added Streamable HTTP server (`http_mcp_server.js`); implemented 40-step protocol compliance verifier (`scripts/verify_amazon_mcp.js`); authored formal Developer Friction Log for Amazon engineers.
- **Phase 3 (October 14, 2026):** Added Dockerfile containerization and Smithery registry manifest (`smithery.yaml`) for zero-friction judge evaluation.
- **Phase 4 (October 19, 2026):** Pre-flight audit remediation; aligned technical claims to the tested behavior (multi-venue median snapshot, venue values, and explicit fail-closed regime refusal); generated the working application video demo (`velqiris_alexa_mcp_real_demo.mp4`).

---

## 4. COMPLIANCE & ELIGIBILITY ATTESTATION
All hackathon-specific integrations, scripts, and MCP wrappers were authored during the official hackathon submission window. All code is licensed under the permissive MIT open-source license.
