import { Component, Show, For } from "solid-js"
import { MermaidRenderer } from "./mermaid-renderer"
import { EChartsRenderer } from "./echarts-renderer"
import { HtmlSandbox } from "./html-sandbox"
import { ReactRenderer } from "./react-renderer"
import { Card } from "@opencode-ai/ui/card"
import { IconButton } from "@opencode-ai/ui/icon-button"
import { Icon } from "@opencode-ai/ui/icon"
import { Spinner } from "@opencode-ai/ui/spinner"
import "./live-preview.css"

// Local type definitions to avoid cross-package import issues
export enum BlockType {
  MERMAID = "mermaid",
  ECHARTS = "echarts",
  REACT = "react",
  HTML = "html",
  UNKNOWN = "unknown",
}

export interface ParsedBlock {
  type: BlockType
  content: string
  isComplete: boolean
  language: string
  startIndex: number
  endIndex: number
}

interface LivePreviewPanelProps {
  blocks: ParsedBlock[]
  isVisible: boolean
  onToggle: () => void
  onResize: (width: number) => void
}

export const LivePreviewPanel: Component<LivePreviewPanelProps> = (props) => {
  return (
    <Show when={props.isVisible}>
      <div class="live-preview-panel">
        <div class="live-preview-header">
          <span class="live-preview-title">Live Preview</span>
          <div class="live-preview-actions">
            <IconButton icon="close" onClick={props.onToggle} aria-label="Close preview" />
          </div>
        </div>
        <div class="live-preview-content">
          <Show
            when={props.blocks.length > 0}
            fallback={
              <div class="live-preview-empty">
                <Icon name="eye" class="live-preview-empty-icon" />
                <p>No renderable blocks detected</p>
                <p class="live-preview-empty-hint">
                  AI-generated Mermaid diagrams, charts, and UI components will appear here
                </p>
              </div>
            }
          >
            <For each={props.blocks}>
              {(block) => (
                <Card class="live-preview-block">
                  <Show when={block.type === BlockType.MERMAID}>
                    <MermaidRenderer content={block.content} isComplete={block.isComplete} />
                  </Show>
                  <Show when={block.type === BlockType.ECHARTS}>
                    <EChartsRenderer content={block.content} isComplete={block.isComplete} />
                  </Show>
                  <Show when={block.type === BlockType.REACT}>
                    <ReactRenderer content={block.content} isComplete={block.isComplete} />
                  </Show>
                  <Show when={block.type === BlockType.HTML}>
                    <HtmlSandbox content={block.content} isComplete={block.isComplete} />
                  </Show>
                  <Show when={block.type === BlockType.UNKNOWN}>
                    <div class="live-preview-placeholder">Unknown block type</div>
                  </Show>
                  <Show when={!block.isComplete}>
                    <div class="live-preview-streaming">
                      <Spinner />
                      <span>Streaming...</span>
                    </div>
                  </Show>
                </Card>
              )}
            </For>
          </Show>
        </div>
      </div>
    </Show>
  )
}
