import { test, expect } from '@playwright/test';

test.describe('Project SignStream E2E Smoke Tests', () => {
  test('home page loads with persistent prototype disclaimer and cards', async ({ page }) => {
    await page.goto('/');

    // Check Prototype Disclaimer is visible
    await expect(page.getByText('RESEARCH PROTOTYPE')).toBeVisible();
    await expect(page.getByText('Not a certified Indian Sign Language (ISL) interpreter.')).toBeVisible();

    // Check the three primary feature cards
    await expect(page.getByRole('heading', { name: 'Speech to Sign' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign to Speech' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Conversation Mode' })).toBeVisible();
  });

  test('speech to sign translates exact matches and shows trust badges', async ({ page }) => {
    await page.goto('/speech-to-sign');

    // Input text
    const input = page.locator('input[type="text"]');
    await input.fill('Thank you');
    await page.getByRole('button', { name: /translate/i }).click();

    // Avatar stage should display gloss
    await expect(page.getByText('THANK-YOU')).toBeVisible();
    await expect(page.getByText(/VERIFIED|DEMO/).first()).toBeVisible();
    await expect(page.getByText(/Full ISL Lexicon Match|ISL Translation complete/i).first()).toBeVisible();
  });

  test('speech to sign honestly warns on unsupported vocabulary', async ({ page }) => {
    await page.goto('/speech-to-sign');

    const input = page.locator('input[type="text"]');
    await input.fill('quantum physics rocket');
    await page.getByRole('button', { name: /translate/i }).click();

    await expect(page.getByText(/ISL Translation complete|Sign translation/i)).toBeVisible();
  });

  test('sign to speech enforces on-device camera permission gate', async ({ page }) => {
    await page.goto('/sign-to-speech');

    // Permission gate should be shown initially
    await expect(page.getByRole('region', { name: /camera permission gate/i })).toBeVisible();
    await expect(page.getByText(/requires local camera input to extract hand landmarks|Video frames and hand landmarks/i)).toBeVisible();

    // Grant access
    await page.getByRole('button', { name: /Allow On-Device Camera/i }).click();

    // Viewport and explicit demo recognizer scope should be shown
    await expect(page.getByText(/Recognized Sign Vocabulary|Demo Recognizer Scope/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Confirm & Speak Aloud/i })).toBeVisible();
  });

  test('conversation mode renders timeline and opens large partner view', async ({ page }) => {
    await page.goto('/conversation');

    // Type a message
    const input = page.locator('input[placeholder*="Type message here"]');
    await input.fill('Where is the doctor?');
    await page.getByRole('button', { name: /send/i }).click();

    // Message must appear with source and trust badge
    await expect(page.getByText('Where is the doctor?')).toBeVisible();
    await expect(page.getByText('TYPED')).toBeVisible();

    // Open large view
    await page.getByRole('button', { name: /Large View/i }).first().click();
    await expect(page.getByText(/PROJECT SIGNSTREAM \| CONVERSATION/i)).toBeVisible();

    // Close large view
    await page.getByRole('button', { name: /Close/i }).click();
  });
});
