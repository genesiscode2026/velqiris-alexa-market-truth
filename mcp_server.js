/**
 * VELQIRIS Model Context Protocol (MCP) Server
 * Protocol Version: 2024-11-05 (JSON-RPC 2.0 over stdio)
 *
 * Implements standard MCP tools and resources for Market Truth Consensus
 * and deterministic risk regime verification.
 */

const readline = require('readline')
let consensusModule
try {
  consensusModule = require('./consensus.js')
} catch (_) {
  consensusModule = require('./netlify/functions/consensus.js')
}
const { collectPrices, median, ALLOWED_SYMBOLS } = consensusModule

const SERVER_NAME = 'velqiris-market-truth-mcp'
const SERVER_VERSION = '1.1.0'
const PROTOCOL_VERSION = '2025-11-25'

const TOOLS = [
  {
    name: 'get_market_truth_consensus',
    description: 'Fetches multi-venue spot price consensus across independent venues (Coinbase, Binance, OKX). Fails closed if fewer than 2 independent sources respond.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          enum: Array.from(ALLOWED_SYMBOLS),
          description: 'Asset ticker to verify (e.g. BTC, ETH, SOL, ICP)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'verify_risk_regime',
    description: 'Evaluates market risk regime for an asset. Fails closed against inventing market regimes from point-in-time snapshots.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          enum: Array.from(ALLOWED_SYMBOLS),
          description: 'Asset ticker to evaluate (e.g. BTC, ETH, SOL, ICP)',
        },
      },
      required: ['symbol'],
    },
  },
]

const RESOURCES = [
  {
    uri: 'velqiris://provenance/policy',
    name: 'VELQIRIS Multi-Venue Consensus Policy',
    mimeType: 'application/json',
    description: 'Invariants for multi-venue price consensus and fail-closed regime rules',
  },
  {
    uri: 'velqiris://architecture/summary',
    name: 'VELQIRIS Architecture Summary',
    mimeType: 'text/markdown',
    description: 'Overview of VELQIRIS agentic verification layer',
  },
]

const RESOURCE_CONTENTS = {
  'velqiris://provenance/policy': JSON.stringify({
    min_independent_venues: 2,
    consensus_algorithm: 'MEDIAN',
    fallback_to_mock_data: false,
    point_in_time_regime_inference: 'FORBIDDEN',
    payout_rail_invariant: 'USDC on Base: 0xC6F86e170411182114FcCdb28793dC76B5e8D144',
  }, null, 2),
  'velqiris://architecture/summary': '# VELQIRIS Architecture\n\nVELQIRIS provides multi-venue consensus and fail-closed regime gating before AI agent action.',
}

async function handleToolCall(name, args = {}) {
  if (!args || typeof args.symbol !== 'string' || !args.symbol.trim()) {
    return {
      isError: true,
      content: [{ type: 'text', text: 'Error: Missing required argument "symbol".' }],
    }
  }
  const symbol = args.symbol.trim().toUpperCase()
  if (!ALLOWED_SYMBOLS.has(symbol)) {
    return {
      isError: true,
      content: [{ type: 'text', text: `Error: Unsupported symbol '${symbol}'. Allowed: ${Array.from(ALLOWED_SYMBOLS).join(', ')}` }],
    }
  }

  if (name === 'verify_risk_regime') {
    return {
      isError: false,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST',
            symbol,
            regime: null,
            confidence: 0,
            message: `Market regime inference refused for ${symbol}: Point-in-time snapshots cannot extrapolate regime trends. Historical time series required.`,
          }, null, 2),
        },
      ],
    }
  }

  const priceCollector = exports._collectPrices || collectPrices
  const prices = await priceCollector(symbol)
  const values = Object.values(prices)

  if (values.length < 2) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            status: 'INSUFFICIENT_INDEPENDENT_SOURCES',
            symbol,
            source_count: values.length,
            sources: prices,
            message: `Fail-closed: Cannot verify ${symbol} from at least 2 independent venues.`,
          }, null, 2),
        },
      ],
    }
  }

  const consensus = median(values)
  const spreadBps = ((Math.max(...values) - Math.min(...values)) / consensus) * 10000

  return {
    isError: false,
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          status: 'VERIFIED_MULTI_VENUE_SNAPSHOT',
          symbol,
          consensus_price_usd: Number(consensus.toFixed(2)),
          spread_basis_points: Number(spreadBps.toFixed(2)),
          source_count: values.length,
          sources: prices,
          observed_at: new Date().toISOString(),
        }, null, 2),
      },
    ],
  }
}

async function handleRpcRequest(request) {
  const { id, method, params } = request

  switch (method) {
    case 'initialize': {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: {
            tools: {},
            resources: {},
          },
          serverInfo: {
            name: SERVER_NAME,
            version: SERVER_VERSION,
          },
        },
      }
    }

    case 'notifications/initialized':
      // Client notification, no response required
      return null

    case 'ping':
      return { jsonrpc: '2.0', id, result: {} }

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          tools: TOOLS,
        },
      }

    case 'tools/call': {
      const toolName = params?.name
      const toolArgs = params?.arguments || {}
      if (!TOOLS.find((t) => t.name === toolName)) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32601, message: `Tool not found: ${toolName}` },
        }
      }
      try {
        const toolResult = await handleToolCall(toolName, toolArgs)
        return {
          jsonrpc: '2.0',
          id,
          result: toolResult,
        }
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32603, message: `Tool execution failed: ${err.message}` },
        }
      }
    }

    case 'resources/list':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          resources: RESOURCES,
        },
      }

    case 'resources/read': {
      const uri = params?.uri
      const content = RESOURCE_CONTENTS[uri]
      if (!content) {
        return {
          jsonrpc: '2.0',
          id,
          error: { code: -32602, message: `Resource not found: ${uri}` },
        }
      }
      return {
        jsonrpc: '2.0',
        id,
        result: {
          contents: [
            {
              uri,
              mimeType: uri.endsWith('.json') ? 'application/json' : 'text/markdown',
              text: content,
            },
          ],
        },
      }
    }

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      }
  }
}

function startStdioServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  })

  rl.on('line', async (line) => {
    const trimmed = line.trim()
    if (!trimmed) return
    try {
      const req = JSON.parse(trimmed)
      const res = await handleRpcRequest(req)
      if (res !== null) {
        process.stdout.write(JSON.stringify(res) + '\n')
      }
    } catch (e) {
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `Parse error: ${e.message}` },
      }) + '\n')
    }
  })
}

if (require.main === module) {
  startStdioServer()
}

module.exports = {
  handleRpcRequest,
  handleToolCall,
  TOOLS,
  RESOURCES,
  startStdioServer,
}
