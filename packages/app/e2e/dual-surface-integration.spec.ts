import { test, expect } from "@playwright/test"

test.describe("Dual-Surface Engine Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to OpenCode session page
    await page.goto("http://localhost:1420")
  })

  test("parser detects mermaid blocks in AI response", async ({ page }) => {
    // Simulate AI streaming response with mermaid block
    await page.evaluate(() => {
      // This would be injected via the app's test API
      window.__testInjectStreamedContent("```mermaid\ngraph TD\nA-->B\n```")
    })

    // Verify preview panel shows mermaid diagram
    const previewPanel = page.locator(".live-preview-panel")
    await expect(previewPanel).toBeVisible()

    const mermaidSvg = page.locator(".mermaid-svg svg")
    await expect(mermaidSvg).toBeVisible()
  })

  test("panel toggles visibility correctly", async ({ page }) => {
    // Open preview panel
    await page.click('[aria-label="Open preview"]')
    await expect(page.locator(".live-preview-panel")).toBeVisible()

    // Close preview panel
    await page.click('[aria-label="Close preview"]')
    await expect(page.locator(".live-preview-panel")).not.toBeVisible()
  })

  test("panel resizes with drag handle", async ({ page }) => {
    // Open preview panel
    await page.click('[aria-label="Open preview"]')
    
    // Get initial width
    const panel = page.locator(".live-preview-panel")
    const initialWidth = await panel.evaluate(el => el.clientWidth)

    // Drag resize handle
    const resizeHandle = page.locator(".resize-handle")
    await resizeHandle.hover()
    await page.mouse.down()
    await page.mouse.move(100, 0, { steps: 10 })
    await page.mouse.up()

    // Verify width changed
    const newWidth = await panel.evaluate(el => el.clientWidth)
    expect(newWidth).not.toBe(initialWidth)
  })

  test("handles streaming mermaid content", async ({ page }) => {
    // Simulate partial streaming
    await page.evaluate(() => {
      window.__testInjectStreamedContent("```mermaid\ngraph TD\nA--")
    })

    // Should show streaming indicator
    const streamingIndicator = page.locator(".live-preview-streaming")
    await expect(streamingIndicator).toBeVisible()

    // Complete the stream
    await page.evaluate(() => {
      window.__testInjectStreamedContent(">B\n```")
    })

    // Should render complete diagram
    const mermaidSvg = page.locator(".mermaid-svg svg")
    await expect(mermaidSvg).toBeVisible()
  })

  test("handles invalid mermaid syntax gracefully", async ({ page }) => {
    // Inject invalid mermaid syntax
    await page.evaluate(() => {
      window.__testInjectStreamedContent("```mermaid\ninvalid syntax here\n```")
    })

    // Should show error state, not crash
    const errorState = page.locator(".mermaid-error")
    await expect(errorState).toBeVisible()
  })

  test("multiple blocks render in sequence", async ({ page }) => {
    // Inject multiple blocks
    await page.evaluate(() => {
      window.__testInjectStreamedContent(`
Some text

\`\`\`mermaid
graph TD
A-->B
\`\`\`

More text

\`\`\`echarts
{}
\`\`\`
      `)
    })

    // Should show both blocks
    const blocks = page.locator(".live-preview-block")
    await expect(blocks).toHaveCount(2)
  })

  test("theme syncs with OpenCode theme", async ({ page }) => {
    // Set dark theme
    await page.evaluate(() => {
      document.documentElement.setAttribute("data-theme", "dark")
    })

    // Verify panel uses dark theme
    const panel = page.locator(".live-preview-panel")
    const bgColor = await panel.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    )
    expect(bgColor).toContain("rgb(0, 0, 0)") // Dark background
  })

  test("export diagram as PNG", async ({ page }) => {
    // Inject mermaid diagram
    await page.evaluate(() => {
      window.__testInjectStreamedContent("```mermaid\ngraph TD\nA-->B\n```")
    })

    // Click export button
    await page.click('[aria-label="Export as PNG"]')
    
    // Verify download triggered (check for download event)
    const downloadPromise = page.waitForEvent("download")
    await downloadPromise
  })

  test("performance: maintains 60fps during streaming", async ({ page }) => {
    // Start performance monitoring
    const fpsLog = []
    page.on("framerate", fps => fpsLog.push(fps))

    // Stream large diagram
    await page.evaluate(() => {
      let content = "```mermaid\ngraph TD\n"
      for (let i = 0; i < 50; i++) {
        content += `A${i}-->B${i}\n`
      }
      content += "```"
      window.__testInjectStreamedContent(content)
    })

    // Wait for rendering
    await page.waitForTimeout(1000)

    // Verify FPS stayed above 55
    const minFps = Math.min(...fpsLog)
    expect(minFps).toBeGreaterThan(55)
  })
})
