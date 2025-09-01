#!/bin/bash

echo "Setting up admin user with roles in Keycloak demo realm..."

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

echo "Got admin token, setting up roles and admin user in demo realm..."

# Create realm roles first
echo "Creating realm roles..."

curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "admin", "description": "Administrator role with full access"}'

curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "manager", "description": "Manager role with elevated access"}'

curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "doctor", "description": "Doctor role for medical staff"}'

curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "nurse", "description": "Nurse role for nursing staff"}'

curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "staff", "description": "General staff role"}'

curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "user", "description": "Basic user role"}'

echo "Roles created. Creating admin user..."

# Create admin user in demo realm
USER_RESPONSE=$(curl -s -X POST http://localhost:8080/admin/realms/demo/users \
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
  }' \
  -w "%{http_code}")

echo "User creation response: $USER_RESPONSE"

# Get the user ID
USER_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/demo/users?username=admin" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

if [ "$USER_ID" = "null" ] || [ -z "$USER_ID" ]; then
  echo "Failed to get user ID. User might already exist or creation failed."
  # Try to get existing user
  USER_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/demo/users?username=admin" \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')
fi

echo "User ID: $USER_ID"

if [ "$USER_ID" != "null" ] && [ -n "$USER_ID" ]; then
  echo "Assigning admin role to user..."
  
  # Get admin role ID
  ADMIN_ROLE_ID=$(curl -s -X GET http://localhost:8080/admin/realms/demo/roles/admin \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')
  
  echo "Admin role ID: $ADMIN_ROLE_ID"
  
  # Assign admin role to user
  curl -s -X POST "http://localhost:8080/admin/realms/demo/users/$USER_ID/role-mappings/realm" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "[{\"id\": \"$ADMIN_ROLE_ID\", \"name\": \"admin\"}]"
  
  echo "Admin role assigned successfully!"
else
  echo "Failed to get user ID, cannot assign roles."
fi

echo ""
echo "Setup complete!"
echo ""
echo "You can now access the admin dashboard at:"
echo "Frontend: http://localhost:3000"
echo "Login with: admin/admin"
echo "The admin user will be automatically redirected to: /admin/dashboard"
echo ""
echo "Keycloak Admin Console: http://localhost:8080/admin"
echo "Master realm admin: admin/admin"
