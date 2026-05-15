import { ComponentRegistry, ComponentDefinition, PropType } from "./component-registry"
import { DSLNode, DSLNodeType } from "./openui-dsl-parser"

export interface RenderPlanItem {
  component: string
  props: Record<string, any>
  children: RenderPlanItem[]
  depth: number
}

export interface RendererOptions {
  strictMode?: boolean // If true, fail on unknown components
}

export class DSLRenderer {
  constructor(
    private registry: ComponentRegistry,
    private options: RendererOptions = {}
  ) {}

  resolveComponent(node: DSLNode): ComponentDefinition | undefined {
    return this.registry.get(node.name)
  }

  validateProps(node: DSLNode): string[] {
    const def = this.registry.get(node.name)
    if (!def) return [`Unknown component: ${node.name}`]
    
    const violations: string[] = []
    
    for (const [name, propDef] of Object.entries(def.props)) {
      if (propDef.required && node.props[name] === undefined) {
        violations.push(`Missing required prop "${name}" for component "${node.name}"`)
      }
    }
    
    return violations
  }

  validateNode(node: DSLNode): string[] {
    const errors: string[] = []
    
    if (node.type === DSLNodeType.COMPONENT) {
      const def = this.registry.get(node.name)
      if (!def) {
        if (this.options.strictMode) {
          errors.push(`ERROR: Unknown component "${node.name}"`)
        }
        return errors
      }
      
      // Check nesting
      if (!def.nesting && node.children.length > 0) {
        errors.push(`ERROR: Component "${node.name}" cannot nest children`)
      }
      
      // Validate props
      errors.push(...this.validateProps(node))
      
      // Recurse into children
      for (const child of node.children) {
        errors.push(...this.validateNode(child))
      }
    }
    
    return errors
  }

  generateRenderPlan(tree: DSLNode): RenderPlanItem[] {
    const plan: RenderPlanItem[] = []
    
    const walk = (node: DSLNode, depth: number) => {
      if (node.type === DSLNodeType.ROOT) {
        for (const child of node.children) {
          walk(child, depth)
        }
        return
      }
      
      const def = this.registry.get(node.name)
      if (!def) return // Skip unknown components
      
      plan.push({
        component: node.name,
        props: { ...node.props },
        children: [],
        depth,
      })
      
      for (const child of node.children) {
        const childDef = this.registry.get(child.name)
        if (childDef) {
          walk(child, depth + 1)
        }
      }
    }
    
    walk(tree, 0)
    return plan
  }
}

export function createComponentRenderer(
  registry: ComponentRegistry,
  options?: RendererOptions
): DSLRenderer {
  return new DSLRenderer(registry, options)
}
