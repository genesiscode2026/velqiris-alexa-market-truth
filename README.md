# VELQIRIS Alexa+ & Model Context Protocol (MCP) Market Truth Server

A verified market truth consensus engine implementing:
1. **Model Context Protocol (MCP)** server (`http_mcp_server.js` and `mcp_server.js`) compliant with JSON-RPC 2.0 and Streamable HTTP transport (protocol version `2025-11-25 or later`).
2. **Alexa+ Web Simulation** (`public/index.html` + `netlify/functions/consensus.js`) for the Alexa+ agentic track of the Amazon Build, Ship, Shape hackathon.

It answers spot-price questions only when at least two independent venues respond and strictly refuses to invent a market regime from a point-in-time snapshot (fail-closed).

## Live Demo (Simulated Alexa+ Interface)

https://velqiris-acquisition.netlify.app/alexa-simulation.html

*(Note: Explicitly labeled as a developer simulation per hackathon guidelines. Does not claim proprietary Amazon certification or direct production consumer hardware deployment).*

## Model Context Protocol (MCP) Integration

VELQIRIS implements a standard MCP server for agentic AI architectures (Claude Desktop, MCP clients, Amazon Alexa Agentic workflows):

### Protocol Details
- **Transport**: Streamable HTTP (`Transfer-Encoding: chunked`) & Standard I/O (stdio)
- **Protocol Version**: `2025-11-25` (Amazon Developer & Anthropic specification)
- **Specification**: JSON-RPC 2.0 with session tracking (`Mcp-Session-Id`)

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

Run all unit and MCP protocol tests:
```bash
npm test
```

Run official Amazon MCP Protocol Compliance Verification (40 assertions):
```bash
npm run verify:mcp
# or: node scripts/verify_amazon_mcp.js
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

Start local Netlify development server:
```bash
netlify dev
```

## Installation via Smithery & Claude Desktop

To install this MCP server into Claude Desktop via Smithery:
```bash
npx -y @smithery/cli install @genesiscode2026/velqiris-alexa-market-truth --client claude
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

## Commercial Dual-Licensing & Base USDC Settlement

- **Open Source:** MIT License for personal, educational, and developer evaluation.
- **Enterprise / Commercial License:** $299 USDC (Base) for proprietary commercial applications, algorithmic trading bots, and SLA support.
- **Instant Settlement:** Direct USDC payment on Base network to custody address:
  `0xC6F86e170411182114FcCdb28793dC76B5e8D144`
- **Modular Acquisition & Full Buyout:** Visit [VELQIRIS Commercial Licensing](https://velqiris-acquisition.netlify.app/#licensing).

## Hackathon Disclosure

This project implements the Model Context Protocol (MCP) and uses the simulated Alexa+ experience path expressly described in the competition requirements. It is not connected to a proprietary consumer Alexa account and does not claim certification or endorsement by Amazon.

## License

MIT. See `LICENSE`.
