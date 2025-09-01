#!/bin/bash

echo "Setting up admin user in Keycloak demo realm..."

# Get admin access token
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to get admin token. Please check Keycloak is running and admin credentials are correct."
  exit 1
fi

echo "Got admin token, creating admin user in demo realm..."

# Create admin user in demo realm
curl -s -X POST http://localhost:8080/admin/realms/demo/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@hospital.com",
    "firstName": "Admin",
    "lastName": "User",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "admin",
      "temporary": false
    }]
  }'

echo "Admin user created successfully!"
echo ""
echo "You can now access the admin dashboard at:"
echo "Frontend: http://localhost:3000/admin/dashboard"
echo "Login with: admin/admin"
echo ""
echo "Keycloak Admin Console: http://localhost:8080/admin"
echo "Master realm admin: admin/admin"
