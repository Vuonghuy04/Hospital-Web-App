#!/bin/bash

echo "Updating Keycloak client configuration for port 3001..."

# Get admin access token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to get admin token. Please check Keycloak is running."
  exit 1
fi

echo "Got admin token, updating demo-client configuration..."

# Get current client configuration
CLIENT_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/demo/clients?clientId=demo-client" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

if [ "$CLIENT_ID" = "null" ] || [ -z "$CLIENT_ID" ]; then
  echo "Client demo-client not found. Creating it..."
  
  # Create the client
  curl -s -X POST http://localhost:8080/admin/realms/demo/clients \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "clientId": "demo-client",
      "name": "Hospital Demo Client",
      "enabled": true,
      "publicClient": true,
      "redirectUris": [
        "http://localhost:3000/*",
        "http://localhost:3001/*",
        "http://localhost:3002/*"
      ],
      "webOrigins": [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002"
      ],
      "attributes": {
        "pkce.code.challenge.method": "S256"
      }
    }'
  
  echo "Client created successfully!"
else
  echo "Updating existing client with ID: $CLIENT_ID"
  
  # Update the existing client
  curl -s -X PUT "http://localhost:8080/admin/realms/demo/clients/$CLIENT_ID" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "clientId": "demo-client",
      "name": "Hospital Demo Client",
      "enabled": true,
      "publicClient": true,
      "redirectUris": [
        "http://localhost:3000/*",
        "http://localhost:3001/*",
        "http://localhost:3002/*"
      ],
      "webOrigins": [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002"
      ],
      "attributes": {
        "pkce.code.challenge.method": "S256"
      }
    }'
  
  echo "Client updated successfully!"
fi

echo ""
echo "Keycloak client configuration updated!"
echo "You can now access the app on multiple ports:"
echo "- http://localhost:3000"
echo "- http://localhost:3001" 
echo "- http://localhost:3002"
