export enum DSLNodeType {
  ROOT = "root",
  COMPONENT = "component",
  PROP = "prop",
  ARRAY = "array",
  STRING = "string",
  IDENTIFIER = "identifier",
}

export interface DSLNode {
  type: DSLNodeType
  name: string
  props: Record<string, any>
  children: DSLNode[]
  parent?: DSLNode
}

interface ParsedLine {
  identifier: string
  componentName: string
  props: Record<string, any>
  childrenRefs: string[]
}

export class OpenUIDSLParser {
  private buffer: string
  private definitions: Map<string, ParsedLine>
  private root: DSLNode

  constructor() {
    this.buffer = ""
    this.definitions = new Map()
    this.root = { type: DSLNodeType.ROOT, name: "root", props: {}, children: [] }
  }

  push(chunk: string): void {
    this.buffer += chunk
    this.processBuffer()
  }

  getTree(): DSLNode {
    this.resolveTree()
    return this.root
  }

  reset(): void {
    this.buffer = ""
    this.definitions = new Map()
    this.root = { type: DSLNodeType.ROOT, name: "root", props: {}, children: [] }
  }

  private processBuffer(): void {
    let content = this.buffer
    this.buffer = ""
    
    const lines = content.split("\n")
    
    const completeLines = content.endsWith("\n") ? lines : lines.slice(0, -1)
    const partialLine = content.endsWith("\n") ? "" : lines[lines.length - 1]
    
    for (const line of completeLines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const parsed = this.parseLine(trimmed)
      if (parsed) {
        this.definitions.set(parsed.identifier, parsed)
      }
    }
    
    if (partialLine) {
      const trimmed = partialLine.trim()
      if (trimmed) {
        const parsed = this.parseLine(trimmed)
        if (parsed) {
          this.definitions.set(parsed.identifier, parsed)
        } else {
          this.buffer = partialLine
        }
      }
    }
  }

  private parseLine(line: string): ParsedLine | null {
    const assignmentMatch = line.match(/^(\w+)\s*=\s*(\w+)\(([\s\S]*)\)$/)
    if (!assignmentMatch) return null
    
    const identifier = assignmentMatch[1]
    const componentName = assignmentMatch[2]
    const argsStr = assignmentMatch[3]
    
    const childrenRefs: string[] = []
    let propsStr = argsStr
    
    const bracketMatch = argsStr.match(/^[[{]([^\]}]*)[\]}]\s*,?\s*(.*)$/)
    if (bracketMatch) {
      const childrenContent = bracketMatch[1]
      propsStr = bracketMatch[2]
      
      if (childrenContent.trim()) {
        const refs = childrenContent.split(",").map(r => r.trim()).filter(Boolean)
        childrenRefs.push(...refs)
      }
    }
    
    const props = this.parseProps(propsStr)
    
    return { identifier, componentName, props, childrenRefs }
  }

  private parseProps(propsStr: string): Record<string, any> {
    const props: Record<string, any> = {}
    if (!propsStr.trim()) return props
    
    let i = 0
    while (i < propsStr.length) {
      while (i < propsStr.length && (propsStr[i] === " " || propsStr[i] === ",")) i++
      if (i >= propsStr.length) break
      
      const keyStart = i
      while (i < propsStr.length && propsStr[i] !== "=") i++
      if (i >= propsStr.length) break
      
      const key = propsStr.substring(keyStart, i).trim()
      i++
      
      while (i < propsStr.length && propsStr[i] === " ") i++
      
      if (i < propsStr.length) {
        if (propsStr[i] === '"') {
          i++
          const valStart = i
          while (i < propsStr.length && propsStr[i] !== '"') i++
          props[key] = propsStr.substring(valStart, i)
          i++
        } else if (propsStr[i] === "[") {
          const arrStart = i
          let depth = 0
          while (i < propsStr.length) {
            if (propsStr[i] === "[") depth++
            if (propsStr[i] === "]") {
              depth--
              if (depth === 0) { i++; break }
            }
            i++
          }
          props[key] = propsStr.substring(arrStart + 1, i - 1)
            .split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean)
        } else {
          const valStart = i
          while (i < propsStr.length && propsStr[i] !== "," && propsStr[i] !== " " && propsStr[i] !== ")") i++
          props[key] = propsStr.substring(valStart, i).trim()
        }
      }
    }
    
    return props
  }

  private resolveTree(): void {
    const rootDef = this.definitions.get("root")
    if (!rootDef) return
    
    this.root.children = []
    const rootComponent = this.buildNode(rootDef)
    rootComponent.parent = this.root
    this.root.children.push(rootComponent)
  }

  private buildNode(def: ParsedLine): DSLNode {
    const node: DSLNode = {
      type: DSLNodeType.COMPONENT,
      name: def.componentName,
      props: { ...def.props },
      children: [],
    }
    
    for (const ref of def.childrenRefs) {
      const childDef = this.definitions.get(ref)
      if (childDef) {
        const childNode = this.buildNode(childDef)
        childNode.parent = node
        node.children.push(childNode)
      }
    }
    
    return node
  }
}
