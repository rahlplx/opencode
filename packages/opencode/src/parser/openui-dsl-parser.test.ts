import { describe, expect, test } from "bun:test"
import { OpenUIDSLParser, DSLNodeType } from "./openui-dsl-parser"

describe("OpenUIDSLParser", () => {
  describe("line-oriented parsing", () => {
    test("parses simple component declaration", () => {
      const parser = new OpenUIDSLParser()
      parser.push("root = Stack([chart])")
      const tree = parser.getTree()
      
      expect(tree).toBeDefined()
      expect(tree.type).toBe(DSLNodeType.ROOT)
      expect(tree.children).toHaveLength(1)
      expect(tree.children[0].type).toBe(DSLNodeType.COMPONENT)
      expect(tree.children[0].name).toBe("Stack")
    })

    test("parses component with props", () => {
      const parser = new OpenUIDSLParser()
      parser.push('root = Chart(type="bar", data=sales)')
      const tree = parser.getTree()
      
      expect(tree.children[0].name).toBe("Chart")
      expect(tree.children[0].props).toHaveProperty("type", "bar")
      expect(tree.children[0].props).toHaveProperty("data", "sales")
    })

    test("handles streaming line-by-line", () => {
      const parser = new OpenUIDSLParser()
      
      // First line: root with placeholder
      parser.push("root = Stack([chart])\n")
      let tree = parser.getTree()
      expect(tree).toBeDefined()
      expect(tree.children).toHaveLength(1)
      
      // Second line: define the chart component
      parser.push('chart = Chart(type="bar")\n')
      tree = parser.getTree()
      expect(tree.children[0].children).toHaveLength(1)
      expect(tree.children[0].children[0].name).toBe("Chart")
    })
  })

  describe("component resolution", () => {
    test("resolves component references", () => {
      const parser = new OpenUIDSLParser()
      parser.push("root = Stack([chart, table])")
      parser.push('chart = Chart(type="bar")')
      parser.push('table = Table(columns=["Name", "Value"])')
      const tree = parser.getTree()
      
      const root = tree.children[0]
      expect(root.name).toBe("Stack")
      expect(root.children).toHaveLength(2)
      expect(root.children[0].name).toBe("Chart")
      expect(root.children[1].name).toBe("Table")
    })

    test("handles undefined references gracefully", () => {
      const parser = new OpenUIDSLParser()
      parser.push("root = Stack([unknown_component])")
      const tree = parser.getTree()
      
      expect(tree).toBeDefined()
    })
  })

  describe("error handling", () => {
    test("handles malformed lines", () => {
      const parser = new OpenUIDSLParser()
      parser.push("this is not valid DSL syntax")
      const tree = parser.getTree()
      
      expect(tree).toBeDefined()
    })

    test("handles incomplete expressions", () => {
      const parser = new OpenUIDSLParser()
      parser.push("root = Stack([chart")
      const tree = parser.getTree()
      
      expect(tree).toBeDefined()
    })

    test("handles empty input", () => {
      const parser = new OpenUIDSLParser()
      const tree = parser.getTree()
      
      expect(tree.children).toHaveLength(0)
    })
  })

  describe("token efficiency", () => {
    test("parses dashboard in compact form", () => {
      const dslInput = [
        'root = Dashboard({ sidebar, main })',
        'sidebar = Sidebar({ nav, profile })',
        'nav = Navigation(items=["Home", "Charts", "Settings"])',
        'profile = Profile(name="User")',
        'main = Stack({ chart, table, button })',
        'chart = Chart(type="bar", data=sales_data, color="blue")',
        'table = Table(columns=["Name", "Revenue"], rows=customers)',
        'button = Button(label="Export", onClick=export_csv)',
      ].join("\n")
      
      const parser = new OpenUIDSLParser()
      parser.push(dslInput)
      const tree = parser.getTree()
      
      expect(tree).toBeDefined()
      expect(tree.children).toHaveLength(1)
      expect(tree.children[0].name).toBe("Dashboard")
      
      // Verify children are resolved
      const dashboard = tree.children[0]
      expect(dashboard.children.length).toBeGreaterThan(0)
      
      // Count lines as token estimate
      const tokenCount = dslInput.split("\n").length
      expect(tokenCount).toBeLessThan(20) // DSL should be compact
    })
  })

  describe("performance", () => {
    test("parses 1000 lines efficiently", () => {
      const parser = new OpenUIDSLParser()
      const start = performance.now()
      
      // root definition
      parser.push("root = Container({ items })\n")
      // Generate 999 item definitions
      for (let i = 0; i < 999; i++) {
        parser.push(`item${i} = Card(title="Item ${i}")\n`)
      }
      // items references all
      parser.push(`items = Stack({ ${Array.from({length: 999}, (_, i) => `item${i}`).join(", ")} })\n`)
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(200) // 200ms budget for 1000 lines
      
      const tree = parser.getTree()
      expect(tree.children.length).toBeGreaterThan(0)
    })

    test("handles 100 rapid streaming chunks", () => {
      const parser = new OpenUIDSLParser()
      const start = performance.now()
      
      for (let i = 0; i < 100; i++) {
        parser.push(`item${i} = Card(title="Item ${i}")`)
      }
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(50)
    })
  })

  describe("incremental updates", () => {
    test("patches existing component", () => {
      const parser = new OpenUIDSLParser()
      parser.push("root = Stack([chart])")
      parser.push('chart = Chart(type="bar")')
      
      let tree = parser.getTree()
      expect(tree.children[0].children[0].props.type).toBe("bar")
      
      parser.push('chart = Chart(type="line")')
      tree = parser.getTree()
      const chartNode = tree.children[0].children.find(c => c.name === "Chart")
      expect(chartNode?.props.type).toBe("line")
    })
  })
})
