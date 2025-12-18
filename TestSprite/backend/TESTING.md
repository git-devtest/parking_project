# Testing Guide - Parking Project

## Overview

This project uses **TestSprite**, an AI-powered testing framework, to automate comprehensive testing for both backend and frontend components. TestSprite generates and executes tests through its Model Context Protocol (MCP) integration.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **Node.js** 16+ installed
2. **TestSprite Account**: Sign up at [testsprite.com](https://testsprite.com)
3. **TestSprite API Key**: Obtain from your TestSprite dashboard
4. **Database**: MySQL database configured (see backend `.env`)

---

## Installation

### 1. Install TestSprite MCP Server

```powershell
# Install globally
npm install -g @testsprite/mcp-server

# Verify installation
testsprite --version
```

### 2. Install TestSprite CLI

```powershell
npm install -g @testsprite/cli
```

---

## Configuration

### 1. Set Up API Key

Edit the `.testspriterc` file in the project root:

```env
TESTSPRITE_API_KEY=your_actual_api_key_here
TESTSPRITE_PROJECT_ID=parking-project
```

**⚠️ Important**: Add `.testspriterc` to `.gitignore` to keep your API key secure.

### 2. Verify Configuration

The project includes:
- **`testsprite.config.json`**: Main configuration file
- **`.testspriterc`**: Environment variables and API credentials
- **Backend test plan**: `parking-backend/tests/api/test-plan.md`
- **Frontend test plan**: `parking-frontend/tests/e2e/test-plan.md`

---

## Running Tests

### Backend API Tests

```powershell
cd parking-backend

# Start the backend server first
npm run dev

# In a separate terminal, run tests
npm run test:testsprite:api          # API endpoint tests only
npm run test:testsprite:integration  # Integration tests
npm run test:testsprite              # All backend tests
npm run test:all                     # Jest + TestSprite tests
```

### Frontend E2E Tests

```powershell
cd parking-frontend

# Start the frontend application
npm run dev

# In a separate terminal, run tests
npm run test:testsprite:e2e    # End-to-end tests
npm run test:testsprite:ui     # UI component tests
npm run test:testsprite        # All frontend tests
npm run test:all               # Karma + TestSprite tests
```

### Full-Stack Integration Tests

```powershell
# From project root
# Ensure both backend and frontend are running

testsprite run --full-stack --config testsprite.config.json
```

---

## Test Suites

### Backend Test Coverage

| Test Suite | Endpoints Covered | Test Cases |
|------------|------------------|------------|
| **Authentication** | `/api/auth/*` | Login, JWT validation, role-based access |
| **Vehicles** | `/api/vehicles/*` | Entry, exit, parked list, capacity, history |
| **Reports** | `/api/reports/*` | Daily, dashboard, custom reports |
| **Users** | `/api/users/*` | CRUD operations, admin functions |
| **Tickets** | `/api/tickets/*` | Generation, retrieval |
| **Insights** | `/api/insights/*` | Analytics data |
| **Audit** | `/api/audit/*` | Audit logs |
| **Backups** | `/api/backups/*` | Backup management |
| **Health** | `/health` | System health check |

### Frontend Test Coverage

| Test Suite | Components | Test Cases |
|------------|-----------|------------|
| **User Journeys** | Login → Dashboard → Operations | 5 critical paths |
| **Components** | Dashboard, Forms, Tables, Charts | UI rendering, interactions |
| **Accessibility** | All pages | WCAG AA compliance, keyboard navigation |
| **Performance** | All routes | Load times, rendering performance |
| **Responsive** | All layouts | Mobile, tablet, desktop views |

---

## Test Reports

### Viewing Reports

After running tests, TestSprite generates detailed reports:

1. **Local Reports**: `./test-reports/` directory
   - HTML reports: `test-reports/index.html`
   - JSON reports: `test-reports/results.json`
   - JUnit XML: `test-reports/junit.xml`

2. **Cloud Dashboard**: Access at [testsprite.com/dashboard](https://testsprite.com/dashboard)
   - Real-time test execution
   - Historical trends
   - Bug detection and analysis
   - Screenshots and videos

### Report Contents

- ✅ **Pass/Fail Status**: Overall test results
- 📊 **Coverage Metrics**: Code coverage percentages
- 🐛 **Bug Detection**: Identified issues with root cause analysis
- 📸 **Screenshots**: Visual evidence of failures
- 🎥 **Videos**: Recorded test executions
- ⏱️ **Performance**: Response times and load metrics

---

## Test Coverage Goals

| Metric | Target | Current |
|--------|--------|---------|
| Statements | 80% | TBD |
| Branches | 75% | TBD |
| Functions | 80% | TBD |
| Lines | 80% | TBD |

Run coverage reports:

```powershell
# Backend
cd parking-backend
npm run test:testsprite -- --coverage

# Frontend
cd parking-frontend
npm run test:testsprite -- --coverage
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/testsprite.yml`:

```yaml
name: TestSprite Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: parking_db
        ports:
          - 3306:3306
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd parking-backend && npm install
          cd ../parking-frontend && npm install
      
      - name: Install TestSprite
        run: npm install -g @testsprite/cli
      
      - name: Run Backend Tests
        env:
          TESTSPRITE_API_KEY: ${{ secrets.TESTSPRITE_API_KEY }}
        run: |
          cd parking-backend
          npm run dev &
          sleep 10
          npm run test:testsprite
      
      - name: Run Frontend Tests
        env:
          TESTSPRITE_API_KEY: ${{ secrets.TESTSPRITE_API_KEY }}
        run: |
          cd parking-frontend
          npm run dev &
          sleep 15
          npm run test:testsprite
      
      - name: Upload Test Reports
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: test-reports/
```

---

## Troubleshooting

### Common Issues

#### 1. TestSprite CLI Not Found

```powershell
# Reinstall globally
npm install -g @testsprite/cli --force

# Check PATH
echo $env:PATH
```

#### 2. API Key Invalid

- Verify API key in `.testspriterc`
- Check TestSprite dashboard for key status
- Regenerate key if necessary

#### 3. Tests Failing to Connect to Backend

```powershell
# Ensure backend is running
cd parking-backend
npm run dev

# Check backend health
curl http://localhost:3000/health
```

#### 4. Database Connection Errors

- Verify database is running
- Check credentials in `parking-backend/.env`
- Ensure database exists and is accessible

#### 5. Frontend Tests Timeout

```powershell
# Increase timeout in testsprite.config.json
{
  "execution": {
    "timeout": 60000  // Increase to 60 seconds
  }
}
```

#### 6. Port Already in Use

```powershell
# Find process using port
netstat -ano | findstr :3000
netstat -ano | findstr :4200

# Kill process
taskkill /PID <process_id> /F
```

### Getting Help

- **TestSprite Documentation**: [docs.testsprite.com](https://docs.testsprite.com)
- **TestSprite Support**: support@testsprite.com
- **Project Issues**: Create an issue in the repository

---

## Best Practices

1. **Run tests locally** before pushing to CI/CD
2. **Keep test plans updated** when adding new features
3. **Review test reports** for false positives
4. **Monitor test execution time** and optimize slow tests
5. **Use test data factories** for consistent test data
6. **Clean up test data** after test runs
7. **Run tests in isolation** to avoid dependencies
8. **Update coverage goals** as project grows

---

## Additional Resources

- [TestSprite Official Documentation](https://docs.testsprite.com)
- [Backend API Documentation](http://localhost:3000/api-docs)
- [Angular Testing Guide](https://angular.dev/guide/testing)
- [Jest Documentation](https://jestjs.io/)

---

**Last Updated**: December 17, 2024
