/**
 * VELQIRIS Streamable HTTP Model Context Protocol (MCP) Server
 * Protocol Version: 2025-11-25 or later
 * Transport: Streamable HTTP (Transfer-Encoding: chunked / text/event-stream)
 * Conforming to Amazon Developer & Anthropic MCP Specifications.
 */

const http = require('node:http')
const crypto = require('node:crypto')
const { handleRpcRequest, handleToolCall, TOOLS, RESOURCES } = require('./mcp_server.js')

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3333
const PROTOCOL_VERSION = '2025-11-25'
const SERVER_NAME = 'velqiris-market-truth-mcp'
const SERVER_VERSION = '1.1.0'

// Active sessions map: sessionId -> { createdAt, lastActive, initialized }
const sessions = new Map()

// Allowed Origins for browser/web client validation
const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/velqiris-acquisition\.netlify\.app$/,
  /^https:\/\/amazonappdev2026\.devpost\.com$/,
  /^https:\/\/devpost\.com$/,
]

function isOriginAllowed(origin) {
  if (!origin) return true // Allow non-browser agents (stdio, CLI, server-to-server)
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
}

function createHttpMcpServer() {
  const server = http.createServer(async (req, res) => {
    const origin = req.headers['origin']

    // 1. Origin Security Validation (403 for unauthorized origins)
    if (origin && !isOriginAllowed(origin)) {
      res.writeHead(403, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        error: 'FORBIDDEN_ORIGIN',
        message: `Origin '${origin}' is not permitted by MCP security policy.`,
      }))
      return
    }

    const allowOrigin = origin && isOriginAllowed(origin) ? origin : '*'
    res.setHeader('Access-Control-Allow-Origin', allowOrigin)
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Authorization, Accept')
    res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id, Mcp-Protocol-Version')

    if (req.method === 'OPTIONS') {
      res.writeHead(204)
      res.end()
      return
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

    // 2. Health & Discovery Route
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        status: 'ONLINE',
        server: SERVER_NAME,
        version: SERVER_VERSION,
        protocolVersion: PROTOCOL_VERSION,
        transport: 'Streamable HTTP',
        activeSessions: sessions.size,
        endpoints: {
          mcp: '/mcp',
          health: '/health',
        },
        toolsCount: TOOLS.length,
        resourcesCount: RESOURCES.length,
      }, null, 2))
      return
    }

    // 3. DELETE /mcp (Session Termination)
    if (req.method === 'DELETE' && (url.pathname === '/mcp' || url.pathname === '/')) {
      const sessionId = req.headers['mcp-session-id']
      if (!sessionId) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'MISSING_SESSION_ID', message: 'Mcp-Session-Id header required to terminate.' }))
        return
      }
      if (!sessions.has(sessionId)) {
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'SESSION_NOT_FOUND', message: 'Session ID not found to terminate.' }))
        return
      }
      sessions.delete(sessionId)
      res.writeHead(204)
      res.end()
      return
    }

    // 4. SSE Stream Route (GET /mcp or GET /sse)
    if (req.method === 'GET' && (url.pathname === '/mcp' || url.pathname === '/sse')) {
      let sessionId = req.headers['mcp-session-id']
      if (!sessionId || !sessions.has(sessionId)) {
        sessionId = crypto.randomUUID()
        sessions.set(sessionId, { createdAt: Date.now(), lastActive: Date.now(), initialized: true })
      } else {
        const s = sessions.get(sessionId)
        s.lastActive = Date.now()
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Mcp-Session-Id': sessionId,
        'Mcp-Protocol-Version': PROTOCOL_VERSION,
      })

      res.write(`event: endpoint\ndata: ${JSON.stringify({ endpoint: '/mcp', sessionId })}\n\n`)

      const interval = setInterval(() => {
        res.write(`event: ping\ndata: {}\n\n`)
      }, 15000)

      req.on('close', () => {
        clearInterval(interval)
        sessions.delete(sessionId)
      })
      return
    }

    // 5. MCP Request Route (POST /mcp or POST /)
    if (req.method === 'POST' && (url.pathname === '/mcp' || url.pathname === '/')) {
      // Validate MCP-Protocol-Version header: invalid header MUST return 400
      const clientVersionHeader = req.headers['mcp-protocol-version']
      if (clientVersionHeader && clientVersionHeader !== PROTOCOL_VERSION) {
        res.writeHead(400, {
          'Content-Type': 'application/json',
          'Mcp-Protocol-Version': PROTOCOL_VERSION,
        })
        res.end(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32602,
            message: `Unsupported MCP-Protocol-Version '${clientVersionHeader}'. Server requires '${PROTOCOL_VERSION}'.`,
          },
        }))
        return
      }

      let rawBody = ''
      req.on('data', chunk => { rawBody += chunk })
      req.on('end', async () => {
        let rpcRequest
        try {
          if (!rawBody || rawBody.trim() === '') {
            throw new Error('Empty request body')
          }
          rpcRequest = JSON.parse(rawBody)
        } catch (parseErr) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Mcp-Protocol-Version': PROTOCOL_VERSION })
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: { code: -32700, message: `Parse error: ${parseErr.message}` },
          }))
          return
        }

        // Validate JSON-RPC 2.0 structure
        if (typeof rpcRequest !== 'object' || rpcRequest === null || rpcRequest.jsonrpc !== '2.0' || !rpcRequest.method) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Mcp-Protocol-Version': PROTOCOL_VERSION })
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: rpcRequest?.id ?? null,
            error: { code: -32600, message: 'Invalid Request: Not a valid JSON-RPC 2.0 payload.' },
          }))
          return
        }

        const isInitialize = rpcRequest.method === 'initialize'
        const isNotification = rpcRequest.id === undefined || rpcRequest.id === null || rpcRequest.method.startsWith('notifications/')

        let sessionId = req.headers['mcp-session-id']

        if (isInitialize) {
          // Initialize creates a new session
          sessionId = crypto.randomUUID()
          sessions.set(sessionId, {
            createdAt: Date.now(),
            lastActive: Date.now(),
            initialized: false,
          })
        } else {
          // Post-initialize requests:
          // 1. Missing session ID MUST return HTTP 400
          if (!sessionId) {
            res.writeHead(400, { 'Content-Type': 'application/json', 'Mcp-Protocol-Version': PROTOCOL_VERSION })
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: rpcRequest.id ?? null,
              error: { code: -32000, message: 'Missing required Mcp-Session-Id header for post-initialize request.' },
            }))
            return
          }
          // 2. Unknown session ID MUST return HTTP 404
          if (!sessions.has(sessionId)) {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Mcp-Protocol-Version': PROTOCOL_VERSION })
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: rpcRequest.id ?? null,
              error: { code: -32000, message: `Session '${sessionId}' not found or expired.` },
            }))
            return
          }

          const s = sessions.get(sessionId)
          s.lastActive = Date.now()
          if (rpcRequest.method === 'notifications/initialized') {
            s.initialized = true
          }
        }

        // Set Streamable HTTP Headers
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.setHeader('Mcp-Protocol-Version', PROTOCOL_VERSION)
        if (sessionId) {
          res.setHeader('Mcp-Session-Id', sessionId)
        }

        // Handle Notifications with HTTP 202 Accepted per MCP Streamable HTTP spec
        if (isNotification) {
          try {
            await handleRpcRequest(rpcRequest)
          } catch (_) {}
          res.writeHead(202)
          res.end()
          return
        }

        // Process standard RPC Request
        try {
          const rpcResponse = await handleRpcRequest(rpcRequest)
          
          if (rpcResponse === null) {
            res.writeHead(202)
            res.end()
            return
          }

          res.setHeader('Transfer-Encoding', 'chunked')
          res.writeHead(200)

          // Streamable HTTP Chunked Write
          const jsonString = JSON.stringify(rpcResponse)
          const chunkSize = 64
          for (let i = 0; i < jsonString.length; i += chunkSize) {
            res.write(jsonString.slice(i, i + chunkSize))
          }
          res.end()
        } catch (handlerErr) {
          res.writeHead(500, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            id: rpcRequest.id ?? null,
            error: { code: -32603, message: `Internal server error: ${handlerErr.message}` },
          }))
        }
      })
      return
    }

    // 6. Fallback 404
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'NOT_FOUND', path: url.pathname }))
  })

  return server
}

function startHttpServer(port = DEFAULT_PORT) {
  const server = createHttpMcpServer()
  return new Promise((resolve, reject) => {
    server.listen(port, '0.0.0.0', () => {
      console.log(`[VELQIRIS-MCP] Streamable HTTP MCP Server listening on http://0.0.0.0:${port}/mcp`)
      console.log(`[VELQIRIS-MCP] Protocol Version: ${PROTOCOL_VERSION}`)
      resolve(server)
    })
    server.on('error', reject)
  })
}

if (require.main === module) {
  startHttpServer().catch(err => {
    console.error('[VELQIRIS-MCP] Failed to start HTTP server:', err)
    process.exit(1)
  })
}

module.exports = {
  createHttpMcpServer,
  startHttpServer,
  isOriginAllowed,
  sessions,
  PROTOCOL_VERSION,
  SERVER_NAME,
  SERVER_VERSION,
}
