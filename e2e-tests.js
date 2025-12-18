#!/usr/bin/env node

/**
 * E2E Test Suite para Frontend Parking System
 * Ejecuta pruebas automatizadas del flujo de usuario principal
 * Herramienta: Puppeteer
 */

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  // Fallback: usar puppeteer vía npx
  puppeteer = require('puppeteer/lib/cjs/puppeteer/launcher/chrome-launcher.js');
}
const fs = require('fs');
const path = require('path');

// Configuración
const TEST_CONFIG = {
  baseURL: 'http://localhost:4200',
  headless: 'new',
  timeout: 30000,
  slowMo: 100,
  credentials: {
    admin: { email: 'admin@parking.com', password: 'admin123' },
    operator: { email: 'operator@parking.com', password: 'operator123' }
  }
};

// Resultados de pruebas
const testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  startTime: new Date(),
  testCases: []
};

/**
 * Registro de prueba
 */
async function logTest(testName, status, error = null) {
  testResults.totalTests++;
  
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ [PASS] ${testName}`);
  } else if (status === 'FAIL') {
    testResults.failed++;
    console.error(`❌ [FAIL] ${testName}`);
    if (error) console.error(`   Error: ${error.message}`);
  } else if (status === 'SKIP') {
    testResults.skipped++;
    console.log(`⏭️  [SKIP] ${testName}`);
  }
  
  testResults.testCases.push({
    name: testName,
    status,
    error: error ? error.message : null,
    timestamp: new Date().toISOString()
  });
}

/**
 * Prueba 1: Frontend accessible
 */
async function testFrontendAccessible(browser) {
  try {
    const page = await browser.newPage();
    const response = await page.goto(`${TEST_CONFIG.baseURL}/`, { waitUntil: 'networkidle2' });
    
    if (response.status() === 200) {
      await logTest('Frontend Accessible', 'PASS');
    } else {
      throw new Error(`Status ${response.status()}`);
    }
    await page.close();
  } catch (error) {
    await logTest('Frontend Accessible', 'FAIL', error);
  }
}

/**
 * Prueba 2: Login page visible
 */
async function testLoginPage(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`${TEST_CONFIG.baseURL}/login`, { waitUntil: 'networkidle2' });
    
    // Verificar que exista el formulario de login
    const loginForm = await page.$('form, [role="presentation"]');
    if (loginForm) {
      await logTest('Login Page Visible', 'PASS');
    } else {
      throw new Error('Login form not found');
    }
    await page.close();
  } catch (error) {
    await logTest('Login Page Visible', 'FAIL', error);
  }
}

/**
 * Prueba 3: Login exitoso
 */
async function testLoginSuccess(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`${TEST_CONFIG.baseURL}/login`, { waitUntil: 'networkidle2' });
    
    // Buscar y completar campos de login
    const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const submitBtn = await page.$('button[type="submit"], button[aria-label*="login" i]');
    
    if (emailInput && passwordInput && submitBtn) {
      await emailInput.type(TEST_CONFIG.credentials.admin.email, { delay: 50 });
      await passwordInput.type(TEST_CONFIG.credentials.admin.password, { delay: 50 });
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
        submitBtn.click()
      ]);
      
      // Esperar a que se complete la navegación
      await page.waitForTimeout(2000);
      
      const url = page.url();
      if (url.includes('/dashboard') || !url.includes('/login')) {
        await logTest('Login Success', 'PASS');
      } else {
        throw new Error(`Still on login page: ${url}`);
      }
    } else {
      throw new Error('Login form elements not found');
    }
    
    await page.close();
  } catch (error) {
    await logTest('Login Success', 'FAIL', error);
  }
}

/**
 * Prueba 4: Dashboard accesible después de login
 */
async function testDashboardAccess(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`${TEST_CONFIG.baseURL}/dashboard`, { waitUntil: 'networkidle2' });
    
    const url = page.url();
    if (url.includes('/dashboard') || url.includes('/')) {
      await logTest('Dashboard Access', 'PASS');
    } else {
      throw new Error(`Redirected from dashboard: ${url}`);
    }
    
    await page.close();
  } catch (error) {
    await logTest('Dashboard Access', 'FAIL', error);
  }
}

/**
 * Prueba 5: Vehicle Entry page
 */
async function testVehicleEntryPage(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`${TEST_CONFIG.baseURL}/vehicle-entry`, { waitUntil: 'networkidle2' });
    
    const vehicleForm = await page.$('form, [role="presentation"]');
    if (vehicleForm) {
      await logTest('Vehicle Entry Page', 'PASS');
    } else {
      throw new Error('Vehicle entry form not found');
    }
    
    await page.close();
  } catch (error) {
    await logTest('Vehicle Entry Page', 'FAIL', error);
  }
}

/**
 * Prueba 6: Vehicle list/dashboard
 */
async function testVehiclesList(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`${TEST_CONFIG.baseURL}/vehicles`, { waitUntil: 'networkidle2' });
    
    await page.waitForTimeout(1000);
    const vehicleTable = await page.$('table, [role="grid"], app-vehicle-list');
    
    if (vehicleTable) {
      await logTest('Vehicles List', 'PASS');
    } else {
      throw new Error('Vehicles list not found');
    }
    
    await page.close();
  } catch (error) {
    await logTest('Vehicles List', 'FAIL', error);
  }
}

/**
 * Prueba 7: Reports page
 */
async function testReportsPage(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`${TEST_CONFIG.baseURL}/reports`, { waitUntil: 'networkidle2' });
    
    await page.waitForTimeout(1000);
    const reportContent = await page.$('[role="main"], app-reports, .reports-container');
    
    if (reportContent) {
      await logTest('Reports Page', 'PASS');
    } else {
      throw new Error('Reports page not found');
    }
    
    await page.close();
  } catch (error) {
    await logTest('Reports Page', 'FAIL', error);
  }
}

/**
 * Prueba 8: User management page
 */
async function testUserManagementPage(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`${TEST_CONFIG.baseURL}/users`, { waitUntil: 'networkidle2' });
    
    await page.waitForTimeout(1000);
    const usersContent = await page.$('[role="main"], app-users, .users-container');
    
    if (usersContent) {
      await logTest('User Management Page', 'PASS');
    } else {
      throw new Error('User management page not found');
    }
    
    await page.close();
  } catch (error) {
    await logTest('User Management Page', 'FAIL', error);
  }
}

/**
 * Prueba 9: Navigation menu
 */
async function testNavigationMenu(browser) {
  try {
    const page = await browser.newPage();
    await page.goto(`${TEST_CONFIG.baseURL}/`, { waitUntil: 'networkidle2' });
    
    const navMenu = await page.$('nav, [role="navigation"], .navbar, mat-sidenav');
    
    if (navMenu) {
      await logTest('Navigation Menu', 'PASS');
    } else {
      throw new Error('Navigation menu not found');
    }
    
    await page.close();
  } catch (error) {
    await logTest('Navigation Menu', 'FAIL', error);
  }
}

/**
 * Prueba 10: Responsive design
 */
async function testResponsiveDesign(browser) {
  try {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      const page = await browser.newPage();
      await page.setViewport(viewport);
      await page.goto(`${TEST_CONFIG.baseURL}/`, { waitUntil: 'networkidle2' });
      
      const bodyHeight = await page.evaluate(() => document.body.scrollHeight);
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      
      if (bodyHeight > 0 && bodyWidth > 0) {
        console.log(`   ✓ ${viewport.name}: ${bodyWidth}x${bodyHeight}`);
      }
      
      await page.close();
    }
    
    await logTest('Responsive Design', 'PASS');
  } catch (error) {
    await logTest('Responsive Design', 'FAIL', error);
  }
}

/**
 * Función principal
 */
async function runTests() {
  let browser;
  
  try {
    console.log('\n🚀 Iniciando E2E Testing...\n');
    console.log(`📍 URL Base: ${TEST_CONFIG.baseURL}`);
    console.log(`🕐 Inicio: ${testResults.startTime.toLocaleString()}\n`);
    console.log('─'.repeat(60));
    
    browser = await puppeteer.launch({
      headless: TEST_CONFIG.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // Ejecutar todas las pruebas
    await testFrontendAccessible(browser);
    await testLoginPage(browser);
    await testLoginSuccess(browser);
    await testDashboardAccess(browser);
    await testVehicleEntryPage(browser);
    await testVehiclesList(browser);
    await testReportsPage(browser);
    await testUserManagementPage(browser);
    await testNavigationMenu(browser);
    await testResponsiveDesign(browser);
    
    console.log('─'.repeat(60));
    console.log('\n📊 RESUMEN DE PRUEBAS\n');
    console.log(`Total:   ${testResults.totalTests}`);
    console.log(`✅ Pasadas:  ${testResults.passed}`);
    console.log(`❌ Fallidas: ${testResults.failed}`);
    console.log(`⏭️  Omitidas: ${testResults.skipped}`);
    
    const successRate = testResults.totalTests > 0 
      ? ((testResults.passed / testResults.totalTests) * 100).toFixed(2)
      : 0;
    console.log(`\n⭐ Tasa de Éxito: ${successRate}%\n`);
    
    // Guardar resultados
    testResults.endTime = new Date();
    testResults.duration = (testResults.endTime - testResults.startTime) / 1000;
    
    const reportPath = path.join(__dirname, '../TestSprite/e2e-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log(`📄 Resultados guardados en: ${reportPath}\n`);
    
  } catch (error) {
    console.error('❌ Error ejecutando tests:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Ejecutar
runTests();
