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

test('downloads pill appears and navigates to Downloads', async ({ page }) => {
  // Mock generate and task polling
  await page.route('**/api/generate-podcast', async (route) => {
    await route.fulfill({ json: { task_id: 't1', status: 'processing' } })
  })
  let polled = 0
  await page.route('**/api/task/t1', async (route) => {
    polled += 1
    if (polled < 2) {
      await route.fulfill({ json: { id: 't1', status: 'generating_transcript', data: {} } })
    } else {
      await route.fulfill({ json: { id: 't1', status: 'completed', data: { audio_path: '/api/download/podcasts/t1.wav' } } })
    }
  })
  await page.goto('/notebook/1')
  // Switch to Studio panel
  await page.getByRole('button', { name: /^Studio$/ }).click()
  // Click generate to start task
  await page.getByRole('button', { name: /Generate Podcast/i }).click()
  // Wait for pill and click it
  await page.getByRole('button', { name: /Downloads/ }).click()
  await expect(page.getByText(/Transcript \\+ timings \(JSON\)/i)).toBeVisible()
})
