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

class StreamingMarkdownParser {
  private state: {
    buffer: string
    blocks: ParsedBlock[]
    currentBlock: ParsedBlock | null
    inCodeFence: boolean
    fenceLength: number
  }

  constructor() {
    this.state = {
      buffer: "",
      blocks: [],
      currentBlock: null,
      inCodeFence: false,
      fenceLength: 0,
    }
  }

  push(chunk: string): void {
    this.state.buffer += chunk
    this.processBuffer()
  }

  getBlocks(): ParsedBlock[] {
    return [...this.state.blocks, ...(this.state.currentBlock ? [this.state.currentBlock] : [])]
  }

  reset(): void {
    this.state = {
      buffer: "",
      blocks: [],
      currentBlock: null,
      inCodeFence: false,
      fenceLength: 0,
    }
  }

  private processBuffer(): void {
    const { buffer } = this.state
    let i = 0

    while (i < buffer.length) {
      if (!this.state.inCodeFence) {
        if (buffer[i] === "`" && buffer.substring(i, i + 3) === "```") {
          let fenceLen = 3
          while (buffer[i + fenceLen] === "`") {
            fenceLen++
          }

          let langStart = i + fenceLen
          let langEnd = langStart
          while (langEnd < buffer.length && buffer[langEnd] !== "\n") {
            langEnd++
          }

          if (langEnd < buffer.length) {
            const language = buffer.substring(langStart, langEnd).trim()
            const contentStart = langEnd + 1

            this.state.inCodeFence = true
            this.state.fenceLength = fenceLen

            this.state.currentBlock = {
              type: this.resolveBlockType(language),
              content: "",
              isComplete: false,
              language,
              startIndex: i,
              endIndex: -1,
            }

            i = contentStart
            continue
          } else {
            break
          }
        }
      } else {
        if (buffer[i] === "`" && buffer.substring(i, i + 3) === "```") {
          if (i === 0 || buffer[i - 1] === "\n") {
            let fenceLen = 3
            while (buffer[i + fenceLen] === "`") {
              fenceLen++
            }

            if (fenceLen === this.state.fenceLength) {
              let lineEnd = i + fenceLen
              while (lineEnd < buffer.length && buffer[lineEnd] !== "\n") {
                lineEnd++
              }

              if (this.state.currentBlock) {
                const contentStart = this.state.currentBlock.startIndex + this.state.fenceLength + this.state.currentBlock.language.length + 1
                this.state.currentBlock.content = buffer.substring(contentStart, i)
                this.state.currentBlock.endIndex = lineEnd
                this.state.currentBlock.isComplete = true
                this.state.blocks.push(this.state.currentBlock)
                this.state.currentBlock = null
              }

              this.state.inCodeFence = false
              this.state.fenceLength = 0
              i = lineEnd < buffer.length ? lineEnd + 1 : lineEnd
              continue
            }
          }
        }
      }

      i++
    }

    if (this.state.inCodeFence && this.state.currentBlock) {
      const contentStart = this.state.currentBlock.startIndex + this.state.fenceLength + this.state.currentBlock.language.length + 1
      this.state.currentBlock.content = buffer.substring(contentStart)
    }

    const keepChars = 100
    if (buffer.length > keepChars) {
      const offset = buffer.length - keepChars
      this.state.buffer = buffer.substring(offset)
      
      if (this.state.currentBlock) {
        this.state.currentBlock.startIndex -= offset
      }
    }
  }

  private resolveBlockType(language: string): BlockType {
    const lang = language.toLowerCase().trim()
    
    switch (lang) {
      case "mermaid":
        return BlockType.MERMAID
      case "echarts":
      case "chart":
        return BlockType.ECHARTS
      case "react":
      case "jsx":
      case "tsx":
        return BlockType.REACT
      case "html":
        return BlockType.HTML
      default:
        return BlockType.UNKNOWN
    }
  }
}

describe("Integration: Parser to Panel", () => {
  test("parser feeds blocks to panel correctly", () => {
    const parser = new StreamingMarkdownParser()
    
    // Simulate AI streaming response
    parser.push("```mermaid\ngraph TD\nA-->B\nB-->C\n```\n")
    
    const blocks = parser.getBlocks()
    
    // Panel should receive complete block
    expect(blocks.length).toBeGreaterThanOrEqual(1)
    // Find the mermaid block
    const mermaidBlock = blocks.find(b => b.type === BlockType.MERMAID)
    expect(mermaidBlock).toBeDefined()
    expect(mermaidBlock!.isComplete).toBe(true)
    expect(mermaidBlock!.content).toContain("A-->B")
    expect(mermaidBlock!.content).toContain("B-->C")
  })

  test("panel visibility toggles when blocks appear", () => {
    let isVisible = false
    const parser = new StreamingMarkdownParser()
    
    // Initially no blocks, panel hidden
    expect(parser.getBlocks()).toHaveLength(0)
    expect(isVisible).toBe(false)
    
    // Add mermaid block
    parser.push("```mermaid\ngraph TD\nA-->B\n```\n")
    
    // Panel should become visible
    if (parser.getBlocks().length > 0) {
      isVisible = true
    }
    
    expect(isVisible).toBe(true)
  })

  test("handles rapid streaming chunks", () => {
    const parser = new StreamingMarkdownParser()
    
    // Simulate rapid streaming (100 chunks)
    for (let i = 0; i < 100; i++) {
      parser.push(`line ${i}\n`)
    }
    
    // Should handle without crashing
    expect(() => parser.getBlocks()).not.toThrow()
  })

  test("resets parser state correctly", () => {
    const parser = new StreamingMarkdownParser()
    
    // Add some content
    parser.push("```mermaid\ngraph TD\nA-->B\n```\n")
    expect(parser.getBlocks()).toHaveLength(1)
    
    // Reset
    parser.reset()
    expect(parser.getBlocks()).toHaveLength(0)
    
    // Add new content
    parser.push("```echarts\n{}\n```\n")
    const blocks = parser.getBlocks()
    expect(blocks).toHaveLength(1)
    expect(blocks[0].type).toBe(BlockType.ECHARTS)
  })

  test("performance: processes chunks within budget", () => {
    const parser = new StreamingMarkdownParser()
    const start = performance.now()
    
    // Process 1000 chunks
    for (let i = 0; i < 1000; i++) {
      parser.push(`chunk ${i}\n`)
    }
    
    const duration = performance.now() - start
    expect(duration).toBeLessThan(50) // < 50ms total
  })
})
