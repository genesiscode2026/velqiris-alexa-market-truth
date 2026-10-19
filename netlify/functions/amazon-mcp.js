/**
 * VELQIRIS Amazon Developer Hackathon — Serverless MCP Endpoint
 *
 * Implements Model Context Protocol (v2025-11-25) over HTTP JSON-RPC 2.0
 * for Netlify Serverless deployment.
 *
 * Architecture:
 * Strictly stateless mode for distributed serverless execution.
 * Does not generate, return, expose, or validate Mcp-Session-Id.
 */

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/velqiris-acquisition\.netlify\.app$/,
  /^https:\/\/amazonappdev2026\.devpost\.com$/,
  /^https:\/\/devpost\.com$/,
]

const PROTOCOL_VERSION = '2025-11-25'
const SERVER_NAME = 'velqiris-market-truth-mcp'
const SERVER_VERSION = '1.0.0'
const ALLOWED_SYMBOLS = new Set(['BTC', 'ETH', 'SOL', 'ICP'])

const TOOLS = [
  {
    name: 'get_market_truth_consensus',
    description: 'Calculates statistical median spot price across independent venues (Coinbase, Binance, OKX). Requires >= 2 venues to respond, otherwise fails closed. Reports dispersion in basis points.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          enum: ['BTC', 'ETH', 'SOL', 'ICP'],
          description: 'The cryptocurrency asset symbol to query.',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'verify_risk_regime',
    description: 'Strict fail-closed market regime evaluation. Fails closed with INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST because single-point snapshots cannot extrapolate regime trends.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          enum: ['BTC', 'ETH', 'SOL', 'ICP'],
          description: 'The cryptocurrency asset symbol to evaluate.',
        },
      },
      required: ['symbol'],
    },
  },
]

const RESOURCES = [
  {
    uri: 'velqiris://provenance/policy',
    name: 'Multi-Venue Consensus Policy',
    description: 'Mathematical rules for consensus median, dispersion reporting, and fail-closed security invariants.',
    mimeType: 'text/markdown',
  },
  {
    uri: 'velqiris://architecture/summary',
    name: 'VELQIRIS Agentic Architecture',
    description: 'Overview of Model Context Protocol integration and fail-closed market truth verifier.',
    mimeType: 'text/markdown',
  },
]

function isOriginAllowed(origin) {
  if (!origin) return true
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'VELQIRIS-Amazon-MCP/1.0' },
    signal: AbortSignal.timeout(3500),
  })
  if (!response.ok) throw new Error(`HTTP_${response.status}`)
  return response.json()
}

async function collectPrices(symbol) {
  const requests = [
    ['coinbase', `https://api.coinbase.com/v2/prices/${symbol}-USD/spot`, (d) => Number(d?.data?.amount)],
    ['binance', `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`, (d) => Number(d?.price)],
    ['okx', `https://www.okx.com/api/v5/market/ticker?instId=${symbol}-USDT`, (d) => Number(d?.data?.[0]?.last)],
  ]
  const settled = await Promise.allSettled(
    requests.map(async ([name, url, parse]) => {
      const data = await fetchJson(url)
      const val = parse(data)
      if (!Number.isFinite(val) || val <= 0) throw new Error('INVALID_PRICE')
      return [name, val]
    })
  )
  return Object.fromEntries(
    settled.filter((item) => item.status === 'fulfilled').map((item) => item.value)
  )
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

exports.handler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin || ''

  // 1. Origin validation: reject forbidden origin with 403
  if (origin && !isOriginAllowed(origin)) {
    return {
      statusCode: 403,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
      body: JSON.stringify({
        error: 'FORBIDDEN_ORIGIN',
        message: `Origin '${origin}' is not permitted by MCP security policy.`,
      }),
    }
  }

  const allowOrigin = origin && isOriginAllowed(origin) ? origin : '*'

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Mcp-Protocol-Version, Authorization, Accept',
    'Access-Control-Expose-Headers': 'Mcp-Protocol-Version',
    'Mcp-Protocol-Version': PROTOCOL_VERSION,
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  // 2. HTTP Method: Only POST is accepted for JSON-RPC MCP calls. GET and DELETE return 405.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        ...headers,
        Allow: 'POST, OPTIONS',
      },
      body: JSON.stringify({
        error: 'METHOD_NOT_ALLOWED',
        message: `HTTP ${event.httpMethod} is not allowed. MCP endpoint accepts POST for JSON-RPC 2.0 requests.`,
      }),
    }
  }

  // 3. Validate MCP-Protocol-Version header: invalid header MUST return 400
  const clientVersionHeader = event.headers?.['mcp-protocol-version'] || event.headers?.['Mcp-Protocol-Version']
  if (clientVersionHeader && clientVersionHeader !== PROTOCOL_VERSION) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32602,
          message: `Unsupported MCP-Protocol-Version '${clientVersionHeader}'. Server requires '${PROTOCOL_VERSION}'.`,
        },
      }),
    }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch (err) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: `Parse error: ${err.message}` },
      }),
    }
  }

  if (typeof body !== 'object' || body === null || body.jsonrpc !== '2.0' || !body.method) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: body?.id ?? null,
        error: { code: -32600, message: 'Invalid Request: Not a valid JSON-RPC 2.0 payload.' },
      }),
    }
  }

  const { id, method, params } = body

  // 4. Handle notifications (HTTP 202 Accepted with empty body)
  const isNotification = id === undefined || id === null || method.startsWith('notifications/')
  if (isNotification) {
    return { statusCode: 202, headers, body: '' }
  }

  // 5. Handle RPC methods
  try {
    switch (method) {
      case 'initialize': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: PROTOCOL_VERSION,
              capabilities: {
                tools: { listChanged: false },
                resources: { subscribe: false, listChanged: false },
              },
              serverInfo: {
                name: SERVER_NAME,
                version: SERVER_VERSION,
              },
            },
          }),
        }
      }

      case 'ping': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ jsonrpc: '2.0', id, result: {} }),
        }
      }

      case 'tools/list': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id,
            result: { tools: TOOLS },
          }),
        }
      }

      case 'tools/call': {
        const toolName = params?.name
        const args = params?.arguments || {}

        // VALIDATE ARGUMENTS FIRST BEFORE ANY EXTERNAL CALL
        if (!args.symbol || typeof args.symbol !== 'string' || !args.symbol.trim()) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id,
              result: {
                isError: true,
                content: [{ type: 'text', text: 'Missing required argument "symbol".' }],
              },
            }),
          }
        }

        const symbol = args.symbol.trim().toUpperCase()
        if (!ALLOWED_SYMBOLS.has(symbol)) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id,
              result: {
                isError: true,
                content: [{ type: 'text', text: `Unsupported asset symbol '${symbol}'. Supported: BTC, ETH, SOL, ICP.` }],
              },
            }),
          }
        }

        if (toolName === 'verify_risk_regime') {
          // Strictly fail-closed without external network calls
          const refusalPayload = {
            status: 'REGIME_VERIFICATION_REFUSED',
            symbol,
            regime: null,
            confidence: 0,
            risk_status: 'INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST',
            reason: 'Cannot extrapolate market regime from a single point-in-time snapshot. Historical series required.',
            observed_at: new Date().toISOString(),
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(refusalPayload, null, 2) }],
              },
            }),
          }
        }

        if (toolName === 'get_market_truth_consensus') {
          const prices = await (exports._collectPrices || collectPrices)(symbol)
          const values = Object.values(prices)

          if (values.length < 2) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                jsonrpc: '2.0',
                id,
                result: {
                  isError: true,
                  content: [{
                    type: 'text',
                    text: `Failed closed: only ${values.length} venue(s) responded for ${symbol}. Minimum 2 required for consensus.`,
                  }],
                },
              }),
            }
          }

          const consensus = median(values)
          const min = Math.min(...values)
          const max = Math.max(...values)
          const spreadBps = ((max - min) / consensus) * 10000

          const resultPayload = {
            status: 'VERIFIED_MULTI_VENUE_SNAPSHOT',
            symbol,
            consensus_price_usd: Number(consensus.toFixed(2)),
            spread_basis_points: Number(spreadBps.toFixed(2)),
            source_count: values.length,
            sources: prices,
            observed_at: new Date().toISOString(),
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id,
              result: {
                content: [{ type: 'text', text: JSON.stringify(resultPayload, null, 2) }],
              },
            }),
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id,
            result: {
              isError: true,
              content: [{ type: 'text', text: `Tool '${toolName}' not found.` }],
            },
          }),
        }
      }

      case 'resources/list': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id,
            result: { resources: RESOURCES },
          }),
        }
      }

      case 'resources/read': {
        const uri = params?.uri
        if (uri === 'velqiris://provenance/policy') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id,
              result: {
                contents: [{
                  uri,
                  mimeType: 'text/markdown',
                  text: '# VELQIRIS Market Truth & Consensus Policy\n\n1. Minimum 2 independent spot venue indications required.\n2. Median calculation over spot indications.\n3. Spread reported in basis points.\n4. Fail-closed on insufficient venues or regime extrapolation attempts.',
                }],
              },
            }),
          }
        }
        if (uri === 'velqiris://architecture/summary') {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              jsonrpc: '2.0',
              id,
              result: {
                contents: [{
                  uri,
                  mimeType: 'text/markdown',
                  text: '# VELQIRIS Architecture\n\nModel Context Protocol (MCP) server providing verifiable multi-venue market consensus and strict fail-closed security invariants.',
                }],
              },
            }),
          }
        }

        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: { code: -32002, message: `Resource '${uri}' not found.` },
          }),
        }
      }

      default: {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: `Method '${method}' not found.` },
          }),
        }
      }
    }
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id,
        error: { code: -32603, message: `Internal server error: ${err.message}` },
      }),
    }
  }
}

exports.TOOLS = TOOLS
exports.RESOURCES = RESOURCES
exports.PROTOCOL_VERSION = PROTOCOL_VERSION
exports.collectPrices = collectPrices
exports.median = median
