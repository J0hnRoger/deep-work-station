# Multi-stage build for optimized production image
# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY ./nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Metadata
LABEL org.opencontainers.image.title="Deep Work Station Frontend"
LABEL org.opencontainers.image.description="Focus and productivity app with audio player and Pomodoro timers"
LABEL org.opencontainers.image.vendor="CodinCloud"
LABEL org.opencontainers.image.source="https://github.com/your-username/deep-work-station"