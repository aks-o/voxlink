FROM node:18-alpine

WORKDIR /app

# Copy package.json and install deps
COPY package.json ./
RUN npm install --omit=dev

# Copy server
COPY server.js ./

# Copy built dashboard
COPY packages/dashboard/dist ./dashboard

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S voxlink -u 1001 && \
    chown -R voxlink:nodejs /app

USER voxlink

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server.js"]
