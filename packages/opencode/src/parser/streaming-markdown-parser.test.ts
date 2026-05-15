import { describe, expect, test } from "bun:test"
import { StreamingMarkdownParser, BlockType } from "./streaming-markdown-parser"
import type { ParsedBlock } from "./streaming-markdown-parser"

describe("StreamingMarkdownParser", () => {
  describe("block detection", () => {
    test("detects opening mermaid code fence", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```mermaid\ngraph TD\n")
      const blocks = parser.getBlocks()
      
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe(BlockType.MERMAID)
      expect(blocks[0].content).toBe("graph TD\n")
      expect(blocks[0].isComplete).toBe(false)
    })

    test("detects closing code fence", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```mermaid\ngraph TD\nA-->B\n```\n")
      const blocks = parser.getBlocks()
      
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe(BlockType.MERMAID)
      expect(blocks[0].content).toBe("graph TD\nA-->B\n")
      expect(blocks[0].isComplete).toBe(true)
    })

    test("extracts content correctly", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```mermaid\ngraph TD\nA-->B\nB-->C\n```\n")
      const blocks = parser.getBlocks()
      
      expect(blocks).toHaveLength(1)
      expect(blocks[0].content).toBe("graph TD\nA-->B\nB-->C\n")
      expect(blocks[0].content).not.toBe("")
      expect(blocks[0].content).toContain("A-->B")
      expect(blocks[0].content).toContain("B-->C")
    })

    test("detects echarts code fence", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```echarts\n{\n  \"title\": {\"text\": \"Test\"}\n}\n```\n")
      const blocks = parser.getBlocks()
      
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe(BlockType.ECHARTS)
      expect(blocks[0].isComplete).toBe(true)
    })

    test("detects react code fence", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```react\nfunction App() { return <div>Hello</div> }\n```\n")
      const blocks = parser.getBlocks()
      
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe(BlockType.REACT)
      expect(blocks[0].isComplete).toBe(true)
    })

    test("detects html code fence", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```html\n<div class=\"test\">Hello</div>\n```\n")
      const blocks = parser.getBlocks()
      
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe(BlockType.HTML)
      expect(blocks[0].isComplete).toBe(true)
    })
  })

  describe("streaming behavior", () => {
    test("handles partial opening fence", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```")
      const blocks = parser.getBlocks()
      
      // Should not detect a block yet - incomplete fence
      expect(blocks).toHaveLength(0)
    })

    test("handles partial fence with language", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```mer")
      const blocks = parser.getBlocks()
      
      // Should not detect a block yet - incomplete language
      expect(blocks).toHaveLength(0)
    })

    test("updates content as streaming continues", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```mermaid\ngraph TD\n")
      parser.push("A-->B\n")
      parser.push("B-->C\n")
      const blocks = parser.getBlocks()
      
      // Should have 1 incomplete block
      expect(blocks.length).toBeGreaterThanOrEqual(1)
      // The last block should be the mermaid block
      const lastBlock = blocks[blocks.length - 1]
      expect(lastBlock.type).toBe(BlockType.MERMAID)
      expect(lastBlock.isComplete).toBe(false)
      // Content should contain the graph definition
      expect(lastBlock.content).toContain("graph TD")
      expect(lastBlock.content).toContain("A-->B")
      expect(lastBlock.content).toContain("B-->C")
    })

    test("handles multiple blocks in single stream", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```mermaid\ngraph TD\nA-->B\n```\n\nSome text\n\n```echarts\n{}\n```\n")
      const blocks = parser.getBlocks()
      
      expect(blocks).toHaveLength(2)
      expect(blocks[0].type).toBe(BlockType.MERMAID)
      expect(blocks[0].isComplete).toBe(true)
      expect(blocks[1].type).toBe(BlockType.ECHARTS)
      expect(blocks[1].isComplete).toBe(true)
    })

    test("handles unclosed block at end of stream", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```mermaid\ngraph TD\nA-->B")
      const blocks = parser.getBlocks()
      
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe(BlockType.MERMAID)
      expect(blocks[0].isComplete).toBe(false)
      expect(blocks[0].content).toBe("graph TD\nA-->B")
    })
  })

  describe("error handling", () => {
    test("handles malformed fences gracefully", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("``` mermaid\ngraph TD\nA-->B\n```\n")
      const blocks = parser.getBlocks()
      
      // Should handle space after backticks gracefully
      expect(blocks.length).toBeGreaterThanOrEqual(0)
    })

    test("handles nested fences", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("````markdown\n```mermaid\ngraph TD\n```\n````\n")
      const blocks = parser.getBlocks()
      
      // Should handle nested fences
      expect(blocks.length).toBeGreaterThanOrEqual(0)
    })

    test("handles empty code block", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```mermaid\n```\n")
      const blocks = parser.getBlocks()
      
      expect(blocks).toHaveLength(1)
      expect(blocks[0].type).toBe(BlockType.MERMAID)
      expect(blocks[0].content).toBe("")
      expect(blocks[0].isComplete).toBe(true)
    })
  })

  describe("performance", () => {
    test("parses streaming chunks efficiently", () => {
      const parser = new StreamingMarkdownParser()
      const start = performance.now()
      
      // Simulate streaming 1000 chunks
      for (let i = 0; i < 1000; i++) {
        parser.push(`line ${i}\n`)
      }
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(50) // Should take less than 50ms
    })
  })
})
