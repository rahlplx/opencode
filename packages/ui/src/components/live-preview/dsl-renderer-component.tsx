import { Component, createMemo, For, type JSX } from "solid-js"
import { Dynamic } from "solid-js/web"
import { getComponentMapper, type ComponentMapper } from "./dsl-component-map"

export interface RenderPlanItem {
  component: string
  props: Record<string, unknown>
  children: RenderPlanItem[]
  depth: number
}

interface DSLRendererComponentProps {
  plan: RenderPlanItem[]
  class?: string
}

// ── Unknown component fallback ──

const UnknownComponent: Component<{ name: string; children?: JSX.Element }> = (props) => (
  <div
    data-unknown-component={props.name}
    style={{ padding: "8px", border: "1px dashed var(--border-base)", color: "var(--text-weak)", "font-size": "12px" }}
  >
    Unknown component: {props.name}
    {props.children}
  </div>
)

// ── Resolve children into mapped props ──

function resolveChildren(
  mapper: ComponentMapper,
  dslProps: Record<string, unknown>,
  renderedChildren: JSX.Element,
): Record<string, unknown> {
  const mapped = mapper.propsMapper(dslProps)
  mapped.children = renderedChildren
  return mapped
}

// ── Recursive node renderer ──

const RenderPlanNode: Component<{ item: RenderPlanItem }> = (props) => {
  const mapper = createMemo(() => getComponentMapper(props.item.component))

  const childElements = (
    <For each={props.item.children}>
      {(child) => <RenderPlanNode item={child} />}
    </For>
  )

  return (
    <div data-dsl-component={props.item.component} data-dsl-depth={props.item.depth}>
      {mapper()
        ? (() => {
            const m = mapper()!
            const resolvedProps = resolveChildren(m, props.item.props, childElements)
            return <Dynamic component={m.solidComponent} {...resolvedProps} />
          })()
        : (() => <UnknownComponent name={props.item.component}>{childElements}</UnknownComponent>)()}
    </div>
  )
}

// ── Root renderer ──

export const DSLRendererComponent: Component<DSLRendererComponentProps> = (props) => (
  <div class={props.class} data-dsl-renderer>
    <For each={props.plan}>
      {(item) => <RenderPlanNode item={item} />}
    </For>
  </div>
)
