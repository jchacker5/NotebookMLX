import { test, expect } from '@playwright/test'

test('loads landing page and UI shell', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByText('NotebookMLX')).toBeVisible()

  // New notebook button in header
  await expect(page.getByRole('button', { name: /New notebook/i })).toBeVisible()

  // Open and close the modal without backend
  await page.getByRole('button', { name: /New notebook/i }).click()
  await expect(page.getByText(/Add sources/i)).toBeVisible()
})
