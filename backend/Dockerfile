# ====================================================================
# Backend Dockerfile - Student Attendance REST API
# ====================================================================
FROM node:20-alpine AS base

# Install build dependencies required for native SQLite compilation if needed
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Ensure data directory exists for persistent SQLite database
RUN mkdir -p /app/data

# Environment configuration
ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/app/data/attendance.db

# Expose backend REST port
EXPOSE 5000

# Container healthcheck probing /api/health
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start backend server
CMD ["node", "src/server.js"]
