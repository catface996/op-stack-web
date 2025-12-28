import { chromium } from 'playwright';

async function testAgentConfig() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  console.log('Opening page...');
  await page.goto('http://localhost:3000/agents/4/config');
  await page.waitForTimeout(1000);

  // Check if we need to login
  const loginVisible = await page.locator('text=Welcome back').isVisible();
  if (loginVisible) {
    console.log('Login required, logging in...');
    await page.fill('input[placeholder="name@company.com"]', 'admin@test.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);
  }

  // Navigate to agent config page
  console.log('Navigating to agent config page...');
  await page.goto('http://localhost:3000/agents/4/config');
  await page.waitForTimeout(3000);

  // ============================================
  // TEST STEP 1: Basic Info
  // ============================================
  console.log('\n=== Testing Step 1: Basic Info ===');

  // Verify we're on step 1
  const step1Active = await page.locator('button:has-text("STEP 1") >> text=Basic Info').isVisible();
  console.log('Step 1 button visible:', step1Active);

  // Check form fields
  const agentNameInput = await page.locator('input').first();
  const agentName = await agentNameInput.inputValue();
  console.log('Agent name:', agentName);

  // Check model dropdown
  const modelField = await page.locator('text=MODEL').isVisible();
  console.log('Model field visible:', modelField);

  // Check temperature
  const tempField = await page.locator('text=TEMPERATURE').isVisible();
  console.log('Temperature field visible:', tempField);

  await page.screenshot({ path: 'test-results/step1-basic-info.png', fullPage: true });
  console.log('Screenshot saved: step1-basic-info.png');

  // ============================================
  // TEST STEP 2: Navigate to Prompt Template
  // ============================================
  console.log('\n=== Testing Step 2: Prompt Template ===');

  // Click specifically on the Step 2 button in the stepper
  const step2Button = page.locator('button:has-text("STEP 2"):has-text("Prompt Template")');
  console.log('Looking for Step 2 button...');
  await step2Button.click();
  await page.waitForTimeout(1500);

  // Verify we're on step 2
  const promptTemplateHeading = await page.locator('h2:has-text("Prompt Template")').isVisible();
  console.log('Prompt Template heading visible:', promptTemplateHeading);

  await page.screenshot({ path: 'test-results/step2-prompt-template.png', fullPage: true });
  console.log('Screenshot saved: step2-prompt-template.png');

  // Try clicking on a template to open preview panel
  console.log('\nTrying to open preview panel...');
  const firstTemplate = page.locator('button:has-text("second")').first();
  const templateVisible = await firstTemplate.isVisible();
  console.log('First template card visible:', templateVisible);

  if (templateVisible) {
    await firstTemplate.click();
    await page.waitForTimeout(1000);

    // Check if preview panel opened
    const previewPanel = await page.locator('text=Template Preview').isVisible();
    console.log('Preview panel visible:', previewPanel);

    await page.screenshot({ path: 'test-results/step2-with-preview.png', fullPage: true });
    console.log('Screenshot saved: step2-with-preview.png');
  }

  // ============================================
  // TEST STEP 3: Navigate to Tools
  // ============================================
  console.log('\n=== Testing Step 3: Tools ===');

  // Click specifically on the Step 3 button in the stepper
  const step3Button = page.locator('button:has-text("STEP 3"):has-text("Tools")');
  console.log('Looking for Step 3 button...');
  await step3Button.click();
  await page.waitForTimeout(1500);

  // Verify we're on step 3
  const toolsHeading = await page.locator('h2:has-text("Tools")').isVisible();
  console.log('Tools heading visible:', toolsHeading);

  await page.screenshot({ path: 'test-results/step3-tools.png', fullPage: true });
  console.log('Screenshot saved: step3-tools.png');

  // Try expanding a category
  console.log('\nTrying to expand a category...');
  const firstCategory = page.locator('button:has-text("FolderOpen")').first();
  const categoryButtons = await page.locator('.border.border-slate-800.rounded-lg button').first();
  const hasCategoryButton = await categoryButtons.count() > 0;

  if (hasCategoryButton) {
    console.log('Found category buttons, clicking first one...');
    await categoryButtons.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/step3-category-expanded.png', fullPage: true });
    console.log('Screenshot saved: step3-category-expanded.png');
  } else {
    console.log('No category buttons found');
  }

  // ============================================
  // Navigate back to Step 1
  // ============================================
  console.log('\n=== Testing navigation back to Step 1 ===');
  const step1Button = page.locator('button:has-text("STEP 1"):has-text("Basic Info")');
  await step1Button.click();
  await page.waitForTimeout(1000);

  const backToStep1 = await page.locator('h2:has-text("Basic Information")').isVisible();
  console.log('Back to Basic Information:', backToStep1);

  await page.screenshot({ path: 'test-results/step1-return.png', fullPage: true });

  console.log('\n=== Test completed successfully! ===');
  console.log('Screenshots saved to test-results/');

  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
  await page.waitForTimeout(30000);

  await browser.close();
}

testAgentConfig().catch(console.error);
