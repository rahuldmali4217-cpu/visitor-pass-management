const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  console.log('Starting automated screenshot capture...');
  
  const screenshotsDir = path.join(__dirname, '../../screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();
  const baseUrl = 'https://visitor-pass-management-z0w5.onrender.com';

  try {
    // 1. Login Screen
    console.log('Capturing 01_login_roles.png...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '01_login_roles.png'), fullPage: true });

    // 2. Pre-Registration Form
    console.log('Capturing 02_visitor_preregistration_otp.png...');
    await page.goto(`${baseUrl}/pre-register`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(screenshotsDir, '02_visitor_preregistration_otp.png'), fullPage: true });

    // 3. Host Dashboard
    console.log('Capturing 03_host_approval.png...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Host")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '03_host_approval.png'), fullPage: true });

    // 4. Visitor Dashboard
    console.log('Capturing 04_visitor_digital_pass.png...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Visitor")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '04_visitor_digital_pass.png'), fullPage: true });

    // 5. Security Dashboard
    console.log('Capturing 05_security_gate_scanner.png...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Security")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2500);
    await page.fill('input[placeholder*="VP-"]', 'VP-DEMO01');
    await page.click('button:has-text("Verify Pass")');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(screenshotsDir, '05_security_gate_scanner.png'), fullPage: true });

    // 6. Admin Analytics Dashboard
    console.log('Capturing 06_admin_analytics_reports.png...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.click('button:has-text("Admin")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(screenshotsDir, '06_admin_analytics_reports.png'), fullPage: true });

    console.log('✅ All 6 HD screenshots captured successfully in /screenshots!');
  } catch (error) {
    console.error('Error during screenshot capture:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
