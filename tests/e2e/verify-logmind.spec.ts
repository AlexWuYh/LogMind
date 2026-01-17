import { test, expect } from '@playwright/test';

test.describe('LogMind User Verification', () => {

  test('Verify Dashboard, Daily Logs, Settings, and Reports', async ({ page }) => {
    // 1. Dashboard
    console.log('Step 1: Verifying Dashboard...');
    await page.goto('/');
    
    // Verify Dashboard loads
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    
    // Verify KPI cards
    await expect(page.getByText('This Week')).toBeVisible();
    await expect(page.getByText('This Month')).toBeVisible();
    // Assuming these are also present based on core-flow.spec.ts
    await expect(page.getByText('Total Logs')).toBeVisible();
    
    console.log('Dashboard verified.');

    // 2. Daily Logs
    console.log('Step 2: Verifying Daily Logs...');
    // Navigate to "Daily Logs"
    await page.getByRole('link', { name: 'Daily Logs' }).click();
    await expect(page).toHaveURL(/\/logs/);
    
    // Click "Write Today's Log"
    await page.getByRole('button', { name: "Write Today's Log" }).click();
    
    // Verify we are on the log page (URL contains date)
    const today = new Date().toISOString().split('T')[0];
    await expect(page).toHaveURL(new RegExp(`/logs/${today}`));
    
    // Fill in the form
    // Project
    await page.getByLabel('Main Project').fill('Verification Project');
    
    // Priority (Radix UI Select)
    // Click the trigger. Assuming it's the first combobox or we can find it by label proximity if needed.
    // In core-flow it used .first(). Let's try to be more specific if possible, but .first() is safe if it's the first one.
    const priorityTrigger = page.locator('button[role="combobox"]').first();
    await priorityTrigger.click();
    await page.getByRole('option', { name: 'High' }).click();
    
    // Progress
    await page.getByLabel('Progress (%)').fill('80');
    
    // Summary
    await page.getByLabel("Today's Summary").fill('Automated verification summary.');
    
    // Work Item
    // We need to fill "What did you do?"
    await page.getByPlaceholder('What did you do?').first().fill('Verified LogMind functionality');
    
    // Save
    await page.getByRole('button', { name: 'Save' }).click();
    
    // Verify success toast
    await expect(page.getByText('Daily log saved successfully.')).toBeVisible();
    console.log('Daily Logs verified.');

    // 3. Settings
    console.log('Step 3: Verifying Settings...');
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL('/settings');
    
    // Verify form elements
    await expect(page.getByLabel('Provider')).toBeVisible();
    await expect(page.getByLabel('API Key')).toBeVisible();
    console.log('Settings verified.');

    // 4. Reports
    console.log('Step 4: Verifying Reports...');
    await page.getByRole('link', { name: 'Weekly Report' }).click();
    await expect(page).toHaveURL('/reports/weekly');
    
    // Check if page loads (look for specific text or heading)
    // Assuming there is a heading "Weekly Report" or similar, or just checking body visibility.
    // Let's check for "Weekly Report" text which matches the link name and likely the header.
    await expect(page.getByRole('heading', { name: 'Weekly Report' })).toBeVisible();
    console.log('Reports verified.');
  });
});
