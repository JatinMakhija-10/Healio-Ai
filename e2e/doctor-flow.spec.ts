import { test, expect } from '@playwright/test';

test.describe('Doctor Workflow', () => {
    test('Complete journey: Register -> Schedule -> Video Consult', async ({ page }) => {
        // 1. Signup
        await page.goto('/doctor/signup');
        await expect(page.locator('text=Join Our Medical Network')).toBeVisible();

        // Generate unique user
        const uniqueSuffix = Date.now();
        const email = `dr.test${uniqueSuffix}@example.com`;

        await page.fill('input[id="email"]', email);
        await page.fill('input[id="password"]', 'Password123'); // Strong password
        await page.fill('input[id="confirmPassword"]', 'Password123');

        await page.click('button[type="submit"]');

        // 2. Register Profile (Step 1)
        await expect(page.locator('text=Personal Information')).toBeVisible({ timeout: 15000 });
        await page.fill('input[id="fullName"]', 'Dr. Automated Test');
        await page.fill('input[id="phone"]', '9876543210');
        await page.fill('textarea[id="bio"]', 'Automated test bio');
        await page.click('button:has-text("Next")');

        // Step 2
        await expect(page.locator('text=Professional Details')).toBeVisible();
        await page.fill('input[id="qualification"]', 'MBBS');
        await page.fill('input[id="experience"]', '5');
        await page.fill('input[id="license"]', `LIC-${uniqueSuffix}`);
        await page.click('button:has-text("Next")');

        // Step 3 (Documents - Skip upload as validation logic is loose)
        await expect(page.locator('text=Upload Documents')).toBeVisible();
        await page.click('button:has-text("Next")');

        // Step 4 (Availability)
        await expect(page.locator('text=Set Your Availability')).toBeVisible();
        await page.click('button:has-text("Submit Application")');

        // 3. Verify Success & Navigate to Schedule
        await expect(page.locator('text=Application Submitted!')).toBeVisible({ timeout: 15000 });

        // Manually navigate to schedule (bypass verification wait)
        await page.goto('/doctor/schedule');

        // 4. Open Booking Modal
        await expect(page.locator('text=My Schedule')).toBeVisible();
        await page.click('text=New Appointment');

        // 5. Fill Booking Form
        await expect(page.locator('text=Schedule Appointment')).toBeVisible();

        // Select patient (assuming mock data is pre-filled or select first option)
        // Actually the mock uses pre-selected patient if not changed, let's verify patient name exists
        await expect(page.locator('text=Select Patient')).toBeVisible();

        // Click "Book Appointment"
        // May need to wait for modal animation
        await page.waitForTimeout(500);
        await page.click('button:has-text("Book Appointment")');

        // 6. Verify Appointment Appears
        await expect(page.locator('div.rbc-event')).toBeVisible({ timeout: 5000 });

        // 7. Enter Video Call
        // Click the most recently created event (last one)
        const events = page.locator('div.rbc-event');
        await events.last().click();

        // 8. Verify Video Room redirection
        // Should contain /doctor/consult/
        await expect(page).toHaveURL(/\/doctor\/consult\/.*/);
        await expect(page.locator('text=Video Consultation')).toBeVisible();
    });
});
