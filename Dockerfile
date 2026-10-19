FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY consensus.js ./
COPY netlify ./netlify
COPY mcp_server.js http_mcp_server.js ./

ENV NODE_ENV=production
ENV PORT=3333

EXPOSE 3333

USER node

CMD ["node", "http_mcp_server.js"]
