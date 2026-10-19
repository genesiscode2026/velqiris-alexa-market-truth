# VELQIRIS Alexa+ & Model Context Protocol (MCP) Market Truth Server

A verified market truth consensus engine implementing:
1. **Model Context Protocol (MCP)** server (`http_mcp_server.js`, `mcp_server.js`, and `netlify/functions/amazon-mcp.js`) compliant with JSON-RPC 2.0 (protocol version `2025-11-25`).
2. **Alexa+ Web Simulation & In-Browser MCP Client** (`public/index.html` / `sale_site/alexa-simulation.html`) implementing the complete client lifecycle (`initialize` -> `notifications/initialized` -> `tools/list` -> `tools/call`).

It answers spot-price questions only when at least two independent venues respond and strictly refuses to invent a market regime from a point-in-time snapshot (fail-closed).

## Live Demo (Simulated Alexa+ Interface & MCP Client)

https://velqiris-acquisition.netlify.app/alexa-simulation.html

*(Note: Explicitly labeled as a developer simulation per hackathon guidelines. Does not claim proprietary Amazon certification or direct production consumer hardware deployment).*

## Model Context Protocol (MCP) Integration

VELQIRIS implements a standard MCP server for agentic AI architectures (Claude Desktop, MCP clients, Amazon Alexa Agentic workflows):

### Protocol Details
- **Transports**:
  - **Local / Container Streamable HTTP**: Native Node.js HTTP server (`http_mcp_server.js`) with chunked transfer (`Transfer-Encoding: chunked`), session lifecycle tracking (`Mcp-Session-Id`), and Origin validation (403 on untrusted origins).
  - **Serverless HTTP**: Stateless edge endpoint (`netlify/functions/amazon-mcp.js`) ensuring reliable operation across non-sticky distributed Lambda instances.
  - **Standard I/O (stdio)**: CLI / desktop MCP adapter (`mcp_server.js`).
- **Protocol Version**: `2025-11-25` (Amazon Developer & Anthropic specification)
- **Specification**: JSON-RPC 2.0 with session tracking and version negotiation

### Tools Exposed
- `get_market_truth_consensus`: Fetches multi-venue spot price consensus (Coinbase, Binance, OKX). Fails closed if fewer than 2 independent sources respond.
  - Schema: `{ symbol: "BTC" | "ETH" | "SOL" | "ICP" }`
- `verify_risk_regime`: Evaluates market risk regime. Refuses to extrapolate future regimes from single snapshots (`INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST`).
  - Schema: `{ symbol: "BTC" | "ETH" | "SOL" | "ICP" }`

### Resources Exposed
- `velqiris://provenance/policy`: Invariants for multi-venue price consensus and fail-closed security rules.
- `velqiris://architecture/summary`: Overview of VELQIRIS agentic verification layer.

## Verification & Judging Deliverables

- **Judge Start Here:** [`JUDGE_START_HERE.md`](./JUDGE_START_HERE.md) (Quick verification guide)
- **MCP Compliance Report:** [`AMAZON_MCP_COMPLIANCE_REPORT.md`](./AMAZON_MCP_COMPLIANCE_REPORT.md) (40/40 automated tests pass)
- **Developer Friction Log & Product Feedback:** [`FRICTION_LOG.md`](./FRICTION_LOG.md) (10% judging bonus track)
- **Video Demo Script & Shotlist:** [`AMAZON_VIDEO_SCRIPT.md`](./AMAZON_VIDEO_SCRIPT.md) | [`AMAZON_VIDEO_SHOTLIST.md`](./AMAZON_VIDEO_SHOTLIST.md)
- **Smithery Registry Config:** [`smithery.yaml`](./smithery.yaml)

## Running & Testing Locally

Run all unit and MCP protocol tests (deterministic, offline):
```bash
npm test
```

Run internal MCP Protocol Verification Test Suite (40 assertions):
```bash
npm run verify:mcp
# or: node scripts/verify_amazon_mcp.js
```

Optional: Run network-dependent live smoke test against live venues:
```bash
npm run test:live
```

Start the Streamable HTTP server:
```bash
node http_mcp_server.js
# Listening on http://0.0.0.0:3333/mcp
```

Start the MCP stdio server:
```bash
node mcp_server.js
```

Run the remote MCP server in a production container:
```bash
docker build -t velqiris-market-truth .
docker run --rm -p 3333:3333 velqiris-market-truth
curl http://127.0.0.1:3333/health
```

Start local Netlify development server:
```bash
netlify dev
```

## Installation via Smithery & Claude Desktop

To install this MCP server into Claude Desktop via Smithery:
```bash
npx -y smithery mcp add chitara-trading/velqiris-market-truth
```

Or configure manually in your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "velqiris-market-truth": {
      "command": "node",
      "args": ["/path/to/velqiris-alexa-market-truth/mcp_server.js"]
    }
  }
}
```

## Open-Source Core & Optional Deployment Package

- **Open-source reference implementation:** This repository is MIT licensed, including commercial-use rights under the terms of the MIT License.
- **Optional serverless/x402 source package:** A separately maintained Netlify-compatible deployment bundle with wallet-bound Base settlement, signed fulfillment, and packaged release evidence is available for 49 USDC.
- **Settlement invariant:** The optional package accepts native USDC on Base only, through the verified checkout flow.
- **Licensing and acquisition:** See [VELQIRIS Commercial Licensing](https://velqiris-acquisition.netlify.app/portfolio.html) for the exact package scope and current terms.

## Hackathon Disclosure

This project implements the Model Context Protocol (MCP) and uses the simulated Alexa+ experience path expressly described in the competition requirements. It is not connected to a proprietary consumer Alexa account and does not claim certification or endorsement by Amazon.

## License

MIT. See `LICENSE`.
