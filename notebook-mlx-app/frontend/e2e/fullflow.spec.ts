import { test, expect } from '@playwright/test'

test('upload → chat → download (mocked)', async ({ page }) => {
  await page.route('**/api/upload-source', async (route) => {
    await route.fulfill({ json: { source_id: 'src_123', filename: 'sample.txt', status: 'processed' } })
  })
  await page.route('**/api/chat', async (route) => {
    await route.fulfill({ json: { response: 'Hello world', citations: [] } })
  })
  await page.route('**/api/task/**', async (route) => {
    await route.fulfill({ json: { task_id: 't1', status: 'completed', audio_path: '/api/download/podcasts/t1.wav' } })
  })
  await page.route('**/api/download/**', async (route) => {
    await route.fulfill({ body: 'OK' })
  })

  await page.goto('/')
  await expect(page.getByText('NotebookMLX')).toBeVisible()
  await page.getByRole('button', { name: /New notebook/i }).click()
  await expect(page.getByText(/Add sources/i)).toBeVisible()
})

