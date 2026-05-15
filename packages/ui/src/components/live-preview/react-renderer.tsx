import { Component, Show } from "solid-js"

interface ReactRendererProps {
  content: string
  isComplete: boolean
}

/**
 * Sanitizes React code to prevent injection via closing script tags.
 * Also removes any import statements (dependencies must be global).
 */
function sanitizeCode(code: string): string {
  // Prevent script tag injection
  const cleaned = code.replace(/<\/script>/gi, "<\\/script>")
  // Strip import/export statements — deps are provided globally
  return cleaned.replace(/^(import|export)\s.+$/gm, "")
}

/**
 * Generates the full HTML document for the sandbox iframe.
 * Includes React 18 + ReactDOM + Babel standalone from CDN.
 */
function generateSandboxHTML(code: string): string {
  const safeCode = sanitizeCode(code)
  // Wrap user code in a self-contained App function if it doesn't have one
  const wrappedCode = safeCode.includes("function App")
    ? safeCode
    : `function App() {\n${safeCode}\n}`
  // Strip "export default" from App function
  const finalCode = wrappedCode.replace("export default function App", "function App")

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"><\/script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"><\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
  <style>
    body { margin: 0; padding: 8px; font-family: system-ui, sans-serif; }
    #root { width: 100%; }
    .error { color: #e53e3e; padding: 12px; background: #fff5f5; border-radius: 4px; }
    .error h3 { margin: 0 0 8px; font-size: 14px; }
    .error pre { margin: 0; font-size: 12px; white-space: pre-wrap; }
    .loading { color: #718096; padding: 12px; text-align: center; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    window.onerror = function(msg, source, line, col, err) {
      document.getElementById('root').innerHTML =
        '<div class="error"><h3>Runtime Error</h3><pre>' +
        (err ? err.message : msg) +
        (line ? ' (line ' + line + ')' : '') +
        '</pre></div>';
    };
  <\/script>
  <script type="text/babel" data-type="module">
    try {
      ${finalCode}
      var root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    } catch (e) {
      document.getElementById('root').innerHTML =
        '<div class="error"><h3>Render Error</h3><pre>' + e.message + '</pre></div>';
    }
  <\/script>
</body>
</html>`
}

export const ReactRenderer: Component<ReactRendererProps> = (props) => {
  return (
    <Show
      when={props.content && props.isComplete}
      fallback={
        <div class="live-preview-placeholder">
          {props.content ? "Transpiling React components\u2026" : "Generating React components\u2026"}
        </div>
      }
    >
      <div data-component="react-renderer">
        <iframe
          data-slot="react-iframe"
          style={{
            width: "100%",
            height: "400px",
            border: "1px solid var(--border-base)",
            "border-radius": "4px",
            background: "white",
          }}
          sandbox="allow-scripts"
          srcdoc={generateSandboxHTML(props.content)}
          title="React Preview"
        />
      </div>
    </Show>
  )
}

// Exported for testing
export { sanitizeCode, generateSandboxHTML }
