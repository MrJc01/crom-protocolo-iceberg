# Iceberg Daemon Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY dist/ ./dist/

# Data directory
RUN mkdir -p /data
ENV DATA_DIR=/data

# Expose port
EXPOSE 8420

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8420/health || exit 1

# Run
CMD ["node", "dist/index.js"]
