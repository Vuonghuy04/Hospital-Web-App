Write-Host "Hospital Users Setup for Keycloak" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# Wait for Keycloak
Write-Host "Waiting for Keycloak to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$keycloakReady = $false

while (-not $keycloakReady -and $attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/realms/demo" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $keycloakReady = $true
            Write-Host "Keycloak is ready!" -ForegroundColor Green
        }
    }
    catch {
        $attempt++
        Write-Host "Waiting... Attempt $attempt of $maxAttempts" -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
}

if (-not $keycloakReady) {
    Write-Host "Failed to connect to Keycloak" -ForegroundColor Red
    exit 1
}

# Get admin token
Write-Host "Getting admin token..." -ForegroundColor Yellow
try {
    $tokenBody = "username=admin&password=admin&grant_type=password&client_id=admin-cli"
    $tokenResponse = Invoke-RestMethod -Uri "http://localhost:8080/realms/master/protocol/openid-connect/token" -Method POST -ContentType "application/x-www-form-urlencoded" -Body $tokenBody
    $token = $tokenResponse.access_token
    Write-Host "Admin token obtained" -ForegroundColor Green
}
catch {
    Write-Host "Failed to get admin token" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Create roles
Write-Host ""
Write-Host "Creating roles..." -ForegroundColor Yellow
$roles = @("doctor", "nurse", "contractor", "accountant")

foreach ($role in $roles) {
    try {
        $roleJson = "{`"name`":`"$role`",`"description`":`"$role role`"}"
        Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/demo/roles" -Method POST -Headers $headers -Body $roleJson -ErrorAction Stop
        Write-Host "Created role: $role" -ForegroundColor Gray
    }
    catch {
        Write-Host "Role $role already exists or error occurred" -ForegroundColor Gray
    }
}

Write-Host "Roles created" -ForegroundColor Green

# Enable direct access grants
Write-Host ""
Write-Host "Configuring demo-client..." -ForegroundColor Yellow
try {
    $clients = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/demo/clients" -Method GET -Headers $headers
    $demoClient = $clients | Where-Object { $_.clientId -eq "demo-client" }
    
    if ($demoClient) {
        $clientConfig = "{`"directAccessGrantsEnabled`":true}"
        Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/demo/clients/$($demoClient.id)" -Method PUT -Headers $headers -Body $clientConfig
        Write-Host "Direct access grants enabled" -ForegroundColor Green
    }
}
catch {
    Write-Host "Could not configure demo-client" -ForegroundColor Yellow
}

# Create users
Write-Host ""
Write-Host "Creating users..." -ForegroundColor Yellow

$usersList = @(
    @{username="admin"; password="admin"; firstName="Admin"; lastName="User"; email="admin@hospital.com"},
    @{username="duc"; password="duc"; firstName="Duc"; lastName="Nguyen"; email="duc@hospital.com"},
    @{username="dung"; password="dung"; firstName="Dung"; lastName="Tran"; email="dung@hospital.com"},
    @{username="huy"; password="huy"; firstName="Huy"; lastName="Le"; email="huy@hospital.com"},
    @{username="dat"; password="dat"; firstName="Dat"; lastName="Pham"; email="dat@hospital.com"}
)

foreach ($user in $usersList) {
    try {
        $userJson = @"
{
    "username": "$($user.username)",
    "enabled": true,
    "emailVerified": true,
    "firstName": "$($user.firstName)",
    "lastName": "$($user.lastName)",
    "email": "$($user.email)",
    "credentials": [
        {
            "type": "password",
            "value": "$($user.password)",
            "temporary": false
        }
    ]
}
"@
        
        Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/demo/users" -Method POST -Headers $headers -Body $userJson -ErrorAction Stop
        Write-Host "Created user: $($user.username)" -ForegroundColor Gray
    }
    catch {
        Write-Host "User $($user.username) already exists or error occurred" -ForegroundColor Gray
    }
}

# Assign manager role to admin
Write-Host ""
Write-Host "Assigning manager role to admin..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/demo/users" -Method GET -Headers $headers
    $adminUser = $users | Where-Object { $_.username -eq "admin" }
    
    if ($adminUser) {
        $roles = Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/demo/roles" -Method GET -Headers $headers
        $managerRole = $roles | Where-Object { $_.name -eq "manager" }
        
        if ($managerRole) {
            $roleJson = "[{`"id`":`"$($managerRole.id)`",`"name`":`"manager`"}]"
            Invoke-RestMethod -Uri "http://localhost:8080/admin/realms/demo/users/$($adminUser.id)/role-mappings/realm" -Method POST -Headers $headers -Body $roleJson
            Write-Host "Manager role assigned to admin" -ForegroundColor Green
        }
    }
}
catch {
    Write-Host "Could not assign manager role" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Users created successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Users created:" -ForegroundColor Cyan
Write-Host "  admin / admin - Administrator" -ForegroundColor White
Write-Host "  duc / duc - Doctor" -ForegroundColor White
Write-Host "  dung / dung - Nurse" -ForegroundColor White
Write-Host "  huy / huy - Contractor" -ForegroundColor White
Write-Host "  dat / dat - Accountant" -ForegroundColor White
Write-Host ""
Write-Host "Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API: http://localhost:5002" -ForegroundColor White
Write-Host "  ML Service:  http://localhost:5001" -ForegroundColor White
Write-Host "  Keycloak:    http://localhost:8080" -ForegroundColor White
