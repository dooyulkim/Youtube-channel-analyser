# Backend Dockerfile
FROM node:18-slim AS builder

WORKDIR /backend

# Copy package files
COPY package*.json ./


# Copy channel configuration
COPY channel_config.json ./

# Install dependencies
RUN rm -rf node_modules package-lock.json && npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-slim

WORKDIR /backend

# Copy package files and install production dependencies only
COPY package*.json ./
RUN rm -rf node_modules package-lock.json && npm install --only=production

# Copy built files from builder
COPY --from=builder /backend/dist ./dist

# Create reports directory
RUN mkdir -p /backend/reports

# Expose port (if needed for future API)
EXPOSE 3000

# Set environment
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/index.js"]
