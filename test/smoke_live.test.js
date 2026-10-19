/**
 * VELQIRIS Live Multi-Venue Smoke Test (Network Dependent)
 * Queries live Coinbase, Binance, and OKX endpoints to verify end-to-end connectivity.
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const amazonMcp = require('../netlify/functions/amazon-mcp.js')

test('Live Smoke: Query live multi-venue consensus for BTC', async () => {
  const event = {
    httpMethod: 'POST',
    headers: {
      origin: 'https://velqiris-acquisition.netlify.app',
      'mcp-protocol-version': '2025-11-25',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 901,
      method: 'tools/call',
      params: {
        name: 'get_market_truth_consensus',
        arguments: { symbol: 'BTC' },
      },
    }),
  }

  const res = await amazonMcp.handler(event)
  assert.equal(res.statusCode, 200)
  const body = JSON.parse(res.body)
  assert.equal(body.result.isError, undefined, 'Live call should succeed with valid internet')
  const payload = JSON.parse(body.result.content[0].text)
  assert.equal(payload.symbol, 'BTC')
  assert.ok(payload.consensus_price_usd > 0)
  assert.ok(payload.source_count >= 2, 'Requires >= 2 live independent venues')
  console.log(`[LIVE SMOKE PASS] BTC Consensus: $${payload.consensus_price_usd} (${payload.source_count} venues, spread: ${payload.spread_basis_points} bps)`)
})
