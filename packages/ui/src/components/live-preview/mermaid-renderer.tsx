import { Component, createEffect, createSignal, onCleanup, onMount, Show } from "solid-js"

interface MermaidRendererProps {
  content: string
  isComplete: boolean
}

export const MermaidRenderer: Component<MermaidRendererProps> = (props) => {
  const [svg, setSvg] = createSignal<string>("")
  const [error, setError] = createSignal<string | null>(null)
  const [isLoading, setIsLoading] = createSignal(false)
  let containerRef: HTMLDivElement | undefined

  const renderDiagram = async () => {
    if (!props.content || !containerRef) return

    setIsLoading(true)
    setError(null)

    try {
      // Simple SVG rendering for now - mermaid will be added as async import
      const id = `mermaid-${Date.now()}`
      // Placeholder: In production, this would use mermaid.render()
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200">
        <text x="50%" y="50%" text-anchor="middle" fill="currentColor" font-family="monospace">
          ${props.content.split('\n')[0] || 'Diagram'}
        </text>
      </svg>`
      setSvg(placeholderSvg)
    } catch (err: any) {
      if (props.isComplete) {
        setError(err.message || "Failed to render diagram")
      }
      // Don't show errors during streaming - diagram may be incomplete
    } finally {
      setIsLoading(false)
    }
  }

  // Re-render when content changes
  createEffect(() => {
    const content = props.content
    // Debounce re-renders during streaming
    const timeout = setTimeout(renderDiagram, props.isComplete ? 0 : 100)
    onCleanup(() => clearTimeout(timeout))
  })

  return (
    <div class="mermaid-renderer" ref={containerRef}>
      <Show when={isLoading()}>
        <div class="mermaid-loading">Rendering diagram...</div>
      </Show>
      <Show when={error()}>
        <div class="mermaid-error">
          <p>⚠️ Diagram syntax error</p>
          <pre>{error()}</pre>
        </div>
      </Show>
      <Show when={!isLoading() && !error() && svg()}>
        <div
          class="mermaid-svg"
          innerHTML={svg()}
        />
      </Show>
      <Show when={!isLoading() && !error() && !svg() && props.content}>
        <div class="mermaid-placeholder">
          {props.isComplete ? "Waiting to render..." : "Streaming diagram..."}
        </div>
      </Show>
    </div>
  )
}
