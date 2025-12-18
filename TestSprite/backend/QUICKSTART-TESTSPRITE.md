# TestSprite Quick Start Guide

## 1. Install TestSprite

**Through TestSprite Dashboard:**
1. Log in to [testsprite.com](https://testsprite.com)
2. Go to **Settings** → **MCP Integration**
3. Follow the installation instructions for your platform
4. Install the MCP server for your IDE

**Verify Installation:**
```powershell
# Check MCP server status
testsprite-mcp status

# Or use through your IDE's AI assistant
# TestSprite integrates with Cursor, VS Code, etc.
```

## 2. Configure API Key

Edit `.testspriterc` in the project root and add your API key:

```env
TESTSPRITE_API_KEY=your_actual_api_key_here
```

**Get your API key from**: [testsprite.com/dashboard/settings](https://testsprite.com/dashboard/settings)

## 3. Run Your First Test

### Backend API Test

```powershell
# Terminal 1: Start backend
cd parking-backend
npm run dev

# Terminal 2: Run tests
cd parking-backend
npm run test:testsprite:api
```

### Frontend E2E Test

```powershell
# Terminal 1: Start frontend
cd parking-frontend
npm run dev

# Terminal 2: Run tests
cd parking-frontend
npm run test:testsprite:e2e
```

## 4. View Results

- **Local Reports**: Open `test-reports/index.html` in your browser
- **Cloud Dashboard**: Visit [testsprite.com/dashboard](https://testsprite.com/dashboard)

## Need Help?

See the full [TESTING.md](TESTING.md) guide for detailed documentation.

---

**Tip**: Run `npm run test:all` in either directory to run both traditional tests (Jest/Karma) and TestSprite tests together.
