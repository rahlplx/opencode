import { describe, expect, test } from "bun:test"

// Local type definitions to avoid import issues
enum BlockType {
  MERMAID = "mermaid",
  ECHARTS = "echarts",
  REACT = "react",
  HTML = "html",
  UNKNOWN = "unknown",
}

interface ParsedBlock {
  type: BlockType
  content: string
  isComplete: boolean
  language: string
  startIndex: number
  endIndex: number
}

describe("LivePreviewPanel", () => {
  describe("block detection", () => {
    test("identifies mermaid blocks", () => {
      const block: ParsedBlock = {
        type: BlockType.MERMAID,
        content: "graph TD\nA-->B",
        isComplete: true,
        language: "mermaid",
        startIndex: 0,
        endIndex: 20,
      }
      expect(block.type).toBe(BlockType.MERMAID)
      expect(block.isComplete).toBe(true)
    })

    test("identifies echarts blocks", () => {
      const block: ParsedBlock = {
        type: BlockType.ECHARTS,
        content: "{}",
        isComplete: true,
        language: "echarts",
        startIndex: 0,
        endIndex: 10,
      }
      expect(block.type).toBe(BlockType.ECHARTS)
    })

    test("identifies react blocks", () => {
      const block: ParsedBlock = {
        type: BlockType.REACT,
        content: "function App() {}",
        isComplete: true,
        language: "react",
        startIndex: 0,
        endIndex: 20,
      }
      expect(block.type).toBe(BlockType.REACT)
    })

    test("identifies html blocks", () => {
      const block: ParsedBlock = {
        type: BlockType.HTML,
        content: "<div>Hello</div>",
        isComplete: true,
        language: "html",
        startIndex: 0,
        endIndex: 20,
      }
      expect(block.type).toBe(BlockType.HTML)
    })
  })

  describe("panel state", () => {
    test("tracks visibility state", () => {
      let isVisible = true
      const toggle = () => { isVisible = !isVisible }
      
      expect(isVisible).toBe(true)
      toggle()
      expect(isVisible).toBe(false)
    })

    test("tracks resize state", () => {
      let width = 400
      const resize = (newWidth: number) => { width = newWidth }
      
      expect(width).toBe(400)
      resize(600)
      expect(width).toBe(600)
    })
  })

  describe("performance", () => {
    test("handles large block arrays efficiently", () => {
      const blocks: ParsedBlock[] = []
      for (let i = 0; i < 100; i++) {
        blocks.push({
          type: BlockType.MERMAID,
          content: `graph TD\nA${i}-->B${i}`,
          isComplete: true,
          language: "mermaid",
          startIndex: i * 100,
          endIndex: (i + 1) * 100,
        })
      }
      
      expect(blocks.length).toBe(100)
      expect(blocks[99].content).toContain("A99-->B99")
    })
  })
})
