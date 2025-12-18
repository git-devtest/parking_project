# TestSprite Health Endpoint Verification Test Suite
# Verification of enhanced health endpoints with all recommendations implemented

Write-Host "=== TestSprite Health Endpoint Verification Suite ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$testResults = @()

# ============================================
# PART 1: Basic Health Endpoint Tests
# ============================================
Write-Host "=== PART 1: Basic Health Endpoint (/health) ===" -ForegroundColor Magenta
Write-Host ""

# Test 1: Status 200 OK
Write-Host "Test 1: Health endpoint responds 200 OK" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  [PASS] Status code is 200" -ForegroundColor Green
        $testResults += @{Test = "Basic: Status 200 OK"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Expected 200, got $($response.StatusCode)" -ForegroundColor Red
        $testResults += @{Test = "Basic: Status 200 OK"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Basic: Status 200 OK"; Result = "FAIL"}
}
Write-Host ""

# Test 2: Database Health Check (NEW FEATURE)
Write-Host "Test 2: Database health check present" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.database -and $content.database.status) {
        Write-Host "  [PASS] Database status: $($content.database.status)" -ForegroundColor Green
        Write-Host "  [INFO] Database response time: $($content.database.responseTime)" -ForegroundColor Cyan
        $testResults += @{Test = "Basic: Database health check"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Database health not found" -ForegroundColor Red
        $testResults += @{Test = "Basic: Database health check"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Basic: Database health check"; Result = "FAIL"}
}
Write-Host ""

# Test 3: Uptime Metric (NEW FEATURE)
Write-Host "Test 3: Uptime metric present" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.uptime) {
        Write-Host "  [PASS] Uptime: $($content.uptime)" -ForegroundColor Green
        $testResults += @{Test = "Basic: Uptime metric"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Uptime not found" -ForegroundColor Red
        $testResults += @{Test = "Basic: Uptime metric"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Basic: Uptime metric"; Result = "FAIL"}
}
Write-Host ""

# Test 4: System Metrics (NEW FEATURE)
Write-Host "Test 4: System metrics present" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.system -and $content.system.memory) {
        Write-Host "  [PASS] System metrics found" -ForegroundColor Green
        Write-Host "  [INFO] Memory usage: $($content.system.memory)" -ForegroundColor Cyan
        Write-Host "  [INFO] Platform: $($content.system.platform)" -ForegroundColor Cyan
        Write-Host "  [INFO] Node version: $($content.system.nodeVersion)" -ForegroundColor Cyan
        $testResults += @{Test = "Basic: System metrics"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] System metrics not found" -ForegroundColor Red
        $testResults += @{Test = "Basic: System metrics"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Basic: System metrics"; Result = "FAIL"}
}
Write-Host ""

# Test 5: Response Time
Write-Host "Test 5: Response time under 100ms" -ForegroundColor Yellow
try {
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    $stopwatch.Stop()
    $responseTime = $stopwatch.ElapsedMilliseconds
    
    if ($responseTime -lt 100) {
        Write-Host "  [PASS] Response time: ${responseTime}ms (< 100ms)" -ForegroundColor Green
        $testResults += @{Test = "Basic: Response time < 100ms"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Response time: ${responseTime}ms (>= 100ms)" -ForegroundColor Red
        $testResults += @{Test = "Basic: Response time < 100ms"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Basic: Response time < 100ms"; Result = "FAIL"}
}
Write-Host ""

# ============================================
# PART 2: Detailed Health Endpoint Tests
# ============================================
Write-Host "=== PART 2: Detailed Health Endpoint (/health/detailed) ===" -ForegroundColor Magenta
Write-Host ""

# Test 6: Detailed endpoint accessible
Write-Host "Test 6: Detailed endpoint responds 200 OK" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health/detailed" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "  [PASS] Status code is 200" -ForegroundColor Green
        $testResults += @{Test = "Detailed: Status 200 OK"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Expected 200, got $($response.StatusCode)" -ForegroundColor Red
        $testResults += @{Test = "Detailed: Status 200 OK"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Detailed: Status 200 OK"; Result = "FAIL"}
}
Write-Host ""

# Test 7: Service status
Write-Host "Test 7: Service status information" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health/detailed" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.service -and $content.service.status) {
        Write-Host "  [PASS] Service status: $($content.service.status)" -ForegroundColor Green
        Write-Host "  [INFO] Version: $($content.service.version)" -ForegroundColor Cyan
        Write-Host "  [INFO] Environment: $($content.service.environment)" -ForegroundColor Cyan
        $testResults += @{Test = "Detailed: Service status"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Service status not found" -ForegroundColor Red
        $testResults += @{Test = "Detailed: Service status"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Detailed: Service status"; Result = "FAIL"}
}
Write-Host ""

# Test 8: Database pool statistics
Write-Host "Test 8: Database pool statistics" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health/detailed" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.database -and $content.database.pool) {
        Write-Host "  [PASS] Database pool stats found" -ForegroundColor Green
        Write-Host "  [INFO] Pool total: $($content.database.pool.total)" -ForegroundColor Cyan
        Write-Host "  [INFO] Pool idle: $($content.database.pool.idle)" -ForegroundColor Cyan
        Write-Host "  [INFO] Pool waiting: $($content.database.pool.waiting)" -ForegroundColor Cyan
        $testResults += @{Test = "Detailed: Database pool stats"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Database pool stats not found" -ForegroundColor Red
        $testResults += @{Test = "Detailed: Database pool stats"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Detailed: Database pool stats"; Result = "FAIL"}
}
Write-Host ""

# Test 9: Detailed memory metrics
Write-Host "Test 9: Detailed memory metrics" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health/detailed" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.system.memory -and $content.system.memory.heapUsed) {
        Write-Host "  [PASS] Detailed memory metrics found" -ForegroundColor Green
        Write-Host "  [INFO] Heap used: $($content.system.memory.heapUsed)" -ForegroundColor Cyan
        Write-Host "  [INFO] Heap total: $($content.system.memory.heapTotal)" -ForegroundColor Cyan
        Write-Host "  [INFO] RSS: $($content.system.memory.rss)" -ForegroundColor Cyan
        Write-Host "  [INFO] Percentage: $($content.system.memory.percentage)" -ForegroundColor Cyan
        $testResults += @{Test = "Detailed: Memory metrics"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] Detailed memory metrics not found" -ForegroundColor Red
        $testResults += @{Test = "Detailed: Memory metrics"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Detailed: Memory metrics"; Result = "FAIL"}
}
Write-Host ""

# Test 10: CPU usage metrics
Write-Host "Test 10: CPU usage metrics" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health/detailed" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    if ($content.system.cpu) {
        Write-Host "  [PASS] CPU metrics found" -ForegroundColor Green
        Write-Host "  [INFO] CPU user: $($content.system.cpu.user)" -ForegroundColor Cyan
        Write-Host "  [INFO] CPU system: $($content.system.cpu.system)" -ForegroundColor Cyan
        $testResults += @{Test = "Detailed: CPU metrics"; Result = "PASS"}
    } else {
        Write-Host "  [FAIL] CPU metrics not found" -ForegroundColor Red
        $testResults += @{Test = "Detailed: CPU metrics"; Result = "FAIL"}
    }
} catch {
    Write-Host "  [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    $testResults += @{Test = "Detailed: CPU metrics"; Result = "FAIL"}
}
Write-Host ""

# ============================================
# Display Full Responses
# ============================================
Write-Host "=== Full Response Samples ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "--- Basic Health Endpoint ---" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    $content | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "--- Detailed Health Endpoint ---" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/health/detailed" -Method GET -UseBasicParsing
    $content = $response.Content | ConvertFrom-Json
    $content | ConvertTo-Json -Depth 10 | Write-Host
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# ============================================
# Summary
# ============================================
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
$passed = ($testResults | Where-Object { $_.Result -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Result -eq "FAIL" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host ""

# Detailed breakdown
Write-Host "--- Test Breakdown ---" -ForegroundColor Cyan
Write-Host "Basic Health Endpoint: 5 tests" -ForegroundColor White
Write-Host "Detailed Health Endpoint: 5 tests" -ForegroundColor White
Write-Host ""

if ($failed -eq 0) {
    Write-Host "[SUCCESS] All tests passed! All recommendations implemented successfully!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "[FAILED] Some tests failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed tests:" -ForegroundColor Yellow
    $testResults | Where-Object { $_.Result -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Test)" -ForegroundColor Red
    }
    exit 1
}
