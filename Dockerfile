# Build stage - build the dashboard
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dashboard source
COPY packages/dashboard/package*.json ./packages/dashboard/
WORKDIR /app/packages/dashboard
RUN npm install

COPY packages/dashboard/ ./
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package.json and install production deps
COPY package.json ./
RUN npm install --omit=dev

# Copy server
COPY server.js ./

# Copy built dashboard from builder stage
COPY --from=builder /app/packages/dashboard/dist ./dashboard

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S voxlink -u 1001 && \
    chown -R voxlink:nodejs /app

USER voxlink

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server.js"]
