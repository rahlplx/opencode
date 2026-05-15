import { Component, createSignal, createEffect, onCleanup, For, Show } from "solid-js"
import { createStore, reconcile } from "solid-js/store"
import { OpenUIDSLParser } from "@opencode-ai/opencode/parser/openui-dsl-parser"
import { StreamingMarkdownParser, BlockType, ParsedBlock } from "@opencode-ai/opencode/parser/streaming-markdown-parser"
import { DSLRenderer } from "@opencode-ai/opencode/parser/dsl-renderer"
import { createOpenCodeLibrary } from "@opencode-ai/opencode/parser/opencode-library"
import { DSLRendererComponent, type RenderPlanItem } from "@opencode-ai/ui/live-preview/dsl-renderer-component"
import { MermaidRenderer } from "@opencode-ai/ui/live-preview/mermaid-renderer"
import { EChartsRenderer } from "@opencode-ai/ui/live-preview/echarts-renderer"
import { ReactRenderer } from "@opencode-ai/ui/live-preview/react-renderer"
import { HtmlSandbox } from "@opencode-ai/ui/live-preview/html-sandbox"
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
  // FIX #2: createStore + reconcile instead of createSignal for incremental updates
  const [items, setItems] = createStore<RenderItem[]>([])
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

    // FIX #2: reconcile does deep diffing — unchanged items keep identity
    setItems(reconcile(currentItems))
  }

  createEffect(() => {
    if (!sdk) return
    const subscription = sdk.sessions.onStreamingResponse?.(processChunk)
    onCleanup(() => subscription?.unsubscribe())
  })

  // FIX #3: Reset parsers on session lifecycle events
  createEffect(() => {
    if (!sdk?.event) return
    const unsubCreated = sdk.event.on("session.created", () => {
      dslParser.reset()
      mdParser.reset()
      setItems(reconcile([]))
      setIsVisible(false)
    })
    const unsubStatus = sdk.event.on("session.status", (event) => {
      if (event.properties?.status?.type === "idle") {
        dslParser.reset()
        mdParser.reset()
        setItems(reconcile([]))
      }
    })
    onCleanup(() => {
      unsubCreated()
      unsubStatus()
    })
  })

  const togglePanel = () => setIsVisible(!isVisible())
  const resizePanel = (width: number) => {
    settings?.set("previewPanelWidth", width)
  }

  return { items, isVisible, togglePanel, resizePanel, processChunk, registry }
}

// FIX #1: BlockRenderer replaces LegacyBlockRenderer — uses actual renderers
const BlockRenderer: Component<{ block: ParsedBlock }> = (props) => {
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
    <Card class="live-preview-block">
      <div class="legacy-block-header">
        <span class="legacy-block-type">{blockLabel()}</span>
        <Show when={!props.block.isComplete}>
          <Spinner />
        </Show>
      </div>
      <Show when={props.block.type === BlockType.MERMAID}>
        <MermaidRenderer content={props.block.content} isComplete={props.block.isComplete} />
      </Show>
      <Show when={props.block.type === BlockType.ECHARTS}>
        <EChartsRenderer content={props.block.content} isComplete={props.block.isComplete} />
      </Show>
      <Show when={props.block.type === BlockType.REACT}>
        <ReactRenderer content={props.block.content} isComplete={props.block.isComplete} />
      </Show>
      <Show when={props.block.type === BlockType.HTML}>
        <HtmlSandbox content={props.block.content} isComplete={props.block.isComplete} />
      </Show>
    </Card>
  )
}

export const DualSurfaceIntegration: Component = () => {
  const { items, isVisible, togglePanel, resizePanel } = useDualSurfaceParser()

  return (
    <div class="dual-surface-integration">
      <Show when={isVisible()}>
        {/* DSL renders actual SolidJS components */}
        <For each={items.filter((i): i is Extract<RenderItem, { source: "dsl" }> => i.source === "dsl")}>
          {(item) => (
            <DSLRendererComponent plan={item.plan} />
          )}
        </For>
        {/* Fallback: render detected code fences with proper renderers */}
        <For each={items.filter((i): i is Extract<RenderItem, { source: "markdown" }> => i.source === "markdown")}>
          {(item) => (
            <BlockRenderer block={item.block} />
          )}
        </For>
      </Show>
    </div>
  )
}
