import { Component, type JSX } from "solid-js"
import { Button } from "../button"
import { Card } from "../card"
import { Avatar } from "../avatar"
import { Tag } from "../tag"
import { Icon } from "../icon"
import { Spinner } from "../spinner"
import { Progress } from "../progress"
import { Switch } from "../switch"
import { Checkbox } from "../checkbox"
import { TextField } from "../text-field"
import { Select } from "../select"
import { Dialog } from "../dialog"
import { Tabs } from "../tabs"
import { List } from "../list"
import { propsMappers, type PropsMapper } from "./dsl-component-map-logic"

// ── Simple layout components not in the existing UI package ──

export function Stack(props: { children?: JSX.Element; class?: string }): JSX.Element {
  return (
    <div
      data-component="stack"
      style={{ display: "flex", "flex-direction": "column", gap: "8px" }}
      class={props.class}
    >
      {props.children}
    </div>
  )
}

export function Dashboard(props: { children?: JSX.Element; class?: string }): JSX.Element {
  return (
    <div
      data-component="dashboard"
      style={{ display: "flex", height: "100%" }}
      class={props.class}
    >
      <div data-slot="sidebar" style={{ width: "240px", "border-right": "1px solid var(--border-base)" }} />
      <div data-slot="main" style={{ flex: 1, overflow: "auto" }}>
        {props.children}
      </div>
    </div>
  )
}

export function Table(props: { children?: JSX.Element; class?: string }): JSX.Element {
  return (
    <div data-component="table" class={props.class} style={{ overflow: "auto" }}>
      <table style={{ width: "100%", "border-collapse": "collapse" }}>{props.children}</table>
    </div>
  )
}

export function Chart(props: { type?: string; title?: string; class?: string }): JSX.Element {
  return (
    <div
      data-component="chart"
      data-chart-type={props.type}
      class={props.class}
      style={{ padding: "16px", "text-align": "center", color: "var(--text-weak)" }}
    >
      Chart: {props.type ?? "unknown"} - {props.title ?? "untitled"}
    </div>
  )
}

// ── Component Mapper (combines solid components with pure mappers) ──

export interface ComponentMapper {
  solidComponent: Component<any>
  propsMapper: PropsMapper
}

const componentMap: Record<string, ComponentMapper> = {
  Stack: { solidComponent: Stack, propsMapper: propsMappers.Stack },
  Dashboard: { solidComponent: Dashboard, propsMapper: propsMappers.Dashboard },
  Card: { solidComponent: Card, propsMapper: propsMappers.Card },
  Avatar: { solidComponent: Avatar, propsMapper: propsMappers.Avatar },
  Tag: { solidComponent: Tag, propsMapper: propsMappers.Tag },
  Icon: { solidComponent: Icon, propsMapper: propsMappers.Icon },
  Button: { solidComponent: Button, propsMapper: propsMappers.Button },
  TextField: { solidComponent: TextField, propsMapper: propsMappers.TextField },
  Switch: { solidComponent: Switch, propsMapper: propsMappers.Switch },
  Checkbox: { solidComponent: Checkbox, propsMapper: propsMappers.Checkbox },
  Select: { solidComponent: Select, propsMapper: propsMappers.Select },
  Dialog: { solidComponent: Dialog, propsMapper: propsMappers.Dialog },
  Tabs: { solidComponent: Tabs, propsMapper: propsMappers.Tabs },
  Table: { solidComponent: Table, propsMapper: propsMappers.Table },
  Chart: { solidComponent: Chart, propsMapper: propsMappers.Chart },
  List: { solidComponent: List, propsMapper: propsMappers.List },
  Progress: { solidComponent: Progress, propsMapper: propsMappers.Progress },
  Spinner: { solidComponent: Spinner, propsMapper: propsMappers.Spinner },
}

export function getComponentMapper(name: string): ComponentMapper | undefined {
  return componentMap[name]
}

export function getAvailableComponents(): string[] {
  return Object.keys(componentMap)
}
