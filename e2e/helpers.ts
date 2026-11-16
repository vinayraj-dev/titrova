import type { Page } from '@playwright/test';

/** Go to a page and wait until React has attached its event handlers. */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await page.locator('html[data-ready="true"]').waitFor();
}
