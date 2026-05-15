import { Component, Show } from "solid-js"

interface HtmlSandboxProps {
  content: string
  isComplete: boolean
}

export const HtmlSandbox: Component<HtmlSandboxProps> = (props) => {
  return (
    <Show when={props.content && props.isComplete}>
      <div data-component="html-sandbox">
        <iframe
          data-slot="html-iframe"
          style={{
            width: "100%",
            height: "300px",
            border: "1px solid var(--border-base)",
            "border-radius": "4px",
            background: "white",
          }}
          sandbox="allow-scripts"
          srcdoc={`
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { margin: 0; padding: 8px; font-family: sans-serif; }
              </style>
            </head>
            <body>
              ${props.content}
            </body>
            </html>
          `}
        />
      </div>
    </Show>
  )
}
