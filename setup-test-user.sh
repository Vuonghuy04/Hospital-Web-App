#!/bin/bash

echo "Setting up test users in Keycloak demo realm..."

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

echo "Got admin token, creating test users..."

# Create regular user (doctor)
echo "Creating doctor user..."
curl -s -X POST http://localhost:8080/admin/realms/demo/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "doctor.smith",
    "email": "doctor.smith@hospital.com",
    "firstName": "John",
    "lastName": "Smith",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "password",
      "temporary": false
    }]
  }'

# Get the doctor user ID and assign doctor role
DOCTOR_USER_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/demo/users?username=doctor.smith" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

if [ "$DOCTOR_USER_ID" != "null" ] && [ -n "$DOCTOR_USER_ID" ]; then
  echo "Assigning doctor role to doctor.smith..."
  
  # Get doctor role ID
  DOCTOR_ROLE_ID=$(curl -s -X GET http://localhost:8080/admin/realms/demo/roles/doctor \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')
  
  # Assign doctor role to user
  curl -s -X POST "http://localhost:8080/admin/realms/demo/users/$DOCTOR_USER_ID/role-mappings/realm" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "[{\"id\": \"$DOCTOR_ROLE_ID\", \"name\": \"doctor\"}]"
  
  echo "Doctor role assigned successfully!"
fi

# Create nurse user
echo "Creating nurse user..."
curl -s -X POST http://localhost:8080/admin/realms/demo/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "nurse.johnson",
    "email": "nurse.johnson@hospital.com",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "enabled": true,
    "emailVerified": true,
    "credentials": [{
      "type": "password",
      "value": "password",
      "temporary": false
    }]
  }'

# Get the nurse user ID and assign nurse role
NURSE_USER_ID=$(curl -s -X GET "http://localhost:8080/admin/realms/demo/users?username=nurse.johnson" \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[0].id')

if [ "$NURSE_USER_ID" != "null" ] && [ -n "$NURSE_USER_ID" ]; then
  echo "Assigning nurse role to nurse.johnson..."
  
  # Get nurse role ID
  NURSE_ROLE_ID=$(curl -s -X GET http://localhost:8080/admin/realms/demo/roles/nurse \
    -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')
  
  # Assign nurse role to user
  curl -s -X POST "http://localhost:8080/admin/realms/demo/users/$NURSE_USER_ID/role-mappings/realm" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d "[{\"id\": \"$NURSE_ROLE_ID\", \"name\": \"nurse\"}]"
  
  echo "Nurse role assigned successfully!"
fi

echo ""
echo "Test users created successfully!"
echo ""
echo "You can now test different user types:"
echo "👨‍⚕️ Doctor: doctor.smith / password → Should go to /doctor.smith"
echo "👩‍⚕️ Nurse: nurse.johnson / password → Should go to /nurse.johnson"  
echo "👨‍💼 Admin: admin / admin → Should go to /admin"
echo ""
echo "Access the app at:"
echo "- http://localhost:3000 (Docker)"
echo "- http://localhost:3001 (Development)"
