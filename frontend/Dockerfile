# Frontend Dockerfile - Multi-stage build
FROM node:18-slim AS builder

WORKDIR /frontend

# Copy package files
COPY package*.json ./

# Install dependencies (no lock file issues with Debian)
RUN rm -rf node_modules package-lock.json && npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /frontend/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
