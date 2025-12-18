# TestSprite Health Endpoint Test Suite
# Based on test-plan.md specifications

Write-Host "=== TestSprite Health Endpoint Test Suite ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$endpoint = "/health"
$testResults = @()

# Test Case 1: Health endpoint responds 200 OK
Write-Host "Test 1: Health endpoint responds 200 OK" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  [PASS] Status code is 200" -ForegroundColor Green
        $testResults += @{Test = "Status 200 OK"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Expected 200, got $($response.StatusCode)" -ForegroundColor Red
        $testResults += @{Test = "Status 200 OK"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Status 200 OK"; Result = "FAIL"}
}
Write-Host ""

# Test Case 2: Response includes version
Write-Host "Test 2: Response includes version" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.version) {
        Write-Host "  [PASS] Version found: $($content.version)" -ForegroundColor Green
        $testResults += @{Test = "Response includes version"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Version not found in response" -ForegroundColor Red
        $testResults += @{Test = "Response includes version"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Response includes version"; Result = "FAIL"}
}
Write-Host ""

# Test Case 3: Response includes timestamp
Write-Host "Test 3: Response includes timestamp" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.timestamp) {
        Write-Host "  [PASS] Timestamp found: $($content.timestamp)" -ForegroundColor Green
        $testResults += @{Test = "Response includes timestamp"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Timestamp not found in response" -ForegroundColor Red
        $testResults += @{Test = "Response includes timestamp"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Response includes timestamp"; Result = "FAIL"}
}
Write-Host ""

# Test Case 4: Response includes environment
Write-Host "Test 4: Response includes environment" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.environment -or $content.env) {
        $env = if ($content.environment) { $content.environment } else { $content.env }
        Write-Host "  [PASS] Environment found: $env" -ForegroundColor Green
        $testResults += @{Test = "Response includes environment"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Environment not found in response" -ForegroundColor Red
        $testResults += @{Test = "Response includes environment"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Response includes environment"; Result = "FAIL"}
}
Write-Host ""

# Test Case 5: Database connectivity check
Write-Host "Test 5: Database connectivity check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.database -or $content.db -or $content.status -eq "healthy") {
        Write-Host "  [PASS] Database status included in response" -ForegroundColor Green
        $testResults += @{Test = "Database connectivity check"; Result = "PASS"}
    } else {
        Write-Host "  [WARNING] Database status not explicitly mentioned" -ForegroundColor Yellow
        $testResults += @{Test = "Database connectivity check"; Result = "WARNING"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Database connectivity check"; Result = "FAIL"}
}
Write-Host ""

# Test Case 6: Response time under 100ms
Write-Host "Test 6: Response time under 100ms" -ForegroundColor Yellow
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 100) {
        Write-Host "  [PASS] Response time: ${responseTime}ms (< 100ms)" -ForegroundColor Green
        $testResults += @{Test = "Response time < 100ms"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Response time: ${responseTime}ms (>= 100ms)" -ForegroundColor Red
        $testResults += @{Test = "Response time < 100ms"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Response time < 100ms"; Result = "FAIL"}
}
Write-Host ""

# Display full response
Write-Host "=== Full Health Endpoint Response ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "$baseUrl$endpoint" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    $content | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "Error retrieving response: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Summary
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
$passed = ($testResults | Where-Object { $_.Result -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Result -eq "FAIL" }).Count
$warnings = ($testResults | Where-Object { $_.Result -eq "WARNING" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Warnings: $warnings" -ForegroundColor Yellow
Write-Host ""

if ($failed -eq 0 -and $warnings -eq 0) {
    Write-Host "[SUCCESS] All tests passed!" -ForegroundColor Green
    exit 0
} elseif ($failed -eq 0) {
    Write-Host "[WARNING] All tests passed with warnings" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "[FAILED] Some tests failed" -ForegroundColor Red
    exit 1
}
