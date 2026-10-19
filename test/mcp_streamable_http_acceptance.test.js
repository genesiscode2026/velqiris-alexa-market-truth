/**
 * VELQIRIS Model Context Protocol (MCP) Streamable HTTP Acceptance Test Suite
 * Tests exact specification rules (MCP v2025-11-25):
 * - initialize negotiates supported protocolVersion 2025-11-25 without error
 * - notifications return HTTP 202 Accepted
 * - post-initialize requests without session return HTTP 400
 * - requests with unknown session ID return HTTP 404
 * - invalid MCP-Protocol-Version header returns HTTP 400
 * - invalid Origin returns HTTP 403
 * - client Accept header: application/json, text/event-stream
 * - tools/call requires explicit symbol argument (no silent BTC fallback)
 * - tools/call verify_risk_regime fails closed with regime: null
 * - container packaging copies consensus.js
 */

const { test, describe, before, after } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { Readable, Writable } = require('node:stream')
const { createHttpMcpServer, PROTOCOL_VERSION } = require('../http_mcp_server.js')

describe('MCP Streamable HTTP Acceptance & Negative Tests (Spec 2025-11-25)', () => {
  let server
  let testSessionId = null
  const originalFetch = global.fetch

  before(() => {
    global.fetch = async (url) => {
      if (url.includes('coinbase')) return { ok: true, json: async () => ({ data: { amount: '68500.00' } }) }
      if (url.includes('binance')) return { ok: true, json: async () => ({ price: '68520.00' }) }
      if (url.includes('okx')) return { ok: true, json: async () => ({ data: [{ last: '68490.00' }] }) }
      throw new Error(`Unhandled mock URL: ${url}`)
    }
    server = createHttpMcpServer()
  })

  after(() => {
    global.fetch = originalFetch
  })

  function dispatchHttp(srv, { method = 'POST', path = '/mcp', headers = {}, body = '' }) {
    return new Promise((resolve, reject) => {
      const payload = typeof body === 'string' ? body : JSON.stringify(body)
      const req = new Readable({
        read() {
          if (payload) {
            this.push(Buffer.from(payload))
          }
          this.push(null)
        },
      })
      req.method = method
      req.url = path
      req.headers = {
        host: 'localhost:3333',
        accept: 'application/json, text/event-stream',
        ...headers,
      }
      if (payload) {
        req.headers['content-length'] = String(Buffer.byteLength(payload))
      }

      const responseHeaders = {}
      let statusCode = 200
      const chunks = []

      const res = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(Buffer.from(chunk))
          callback()
        },
      })

      res.setHeader = (key, val) => { responseHeaders[key.toLowerCase()] = val }
      res.getHeader = (key) => responseHeaders[key.toLowerCase()]
      res.writeHead = (code, hdrs = {}) => {
        statusCode = code
        if (hdrs) {
          for (const [k, v] of Object.entries(hdrs)) {
            responseHeaders[k.toLowerCase()] = v
          }
        }
      }

      res.on('finish', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        let json = null
        try { json = JSON.parse(raw) } catch (e) { json = raw }
        resolve({
          status: statusCode,
          headers: responseHeaders,
          body: json,
          raw,
          chunkCount: chunks.length,
        })
      })

      srv.emit('request', req, res)
    })
  }

  test('1. Negotiation: initialize with unknown version responds with supported 2025-11-25 (not an error)', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05', // Older / unknown version
          clientInfo: { name: 'negotiating-client', version: '1.0.0' },
          capabilities: {},
        },
      },
    })

    assert.equal(res.status, 200, 'initialize should succeed with HTTP 200 to complete version negotiation')
    assert.equal(res.body.jsonrpc, '2.0')
    assert.equal(res.body.result.protocolVersion, '2025-11-25', 'Server must answer with supported 2025-11-25')
    assert.equal(res.body.result.serverInfo.name, 'velqiris-market-truth-mcp')
    assert.ok(res.headers['mcp-session-id'], 'Server must issue Mcp-Session-Id header')
    testSessionId = res.headers['mcp-session-id']
  })

  test('2. Lifecycle: notifications/initialized returns HTTP 202 Accepted', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      },
      headers: {
        'mcp-session-id': testSessionId,
      },
    })

    assert.equal(res.status, 202, 'Notifications MUST return HTTP 202 Accepted')
  })

  test('3. Negative: post-initialize request without session header returns HTTP 400', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
      },
      headers: {
        // Explicitly omitting Mcp-Session-Id
      },
    })

    assert.equal(res.status, 400, 'Post-initialize request without session ID must return HTTP 400')
    assert.equal(res.body.error.code, -32000)
  })

  test('4. Negative: request with unknown session ID returns HTTP 404', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/list',
      },
      headers: {
        'mcp-session-id': 'unknown-session-uuid-404',
      },
    })

    assert.equal(res.status, 404, 'Unknown session ID must return HTTP 404')
    assert.equal(res.body.error.code, -32000)
  })

  test('5. Negative: invalid MCP-Protocol-Version header returns HTTP 400', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/list',
      },
      headers: {
        'mcp-session-id': testSessionId,
        'mcp-protocol-version': 'invalid-version-string',
      },
    })

    assert.equal(res.status, 400, 'Invalid MCP-Protocol-Version header must return HTTP 400')
    assert.equal(res.body.error.code, -32602)
  })

  test('6. Negative: invalid Origin header returns HTTP 403 Forbidden', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/list',
      },
      headers: {
        'mcp-session-id': testSessionId,
        'origin': 'https://attacker-origin.example.org',
      },
    })

    assert.equal(res.status, 403, 'Invalid Origin must return HTTP 403')
    assert.equal(res.body.error, 'FORBIDDEN_ORIGIN')
  })

  test('7. tools/list: returns registered tools with schemas', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/list',
      },
      headers: {
        'mcp-session-id': testSessionId,
        'mcp-protocol-version': '2025-11-25',
      },
    })

    assert.equal(res.status, 200)
    const tools = res.body.result.tools
    assert.ok(Array.isArray(tools))
    assert.ok(tools.some(t => t.name === 'get_market_truth_consensus'))
    assert.ok(tools.some(t => t.name === 'verify_risk_regime'))
  })

  test('8. Negative: tools/call rejects missing symbol argument (no silent BTC fallback)', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        id: 7,
        method: 'tools/call',
        params: {
          name: 'get_market_truth_consensus',
          arguments: {}, // Missing symbol!
        },
      },
      headers: {
        'mcp-session-id': testSessionId,
        'mcp-protocol-version': '2025-11-25',
      },
    })

    assert.equal(res.status, 200)
    assert.equal(res.body.result.isError, true, 'Must return isError: true when symbol is missing')
    assert.ok(res.body.result.content[0].text.includes('Missing required argument "symbol"'))
  })

  test('9. tools/call: get_market_truth_consensus returns consensus, spread bps, and venues >= 2', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        id: 8,
        method: 'tools/call',
        params: {
          name: 'get_market_truth_consensus',
          arguments: { symbol: 'BTC' },
        },
      },
      headers: {
        'mcp-session-id': testSessionId,
        'mcp-protocol-version': '2025-11-25',
      },
    })

    assert.equal(res.status, 200)
    assert.equal(res.body.result.isError, false)
    const data = JSON.parse(res.body.result.content[0].text)
    assert.equal(data.symbol, 'BTC')
    assert.ok(data.consensus_price_usd > 0)
    assert.ok(data.source_count >= 2)
    assert.ok(typeof data.spread_basis_points === 'number')
  })

  test('10. tools/call: verify_risk_regime fails closed with regime: null', async () => {
    const res = await dispatchHttp(server, {
      body: {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: {
          name: 'verify_risk_regime',
          arguments: { symbol: 'ETH' },
        },
      },
      headers: {
        'mcp-session-id': testSessionId,
        'mcp-protocol-version': '2025-11-25',
      },
    })

    assert.equal(res.status, 200)
    assert.equal(res.body.result.isError, false)
    const data = JSON.parse(res.body.result.content[0].text)
    assert.equal(data.status, 'INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST')
    assert.equal(data.regime, null)
    assert.equal(data.confidence, 0)
  })

  test('11. Container: Dockerfile includes consensus.js and copies required files', () => {
    const dockerfilePath = path.join(__dirname, '..', 'Dockerfile')
    const content = fs.readFileSync(dockerfilePath, 'utf8')
    assert.ok(content.includes('consensus.js'), 'Dockerfile must copy consensus.js')
    assert.ok(content.includes('http_mcp_server.js'))
    assert.ok(content.includes('mcp_server.js'))
  })
})
