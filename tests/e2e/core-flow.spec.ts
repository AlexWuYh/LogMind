import { test, expect } from '@playwright/test';

test.describe('LogMind Core Functionality', () => {

  test('Dashboard renders with correct sections', async ({ page }) => {
    await page.goto('/');

    // 1. Dashboard renders with correct sections
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    
    // KPI Cards
    await expect(page.getByText('This Week')).toBeVisible();
    await expect(page.getByText('This Month')).toBeVisible();
    await expect(page.getByText('Total Logs')).toBeVisible();
    await expect(page.getByText('Reports Generated')).toBeVisible();

    // Sections
    await expect(page.getByText("Today's Status")).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible();
  });

  test('Create a new Daily Log for today and verify save', async ({ page }) => {
    await page.goto('/');

    // Calculate today's date in yyyy-MM-dd format (local time)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // 2. Create a new Daily Log for today
    // Click the button that links to today's log
    const logButton = page.locator(`a[href="/logs/${today}"] button`);
    await logButton.click();

    // Wait for navigation
    await expect(page).toHaveURL(`/logs/${today}`);
    await expect(page.getByRole('heading', { name: `Daily Log: ${today}` })).toBeVisible();

    // Fill out the form
    await page.getByLabel('Main Project').fill('Test Project');

    // Select Priority - Radix UI Select
    // We target the trigger associated with "Priority" label
    // Since there are multiple "Priority" fields (one for main, one for items), we need to be specific.
    // The Main Priority is the first one usually, or we can look for the one in the "General" card.
    // Let's try to scope it to the General card if possible, or use nth(0).
    const priorityTrigger = page.locator('button[role="combobox"]').first(); 
    // Or better:
    // The label "Priority" is associated with the select trigger via some mechanism? 
    // Radix UI often uses aria-labelledby.
    // Let's try clicking the first combobox which should be the main priority.
    await priorityTrigger.click();
    await page.getByRole('option', { name: 'High' }).click();

    await page.getByLabel('Progress (%)').fill('50');

    await page.getByLabel("Today's Summary").fill('This is a test summary for automated testing.');
    await page.getByLabel("Tomorrow's Plan").fill('Plan to run more tests.');

    // Work Items
    // Target the first textarea in the Work Items section
    const workItemContent = page.getByPlaceholder('What did you do?').first();
    await workItemContent.fill('Implemented automated tests');

    const workItemProject = page.getByPlaceholder('Project (Optional)').first();
    await workItemProject.fill('Test Automation');

    // 3. Verify the log is saved
    await page.getByRole('button', { name: 'Save' }).click();

    // Check for toast success message
    // Toasts usually appear in a region.
    await expect(page.getByText('Daily log saved successfully.')).toBeVisible();

    // Verify persistence by reloading
    await page.reload();
    await expect(page.getByLabel('Main Project')).toHaveValue('Test Project');
    await expect(page.getByLabel("Today's Summary")).toHaveValue('This is a test summary for automated testing.');
    // Check priority value if possible (might be tricky with Select, checking text content of trigger)
    await expect(page.locator('button[role="combobox"]').first()).toContainText('High');
  });

  test('Check the Settings page loads', async ({ page }) => {
    // 4. Check the Settings page loads
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'System Settings' })).toBeVisible();
    await expect(page.getByText('AI Configuration')).toBeVisible();
    
    // Verify key fields exist
    await expect(page.getByLabel('Provider')).toBeVisible();
    await expect(page.getByLabel('API Key')).toBeVisible();
    
    // Check Save button
    await expect(page.getByRole('button', { name: 'Save Configuration' })).toBeVisible();
  });

});
