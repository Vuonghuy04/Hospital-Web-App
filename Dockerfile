# Frontend build stage
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production

# Build-time configuration for CRA
ARG REACT_APP_KEYCLOAK_URL=http://localhost:8080
ARG REACT_APP_KEYCLOAK_REALM=demo
ARG REACT_APP_KEYCLOAK_CLIENT_ID=demo-client
ARG REACT_APP_API_BASE_URL=http://localhost:5050

ENV REACT_APP_KEYCLOAK_URL=$REACT_APP_KEYCLOAK_URL \
    REACT_APP_KEYCLOAK_REALM=$REACT_APP_KEYCLOAK_REALM \
    REACT_APP_KEYCLOAK_CLIENT_ID=$REACT_APP_KEYCLOAK_CLIENT_ID \
    REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

# Install deps with better caching
COPY package*.json ./
RUN npm ci

# Build app
COPY . .
RUN npm run build

# Production web server
FROM nginx:1.27-alpine

# Serve the production build
COPY --from=builder /app/build /usr/share/nginx/html

# Minimal nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
