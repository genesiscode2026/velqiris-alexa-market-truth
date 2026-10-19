/**
 * VELQIRIS Amazon Alexa & MCP Protocol Compliance Verifier
 * Protocol Version: 2025-11-25 or later
 * Transport: Streamable HTTP (Transfer-Encoding: chunked / text/event-stream)
 *
 * Strict Compliance Test Suite:
 * - Verifies protocol negotiation to 2025-11-25
 * - Verifies Streamable HTTP transport (Transfer-Encoding: chunked)
 * - Verifies HTTP 202 Accepted for notifications
 * - Verifies session tracking (HTTP 400 on missing session, HTTP 404 on unknown session)
 * - Verifies protocol version header validation (HTTP 400 on invalid header)
 * - Verifies Origin validation (HTTP 403 on forbidden origin)
 * - Verifies tools/list and tools/call execution
 * - Verifies explicit symbol requirement (no default fallback)
 * - Verifies fail-closed risk regime refusal (regime: null)
 */

const { Readable, Writable } = require('node:stream')
const { createHttpMcpServer, PROTOCOL_VERSION } = require('../http_mcp_server.js')

function dispatchHttp(server, { method = 'GET', path = '/', headers = {}, body = '' }) {
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
      host: 'localhost:3845',
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
        statusCode,
        headers: responseHeaders,
        data: json,
        raw,
        chunkCount: chunks.length,
      })
    })

    server.emit('request', req, res)
  })
}

async function runProtocolVerification() {
  console.log('========================================================================')
  console.log('INTERNAL TEST SUITE: VELQIRIS MCP PROTOCOL VERIFICATION')
  console.log('Specification Standard: Model Context Protocol (v2025-11-25)')
  console.log('Transports: Streamable HTTP (Local Stateful) & Netlify HTTP (Stateless)')
  console.log('========================================================================\n')

  // Mock global.fetch for deterministic execution
  const originalFetch = global.fetch
  global.fetch = async (url) => {
    if (url.includes('coinbase')) return { ok: true, json: async () => ({ data: { amount: '68500.00' } }) }
    if (url.includes('binance')) return { ok: true, json: async () => ({ price: '68520.00' }) }
    if (url.includes('okx')) return { ok: true, json: async () => ({ data: [{ last: '68490.00' }] }) }
    throw new Error(`Unhandled mock URL: ${url}`)
  }

  let passedSteps = 0
  let totalSteps = 0

  function assert(condition, message) {
    totalSteps++
    if (!condition) {
      console.error(`\n❌ [ASSERTION FAILED] Step ${totalSteps}: ${message}`)
      throw new Error(`Verification Assertion Failed: ${message}`)
    }
    passedSteps++
    console.log(`✅ [PASS] Step ${totalSteps}: ${message}`)
  }

  const server = createHttpMcpServer()

  // 1. Health Endpoint
  console.log('--- 1. Health & Discovery Route ---')
  const healthRes = await dispatchHttp(server, { method: 'GET', path: '/health' })
  assert(healthRes.statusCode === 200, 'HTTP Server responds 200 on /health')
  assert(healthRes.data.transport === 'Streamable HTTP', 'Server advertises Streamable HTTP transport')
  assert(healthRes.data.protocolVersion === PROTOCOL_VERSION, 'Server protocol version is 2025-11-25')

  // 2. Initialize Handshake & Version Negotiation
  console.log('\n--- 2. Protocol Version Negotiation & Handshake (initialize) ---')
  const initReq = {
    jsonrpc: '2.0',
    id: 'req-init-1',
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05', // Client proposes older version; server should negotiate
      clientInfo: { name: 'test-client', version: '1.0.0' },
      capabilities: {},
    },
  }
  const initRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: initReq })
  assert(initRes.statusCode === 200, 'Initialize returns HTTP 200 for negotiation')
  assert(typeof initRes.headers['mcp-session-id'] === 'string', 'Server returns Mcp-Session-Id header')
  const sessionId = initRes.headers['mcp-session-id']
  assert(initRes.data.jsonrpc === '2.0', 'Response is valid JSON-RPC 2.0')
  assert(initRes.data.result.protocolVersion === '2025-11-25', 'Server negotiates supported 2025-11-25')
  assert(initRes.data.result.serverInfo.name === 'velqiris-market-truth-mcp', 'Server identifies as velqiris-market-truth-mcp')

  // 3. Client Notification (HTTP 202 Accepted)
  console.log('\n--- 3. Client Lifecycle Notification (notifications/initialized) ---')
  const notifyReq = {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  }
  const notifyRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: notifyReq, headers: { 'mcp-session-id': sessionId } })
  assert(notifyRes.statusCode === 202, 'Notification returns HTTP 202 Accepted')

  // 4. Session Validation (Negative checks: missing session -> 400, unknown session -> 404)
  console.log('\n--- 4. Session Tracking & Validation ---')
  const noSessionRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: { jsonrpc: '2.0', id: 2, method: 'tools/list' } })
  assert(noSessionRes.statusCode === 400, 'Post-initialize request without session returns HTTP 400')

  const badSessionRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: { jsonrpc: '2.0', id: 3, method: 'tools/list' }, headers: { 'mcp-session-id': 'bogus-session-id' } })
  assert(badSessionRes.statusCode === 404, 'Unknown session ID returns HTTP 404')

  // 5. Version Header Validation (Negative check: invalid header -> 400)
  console.log('\n--- 5. Version Header Validation ---')
  const badVerRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: { jsonrpc: '2.0', id: 4, method: 'tools/list' }, headers: { 'mcp-session-id': sessionId, 'mcp-protocol-version': 'invalid-ver' } })
  assert(badVerRes.statusCode === 400, 'Invalid MCP-Protocol-Version header returns HTTP 400')

  // 6. Origin Validation (Negative check: unauthorized origin -> 403)
  console.log('\n--- 6. Origin Validation ---')
  const badOriginRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: { jsonrpc: '2.0', id: 5, method: 'ping' }, headers: { 'mcp-session-id': sessionId, 'origin': 'https://evil.example.com' } })
  assert(badOriginRes.statusCode === 403, 'Unauthorized Origin returns HTTP 403 Forbidden')

  const goodOriginRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: { jsonrpc: '2.0', id: 6, method: 'ping' }, headers: { 'mcp-session-id': sessionId, 'origin': 'http://localhost:3000' } })
  assert(goodOriginRes.statusCode === 200, 'Authorized Origin (localhost) returns HTTP 200')

  // 7. Tools Discovery (tools/list)
  console.log('\n--- 7. Tools Discovery (tools/list) ---')
  const toolsRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: { jsonrpc: '2.0', id: 'req-tools', method: 'tools/list' }, headers: { 'mcp-session-id': sessionId, 'mcp-protocol-version': '2025-11-25' } })
  assert(toolsRes.statusCode === 200, 'tools/list returns HTTP 200')
  assert(Array.isArray(toolsRes.data.result.tools), 'tools/list returns array of tools')
  assert(toolsRes.data.result.tools.length >= 2, 'Exposes at least 2 tools')
  const consensusTool = toolsRes.data.result.tools.find(t => t.name === 'get_market_truth_consensus')
  assert(consensusTool !== undefined, 'Tool "get_market_truth_consensus" is present')
  assert(consensusTool.inputSchema.required.includes('symbol'), 'Tool schema requires "symbol"')

  // 8. Tool Call Missing Argument (Negative check: missing symbol -> error, no BTC default)
  console.log('\n--- 8. Tool Call Argument Validation (No silent BTC default) ---')
  const missingArgRes = await dispatchHttp(server, {
    method: 'POST',
    path: '/mcp',
    body: {
      jsonrpc: '2.0',
      id: 'req-no-arg',
      method: 'tools/call',
      params: { name: 'get_market_truth_consensus', arguments: {} },
    },
    headers: { 'mcp-session-id': sessionId, 'mcp-protocol-version': '2025-11-25' },
  })
  assert(missingArgRes.statusCode === 200, 'tools/call returns HTTP 200')
  assert(missingArgRes.data.result.isError === true, 'Missing symbol returns isError: true')
  assert(missingArgRes.data.result.content[0].text.includes('Missing required argument "symbol"'), 'Error specifies missing symbol')

  // 9. Tool Call Execution: get_market_truth_consensus
  console.log('\n--- 9. Tool Call Execution (get_market_truth_consensus) ---')
  const callRes = await dispatchHttp(server, {
    method: 'POST',
    path: '/mcp',
    body: {
      jsonrpc: '2.0',
      id: 'req-call-1',
      method: 'tools/call',
      params: { name: 'get_market_truth_consensus', arguments: { symbol: 'BTC' } },
    },
    headers: { 'mcp-session-id': sessionId, 'mcp-protocol-version': '2025-11-25' },
  })
  assert(callRes.statusCode === 200, 'Tool call returns HTTP 200')
  assert(callRes.headers['transfer-encoding'] === 'chunked', 'Tool call uses Transfer-Encoding: chunked')
  assert(callRes.data.result.isError === false, 'Tool execution succeeds without error')
  const payload = JSON.parse(callRes.data.result.content[0].text)
  assert(payload.symbol === 'BTC', 'Payload matches requested symbol BTC')
  assert(payload.source_count >= 2, 'Requires minimum 2 independent venues')
  assert(typeof payload.consensus_price_usd === 'number' && payload.consensus_price_usd > 0, 'Reports median spot price')
  assert(typeof payload.spread_basis_points === 'number', 'Reports cross-venue spread in basis points')

  // 10. Tool Call Execution: verify_risk_regime (Fail-closed regime refusal)
  console.log('\n--- 10. Risk Regime Fail-Closed Verification (verify_risk_regime) ---')
  const riskCallRes = await dispatchHttp(server, {
    method: 'POST',
    path: '/mcp',
    body: {
      jsonrpc: '2.0',
      id: 'req-risk-1',
      method: 'tools/call',
      params: { name: 'verify_risk_regime', arguments: { symbol: 'ETH' } },
    },
    headers: { 'mcp-session-id': sessionId, 'mcp-protocol-version': '2025-11-25' },
  })
  assert(riskCallRes.statusCode === 200, 'verify_risk_regime returns HTTP 200')
  const riskPayload = JSON.parse(riskCallRes.data.result.content[0].text)
  assert(riskPayload.status === 'INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST', 'Refuses regime without historical time series')
  assert(riskPayload.regime === null, 'Regime is strictly null')
  assert(riskPayload.confidence === 0, 'Confidence is 0')

  // 11. Resources Discovery & Read
  console.log('\n--- 11. Resources Discovery & Read ---')
  const resListRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: { jsonrpc: '2.0', id: 102, method: 'resources/list' }, headers: { 'mcp-session-id': sessionId, 'mcp-protocol-version': '2025-11-25' } })
  assert(Array.isArray(resListRes.data.result.resources), 'resources/list returns array')

  const resReadRes = await dispatchHttp(server, { method: 'POST', path: '/mcp', body: { jsonrpc: '2.0', id: 103, method: 'resources/read', params: { uri: 'velqiris://provenance/policy' } }, headers: { 'mcp-session-id': sessionId, 'mcp-protocol-version': '2025-11-25' } })
  assert(resReadRes.data.result.contents[0].uri === 'velqiris://provenance/policy', 'Read resource matches URI')

  // 12. Stateless Netlify Serverless MCP Function (netlify/functions/amazon-mcp.js)
  console.log('\n--- 12. Stateless Netlify Serverless MCP Handler Verification ---')
  const amazonMcpHandler = require('../netlify/functions/amazon-mcp.js').handler

  const slsGetRes = await amazonMcpHandler({ httpMethod: 'GET', headers: {} })
  assert(slsGetRes.statusCode === 405, 'Serverless handler rejects GET with HTTP 405')

  const slsInitRes = await amazonMcpHandler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app', 'mcp-protocol-version': '2025-11-25' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } }),
  })
  assert(slsInitRes.statusCode === 200, 'Serverless initialize negotiates 2025-11-25')

  const slsNotifRes = await amazonMcpHandler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  })
  assert(slsNotifRes.statusCode === 202, 'Serverless notification returns HTTP 202 Accepted')

  const slsToolsRes = await amazonMcpHandler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app', 'mcp-protocol-version': '2025-11-25' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
  })
  assert(slsToolsRes.statusCode === 200, 'Serverless tools/list operates statelessly without session header')

  const slsCallRes = await amazonMcpHandler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app', 'mcp-protocol-version': '2025-11-25' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'get_market_truth_consensus', arguments: {} } }),
  })
  const slsCallData = JSON.parse(slsCallRes.body)
  assert(slsCallData.result.isError === true, 'Serverless tools/call enforces required symbol before external calls')

  console.log('\n========================================================================')
  console.log(`INTERNAL VERIFICATION COMPLETE: ${passedSteps}/${totalSteps} ASSERTIONS PASSED`)
  console.log('SPECIFICATION: Model Context Protocol (v2025-11-25)')
  console.log('TRANSPORTS: Streamable HTTP (Local Stateful) & Netlify HTTP (Stateless)')
  console.log('STATUS: ALL ASSERTIONS PASSED')
  console.log('========================================================================\n')
}

runProtocolVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err.message)
  process.exit(1)
})
