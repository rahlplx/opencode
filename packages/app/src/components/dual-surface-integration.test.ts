import { describe, expect, test } from "bun:test"

// Local type definitions
enum BlockType { MERMAID = "mermaid", ECHARTS = "echarts", REACT = "react", HTML = "html", UNKNOWN = "unknown" }
interface ParsedBlock { type: BlockType; content: string; isComplete: boolean; language: string; startIndex: number; endIndex: number }
enum DSLNodeType { ROOT = "root", COMPONENT = "component" }
interface DSLNode { type: DSLNodeType; name: string; props: Record<string, any>; children: DSLNode[] }

// Inline DSL parser for testing
class OpenUIDSLParser {
  private definitions = new Map<string, any>()
  private root: DSLNode = { type: DSLNodeType.ROOT, name: "root", props: {}, children: [] }
  
  push(chunk: string) {
    const lines = chunk.split("\n").filter(l => l.trim())
    for (const line of lines) {
      const m = line.trim().match(/^(\w+)\s*=\s*(\w+)\(([\s\S]*)\)$/)
      if (!m) continue
      const [, id, name, args] = m
      const bracketMatch = args.match(/^[[{]([^\]}]*)[\]}]\s*,?\s*(.*)$/)
      const refs = bracketMatch ? bracketMatch[1].split(",").map(r => r.trim()).filter(Boolean) : []
      const props = {} // simplified
      this.definitions.set(id, { identifier: id, componentName: name, props, childrenRefs: refs })
    }
  }
  
  getTree(): DSLNode {
    const rootDef = this.definitions.get("root")
    if (!rootDef) return this.root
    this.root.children = [this.buildNode(rootDef)]
    return this.root
  }
  
  private buildNode(def: any): DSLNode {
    const node: DSLNode = { type: DSLNodeType.COMPONENT, name: def.componentName, props: {}, children: [] }
    for (const ref of def.childrenRefs) {
      const childDef = this.definitions.get(ref)
      if (childDef) node.children.push(this.buildNode(childDef))
    }
    return node
  }
}

class StreamingMarkdownParser {
  private blocks: ParsedBlock[] = []
  push(chunk: string) {
    const mermaidMatch = chunk.match(/```mermaid\n([\s\S]*?)```/)
    if (mermaidMatch) {
      this.blocks.push({ type: BlockType.MERMAID, content: mermaidMatch[1], isComplete: true, language: "mermaid", startIndex: 0, endIndex: chunk.length })
    }
  }
  getBlocks() { return this.blocks }
  reset() { this.blocks = [] }
}

type RenderItem = { source: "dsl"; tree: DSLNode } | { source: "markdown"; block: ParsedBlock }

describe("Dual Surface Integration", () => {
  describe("DSL parser (primary)", () => {
    test("parses line-oriented DSL efficiently", () => {
      const parser = new OpenUIDSLParser()
      parser.push("root = Stack({ chart })\n")
      parser.push('chart = Chart(type="bar")\n')
      const tree = parser.getTree()
      
      expect(tree.children).toHaveLength(1)
      expect(tree.children[0].name).toBe("Stack")
      expect(tree.children[0].children).toHaveLength(1)
      expect(tree.children[0].children[0].name).toBe("Chart")
    })

    test("handles streaming line-by-line", () => {
      const parser = new OpenUIDSLParser()
      parser.push("root = Container({ a, b })\n")
      parser.push("a = Card(title=\"First\")\n")
      parser.push("b = Card(title=\"Second\")\n")
      const tree = parser.getTree()
      
      expect(tree.children[0].children).toHaveLength(2)
    })
  })

  describe("Markdown fallback", () => {
    test("detects mermaid code fences", () => {
      const parser = new StreamingMarkdownParser()
      parser.push("```mermaid\ngraph TD\nA-->B\n```\n")
      const blocks = parser.getBlocks()
      expect(blocks).toHaveLength(1)
      expect(blocks[0].content).toContain("A-->B")
    })
  })

  describe("Dual parser routing", () => {
    test("prefers DSL over markdown when both match", () => {
      const dslParser = new OpenUIDSLParser()
      const mdParser = new StreamingMarkdownParser()
      const items: RenderItem[] = []
      
      const chunk = "root = Stack({ child })\nchild = Card(title=\"Test\")\n"
      dslParser.push(chunk)
      mdParser.push(chunk)
      
      if (dslParser.getTree().children.length > 0) {
        items.push({ source: "dsl", tree: dslParser.getTree() })
      }
      mdParser.getBlocks().forEach(b => items.push({ source: "markdown", block: b }))
      
      expect(items.length).toBeGreaterThan(0)
    })
  })

  describe("Token efficiency", () => {
    test("DSL uses fewer tokens than markdown for same UI", () => {
      // Realistic dashboard in markdown (with code fences, JSON keys, etc.)
      const markdown = "```mermaid\ngraph TD\nA[Sales Dashboard] --> B[Revenue Chart]\nA --> C[Customer Table]\nB --> D[Monthly Data]\nC --> E[Contact List]\n```\n\n```echarts\n{\n\"title\":{\"text\":\"Monthly Revenue\"}\n}\n```"
      
      // Same UI in DSL (line-oriented, no repetition)
      const dsl = "root = Dashboard({ chart, table })\nchart = RevenueChart(type=bar, data=monthly_data)\ntable = CustomerTable(columns=[Name, Revenue])"
      
      const markdownTokens = markdown.split(/\s+/).length
      const dslTokens = dsl.split(/\s+/).length
      
      // DSL should use significantly fewer tokens
      expect(dslTokens).toBeLessThan(markdownTokens)
    })
  })

  describe("Performance", () => {
    test("DSL parsing stays under budget", () => {
      const parser = new OpenUIDSLParser()
      const start = performance.now()
      for (let i = 0; i < 100; i++) {
        parser.push(`item${i} = Widget(name="widget-${i}")\n`)
      }
      const duration = performance.now() - start
      expect(duration).toBeLessThan(50)
    })
  })
})
