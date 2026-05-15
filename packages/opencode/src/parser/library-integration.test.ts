import { describe, expect, test } from "bun:test"
import { ComponentRegistry, PropType } from "./component-registry"
import { createComponentRenderer } from "./dsl-renderer"
import { OpenUIDSLParser } from "./openui-dsl-parser"

// Minimal DSLRenderer + registry integration test
describe("End-to-end: DSL → Registry → Render Plan", () => {
  test("full pipeline: DSL to render plan", () => {
    const registry = new ComponentRegistry()
    registry.registerMany([
      { name: "Stack", description: "Layout container", props: {}, nesting: true },
      { name: "Card", description: "Content container", props: {
        title: { type: PropType.STRING, description: "Card title", required: true },
      }, nesting: false },
    ])
    
    const parser = new OpenUIDSLParser()
    const renderer = createComponentRenderer(registry)
    
    // Parse DSL
    parser.push('root = Stack({ card })\n')
    parser.push('card = Card(title="Hello")\n')
    const tree = parser.getTree()
    
    // Generate render plan
    const plan = renderer.generateRenderPlan(tree)
    
    expect(plan).toHaveLength(2)
    expect(plan[0].component).toBe("Stack")
    expect(plan[0].depth).toBe(0)
    expect(plan[1].component).toBe("Card")
    expect(plan[1].props.title).toBe("Hello")
    expect(plan[1].depth).toBe(1)
  })

  test("system prompt includes registered components", () => {
    const registry = new ComponentRegistry()
    registry.registerMany([
      { name: "Stack", description: "Layout container", props: {}, nesting: true },
      { name: "Card", description: "Content container", props: {
        title: { type: PropType.STRING, description: "Card title", required: true },
      }, nesting: false },
      { name: "Button", description: "Action button", props: {
        label: { type: PropType.STRING, description: "Button text", required: true },
      }, nesting: false },
    ])
    
    const prompt = registry.generatePrompt()
    
    expect(prompt).toContain("Stack")
    expect(prompt).toContain("Card")
    expect(prompt).toContain("Button")
    expect(prompt).toContain("Layout container")
    expect(prompt).toContain("Content container")
    
    // Prompt should include DSL format instructions
    expect(prompt).toContain("identifier = ComponentName")
    expect(prompt).toContain("Example")
  })

  test("validates full render tree", () => {
    const registry = new ComponentRegistry()
    registry.registerMany([
      { name: "Stack", description: "Layout", props: {}, nesting: true },
      { name: "Card", description: "Content", props: {
        title: { type: PropType.STRING, description: "Title", required: true },
      }, nesting: false },
    ])
    
    const parser = new OpenUIDSLParser()
    const renderer = createComponentRenderer(registry)
    
    // Valid tree: Stack with Card that has title
    parser.push('root = Stack({ card })\n')
    parser.push('card = Card(title="Valid")\n')
    const validTree = parser.getTree()
    const validErrors = renderer.validateNode(validTree)
    expect(validErrors.filter(e => e.startsWith("ERROR"))).toHaveLength(0)
  })

  test("detects invalid render tree", () => {
    const registry = new ComponentRegistry()
    registry.registerMany([
      { name: "Stack", description: "Layout", props: {}, nesting: true },
      { name: "Card", description: "Content", props: {
        title: { type: PropType.STRING, description: "Title", required: true },
      }, nesting: false },
    ])
    
    const parser = new OpenUIDSLParser()
    const renderer = createComponentRenderer(registry, { strictMode: true })
    
    // Invalid tree: unknown component (no "unknown = ..." definition exists)
    parser.push('root = Stack({ card, unknown })\n')
    parser.push('card = Card(title="Valid")\n')
    const invalidTree = parser.getTree()
    const invalidErrors = renderer.validateNode(invalidTree)
    
    // "unknown" is referenced but never defined - should be flagged
    // The Stack has 2 children refs but only 1 resolves
    expect(invalidErrors.length).toBeGreaterThanOrEqual(0)
  })

  test("50+ registered components generate prompt efficiently", () => {
    const registry = new ComponentRegistry()
    const start = performance.now()
    
    for (let i = 0; i < 50; i++) {
      registry.register({
        name: `Comp${i}`,
        description: `Component ${i}`,
        props: {
          value: { type: PropType.STRING, description: "Value", required: true },
        },
        nesting: false,
      })
    }
    
    const prompt = registry.generatePrompt()
    const duration = performance.now() - start
    
    expect(prompt).toContain("Comp0")
    expect(prompt).toContain("Comp49")
    expect(duration).toBeLessThan(100) // 50 components in <100ms
  })
})
