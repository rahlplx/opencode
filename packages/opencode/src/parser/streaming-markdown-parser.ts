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

interface ParserState {
  buffer: string
  blocks: ParsedBlock[]
  currentBlock: ParsedBlock | null
  inCodeFence: boolean
  fenceLength: number
}

export class StreamingMarkdownParser {
  private state: ParserState

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
        // Look for opening fence: ```language\n
        if (buffer[i] === "`" && buffer.substring(i, i + 3) === "```") {
          // Find fence length
          let fenceLen = 3
          while (buffer[i + fenceLen] === "`") {
            fenceLen++
          }

          // Find language (until newline)
          let langStart = i + fenceLen
          let langEnd = langStart
          while (langEnd < buffer.length && buffer[langEnd] !== "\n") {
            langEnd++
          }

          // If we have a newline, we have a complete opening fence
          if (langEnd < buffer.length) {
            const language = buffer.substring(langStart, langEnd).trim()
            const contentStart = langEnd + 1 // After newline

            this.state.inCodeFence = true
            this.state.fenceLength = fenceLen

            // Create new block
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
            // Incomplete opening fence - wait for more data
            break
          }
        }
      } else {
        // Look for closing fence: ``` at start of line
        if (buffer[i] === "`" && buffer.substring(i, i + 3) === "```") {
          // Check if this is at start of line
          if (i === 0 || buffer[i - 1] === "\n") {
            // Find fence length
            let fenceLen = 3
            while (buffer[i + fenceLen] === "`") {
              fenceLen++
            }

            // Closing fence must match opening fence length
            if (fenceLen === this.state.fenceLength) {
              // Find end of closing fence line
              let lineEnd = i + fenceLen
              while (lineEnd < buffer.length && buffer[lineEnd] !== "\n") {
                lineEnd++
              }

              // Complete the current block
              if (this.state.currentBlock) {
                // Content is from after opening fence to before closing fence
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

    // Update current block content if streaming
    if (this.state.inCodeFence && this.state.currentBlock) {
      const contentStart = this.state.currentBlock.startIndex + this.state.fenceLength + this.state.currentBlock.language.length + 1
      this.state.currentBlock.content = buffer.substring(contentStart)
    }

    // Truncate buffer to prevent memory issues
    const keepChars = 100
    if (buffer.length > keepChars) {
      const offset = buffer.length - keepChars
      this.state.buffer = buffer.substring(offset)
      
      // Adjust indices
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
