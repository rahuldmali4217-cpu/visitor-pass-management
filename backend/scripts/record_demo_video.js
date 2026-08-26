const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function recordDemoVideo() {
  console.log('Starting automated video recording of Visitor Pass Management System...');
  
  const videoDir = path.join(__dirname, '../demo_video');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  const baseUrl = 'https://visitor-pass-management-z0w5.onrender.com';

  try {
    // 1. Visit Login Page & Showcase 1-Click Role Login
    console.log('Step 1: Navigating to Live Application Login Page...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);

    // 2. Visitor Pre-Registration with OTP Verification
    console.log('Step 2: Pre-Registering a Visitor...');
    await page.click('text=Pre-Register Visit');
    await page.waitForTimeout(2000);

    await page.fill('input[name="visitorName"]', 'Rohan Sharma');
    await page.waitForTimeout(500);
    await page.fill('input[name="visitorEmail"]', 'rohan@example.com');
    await page.waitForTimeout(500);
    await page.fill('input[name="visitorPhone"]', '+91 9876543210');
    await page.waitForTimeout(500);
    await page.fill('input[name="visitorCompany"]', 'Google Cloud Partner');
    await page.waitForTimeout(500);
    await page.fill('input[name="purpose"]', 'Quarterly Technical Architecture Review');
    await page.waitForTimeout(2000);

    // Continue to OTP Step
    const continueBtn = page.locator('button:has-text("Continue to OTP Verification")');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
      await page.waitForTimeout(2000);
    }

    // Enter 6-digit OTP
    const otpInput = page.locator('input[placeholder="123456"]');
    if (await otpInput.isVisible()) {
      await otpInput.fill('123456');
      await page.waitForTimeout(1000);
      await page.click('button:has-text("Verify & Submit")');
      await page.waitForTimeout(3500);
    }

    // 3. Log in as Host to Approve Visit
    console.log('Step 3: Logging in as Host (Employee) to approve visit request...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.click('button:has-text("Host")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(4000);

    // 4. Log in as Visitor to view Digital Pass & Badge
    console.log('Step 4: Logging in as Visitor to view Digital QR Pass...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.click('button:has-text("Visitor")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(4000);

    // 5. Log in as Security for QR Verification & Check-In/Out
    console.log('Step 5: Logging in as Security Gate Officer...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.click('button:has-text("Security")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Verify Pass Code
    await page.fill('input[placeholder*="VP-"]', 'VP-DEMO01');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Verify Pass")');
    await page.waitForTimeout(3500);

    // 6. Log in as Admin for Overview & CSV Export
    console.log('Step 6: Logging in as Admin for Analytics & Audit Reports...');
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.click('button:has-text("Admin")');
    await page.waitForTimeout(800);
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(4500);

    console.log('✅ Demo video recording finished successfully!');
  } catch (error) {
    console.error('Error during video recording:', error.message);
  } finally {
    const rawVideoPath = await page.video() ? await page.video().path() : null;
    await page.close();
    await context.close();
    await browser.close();

    if (rawVideoPath && fs.existsSync(rawVideoPath)) {
      const rootVideoPath = path.join(__dirname, '../../visitor_pass_demo.webm');
      fs.copyFileSync(rawVideoPath, rootVideoPath);
      console.log(`🎬 Demo video saved to: ${rootVideoPath}`);
    }
  }
}

recordDemoVideo();
