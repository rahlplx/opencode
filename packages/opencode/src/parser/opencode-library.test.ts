import { describe, expect, test } from "bun:test"
import { createOpenCodeLibrary } from "./opencode-library"
import { PropType } from "./component-registry"

describe("OpenCode Library", () => {
  test("registers all components", () => {
    const lib = createOpenCodeLibrary()
    const components = lib.list()
    
    expect(components.length).toBeGreaterThan(10)
    expect(lib.get("Card")).toBeDefined()
    expect(lib.get("Button")).toBeDefined()
    expect(lib.get("Stack")).toBeDefined()
    expect(lib.get("TextField")).toBeDefined()
    expect(lib.get("Dialog")).toBeDefined()
  })

  test("each component has required fields", () => {
    const lib = createOpenCodeLibrary()
    
    for (const comp of lib.list()) {
      expect(comp.name).toBeTruthy()
      expect(comp.description).toBeTruthy()
      expect(typeof comp.nesting).toBe("boolean")
      expect(comp.props).toBeDefined()
      
      // Each prop definition must be well-formed
      for (const [key, propDef] of Object.entries(comp.props)) {
        expect(propDef.type).toBeDefined()
        expect(Object.values(PropType)).toContain(propDef.type)
        expect(typeof propDef.required).toBe("boolean")
        expect(propDef.description).toBeTruthy()
      }
    }
  })

  test("generates comprehensive system prompt", () => {
    const lib = createOpenCodeLibrary()
    const prompt = lib.generatePrompt()
    
    // Should list all components
    expect(prompt).toContain("Card")
    expect(prompt).toContain("Button")
    expect(prompt).toContain("Stack")
    expect(prompt).toContain("TextField")
    expect(prompt).toContain("Table")
    expect(prompt).toContain("Chart")
    
    // Should include format instructions
    expect(prompt).toContain("identifier = ComponentName")
    expect(prompt).toContain("Example")
    
    // Should include nesting info
    const stackDef = lib.describe("Stack")
    expect(stackDef).toContain("arranges child components")
  })

  test("all components pass through DSL parser", () => {
    const lib = createOpenCodeLibrary()
    const { OpenUIDSLParser } = require("./openui-dsl-parser")
    const parser = new OpenUIDSLParser()
    
    // Generate DSL for every registered component
    const componentLines = lib.list().map(c => {
      const propsStr = Object.entries(c.props)
        .filter(([_, p]) => p.required)
        .map(([key, p]) => {
          switch (p.type) {
            case PropType.STRING: return `${key}="test"`
            case PropType.NUMBER: return `${key}=42`
            case PropType.BOOLEAN: return `${key}=true`
            case PropType.ARRAY: return `${key}=["a","b"]`
            default: return `${key}=null`
          }
        })
        .join(", ")
      const childrenStr = c.nesting ? "({ child })" : ""
      return `comp_${c.name} = ${c.name}(${childrenStr ? childrenStr + ", " : ""}${propsStr})`
    })
    
    // Parse all in one go
    parser.push(componentLines.join("\n"))
    const tree = parser.getTree()
    
    // At minimum, parsing should not crash
    expect(tree).toBeDefined()
  })

  test("prompt fits within token budget", () => {
    const lib = createOpenCodeLibrary()
    const prompt = lib.generatePrompt()
    
    // Prompt should be under 1500 tokens (rough estimate)
    const tokenCount = prompt.split(/\s+/).length
    expect(tokenCount).toBeLessThan(1500)
  })

  test("stack and dashboard are nestable", () => {
    const lib = createOpenCodeLibrary()
    
    const stack = lib.get("Stack")!
    expect(stack.nesting).toBe(true)
    
    const dashboard = lib.get("Dashboard")!
    expect(dashboard.nesting).toBe(true)
  })

  test("simple components are non-nestable", () => {
    const lib = createOpenCodeLibrary()
    
    const button = lib.get("Button")!
    expect(button.nesting).toBe(false)
    
    const avatar = lib.get("Avatar")!
    expect(avatar.nesting).toBe(false)
    
    const spinner = lib.get("Spinner")!
    expect(spinner.nesting).toBe(false)
  })
})
