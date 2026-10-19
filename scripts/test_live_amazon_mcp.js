/**
 * Test live flow for stateless Amazon MCP serverless function
 */
const assert = require('node:assert/strict')
const amazonMcp = require('../netlify/functions/amazon-mcp.js')

async function runLiveTest() {
  console.log('========================================================================')
  console.log('TESTING LIVE FLOW: Stateless Netlify Serverless Amazon MCP Endpoint')
  console.log('File: netlify/functions/amazon-mcp.js')
  console.log('========================================================================\n')

  // 1. GET status
  console.log('1. Testing GET /status...')
  const getRes = await amazonMcp.handler({ httpMethod: 'GET', headers: {} })
  assert.equal(getRes.statusCode, 200)
  const getBody = JSON.parse(getRes.body)
  console.log('   Server:', getBody.server, 'v' + getBody.version)
  console.log('   Protocol:', getBody.protocolVersion)
  console.log('   Transport:', getBody.transport)
  assert.equal(getBody.protocolVersion, '2025-11-25')

  // 2. initialize handshake
  console.log('\n2. Testing POST initialize handshake...')
  const initRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://velqiris-acquisition.netlify.app',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 101,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        clientInfo: { name: 'live-test-client', version: '1.0.0' },
      },
    }),
  })
  assert.equal(initRes.statusCode, 200)
  const initBody = JSON.parse(initRes.body)
  console.log('   Negotiated protocol version:', initBody.result.protocolVersion)
  console.log('   Server session header returned:', initRes.headers['Mcp-Session-Id'])
  assert.equal(initBody.result.protocolVersion, '2025-11-25')

  // 3. notifications/initialized
  console.log('\n3. Testing POST notifications/initialized (stateless notification)...')
  const notifRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized',
    }),
  })
  assert.equal(notifRes.statusCode, 202)
  console.log('   Notification returned HTTP:', notifRes.statusCode, '(Accepted)')

  // 4. tools/list without sticky session
  console.log('\n4. Testing POST tools/list (stateless execution across Lambda instances)...')
  const toolsRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://velqiris-acquisition.netlify.app',
      'mcp-protocol-version': '2025-11-25',
      'mcp-session-id': 'different-lambda-worker-session-id',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 102,
      method: 'tools/list',
    }),
  })
  assert.equal(toolsRes.statusCode, 200)
  const toolsBody = JSON.parse(toolsRes.body)
  const toolNames = toolsBody.result.tools.map((t) => t.name)
  console.log('   Discovered tools:', toolNames.join(', '))
  assert.ok(toolNames.includes('get_market_truth_consensus'))
  assert.ok(toolNames.includes('verify_risk_regime'))

  // 5. tools/call get_market_truth_consensus (Live multi-venue fetch)
  console.log('\n5. Testing POST tools/call get_market_truth_consensus with BTC (Live Multi-Venue)...')
  const callBtcRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://velqiris-acquisition.netlify.app',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 103,
      method: 'tools/call',
      params: {
        name: 'get_market_truth_consensus',
        arguments: { symbol: 'BTC' },
      },
    }),
  })
  assert.equal(callBtcRes.statusCode, 200)
  const callBtcBody = JSON.parse(callBtcRes.body)
  const btcPayload = JSON.parse(callBtcBody.result.content[0].text)
  console.log('   Status:', btcPayload.status)
  console.log('   Symbol:', btcPayload.symbol)
  console.log('   Consensus Price (USD):', btcPayload.consensus_price_usd)
  console.log('   Venues count:', btcPayload.source_count)
  console.log('   Venue prices:', JSON.stringify(btcPayload.sources))
  console.log('   Spread (bps):', btcPayload.spread_basis_points)
  console.log('   Observed at:', btcPayload.observed_at)
  assert.equal(btcPayload.symbol, 'BTC')
  assert.ok(btcPayload.consensus_price_usd > 0)
  assert.ok(btcPayload.source_count >= 2)

  // 6. tools/call verify_risk_regime (Fail-closed refusal)
  console.log('\n6. Testing POST tools/call verify_risk_regime with ETH (Fail-Closed Refusal)...')
  const regimeRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://velqiris-acquisition.netlify.app',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 104,
      method: 'tools/call',
      params: {
        name: 'verify_risk_regime',
        arguments: { symbol: 'ETH' },
      },
    }),
  })
  assert.equal(regimeRes.statusCode, 200)
  const regimeBody = JSON.parse(regimeRes.body)
  const regimePayload = JSON.parse(regimeBody.result.content[0].text)
  console.log('   Status:', regimePayload.status)
  console.log('   Regime:', regimePayload.regime)
  console.log('   Confidence:', regimePayload.confidence)
  console.log('   Risk Status:', regimePayload.risk_status)
  console.log('   Refusal Reason:', regimePayload.reason)
  assert.equal(regimePayload.status, 'REGIME_VERIFICATION_REFUSED')
  assert.equal(regimePayload.regime, null)
  assert.equal(regimePayload.confidence, 0)
  assert.equal(regimePayload.risk_status, 'INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST')

  // 7. Negative: Missing symbol
  console.log('\n7. Testing negative case: Missing required argument "symbol"...')
  const missingSymRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://velqiris-acquisition.netlify.app' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 105,
      method: 'tools/call',
      params: { name: 'get_market_truth_consensus', arguments: {} },
    }),
  })
  assert.equal(missingSymRes.statusCode, 200)
  const missingSymBody = JSON.parse(missingSymRes.body)
  assert.equal(missingSymBody.result.isError, true)
  console.log('   Error returned correctly (no silent default):', missingSymBody.result.content[0].text)

  // 8. Negative: Invalid Origin (403)
  console.log('\n8. Testing negative case: Forbidden Origin...')
  const badOriginRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: { origin: 'https://attacker.site' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 106, method: 'ping' }),
  })
  assert.equal(badOriginRes.statusCode, 403)
  console.log('   HTTP 403 returned correctly for unauthorized origin')

  // 9. Negative: Invalid Mcp-Protocol-Version header (400)
  console.log('\n9. Testing negative case: Incompatible Mcp-Protocol-Version header...')
  const badVerRes = await amazonMcp.handler({
    httpMethod: 'POST',
    headers: {
      origin: 'https://velqiris-acquisition.netlify.app',
      'mcp-protocol-version': '2024-11-05',
    },
    body: JSON.stringify({ jsonrpc: '2.0', id: 107, method: 'ping' }),
  })
  assert.equal(badVerRes.statusCode, 400)
  console.log('   HTTP 400 returned correctly for version mismatch')

  console.log('\n========================================================================')
  console.log('ALL LIVE FLOW TESTS PASSED!')
  console.log('Stateless Netlify Serverless MCP endpoint is 100% operational.')
  console.log('========================================================================\n')
}

runLiveTest().catch((err) => {
  console.error('\n❌ Live Test Failed:', err)
  process.exit(1)
})
