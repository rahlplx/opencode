export enum PropType {
  STRING = "string",
  NUMBER = "number",
  BOOLEAN = "boolean",
  ARRAY = "array",
  OBJECT = "object",
  COMPONENT = "component", // For children/slots
}

export interface PropDefinition {
  type: PropType
  description: string
  required: boolean
  defaultValue?: any
}

export interface ComponentDefinition {
  name: string
  description: string
  props: Record<string, PropDefinition>
  nesting: boolean // Whether component can contain children
}

export interface RegistryQuery {
  nestableOnly?: boolean
}

export class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map()

  register(def: ComponentDefinition): void {
    const existing = this.components.get(def.name)
    if (existing) {
      throw new Error(`Component "${def.name}" is already registered`)
    }
    this.components.set(def.name, { ...def, props: { ...def.props } })
  }

  registerMany(defs: ComponentDefinition[]): void {
    for (const def of defs) {
      this.register(def)
    }
  }

  get(name: string): ComponentDefinition | undefined {
    return this.components.get(name)
  }

  list(query?: RegistryQuery): ComponentDefinition[] {
    let result = Array.from(this.components.values())
    if (query?.nestableOnly) {
      result = result.filter(c => c.nesting)
    }
    return result
  }

  describe(name: string): string {
    const component = this.components.get(name)
    if (!component) return ""
    
    const propsList = Object.entries(component.props).map(([key, prop]) => {
      const required = prop.required ? "" : "?"
      return `${key}${required}: ${prop.type}`
    })
    
    return `${name}(${propsList.join(", ")}) - ${component.description}`
  }

  generatePrompt(): string {
    const lines: string[] = [
      "You are a UI component generator. Available components:",
      "",
    ]
    
    for (const component of this.components.values()) {
      lines.push(this.describe(component.name))
    }
    
    lines.push("")
    lines.push("Use the format: identifier = ComponentName({ children }, prop1=val1, prop2=val2)")
    lines.push("Use { child1, child2 } syntax for nesting components.")
    lines.push("Each assignment is one line. Reference children by their identifiers.")
    lines.push("")
    lines.push("Example:")
    lines.push('root = Stack({ card, button })')
    lines.push('card = Card(title="Hello")')
    lines.push('button = Button(label="Click me")')
    
    return lines.join("\n")
  }

  clear(): void {
    this.components.clear()
  }
}
