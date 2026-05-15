import { Component, createSignal, createEffect, onCleanup, For, Show } from "solid-js"
import { OpenUIDSLParser, DSLNode, DSLNodeType } from "@opencode-ai/opencode/parser/openui-dsl-parser"
import { StreamingMarkdownParser, BlockType, ParsedBlock } from "@opencode-ai/opencode/parser/streaming-markdown-parser"
import { useSDK } from "@/context/sdk"
import { useSettings } from "@/context/settings"
import { Card } from "@opencode-ai/ui/card"
import { Spinner } from "@opencode-ai/ui/spinner"

// Type for renderable items from either parser
export type RenderItem = 
  | { source: "dsl"; tree: DSLNode }
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
    const oldTree = dslParser.getTree()
    dslParser.push(chunk)
    const newTree = dslParser.getTree()
    if (newTree.children.length > 0) {
      currentItems.push({ source: "dsl", tree: newTree })
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

  return { items, isVisible, togglePanel, resizePanel, processChunk }
}

// DSL Tree Renderer - renders structure progressively
const DSLTreeRenderer: Component<{ tree: DSLNode }> = (props) => {
  const renderNode = (node: DSLNode, depth: number = 0): any => {
    if (node.type === DSLNodeType.ROOT && node.children.length > 0) {
      return node.children.map(child => renderNode(child, depth))
    }
    
    return (
      <Card class="dsl-component" style={`margin-left: ${depth * 12}px`}>
        <div class="dsl-component-header">
          <span class="dsl-component-name">{node.name}</span>
          <Show when={Object.keys(node.props).length > 0}>
            <span class="dsl-component-props">
              {JSON.stringify(node.props)}
            </span>
          </Show>
        </div>
        <Show when={node.children.length > 0}>
          <div class="dsl-component-children">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        </Show>
      </Card>
    )
  }
  
  return <div class="dsl-tree">{renderNode(props.tree)}</div>
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
      {/* DSL tree renders structure-first */}
      <For each={items().filter(i => i.source === "dsl")}>
        {(item) => (
          <DSLTreeRenderer tree={item.tree} />
        )}
      </For>
      {/* Fallback: render detected code fences */}
      <For each={items().filter(i => i.source === "markdown")}>
        {(item) => (
          <LegacyBlockRenderer block={item.block} />
        )}
      </For>
    </div>
  )
}
