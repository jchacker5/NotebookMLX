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

  // Open export modal via chat panel export button (more specific selector)
  await page.locator('div:has-text("Chat") >> button:has-text("Export")').click()
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
  await page.locator('div:has-text("Chat") >> button:has-text("Export")').click()
  await page.getByRole('button', { name: /Export chat as Markdown/i }).click()
  await expect.poll(() => called).toBeTruthy()
})

test('export modal triggers chat HTML request and JSON download', async ({ page }) => {
  let htmlCalled = false
  await page.route('**/api/export/chat-html', async (route) => {
    htmlCalled = true
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' })
  })
  await page.goto('/notebook/1')
  await page.locator('div:has-text("Chat") >> button:has-text("Export")').click()
  await page.getByRole('button', { name: /Export chat as HTML/i }).click()
  await expect.poll(() => htmlCalled).toBeTruthy()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /Export chat as JSON/i }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/chat_export.*\.json$/)
})

test('downloads pill appears and navigates to Downloads', async ({ page }) => {
  // Mock sources API to provide test sources
  await page.route('**/api/sources', async (route) => {
    await route.fulfill({ 
      json: [
        { id: 'test-source-1', filename: 'test.pdf', type: 'pdf', uploadedAt: new Date().toISOString() }
      ] 
    })
  })

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
  
  // Wait for sources to be loaded and add a mock source to the store
  await page.evaluate(() => {
    // Simulate having sources selected in the store
    const mockSource = { id: 'test-source-1', filename: 'test.pdf', type: 'pdf', uploadedAt: new Date() }
    window.useStore?.getState?.()?.addSource?.(mockSource)
    window.useStore?.getState?.()?.toggleSourceSelection?.('test-source-1')
  })
  
  // Switch to Studio panel
  await page.getByRole('button', { name: /^Studio$/ }).click()
  
  // Wait for the Generate Podcast button to be enabled
  await page.waitForSelector('button:has-text("Generate Podcast"):not([disabled])', { timeout: 5000 })
  
  // Click generate to start task
  await page.getByRole('button', { name: /Generate Podcast/i }).click()
  // Wait for pill and click it
  await page.getByRole('button', { name: /Downloads/ }).click()
  await expect(page.getByText(/Transcript \\+ timings \(JSON\)/i)).toBeVisible()
})
