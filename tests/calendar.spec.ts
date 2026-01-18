import { test, expect } from '@playwright/test';

test('Weekly report calendar selection', async ({ page }) => {
  // 1. Go to Weekly Report page
  await page.goto('http://localhost:3000/reports/weekly');
  
  // 2. Open Filter Popover
  await page.click('button[title="筛选日期"]');
  
  // 3. Wait for calendar to appear
  await page.waitForSelector('.rdp-day_today');
  
  // 4. Click today's date
  // Note: shadcn/ui calendar uses .rdp-button_reset for day buttons or standard buttons
  // We'll target a specific day that is clickable
  const todayButton = page.locator('.rdp-day_today');
  await todayButton.click();
  
  // 5. Verify filter is applied
  // The filter button should now have text showing a date range, e.g., "01.12 - 01.18"
  // And the 'clear' X button should appear
  await expect(page.locator('button[title="清除筛选"]')).toBeVisible();
  
  // 6. Verify week highlighting style
  // The selected day should have the 'bg-primary' class or parent with 'bg-primary/10'
  // But strictly, we check if the filter state updated the UI
  const filterText = await page.locator('button[title="清除筛选"]').textContent();
  console.log('Filter text:', filterText);
  expect(filterText).toMatch(/\d{2}\.\d{2} - \d{2}\.\d{2}/);
});