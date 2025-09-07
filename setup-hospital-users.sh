#!/bin/bash

echo "🏥 Setting up Hospital Users in Keycloak"
echo "========================================"

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to be ready..."
until curl -s http://localhost:8080/realms/demo > /dev/null; do
  echo "   Keycloak not ready yet, waiting..."
  sleep 5
done

echo "✅ Keycloak is ready!"

# Get admin token
echo "🔑 Getting admin token..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8080/realms/master/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | jq -r '.access_token')

if [ "$ADMIN_TOKEN" = "null" ] || [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Failed to get admin token"
  exit 1
fi

echo "✅ Admin token obtained"

# Create roles
echo "👥 Creating roles..."

# Doctor role
curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "doctor", "description": "Doctor role with access to patient records and medical data"}' > /dev/null

# Nurse role
curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "nurse", "description": "Nurse role with access to patient care and basic records"}' > /dev/null

# Contractor role
curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "contractor", "description": "Contractor role with limited access to financial data"}' > /dev/null

# Accountant role
curl -s -X POST http://localhost:8080/admin/realms/demo/roles \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "accountant", "description": "Accountant role with access to financial and billing data"}' > /dev/null

echo "✅ Roles created"

# Create groups
echo "👥 Creating groups..."

# Hospital Side group
HOSPITAL_GROUP_ID=$(curl -s -X POST http://localhost:8080/admin/realms/demo/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Hospital Side", "attributes": {"description": ["Medical staff group with access to patient data"]}}' | jq -r '.id')

# Finance Group
FINANCE_GROUP_ID=$(curl -s -X POST http://localhost:8080/admin/realms/demo/groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Finance Group", "attributes": {"description": ["Financial staff group with access to billing and financial data"]}}' | jq -r '.id')

echo "✅ Groups created"

# Add roles to groups
echo "🔗 Adding roles to groups..."

# Add doctor and nurse roles to Hospital Side group
curl -s -X PUT http://localhost:8080/admin/realms/demo/groups/$HOSPITAL_GROUP_ID/role-mappings/realm \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"id": "'$(curl -s http://localhost:8080/admin/realms/demo/roles/doctor -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')'", "name": "doctor"}, {"id": "'$(curl -s http://localhost:8080/admin/realms/demo/roles/nurse -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')'", "name": "nurse"}]' > /dev/null

# Add contractor and accountant roles to Finance Group
curl -s -X PUT http://localhost:8080/admin/realms/demo/groups/$FINANCE_GROUP_ID/role-mappings/realm \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[{"id": "'$(curl -s http://localhost:8080/admin/realms/demo/roles/contractor -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')'", "name": "contractor"}, {"id": "'$(curl -s http://localhost:8080/admin/realms/demo/roles/accountant -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')'", "name": "accountant"}]' > /dev/null

echo "✅ Roles assigned to groups"

# Fix admin user roles
echo "🔧 Fixing admin user roles..."

# Get admin user ID
ADMIN_USER_ID=$(curl -s http://localhost:8080/admin/realms/demo/users -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.[] | select(.username=="admin") | .id')

if [ -n "$ADMIN_USER_ID" ]; then
  # Get admin role ID
  ADMIN_ROLE_ID=$(curl -s http://localhost:8080/admin/realms/demo/roles/admin -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')
  
  if [ -n "$ADMIN_ROLE_ID" ]; then
    # Assign admin role to admin user
    curl -s -X POST http://localhost:8080/admin/realms/demo/users/$ADMIN_USER_ID/role-mappings/realm \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "[{\"id\": \"$ADMIN_ROLE_ID\", \"name\": \"admin\"}]" > /dev/null
    echo "✅ Admin role assigned to admin user"
  fi
  
  # Also assign manager role for broader access
  MANAGER_ROLE_ID=$(curl -s http://localhost:8080/admin/realms/demo/roles/manager -H "Authorization: Bearer $ADMIN_TOKEN" | jq -r '.id')
  
  if [ -n "$MANAGER_ROLE_ID" ]; then
    curl -s -X POST http://localhost:8080/admin/realms/demo/users/$ADMIN_USER_ID/role-mappings/realm \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d "[{\"id\": \"$MANAGER_ROLE_ID\", \"name\": \"manager\"}]" > /dev/null
    echo "✅ Manager role assigned to admin user"
  fi
else
  echo "⚠️ Admin user not found, skipping role assignment"
fi

# Create users
echo "👤 Creating users..."

# Duc (Doctor)
curl -s -X POST http://localhost:8080/admin/realms/demo/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "duc",
    "enabled": true,
    "emailVerified": true,
    "firstName": "Duc",
    "lastName": "Nguyen",
    "email": "duc@hospital.com",
    "credentials": [{"type": "password", "value": "duc", "temporary": false}],
    "groups": ["/Hospital Side"],
    "attributes": {"department": ["Medical"], "position": ["Doctor"]}
  }' > /dev/null

# Dung (Nurse)
curl -s -X POST http://localhost:8080/admin/realms/demo/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dung",
    "enabled": true,
    "emailVerified": true,
    "firstName": "Dung",
    "lastName": "Tran",
    "email": "dung@hospital.com",
    "credentials": [{"type": "password", "value": "dung", "temporary": false}],
    "groups": ["/Hospital Side"],
    "attributes": {"department": ["Medical"], "position": ["Nurse"]}
  }' > /dev/null

# Huy (Contractor)
curl -s -X POST http://localhost:8080/admin/realms/demo/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "huy",
    "enabled": true,
    "emailVerified": true,
    "firstName": "Huy",
    "lastName": "Le",
    "email": "huy@hospital.com",
    "credentials": [{"type": "password", "value": "huy", "temporary": false}],
    "groups": ["/Finance Group"],
    "attributes": {"department": ["Finance"], "position": ["Contractor"]}
  }' > /dev/null

# Dat (Accountant)
curl -s -X POST http://localhost:8080/admin/realms/demo/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "dat",
    "enabled": true,
    "emailVerified": true,
    "firstName": "Dat",
    "lastName": "Pham",
    "email": "dat@hospital.com",
    "credentials": [{"type": "password", "value": "dat", "temporary": false}],
    "groups": ["/Finance Group"],
    "attributes": {"department": ["Finance"], "position": ["Accountant"]}
  }' > /dev/null

echo "✅ Users created"

echo ""
echo "🎉 Hospital users setup complete!"
echo "================================"
echo ""
echo "👥 Users created:"
echo "   admin (Admin) - admin and manager roles"
echo "   duc (Doctor) - Hospital Side group"
echo "   dung (Nurse) - Hospital Side group"
echo "   huy (Contractor) - Finance Group"
echo "   dat (Accountant) - Finance Group"
echo ""
echo "🔐 Login credentials:"
echo "   Username = Password for all users"
echo ""
echo "🌐 Test login at: http://localhost:3000"
echo "🔧 Admin console: http://localhost:8080/admin"
echo ""
echo "💡 The admin user now has proper roles for accessing the admin dashboard!"
