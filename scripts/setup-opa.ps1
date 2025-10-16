Write-Host "OPA Integration Setup for Hospital Web App" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

$projectRoot = "E:\Capstone Project\APP\Hospital-Web-App"

# Check if OPA policies directory exists
if (-not (Test-Path "$projectRoot\opa\policies")) {
    Write-Host "Error: OPA policies directory not found" -ForegroundColor Red
    Write-Host "Make sure you're in the project root directory" -ForegroundColor Yellow
    exit 1
}

Write-Host "Step 1: Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "Docker not found. Please install Docker first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Updating Docker Compose..." -ForegroundColor Yellow

# Check if OPA service already exists in docker-compose
$composeFile = "$projectRoot\deployment\docker\docker-compose.yml"
$composeContent = Get-Content $composeFile -Raw

if ($composeContent -match "hospital-opa") {
    Write-Host "OPA service already exists in docker-compose.yml" -ForegroundColor Yellow
} else {
    Write-Host "Adding OPA service to docker-compose.yml..." -ForegroundColor Cyan
    
    # Backup original file
    Copy-Item $composeFile "$composeFile.backup"
    Write-Host "Created backup: docker-compose.yml.backup" -ForegroundColor Gray
    
    # Add OPA service
    $opaService = @"

  # OPA (Open Policy Agent) Service
  opa:
    image: openpolicyagent/opa:latest
    container_name: hospital-opa
    ports:
      - "8181:8181"
    command:
      - "run"
      - "--server"
      - "--log-level=info"
      - "--log-format=json"
      - "/policies"
    volumes:
      - ../../opa/policies:/policies:ro
    networks:
      - hospital-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:8181/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 10s
"@
    
    # Insert before volumes section
    $updatedContent = $composeContent -replace "(^volumes:)", "$opaService`n`$1"
    Set-Content -Path $composeFile -Value $updatedContent
    
    Write-Host "OPA service added to docker-compose.yml" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 3: Starting OPA service..." -ForegroundColor Yellow

try {
    Set-Location $projectRoot
    docker compose -f deployment/docker/docker-compose.yml up -d opa
    Start-Sleep -Seconds 5
    
    Write-Host "OPA service started" -ForegroundColor Green
} catch {
    Write-Host "Error starting OPA service: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Verifying OPA..." -ForegroundColor Yellow

$maxAttempts = 10
$attempt = 0
$opaReady = $false

while (-not $opaReady -and $attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8181/health" -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $opaReady = $true
            Write-Host "OPA is healthy and ready!" -ForegroundColor Green
        }
    } catch {
        $attempt++
        Write-Host "Waiting for OPA... (Attempt $attempt/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $opaReady) {
    Write-Host "Warning: OPA health check failed" -ForegroundColor Yellow
    Write-Host "Check logs with: docker logs hospital-opa" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 5: Testing OPA policies..." -ForegroundColor Yellow

try {
    # Test healthcare authorization policy
    $testInput = @{
        input = @{
            user = @{
                roles = @("doctor")
                risk_score = 0.3
            }
            resource = @{
                type = "patient_record"
                sensitivity = "medium"
            }
            action = "read"
        }
    } | ConvertTo-Json -Depth 10
    
    $testResult = Invoke-RestMethod -Uri "http://localhost:8181/v1/data/healthcare/authorization" `
        -Method POST `
        -ContentType "application/json" `
        -Body $testInput
    
    if ($testResult.result.allow -eq $true) {
        Write-Host "Policy test PASSED: Doctor can read patient records" -ForegroundColor Green
    } else {
        Write-Host "Policy test FAILED: Unexpected result" -ForegroundColor Red
        Write-Host "Result: $($testResult.result | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "Warning: Could not test policies: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 6: Installing backend dependencies..." -ForegroundColor Yellow

$backendPackageJson = "$projectRoot\backend\package.json"
$packageContent = Get-Content $backendPackageJson -Raw | ConvertFrom-Json

if ($packageContent.dependencies."node-fetch") {
    Write-Host "node-fetch already installed" -ForegroundColor Green
} else {
    Write-Host "Adding node-fetch to package.json..." -ForegroundColor Cyan
    Set-Location "$projectRoot\backend"
    npm install node-fetch@^3.3.2 --save
    Write-Host "node-fetch installed" -ForegroundColor Green
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Green
Write-Host "OPA Integration Setup Complete!" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Service Status:" -ForegroundColor Cyan
Write-Host "  OPA:        http://localhost:8181" -ForegroundColor White
Write-Host "  Health:     http://localhost:8181/health" -ForegroundColor White
Write-Host "  Policies:   http://localhost:8181/v1/policies" -ForegroundColor White
Write-Host ""
Write-Host "Available Policies:" -ForegroundColor Cyan
Write-Host "  healthcare/authorization  - General access control" -ForegroundColor White
Write-Host "  healthcare/jit           - Just-in-Time access" -ForegroundColor White
Write-Host "  healthcare/risk          - ML risk-based policies" -ForegroundColor White
Write-Host "  healthcare/hipaa         - HIPAA compliance" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Review policies in: opa/policies/" -ForegroundColor White
Write-Host "  2. Test policies: curl http://localhost:8181/v1/data/healthcare/authorization" -ForegroundColor White
Write-Host "  3. Add OPA middleware to routes (see backend/middleware/opa.js)" -ForegroundColor White
Write-Host "  4. Read the guide: docs/OPA_INTEGRATION_GUIDE.md" -ForegroundColor White
Write-Host "  5. Check examples: opa/OPA_USE_CASES_SUMMARY.md" -ForegroundColor White
Write-Host ""
Write-Host "Test OPA Policy:" -ForegroundColor Cyan
Write-Host '  curl -X POST http://localhost:8181/v1/data/healthcare/authorization \' -ForegroundColor Gray
Write-Host '    -H "Content-Type: application/json" \' -ForegroundColor Gray
Write-Host '    -d ''{"input": {"user": {"roles": ["doctor"], "risk_score": 0.3}, "resource": {"type": "patient_record"}, "action": "read"}}''' -ForegroundColor Gray
Write-Host ""
Write-Host "View Logs:" -ForegroundColor Cyan
Write-Host "  docker logs hospital-opa -f" -ForegroundColor Gray
Write-Host ""
Write-Host "Happy Policy Writing! " -ForegroundColor Green

