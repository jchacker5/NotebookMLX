import { test, expect } from '@playwright/test'

test('export modal triggers chat PDF request', async ({ page }) => {
  // Mock chat-pdf endpoint
  let called = false
  await page.route('**/api/export/chat-pdf', async (route) => {
    called = true
    await route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: 'PDF',
    })
  })

  // Navigate to a notebook view directly
  await page.goto('/notebook/1')

  // Open export modal via header button
  await page.getByRole('button', { name: /Export/i }).click()
  // Click Export chat as PDF
  await page.getByRole('button', { name: /Export chat as PDF/i }).click()

  await expect.poll(() => called).toBeTruthy()
})

test('export modal triggers chat Markdown request', async ({ page }) => {
  let called = false
  await page.route('**/api/export/chat-md', async (route) => {
    called = true
    await route.fulfill({ status: 200, contentType: 'text/markdown', body: 'MD' })
  })
  await page.goto('/notebook/1')
  await page.getByRole('button', { name: /Export/i }).click()
  await page.getByRole('button', { name: /Export chat as Markdown/i }).click()
  await expect.poll(() => called).toBeTruthy()
})
