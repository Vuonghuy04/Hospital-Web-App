# Build stage
FROM node:18 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Set build-time environment variables
ARG REACT_APP_API_URL=http://localhost:5002
ARG REACT_APP_ADMIN_API_URL=http://localhost:5002
ARG REACT_APP_KEYCLOAK_URL=http://localhost:8080
ARG REACT_APP_KEYCLOAK_REALM=hospital-realm
ARG REACT_APP_KEYCLOAK_CLIENT_ID=hospital-web-app

ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ADMIN_API_URL=$REACT_APP_ADMIN_API_URL
ENV REACT_APP_KEYCLOAK_URL=$REACT_APP_KEYCLOAK_URL
ENV REACT_APP_KEYCLOAK_REALM=$REACT_APP_KEYCLOAK_REALM
ENV REACT_APP_KEYCLOAK_CLIENT_ID=$REACT_APP_KEYCLOAK_CLIENT_ID

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY deployment/docker/nginx.conf /etc/nginx/nginx.conf

# Create non-root user and set permissions
RUN adduser -S nginxuser -u 1001 -G nginx

# Change ownership and create necessary directories
RUN chown -R nginxuser:nginx /usr/share/nginx/html
RUN chown -R nginxuser:nginx /var/cache/nginx
RUN chown -R nginxuser:nginx /var/log/nginx
RUN chown -R nginxuser:nginx /etc/nginx/conf.d
RUN mkdir -p /run/nginx && chown -R nginxuser:nginx /run/nginx

# Switch to non-root user
USER nginxuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
