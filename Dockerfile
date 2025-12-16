FROM node:18-alpine

WORKDIR /app

# Copy only what we need
COPY package.json ./
COPY server.js ./

# Install production dependencies only
RUN npm install --omit=dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S voxlink -u 1001 && \
    chown -R voxlink:nodejs /app

USER voxlink

# Railway uses PORT env var
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server.js"]

