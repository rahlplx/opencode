// Pure logic layer - no JSX, no SolidJS imports
// This file is safe to import in test files

// ── Component name registry ──

export const REGISTERED_COMPONENTS = [
  "Stack",
  "Dashboard",
  "Card",
  "Avatar",
  "Tag",
  "Icon",
  "Button",
  "TextField",
  "Switch",
  "Checkbox",
  "Select",
  "Dialog",
  "Tabs",
  "Table",
  "Chart",
  "List",
  "Progress",
  "Spinner",
] as const

export type RegisteredComponentName = (typeof REGISTERED_COMPONENTS)[number]

// ── Props mapper definitions (pure functions, no JSX) ──

export interface PropsMapper {
  (dslProps: Record<string, unknown>): Record<string, unknown>
}

export const propsMappers: Record<string, PropsMapper> = {
  Stack: (dslProps) => ({
    class: dslProps.class,
  }),
  Dashboard: () => ({}),
  Card: (dslProps) => ({
    variant: dslProps.variant,
  }),
  Avatar: (dslProps) => ({
    fallback: String(dslProps.fallback ?? ""),
    src: dslProps.src as string | undefined,
    size: dslProps.size as "small" | "normal" | "large" | undefined,
  }),
  Tag: (dslProps) => ({
    size: dslProps.size as "normal" | "large" | undefined,
  }),
  Icon: (dslProps) => ({
    name: String(dslProps.name ?? ""),
    size: dslProps.size as "small" | "normal" | "large" | undefined,
  }),
  Button: (dslProps) => ({
    variant: dslProps.variant as "primary" | "secondary" | "ghost" | undefined,
    size: dslProps.size as "small" | "normal" | "large" | undefined,
    icon: dslProps.icon as string | undefined,
  }),
  TextField: (dslProps) => ({
    label: dslProps.label as string | undefined,
    placeholder: dslProps.placeholder as string | undefined,
    value: dslProps.value as string | undefined,
    variant: dslProps.variant as "normal" | "ghost" | undefined,
    copyable: Boolean(dslProps.copyable),
    multiline: Boolean(dslProps.multiline),
  }),
  Switch: (dslProps) => ({
    description: dslProps.description as string | undefined,
    hideLabel: Boolean(dslProps.hideLabel),
  }),
  Checkbox: (dslProps) => ({
    description: dslProps.description as string | undefined,
    hideLabel: Boolean(dslProps.hideLabel),
  }),
  Select: (dslProps) => ({
    placeholder: dslProps.placeholder as string | undefined,
    options: (dslProps.options as unknown[]) ?? [],
  }),
  Dialog: (dslProps) => ({
    title: dslProps.title as string | undefined,
    description: dslProps.description as string | undefined,
    size: dslProps.size as "normal" | "large" | "x-large" | undefined,
  }),
  Tabs: (dslProps) => ({
    variant: dslProps.variant as "normal" | "alt" | "pill" | "settings" | undefined,
    orientation: dslProps.orientation as "horizontal" | "vertical" | undefined,
  }),
  Table: (dslProps) => ({
    class: dslProps.class,
  }),
  Chart: (dslProps) => ({
    type: dslProps.type as string | undefined,
    title: dslProps.title as string | undefined,
  }),
  List: (dslProps) => ({
    items: (dslProps.items as unknown[]) ?? [],
    class: dslProps.class,
  }),
  Progress: (dslProps) => ({
    value: Number(dslProps.value ?? 0),
    hideLabel: Boolean(dslProps.hideLabel),
    showValueLabel: Boolean(dslProps.showValueLabel),
  }),
  Spinner: () => ({}),
}

export function getPropsMapper(name: string): PropsMapper | undefined {
  return propsMappers[name]
}

export function getRegisteredComponents(): readonly string[] {
  return REGISTERED_COMPONENTS
}

export function isRegisteredComponent(name: string): boolean {
  return REGISTERED_COMPONENTS.includes(name as RegisteredComponentName)
}
