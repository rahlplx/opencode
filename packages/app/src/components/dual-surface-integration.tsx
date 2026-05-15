import { Component, createSignal, createEffect, onCleanup, For, Show } from "solid-js"
import { OpenUIDSLParser, DSLNode, DSLNodeType } from "@opencode-ai/opencode/parser/openui-dsl-parser"
import { StreamingMarkdownParser, BlockType, ParsedBlock } from "@opencode-ai/opencode/parser/streaming-markdown-parser"
import { DSLRenderer } from "@opencode-ai/opencode/parser/dsl-renderer"
import { createOpenCodeLibrary } from "@opencode-ai/opencode/parser/opencode-library"
import { DSLRendererComponent, type RenderPlanItem } from "@opencode-ai/ui/live-preview/dsl-renderer-component"
import { Card } from "@opencode-ai/ui/card"
import { Spinner } from "@opencode-ai/ui/spinner"
import { useSDK } from "@/context/sdk"
import { useSettings } from "@/context/settings"

// Shared renderer instance (singleton)
const registry = createOpenCodeLibrary()
const dslRenderer = new DSLRenderer(registry)

// Type for renderable items from either parser
export type RenderItem = 
  | { source: "dsl"; plan: RenderPlanItem[] }
  | { source: "markdown"; block: ParsedBlock }

export function useDualSurfaceParser() {
  const [items, setItems] = createSignal<RenderItem[]>([])
  const [isVisible, setIsVisible] = createSignal(false)
  
  const dslParser = new OpenUIDSLParser()
  const mdParser = new StreamingMarkdownParser()

  const { sdk } = useSDK()
  const { settings } = useSettings()

  const processChunk = (chunk: string) => {
    const currentItems: RenderItem[] = []
    
    // Try DSL parser first (token-efficient line-oriented format)
    dslParser.push(chunk)
    const newTree = dslParser.getTree()
    if (newTree.children.length > 0) {
      // Convert DSL tree to render plan using the component registry
      const plan = dslRenderer.generateRenderPlan(newTree)
      if (plan.length > 0) {
        currentItems.push({ source: "dsl", plan })
      }
    }
    
    // Fallback: detect markdown code fences
    mdParser.push(chunk)
    const blocks = mdParser.getBlocks()
    for (const block of blocks) {
      if (block.type !== BlockType.UNKNOWN) {
        currentItems.push({ source: "markdown", block })
      }
    }
    
    if (currentItems.length > 0 && !isVisible()) {
      setIsVisible(true)
    }
    
    setItems(currentItems)
  }

  createEffect(() => {
    if (!sdk) return
    const subscription = sdk.sessions.onStreamingResponse?.(processChunk)
    onCleanup(() => subscription?.unsubscribe())
  })

  const togglePanel = () => setIsVisible(!isVisible())
  const resizePanel = (width: number) => {
    settings?.set("previewPanelWidth", width)
  }

  return { items, isVisible, togglePanel, resizePanel, processChunk, registry }
}

// Legacy Block Renderer - fallback for markdown code fences
const LegacyBlockRenderer: Component<{ block: ParsedBlock }> = (props) => {
  const blockLabel = () => {
    switch (props.block.type) {
      case BlockType.MERMAID: return "Mermaid Diagram"
      case BlockType.ECHARTS: return "Chart"
      case BlockType.REACT: return "React Component"
      case BlockType.HTML: return "HTML"
      default: return "Code Block"
    }
  }
  
  return (
    <Card class="legacy-block">
      <div class="legacy-block-header">
        <span class="legacy-block-type">{blockLabel()}</span>
        <Show when={!props.block.isComplete}>
          <Spinner />
        </Show>
      </div>
      <pre class="legacy-block-content">{props.block.content}</pre>
    </Card>
  )
}

export const DualSurfaceIntegration: Component = () => {
  const { items, isVisible, togglePanel, resizePanel } = useDualSurfaceParser()

  return (
    <div class="dual-surface-integration">
      <Show when={isVisible}>
        {/* DSL renders actual SolidJS components */}
        <For each={items().filter((i): i is Extract<RenderItem, { source: "dsl" }> => i.source === "dsl")}>
          {(item) => (
            <DSLRendererComponent plan={item.plan} />
          )}
        </For>
        {/* Fallback: render detected code fences */}
        <For each={items().filter((i): i is Extract<RenderItem, { source: "markdown" }> => i.source === "markdown")}>
          {(item) => (
            <LegacyBlockRenderer block={item.block} />
          )}
        </For>
      </Show>
    </div>
  )
}
