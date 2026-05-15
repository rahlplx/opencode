import { Component, createSignal, createEffect, onCleanup } from "solid-js"
import { StreamingMarkdownParser, BlockType, ParsedBlock } from "@opencode-ai/opencode/parser/streaming-markdown-parser"
import { LivePreviewPanel } from "@opencode-ai/ui/live-preview/live-preview-panel"
import { useSDK } from "@/context/sdk"
import { useSettings } from "@/context/settings"

// Integration hook that connects parser to AI streaming
export function useStreamingParser() {
  const [blocks, setBlocks] = createSignal<ParsedBlock[]>([])
  const [isVisible, setIsVisible] = createSignal(false)
  const parser = new StreamingMarkdownParser()

  // Connect to AI streaming response
  const { sdk } = useSDK()
  const { settings } = useSettings()

  // Process streaming chunks
  const processChunk = (chunk: string) => {
    parser.push(chunk)
    const currentBlocks = parser.getBlocks()
    
    // Only show panel if we have renderable blocks
    const renderableBlocks = currentBlocks.filter(block => 
      block.type !== BlockType.UNKNOWN
    )
    
    if (renderableBlocks.length > 0 && !isVisible()) {
      setIsVisible(true)
    }
    
    setBlocks(renderableBlocks)
  }

  // Subscribe to AI streaming
  createEffect(() => {
    if (!sdk) return

    // This would hook into the actual streaming response
    // For now, we'll set up the subscription pattern
    const subscription = sdk.sessions.onStreamingResponse?.(processChunk)
    
    onCleanup(() => {
      subscription?.unsubscribe()
    })
  })

  const togglePanel = () => setIsVisible(!isVisible())
  const resizePanel = (width: number) => {
    // Store panel width in settings
    settings?.set("previewPanelWidth", width)
  }

  return {
    blocks,
    isVisible,
    togglePanel,
    resizePanel,
    processChunk, // Exposed for testing
  }
}

// Integration component that wires everything together
export const DualSurfaceIntegration: Component = () => {
  const { blocks, isVisible, togglePanel, resizePanel } = useStreamingParser()

  return (
    <LivePreviewPanel
      blocks={blocks()}
      isVisible={isVisible()}
      onToggle={togglePanel}
      onResize={resizePanel}
    />
  )
}
