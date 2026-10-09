const assert = require('node:assert/strict')
const { handleRpcRequest, TOOLS, RESOURCES } = require('../mcp_server.js')

const originalFetch = global.fetch

function mockResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  }
}

async function runTests() {
  // 1. Test initialize
  const initRes = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
  })
  assert.equal(initRes.id, 1)
  assert.equal(initRes.result.protocolVersion, '2025-11-25')
  assert.equal(initRes.result.serverInfo.name, 'velqiris-market-truth-mcp')
  assert(initRes.result.capabilities.tools)
  assert(initRes.result.capabilities.resources)

  // 2. Test ping
  const pingRes = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 2,
    method: 'ping',
  })
  assert.equal(pingRes.id, 2)
  assert.deepEqual(pingRes.result, {})

  // 3. Test tools/list
  const toolsListRes = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 3,
    method: 'tools/list',
  })
  assert.equal(toolsListRes.id, 3)
  assert.equal(toolsListRes.result.tools.length, 2)
  assert.equal(toolsListRes.result.tools[0].name, 'get_market_truth_consensus')
  assert.equal(toolsListRes.result.tools[1].name, 'verify_risk_regime')

  // Setup multi-venue mock fetch
  global.fetch = async (url) => {
    if (url.includes('coinbase')) return mockResponse({ data: { amount: '68500.00' } })
    if (url.includes('binance')) return mockResponse({ price: '68520.00' })
    if (url.includes('okx')) return mockResponse({ data: [{ last: '68490.00' }] })
    throw new Error('unknown url')
  }

  // 4. Test tools/call: get_market_truth_consensus
  const callRes = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 4,
    method: 'tools/call',
    params: {
      name: 'get_market_truth_consensus',
      arguments: { symbol: 'BTC' },
    },
  })
  assert.equal(callRes.id, 4)
  assert.equal(callRes.result.isError, false)
  const parsed = JSON.parse(callRes.result.content[0].text)
  assert.equal(parsed.status, 'VERIFIED_MULTI_VENUE_SNAPSHOT')
  assert.equal(parsed.consensus_price_usd, 68500)
  assert.equal(parsed.source_count, 3)

  // 5. Test tools/call: verify_risk_regime (fails closed on spot-only)
  const riskRes = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 5,
    method: 'tools/call',
    params: {
      name: 'verify_risk_regime',
      arguments: { symbol: 'BTC' },
    },
  })
  assert.equal(riskRes.id, 5)
  assert.equal(riskRes.result.isError, false)
  const riskParsed = JSON.parse(riskRes.result.content[0].text)
  assert.equal(riskParsed.status, 'INSUFFICIENT_TIME_SERIES_FOR_REGIME_FORECAST')
  assert.equal(riskParsed.regime, null)

  // 6. Test tools/call: fail-closed when fewer than 2 sources respond
  global.fetch = async () => { throw new Error('venue offline') }
  const failRes = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 6,
    method: 'tools/call',
    params: {
      name: 'get_market_truth_consensus',
      arguments: { symbol: 'BTC' },
    },
  })
  assert.equal(failRes.id, 6)
  assert.equal(failRes.result.isError, true)
  const failParsed = JSON.parse(failRes.result.content[0].text)
  assert.equal(failParsed.status, 'INSUFFICIENT_INDEPENDENT_SOURCES')

  // 7. Test unknown tool call
  const unknownTool = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 7,
    method: 'tools/call',
    params: { name: 'non_existent_tool' },
  })
  assert.equal(unknownTool.id, 7)
  assert.equal(unknownTool.error.code, -32601)

  // 8. Test resources/list
  const resList = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 8,
    method: 'resources/list',
  })
  assert.equal(resList.id, 8)
  assert.equal(resList.result.resources.length, 2)
  assert.equal(resList.result.resources[0].uri, 'velqiris://provenance/policy')

  // 9. Test resources/read
  const resRead = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 9,
    method: 'resources/read',
    params: { uri: 'velqiris://provenance/policy' },
  })
  assert.equal(resRead.id, 9)
  assert.equal(resRead.result.contents[0].uri, 'velqiris://provenance/policy')
  const policyObj = JSON.parse(resRead.result.contents[0].text)
  assert.equal(policyObj.min_independent_venues, 2)

  // 10. Test resources/read invalid
  const resReadBad = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 10,
    method: 'resources/read',
    params: { uri: 'velqiris://nonexistent' },
  })
  assert.equal(resReadBad.id, 10)
  assert.equal(resReadBad.error.code, -32602)

  // 11. Test unknown method
  const unkMethod = await handleRpcRequest({
    jsonrpc: '2.0',
    id: 11,
    method: 'unsupported/method',
  })
  assert.equal(unkMethod.id, 11)
  assert.equal(unkMethod.error.code, -32601)

  console.log('✔ All 11 MCP Server test assertions PASSED.')
}

runTests().finally(() => {
  global.fetch = originalFetch
}).catch((err) => {
  console.error('MCP test error:', err)
  process.exitCode = 1
})
