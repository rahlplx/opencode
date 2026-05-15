import { describe, expect, test } from "bun:test"
import { ComponentRegistry, ComponentDefinition, PropType } from "./component-registry"

describe("ComponentRegistry", () => {
  describe("component registration", () => {
    test("registers a single component", () => {
      const registry = new ComponentRegistry()
      registry.register({
        name: "Card",
        description: "A content container with optional title",
        props: {
          title: { type: PropType.STRING, description: "Card title", required: false },
          children: { type: PropType.COMPONENT, description: "Card content", required: false },
        },
        nesting: true, // Can contain children
      })
      
      const card = registry.get("Card")
      expect(card).toBeDefined()
      expect(card!.name).toBe("Card")
      expect(card!.props.title.type).toBe(PropType.STRING)
    })

    test("registers multiple components", () => {
      const registry = new ComponentRegistry()
      registry.registerMany([
        { name: "Card", description: "Content container", props: {}, nesting: true },
        { name: "Button", description: "Action button", props: { 
          label: { type: PropType.STRING, description: "Button text", required: true },
          variant: { type: PropType.STRING, description: "Button style", required: false },
        }, nesting: false },
        { name: "Chart", description: "Data visualization", props: {
          type: { type: PropType.STRING, description: "Chart type", required: true },
          data: { type: PropType.ARRAY, description: "Chart data", required: true },
        }, nesting: false },
      ])
      
      expect(registry.get("Card")).toBeDefined()
      expect(registry.get("Button")).toBeDefined()
      expect(registry.get("Chart")).toBeDefined()
      expect(registry.get("NonExistent")).toBeUndefined()
    })

    test("prevents duplicate registration", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Card", description: "First", props: {}, nesting: true })
      
      expect(() => {
        registry.register({ name: "Card", description: "Duplicate", props: {}, nesting: true })
      }).toThrow("already registered")
    })
  })

  describe("component queries", () => {
    test("lists all registered components", () => {
      const registry = new ComponentRegistry()
      registry.registerMany([
        { name: "Card", description: "A", props: {}, nesting: true },
        { name: "Button", description: "B", props: {}, nesting: false },
        { name: "Stack", description: "C", props: {}, nesting: true },
      ])
      
      const all = registry.list()
      expect(all).toHaveLength(3)
      expect(all.map(c => c.name)).toEqual(["Card", "Button", "Stack"])
    })

    test("filters by nesting capability", () => {
      const registry = new ComponentRegistry()
      registry.registerMany([
        { name: "Stack", description: "Layout", props: {}, nesting: true },
        { name: "Button", description: "Action", props: {}, nesting: false },
        { name: "Dashboard", description: "Page", props: {}, nesting: true },
      ])
      
      const nestable = registry.list({ nestableOnly: true })
      expect(nestable).toHaveLength(2)
      expect(nestable.map(c => c.name)).toEqual(["Stack", "Dashboard"])
    })
  })

  describe("prop schema validation", () => {
    test("string props are correctly typed", () => {
      const registry = new ComponentRegistry()
      registry.register({
        name: "Card",
        description: "A card",
        props: {
          title: { type: PropType.STRING, description: "The title", required: true },
        },
        nesting: false,
      })
      
      const card = registry.get("Card")!
      expect(card.props.title.type).toBe(PropType.STRING)
      expect(card.props.title.required).toBe(true)
    })

    test("array props are correctly typed", () => {
      const registry = new ComponentRegistry()
      registry.register({
        name: "Table",
        description: "Data table",
        props: {
          columns: { type: PropType.ARRAY, description: "Column definitions", required: true },
          rows: { type: PropType.ARRAY, description: "Data rows", required: false },
        },
        nesting: false,
      })
      
      const table = registry.get("Table")!
      expect(table.props.columns.type).toBe(PropType.ARRAY)
      expect(table.props.rows.type).toBe(PropType.ARRAY)
    })
  })

  describe("prompt generation", () => {
    test("generates component signature line", () => {
      const registry = new ComponentRegistry()
      registry.register({
        name: "Card",
        description: "Content container",
        props: {
          title: { type: PropType.STRING, description: "Card title", required: true },
        },
        nesting: true,
      })
      
      const signature = registry.describe("Card")
      expect(signature).toContain("Card")
      expect(signature).toContain("title")
      expect(signature).toContain("string")
    })

    test("generates full prompt from registry", () => {
      const registry = new ComponentRegistry()
      registry.registerMany([
        { name: "Stack", description: "Layout container", props: {}, nesting: true },
        { name: "Card", description: "Content card", props: { 
          title: { type: PropType.STRING, description: "Title", required: false },
        }, nesting: false },
        { name: "Button", description: "Action button", props: {
          label: { type: PropType.STRING, description: "Button text", required: true },
        }, nesting: false },
      ])
      
      const prompt = registry.generatePrompt()
      expect(prompt).toContain("Stack")
      expect(prompt).toContain("Card")
      expect(prompt).toContain("Button")
      expect(prompt).toContain("Content card")
      expect(prompt).toContain("Layout container")
    })
  })

  describe("performance", () => {
    test("handles 50+ components efficiently", () => {
      const registry = new ComponentRegistry()
      const start = performance.now()
      
      for (let i = 0; i < 50; i++) {
        registry.register({
          name: `Component${i}`,
          description: `Component ${i}`,
          props: {
            prop1: { type: PropType.STRING, description: "Prop 1", required: true },
            prop2: { type: PropType.ARRAY, description: "Prop 2", required: false },
          },
          nesting: i % 2 === 0,
        })
      }
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(50)
      expect(registry.list()).toHaveLength(50)
    })
  })
})
