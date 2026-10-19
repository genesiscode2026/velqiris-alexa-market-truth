const test = require('node:test')
const assert = require('node:assert/strict')
const amazonMcp = require('../netlify/functions/amazon-mcp.js')

// Helper to assert absence of session headers
function assertNoSessionHeaders(res) {
  assert.equal(res.headers['Mcp-Session-Id'], undefined, 'Must not return Mcp-Session-Id')
  assert.equal(res.headers['mcp-session-id'], undefined, 'Must not return mcp-session-id')
  const exposed = res.headers['Access-Control-Expose-Headers'] || ''
  assert.ok(!exposed.toLowerCase().includes('mcp-session-id'), 'Must not expose Mcp-Session-Id in CORS')
  const allowed = res.headers['Access-Control-Allow-Headers'] || ''
  assert.ok(!allowed.toLowerCase().includes('mcp-session-id'), 'Must not allow Mcp-Session-Id in CORS')
}

test('1. Absence of Mcp-Session-Id in all serverless responses', async () => {
  const initRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-11-25' },
    }),
  })
  assert.equal(initRes.statusCode, 200)
  assertNoSessionHeaders(initRes)

  const toolsRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
  })
  assert.equal(toolsRes.statusCode, 200)
  assertNoSessionHeaders(toolsRes)
})

test('2. tools/list operates without session header', async () => {
  const event = {
    httpMethod: 'POST',
    headers: {
      origin: 'https://velqiris-acquisition.netlify.app',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 201,
      method: 'tools/list',
    }),
  }
  const res = await amazonMcp.handler(event)
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.body)
  assert.equal(Array.isArray(body.result.tools), true)
  assert.equal(body.result.tools.length, 2)
  const names = body.result.tools.map((t) => t.name)
  assert.ok(names.includes('get_market_truth_consensus'))
  assert.ok(names.includes('verify_risk_regime'))
})

test('3. GET and DELETE return HTTP 405 Method Not Allowed', async () => {
  const getRes = await amazonMcp.handler({
    httpMethod: 'GET',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
  })
  assert.equal(getRes.statusCode, 405)
  const getBody = JSON.parse(getRes.body)
  assert.equal(getBody.error, 'METHOD_NOT_ALLOWED')
  assert.ok(getRes.headers.Allow.includes('POST'))

  const delRes = await amazonMcp.handler({
    httpMethod: 'DELETE',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
  })
  assert.equal(delRes.statusCode, 405)
  const delBody = JSON.parse(delRes.body)
  assert.equal(delBody.error, 'METHOD_NOT_ALLOWED')
})

test('4. Notifications return HTTP 202 with empty body', async () => {
  const notifRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
  })
  assert.equal(notifRes.statusCode, 202)
  assert.equal(notifRes.body, '', 'Notification body must be strictly empty')
})

test('5. Unauthorized Origin returns HTTP 403', async () => {
  const res = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://unauthorized-attacker.example' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 301, method: 'ping' }),
  })
  assert.equal(res.statusCode, 403)
  const body = JSON.parse(res.body)
  assert.equal(body.error, 'FORBIDDEN_ORIGIN')
})

test('6. Incompatible Mcp-Protocol-Version returns HTTP 400', async () => {
  const res = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://velqiris-acquisition.netlify.app',
      'mcp-protocol-version': '2024-11-05',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 401, method: 'ping' }),
  })
  assert.equal(res.statusCode, 400)
  const body = JSON.parse(res.body)
  assert.equal(body.error.code, -32602)
})

test('7. Missing or unsupported symbol rejected before external call', async () => {
  // Missing symbol
  const missingRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 501,
      method: 'tools/call',
      params: { name: 'get_market_truth_consensus', arguments: {} },
    }),
  })
  assert.equal(missingRes.statusCode, 200)
  const missingBody = JSON.parse(missingRes.body)
  assert.equal(missingBody.result.isError, true)
  assert.match(missingBody.result.content[0].text, /Missing required argument "symbol"/)

  // Unsupported symbol
  const unsuppRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 502,
      method: 'tools/call',
      params: { name: 'get_market_truth_consensus', arguments: { symbol: 'DOGE' } },
    }),
  })
  assert.equal(unsuppRes.statusCode, 200)
  const unsuppBody = JSON.parse(unsuppRes.body)
  assert.equal(unsuppBody.result.isError, true)
  assert.match(unsuppBody.result.content[0].text, /Unsupported asset symbol/)
})

test('8. initialize negotiation returns 2025-11-25 and server capabilities', async () => {
  const res = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://velqiris-acquisition.netlify.app',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 601,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        clientInfo: { name: 'acceptance-client', version: '1.0.0' },
      },
    }),
  })
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.body)
  assert.equal(body.result.protocolVersion, '2025-11-25')
  assert.equal(body.result.serverInfo.name, 'velqiris-market-truth-mcp')
  assert.ok(body.result.capabilities.tools)
  assert.ok(body.result.capabilities.resources)
})

test('9. Full client workflow execution (initialize -> notify -> list -> call)', async () => {
  // Step A: initialize
  const stepA = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-11-25' },
    }),
  })
  assert.equal(stepA.statusCode, 200)

  // Step B: notifications/initialized
  const stepB = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
  })
  assert.equal(stepB.statusCode, 202)
  assert.equal(stepB.body, '')

  // Step C: tools/list
  const stepC = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
  })
  assert.equal(stepC.statusCode, 200)
  const tools = JSON.parse(stepC.body).result.tools
  assert.ok(tools.length >= 2)

  // Step D: tools/call (deterministic mock)
  const prevCollector = amazonMcp._collectPrices
  amazonMcp._collectPrices = async (sym) => ({
    coinbase: 82000.0,
    binance: 82020.0,
    okx: 82010.0,
  })

  try {
    const stepD = await amazonMcp.handler({
      httpMethod: 'POST',
      headers: { origin: 'https://velqiris-acquisition.netlify.app' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: { name: 'get_market_truth_consensus', arguments: { symbol: 'BTC' } },
      }),
    })
    assert.equal(stepD.statusCode, 200)
    const stepDBody = JSON.parse(stepD.body)
    assert.equal(stepDBody.result.isError, undefined)
    const data = JSON.parse(stepDBody.result.content[0].text)
    assert.equal(data.status, 'VERIFIED_MULTI_VENUE_SNAPSHOT')
    assert.equal(data.symbol, 'BTC')
    assert.equal(data.consensus_price_usd, 82010)
    assert.equal(data.source_count, 3)
  } finally {
    amazonMcp._collectPrices = prevCollector
  }
})

test('10. Deterministic consensus and fail-closed regime refusal', async () => {
  // Deterministic fail-closed regime refusal
  const regimeRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 701,
      method: 'tools/call',
      params: { name: 'verify_risk_regime', arguments: { symbol: 'ETH' } },
    }),
  })
  assert.equal(regimeRes.statusCode, 200)
  const regimePayload = JSON.parse(JSON.parse(regimeRes.body).result.content[0].text)
  assert.equal(regimePayload.status, 'REGIME_VERIFICATION_REFUSED')
  assert.equal(regimePayload.regime, null)
  assert.equal(regimePayload.confidence, 0)
  assert.equal(regimePayload.risk_status, 'INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST')

  // Deterministic consensus calculation with simulated prices
  const prevCollector = amazonMcp._collectPrices
  amazonMcp._collectPrices = async (sym) => ({
    coinbase: 100.0,
    binance: 102.0,
    okx: 104.0,
  })

  try {
    const consensusRes = await amazonMcp.handler({
      httpMethod: 'POST',
      headers: { origin: 'https://velqiris-acquisition.netlify.app' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 702,
        method: 'tools/call',
        params: { name: 'get_market_truth_consensus', arguments: { symbol: 'SOL' } },
      }),
    })
    assert.equal(consensusRes.statusCode, 200)
    const payload = JSON.parse(JSON.parse(consensusRes.body).result.content[0].text)
    assert.equal(payload.symbol, 'SOL')
    assert.equal(payload.consensus_price_usd, 102)
    assert.equal(payload.source_count, 3)
    // spread bps: (104 - 100) / 102 * 10000 = 392.16
    assert.equal(payload.spread_basis_points, 392.16)
  } finally {
    amazonMcp._collectPrices = prevCollector
  }
})
