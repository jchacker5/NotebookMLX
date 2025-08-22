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

  // Navigate to root and then simulate notebook view
  await page.goto('/')
  
  // Simulate navigation to notebook view
  await page.evaluate(() => {
    window.history.pushState({}, '', '/notebook/1')
    // Trigger a popstate event to make the app react to the URL change
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
  })
  
  // Wait for the page to load the notebook view
  await page.waitForTimeout(1000)

  // Open export modal via chat panel export button (using data-testid)
  await page.getByTestId('chat-export-button').click()
  // Click Export chat as PDF
  await page.getByTestId('export-chat-pdf-button').click()

  await expect.poll(() => called).toBeTruthy()
})

test('export modal triggers chat Markdown request', async ({ page }) => {
  let called = false
  await page.route('**/api/export/chat-md', async (route) => {
    called = true
    await route.fulfill({ status: 200, contentType: 'text/markdown', body: 'MD' })
  })
  // Navigate to root and then simulate notebook view
  await page.goto('/')
  
  // Simulate navigation to notebook view
  await page.evaluate(() => {
    window.history.pushState({}, '', '/notebook/1')
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
  })
  
  // Wait for the page to load the notebook view
  await page.waitForTimeout(1000)
  
  await page.getByTestId('chat-export-button').click()
  await page.getByTestId('export-chat-markdown-button').click()
  await expect.poll(() => called).toBeTruthy()
})

test('export modal triggers chat HTML request and JSON download', async ({ page }) => {
  let htmlCalled = false
  await page.route('**/api/export/chat-html', async (route) => {
    htmlCalled = true
    await route.fulfill({ status: 200, contentType: 'text/html', body: '<html></html>' })
  })
  // Navigate to root and then simulate notebook view
  await page.goto('/')
  
  // Simulate navigation to notebook view
  await page.evaluate(() => {
    window.history.pushState({}, '', '/notebook/1')
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
  })
  
  // Wait for the page to load the notebook view
  await page.waitForTimeout(1000)
  
  await page.getByTestId('chat-export-button').click()
  await page.getByTestId('export-chat-html-button').click()
  await expect.poll(() => htmlCalled).toBeTruthy()

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-chat-json-button').click(),
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

  // Navigate to root and then simulate notebook view
  await page.goto('/')
  
  // Simulate navigation to notebook view
  await page.evaluate(() => {
    window.history.pushState({}, '', '/notebook/1')
    window.dispatchEvent(new PopStateEvent('popstate', { state: {} }))
  })
  
  // Wait for the page to load the notebook view
  await page.waitForTimeout(1000)
  
  // Switch to Studio panel first
  await page.getByRole('button', { name: /^Studio$/ }).click()
  
  // Add a mock source to the store and select it
  await page.evaluate(() => {
    // Wait for store to be available and add test source
    if (window.useStore) {
      const store = window.useStore.getState()
      const mockSource = { id: 'test-source-1', filename: 'test.pdf', type: 'pdf', uploadedAt: new Date() }
      store.addSource(mockSource)
      store.toggleSourceSelection('test-source-1')
    }
  })
  
  // Wait for a moment to ensure state is updated
  await page.waitForTimeout(500)
  
  // Wait for the Generate Podcast button to be enabled
  await page.waitForSelector('[data-testid="generate-podcast-button"]:not([disabled])', { timeout: 15000 })
  
  // Click generate to start task
  await page.getByTestId('generate-podcast-button').click()
  // Wait for downloads pill to appear and click it
  await page.getByTestId('downloads-pill-button').click()
  await expect(page.getByText(/Transcript \\+ timings \(JSON\)/i)).toBeVisible()
})
