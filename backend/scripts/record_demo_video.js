const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function recordDemoVideo() {
  console.log('Starting automated video recording using Playwright...');
  
  const videoDir = path.join(__dirname, '../demo_video');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  try {
    // 1. Visit Login Page
    console.log('Step 1: Navigating to Login Page...');
    await page.goto('http://localhost:5173/login');
    await page.waitForTimeout(2000);

    // 2. Click Public Pre-Register
    console.log('Step 2: Testing Visitor Pre-Registration...');
    await page.click('text=Pre-Register Visit');
    await page.waitForTimeout(2000);

    await page.fill('input[name="visitorName"]', 'Ramesh Kumar');
    await page.fill('input[name="visitorEmail"]', 'ramesh@gmail.com');
    await page.fill('input[name="visitorPhone"]', '+91 9876543210');
    await page.fill('input[name="visitorCompany"]', 'TechSolutions Ltd');
    await page.fill('input[name="purpose"]', 'Vendor Software Demo Meeting');
    await page.waitForTimeout(2000);

    // Click Continue
    const continueBtn = page.locator('button:has-text("Continue to OTP Verification")');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }

    // OTP Verification
    const otpInput = page.locator('input[placeholder="123456"]');
    if (await otpInput.isVisible()) {
      await otpInput.fill('123456');
      await page.click('button:has-text("Verify & Submit")');
      await page.waitForTimeout(3000);
    }

    // 3. Log in as Host to Approve Visit
    console.log('Step 3: Host Approval Flow...');
    await page.goto('http://localhost:5173/login');
    await page.click('button:has-text("Host")');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // 4. Log in as Security for Gate Control
    console.log('Step 4: Security Gate Control & Check-In...');
    await page.goto('http://localhost:5173/login');
    await page.click('button:has-text("Security")');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2500);

    await page.fill('input[placeholder*="VP-"]', 'VP-DEMO01');
    await page.click('button:has-text("Verify Pass")');
    await page.waitForTimeout(2500);

    // 5. Log in as Admin for Overview
    console.log('Step 5: Admin Analytics Dashboard...');
    await page.goto('http://localhost:5173/login');
    await page.click('button:has-text("Admin")');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3500);

    console.log('Demo video recording completed successfully.');
  } catch (error) {
    console.error('Error during video recording:', error.message);
  } finally {
    await context.close();
    await browser.close();
    console.log(`Video file successfully saved in directory: ${videoDir}`);
  }
}

recordDemoVideo();
