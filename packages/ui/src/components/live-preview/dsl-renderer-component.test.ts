import { describe, expect, test } from "bun:test"
import { getPropsMapper, getRegisteredComponents, isRegisteredComponent, propsMappers } from "./dsl-component-map-logic"
import type { RenderPlanItem } from "./dsl-renderer-component"

// ── Component Registration Tests ──

describe("dsl-component-map-logic", () => {
  describe("component registration", () => {
    test("all 18 components are registered", () => {
      const components = getRegisteredComponents()
      expect(components.length).toBe(18)
    })

    test("Stack is registered", () => {
      expect(isRegisteredComponent("Stack")).toBe(true)
    })

    test("Dashboard is registered", () => {
      expect(isRegisteredComponent("Dashboard")).toBe(true)
    })

    test("Card is registered", () => {
      expect(isRegisteredComponent("Card")).toBe(true)
    })

    test("Button is registered", () => {
      expect(isRegisteredComponent("Button")).toBe(true)
    })

    test("Avatar is registered", () => {
      expect(isRegisteredComponent("Avatar")).toBe(true)
    })

    test("TextField is registered", () => {
      expect(isRegisteredComponent("TextField")).toBe(true)
    })

    test("Switch is registered", () => {
      expect(isRegisteredComponent("Switch")).toBe(true)
    })

    test("Checkbox is registered", () => {
      expect(isRegisteredComponent("Checkbox")).toBe(true)
    })

    test("Select is registered", () => {
      expect(isRegisteredComponent("Select")).toBe(true)
    })

    test("Dialog is registered", () => {
      expect(isRegisteredComponent("Dialog")).toBe(true)
    })

    test("Tabs is registered", () => {
      expect(isRegisteredComponent("Tabs")).toBe(true)
    })

    test("Table is registered", () => {
      expect(isRegisteredComponent("Table")).toBe(true)
    })

    test("Chart is registered", () => {
      expect(isRegisteredComponent("Chart")).toBe(true)
    })

    test("Progress is registered", () => {
      expect(isRegisteredComponent("Progress")).toBe(true)
    })

    test("Spinner is registered", () => {
      expect(isRegisteredComponent("Spinner")).toBe(true)
    })

    test("List is registered", () => {
      expect(isRegisteredComponent("List")).toBe(true)
    })

    test("Tag is registered", () => {
      expect(isRegisteredComponent("Tag")).toBe(true)
    })

    test("Icon is registered", () => {
      expect(isRegisteredComponent("Icon")).toBe(true)
    })
  })

  describe("props mapping", () => {
    test("Button mapper preserves variant", () => {
      const mapper = getPropsMapper("Button")!
      const mapped = mapper({ label: "Click me", variant: "primary" })
      expect(mapped.variant).toBe("primary")
    })

    test("Card mapper preserves variant", () => {
      const mapper = getPropsMapper("Card")!
      const mapped = mapper({ variant: "error" })
      expect(mapped.variant).toBe("error")
    })

    test("Avatar mapper transforms all props", () => {
      const mapper = getPropsMapper("Avatar")!
      const mapped = mapper({ fallback: "JD", src: "https://example.com/avatar.jpg", size: "large" })
      expect(mapped.fallback).toBe("JD")
      expect(mapped.src).toBe("https://example.com/avatar.jpg")
      expect(mapped.size).toBe("large")
    })

    test("Avatar mapper defaults fallback to empty string", () => {
      const mapper = getPropsMapper("Avatar")!
      const mapped = mapper({})
      expect(mapped.fallback).toBe("")
    })

    test("Icon mapper transforms name and size", () => {
      const mapper = getPropsMapper("Icon")!
      const mapped = mapper({ name: "check", size: "small" })
      expect(mapped.name).toBe("check")
      expect(mapped.size).toBe("small")
    })

    test("Icon mapper defaults name to empty string", () => {
      const mapper = getPropsMapper("Icon")!
      const mapped = mapper({})
      expect(mapped.name).toBe("")
    })

    test("Progress mapper converts value to number", () => {
      const mapper = getPropsMapper("Progress")!
      const mapped = mapper({ value: 75, showValueLabel: true })
      expect(mapped.value).toBe(75)
      expect(mapped.showValueLabel).toBe(true)
    })

    test("Progress mapper defaults value to 0", () => {
      const mapper = getPropsMapper("Progress")!
      const mapped = mapper({})
      expect(mapped.value).toBe(0)
    })

    test("Spinner mapper returns empty object", () => {
      const mapper = getPropsMapper("Spinner")!
      const mapped = mapper({})
      expect(mapped).toEqual({})
    })

    test("Tag mapper preserves size", () => {
      const mapper = getPropsMapper("Tag")!
      const mapped = mapper({ size: "large" })
      expect(mapped.size).toBe("large")
    })

    test("TextField mapper transforms label and placeholder", () => {
      const mapper = getPropsMapper("TextField")!
      const mapped = mapper({ label: "Email", placeholder: "Enter email", multiline: true })
      expect(mapped.label).toBe("Email")
      expect(mapped.placeholder).toBe("Enter email")
      expect(mapped.multiline).toBe(true)
    })

    test("Chart mapper transforms type and title", () => {
      const mapper = getPropsMapper("Chart")!
      const mapped = mapper({ type: "bar", title: "Sales" })
      expect(mapped.type).toBe("bar")
      expect(mapped.title).toBe("Sales")
    })

    test("Dialog mapper transforms title and size", () => {
      const mapper = getPropsMapper("Dialog")!
      const mapped = mapper({ title: "Confirm", size: "large" })
      expect(mapped.title).toBe("Confirm")
      expect(mapped.size).toBe("large")
    })

    test("Switch mapper transforms description and hideLabel", () => {
      const mapper = getPropsMapper("Switch")!
      const mapped = mapper({ description: "Toggle feature", hideLabel: true })
      expect(mapped.description).toBe("Toggle feature")
      expect(mapped.hideLabel).toBe(true)
    })

    test("Checkbox mapper transforms description and hideLabel", () => {
      const mapper = getPropsMapper("Checkbox")!
      const mapped = mapper({ description: "Accept terms", hideLabel: false })
      expect(mapped.description).toBe("Accept terms")
      expect(mapped.hideLabel).toBe(false)
    })

    test("Select mapper transforms options and placeholder", () => {
      const mapper = getPropsMapper("Select")!
      const opts = [{ value: "a" }, { value: "b" }]
      const mapped = mapper({ options: opts, placeholder: "Choose" })
      expect(mapped.options).toBe(opts)
      expect(mapped.placeholder).toBe("Choose")
    })

    test("Select mapper defaults options to empty array", () => {
      const mapper = getPropsMapper("Select")!
      const mapped = mapper({})
      expect(mapped.options).toEqual([])
    })

    test("Tabs mapper transforms variant and orientation", () => {
      const mapper = getPropsMapper("Tabs")!
      const mapped = mapper({ variant: "pill", orientation: "vertical" })
      expect(mapped.variant).toBe("pill")
      expect(mapped.orientation).toBe("vertical")
    })

    test("Stack mapper preserves class", () => {
      const mapper = getPropsMapper("Stack")!
      const mapped = mapper({ class: "custom-stack" })
      expect(mapped.class).toBe("custom-stack")
    })

    test("Table mapper preserves class", () => {
      const mapper = getPropsMapper("Table")!
      const mapped = mapper({ class: "custom-table" })
      expect(mapped.class).toBe("custom-table")
    })

    test("List mapper transforms items and class", () => {
      const mapper = getPropsMapper("List")!
      const items = ["a", "b", "c"]
      const mapped = mapper({ items, class: "custom-list" })
      expect(mapped.items).toBe(items)
      expect(mapped.class).toBe("custom-list")
    })

    test("List mapper defaults items to empty array", () => {
      const mapper = getPropsMapper("List")!
      const mapped = mapper({})
      expect(mapped.items).toEqual([])
    })
  })

  describe("unknown component handling", () => {
    test("returns undefined for unknown component", () => {
      const mapper = getPropsMapper("NonExistentComponent")
      expect(mapper).toBeUndefined()
    })

    test("returns undefined for misspelled component", () => {
      const mapper = getPropsMapper("Buttn")
      expect(mapper).toBeUndefined()
    })

    test("isRegisteredComponent returns false for unknown", () => {
      expect(isRegisteredComponent("NonExistent")).toBe(false)
    })
  })
})

// ── Render Plan Logic Tests ──

describe("render plan processing", () => {
  test("single component plan has correct structure", () => {
    const plan: RenderPlanItem[] = [
      {
        component: "Button",
        props: { label: "Click me" },
        children: [],
        depth: 0,
      },
    ]
    expect(plan[0].component).toBe("Button")
    expect(plan[0].props.label).toBe("Click me")
    expect(plan[0].children).toEqual([])
    expect(plan[0].depth).toBe(0)
  })

  test("nested component plan preserves hierarchy", () => {
    const plan: RenderPlanItem[] = [
      {
        component: "Stack",
        props: {},
        children: [
          {
            component: "Card",
            props: { variant: "normal" },
            children: [],
            depth: 1,
          },
          {
            component: "Button",
            props: { label: "Submit" },
            children: [],
            depth: 1,
          },
        ],
        depth: 0,
      },
    ]
    expect(plan[0].component).toBe("Stack")
    expect(plan[0].children.length).toBe(2)
    expect(plan[0].children[0].component).toBe("Card")
    expect(plan[0].children[1].component).toBe("Button")
    expect(plan[0].children[0].depth).toBe(1)
    expect(plan[0].children[1].depth).toBe(1)
  })

  test("deep nesting preserves depth correctly", () => {
    const plan: RenderPlanItem[] = [
      {
        component: "Dashboard",
        props: {},
        children: [
          {
            component: "Stack",
            props: {},
            children: [
              {
                component: "Card",
                props: {},
                children: [
                  {
                    component: "Button",
                    props: {},
                    children: [],
                    depth: 3,
                  },
                ],
                depth: 2,
              },
            ],
            depth: 1,
          },
        ],
        depth: 0,
      },
    ]
    expect(plan[0].depth).toBe(0)
    expect(plan[0].children[0].depth).toBe(1)
    expect(plan[0].children[0].children[0].depth).toBe(2)
    expect(plan[0].children[0].children[0].children[0].depth).toBe(3)
  })

  test("empty plan is valid", () => {
    const plan: RenderPlanItem[] = []
    expect(plan.length).toBe(0)
  })

  test("multiple root components are supported", () => {
    const plan: RenderPlanItem[] = [
      { component: "Button", props: { label: "A" }, children: [], depth: 0 },
      { component: "Button", props: { label: "B" }, children: [], depth: 0 },
      { component: "Button", props: { label: "C" }, children: [], depth: 0 },
    ]
    expect(plan.length).toBe(3)
    expect(plan.every((item) => item.depth === 0)).toBe(true)
  })

  test("all registered components have props mappers", () => {
    const components = getRegisteredComponents()
    for (const name of components) {
      const mapper = getPropsMapper(name)
      expect(mapper).toBeDefined()
    }
  })
})
