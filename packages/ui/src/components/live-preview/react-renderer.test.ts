import { describe, expect, test } from "bun:test"
import { sanitizeCode, generateSandboxHTML } from "./react-renderer"

describe("ReactRenderer", () => {
  describe("sanitizeCode", () => {
    test("strips import statements", () => {
      const code = `import { useState } from "react"\nfunction App() { return <h1>Hi</h1> }`
      const result = sanitizeCode(code)
      expect(result).not.toContain('import {')
    })

    test("strips export default statements", () => {
      const code = `export default function App() { return <h1>Hi</h1> }`
      const result = sanitizeCode(code)
      expect(result).not.toContain('export default')
    })

    test("escapes closing script tags", () => {
      const code = `const x = "</script>"`
      const result = sanitizeCode(code)
      expect(result).not.toContain('</script>')
      expect(result).toContain('<\\/script>')
    })

    test("preserves valid JSX content", () => {
      const code = `function App() { return <div>Hello</div> }`
      const result = sanitizeCode(code)
      expect(result).toContain('function App()')
      expect(result).toContain('<div>Hello</div>')
    })

    test("handles empty code", () => {
      expect(sanitizeCode("")).toBe("")
    })

    test("strips export from const declarations", () => {
      const code = `export const x = 1`
      const result = sanitizeCode(code)
      expect(result).not.toContain('export')
    })
  })

  describe("generateSandboxHTML", () => {
    test("includes React 18 CDN scripts", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain("react@18")
      expect(html).toContain("react-dom@18")
    })

    test("includes Babel standalone CDN", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain("@babel/standalone")
    })

    test("wraps non-app code in App function", () => {
      const html = generateSandboxHTML("return <div>Hello</div>")
      expect(html).toContain("function App()")
    })

    test("preserves existing App function", () => {
      const code = `function App() { return <div>Hello</div> }`
      const html = generateSandboxHTML(code)
      expect(html).toContain("function App()")
      // Should not double-wrap
      expect(html.match(/function App\(\)/g)!.length).toBe(1)
    })

    test("generates ReactDOM.createRoot call", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain("ReactDOM.createRoot")
    })

    test("includes error boundary script", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain("window.onerror")
      expect(html).toContain("Runtime Error")
    })

    test("includes render error try-catch", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain("try {")
      expect(html).toContain("Render Error")
    })

    test("includes viewport meta tag", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain("viewport")
    })

    test("uses production React bundles", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain("production.min.js")
    })
  })

  describe("template structure", () => {
    test("has proper document structure", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain("<!DOCTYPE html>")
      expect(html).toContain("<html>")
      expect(html).toContain("</html>")
    })

    test("has root div mount point", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain('id="root"')
    })

    test("has babel script type text/babel", () => {
      const html = generateSandboxHTML("function App() { return null }")
      expect(html).toContain('type="text/babel"')
    })
  })
})
