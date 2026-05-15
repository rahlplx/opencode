import { describe, expect, test } from "bun:test"
import { ComponentRegistry, PropType } from "./component-registry"
import { DSLNode, DSLNodeType } from "./openui-dsl-parser"
import { createComponentRenderer, RendererOptions } from "./dsl-renderer"

describe("DSLRenderer", () => {
  describe("node mapping", () => {
    test("maps parsed node to component definition", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Stack", description: "Layout", props: {}, nesting: true })
      registry.register({ name: "Card", description: "Content", props: { 
        title: { type: PropType.STRING, description: "Title", required: true },
      }, nesting: false })
      
      const renderer = createComponentRenderer(registry)
      
      const node: DSLNode = { type: DSLNodeType.COMPONENT, name: "Card", props: { title: "Hello" }, children: [] }
      const def = renderer.resolveComponent(node)
      
      expect(def).toBeDefined()
      expect(def!.name).toBe("Card")
    })

    test("returns null for unknown component", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Stack", description: "Layout", props: {}, nesting: true })
      
      const renderer = createComponentRenderer(registry)
      const node: DSLNode = { type: DSLNodeType.COMPONENT, name: "UnknownComponent", props: {}, children: [] }
      
      const def = renderer.resolveComponent(node)
      expect(def).toBeUndefined()
    })
  })

  describe("property validation", () => {
    test("validates required props are present", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Button", description: "Action", props: {
        label: { type: PropType.STRING, description: "Text", required: true },
      }, nesting: false })
      
      const renderer = createComponentRenderer(registry)
      
      // Missing required prop
      const node: DSLNode = { type: DSLNodeType.COMPONENT, name: "Button", props: {}, children: [] }
      const violations = renderer.validateProps(node)
      
      expect(violations.length).toBeGreaterThan(0)
      expect(violations[0]).toContain("label")
    })

    test("passes validation with all required props", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Button", description: "Action", props: {
        label: { type: PropType.STRING, description: "Text", required: true },
      }, nesting: false })
      
      const renderer = createComponentRenderer(registry)
      const node: DSLNode = { type: DSLNodeType.COMPONENT, name: "Button", props: { label: "Click" }, children: [] }
      
      const violations = renderer.validateProps(node)
      expect(violations).toHaveLength(0)
    })
  })

  describe("tree validation", () => {
    test("validates nesting constraints", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Stack", description: "Layout", props: {}, nesting: true })
      registry.register({ name: "Button", description: "Action", props: {}, nesting: false })
      
      const renderer = createComponentRenderer(registry)
      
      // Button inside Stack is fine
      const validNode: DSLNode = { type: DSLNodeType.COMPONENT, name: "Stack", props: {}, children: [
        { type: DSLNodeType.COMPONENT, name: "Button", props: {}, children: [] },
      ]}
      
      const validErrors = renderer.validateNode(validNode)
      expect(validErrors.filter(e => e.startsWith("ERROR"))).toHaveLength(0)
    })

    test("flags invalid nesting", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Button", description: "Action", props: {}, nesting: false })
      registry.register({ name: "Stack", description: "Layout", props: {}, nesting: true })
      
      const renderer = createComponentRenderer(registry)
      
      // Stack inside non-nestable Button
      const invalidNode: DSLNode = { type: DSLNodeType.COMPONENT, name: "Button", props: {}, children: [
        { type: DSLNodeType.COMPONENT, name: "Stack", props: {}, children: [] },
      ]}
      
      const errors = renderer.validateNode(invalidNode)
      expect(errors.some(e => e.includes("cannot nest"))).toBe(true)
    })
  })

  describe("render output", () => {
    test("generates render plan from tree", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Stack", description: "Layout", props: {}, nesting: true })
      registry.register({ name: "Card", description: "Content", props: { 
        title: { type: PropType.STRING, description: "Title", required: true },
      }, nesting: false })
      
      const renderer = createComponentRenderer(registry)
      
      const tree: DSLNode = { type: DSLNodeType.ROOT, name: "root", props: {}, children: [
        { type: DSLNodeType.COMPONENT, name: "Stack", props: {}, children: [
          { type: DSLNodeType.COMPONENT, name: "Card", props: { title: "Hello" }, children: [] },
        ]},
      ]}
      
      const plan = renderer.generateRenderPlan(tree)
      expect(plan).toHaveLength(2) // Stack + Card
      expect(plan[0].component).toBe("Stack")
      expect(plan[1].component).toBe("Card")
    })

    test("skips unknown components in render plan", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Stack", description: "Layout", props: {}, nesting: true })
      
      const renderer = createComponentRenderer(registry)
      
      const tree: DSLNode = { type: DSLNodeType.ROOT, name: "root", props: {}, children: [
        { type: DSLNodeType.COMPONENT, name: "Stack", props: {}, children: [
          { type: DSLNodeType.COMPONENT, name: "UnknownComponent", props: {}, children: [] },
        ]},
      ]}
      
      const plan = renderer.generateRenderPlan(tree)
      // UnknownComponent should be skipped
      const names = plan.map(p => p.component)
      expect(names).not.toContain("UnknownComponent")
    })
  })

  describe("performance", () => {
    test("generates render plan for large tree quickly", () => {
      const registry = new ComponentRegistry()
      registry.register({ name: "Stack", description: "Layout", props: {}, nesting: true })
      registry.register({ name: "Card", description: "Content", props: {}, nesting: false })
      
      const renderer = createComponentRenderer(registry)
      
      // Build a tree with 100 nodes
      const children: DSLNode[] = []
      for (let i = 0; i < 100; i++) {
        children.push({ type: DSLNodeType.COMPONENT, name: "Card", props: { title: `Card ${i}` }, children: [] })
      }
      const tree: DSLNode = { type: DSLNodeType.ROOT, name: "root", props: {}, children: [
        { type: DSLNodeType.COMPONENT, name: "Stack", props: {}, children },
      ]}
      
      const start = performance.now()
      const plan = renderer.generateRenderPlan(tree)
      const duration = performance.now() - start
      
      expect(plan.length).toBeGreaterThan(0)
      expect(duration).toBeLessThan(50)
    })
  })
})
