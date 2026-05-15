import { ComponentRegistry, PropType } from "./component-registry"

/**
 * OpenCode Component Library
 * 
 * Registers the real OpenCode UI components so the AI knows
 * what components are available and how to use them.
 * 
 * The registry.generatePrompt() output is injected into the
 * AI system message, telling it to output DSL code using
 * these exact component names and prop schemas.
 */
export function createOpenCodeLibrary(): ComponentRegistry {
  const registry = new ComponentRegistry()

  registry.registerMany([
    // ── Layout ──────────────────────────────────────
    {
      name: "Stack",
      description: "A vertical layout container that arranges child components in a column",
      props: {},
      nesting: true,
    },
    {
      name: "Dashboard",
      description: "Full-page dashboard layout with sidebar and main content areas arranged horizontally",
      props: {},
      nesting: true,
    },

    // ── Content ─────────────────────────────────────
    {
      name: "Card",
      description: "A content container with optional title and icon. Variants: normal, error, warning, success, info",
      props: {
        title: { type: PropType.STRING, description: "Card title text", required: false },
        variant: {
          type: PropType.STRING,
          description: "Visual variant: normal, error, warning, success, info",
          required: false,
          defaultValue: "normal",
        },
      },
      nesting: false,
    },
    {
      name: "Avatar",
      description: "User avatar displaying initials or an image",
      props: {
        fallback: { type: PropType.STRING, description: "Initials text when no image", required: true },
        src: { type: PropType.STRING, description: "Image URL for the avatar", required: false },
        size: {
          type: PropType.STRING,
          description: "Avatar size: small, normal, large",
          required: false,
          defaultValue: "normal",
        },
      },
      nesting: false,
    },
    {
      name: "Tag",
      description: "A small label/tag for categorizing or highlighting content",
      props: {
        label: { type: PropType.STRING, description: "Tag label text", required: true },
        variant: {
          type: PropType.STRING,
          description: "Visual variant: normal, error, warning, success, info",
          required: false,
          defaultValue: "normal",
        },
      },
      nesting: false,
    },
    {
      name: "Icon",
      description: "Displays a single icon from the OpenCode icon set",
      props: {
        name: { type: PropType.STRING, description: "Icon name (e.g. check, close, arrow-right)", required: true },
        size: {
          type: PropType.STRING,
          description: "Icon size: small, normal, large",
          required: false,
          defaultValue: "normal",
        },
      },
      nesting: false,
    },

    // ── Data Display ────────────────────────────────
    {
      name: "Table",
      description: "A data table with configurable columns and rows",
      props: {
        columns: {
          type: PropType.ARRAY,
          description: "Column definitions as array of strings",
          required: true,
        },
        rows: {
          type: PropType.ARRAY,
          description: "Data rows as array of objects",
          required: false,
        },
      },
      nesting: false,
    },
    {
      name: "Chart",
      description: "A data visualization chart. Renders a placeholder for bar, line, or pie charts",
      props: {
        type: {
          type: PropType.STRING,
          description: "Chart type: bar, line, pie, area",
          required: true,
        },
        title: { type: PropType.STRING, description: "Chart title", required: false },
        data: {
          type: PropType.ARRAY,
          description: "Chart data as array of data points",
          required: false,
        },
      },
      nesting: false,
    },
    {
      name: "Progress",
      description: "A progress bar showing completion percentage",
      props: {
        value: { type: PropType.NUMBER, description: "Progress value (0-100)", required: true },
        max: {
          type: PropType.NUMBER,
          description: "Maximum value (default: 100)",
          required: false,
          defaultValue: 100,
        },
      },
      nesting: false,
    },
    {
      name: "Spinner",
      description: "An animated loading spinner indicating activity",
      props: {},
      nesting: false,
    },
    {
      name: "List",
      description: "A vertical list of items",
      props: {
        items: {
          type: PropType.ARRAY,
          description: "Array of items to display as strings",
          required: true,
        },
      },
      nesting: false,
    },

    // ── Interactive ────────────────────────────────
    {
      name: "Button",
      description: "An interactive button for triggering actions. Variants: primary, secondary, ghost",
      props: {
        label: { type: PropType.STRING, description: "Button text", required: true },
        variant: {
          type: PropType.STRING,
          description: "Button style: primary, secondary, ghost",
          required: false,
          defaultValue: "secondary",
        },
        size: {
          type: PropType.STRING,
          description: "Button size: small, normal, large",
          required: false,
          defaultValue: "normal",
        },
        icon: { type: PropType.STRING, description: "Optional icon name", required: false },
      },
      nesting: false,
    },
    {
      name: "TextField",
      description: "A text input field for user text entry",
      props: {
        placeholder: { type: PropType.STRING, description: "Placeholder text", required: false },
        value: { type: PropType.STRING, description: "Initial value", required: false },
        multiline: {
          type: PropType.BOOLEAN,
          description: "Whether to show as multi-line textarea (true) or single-line input (false)",
          required: false,
          defaultValue: false,
        },
      },
      nesting: false,
    },
    {
      name: "Switch",
      description: "A toggle switch for boolean on/off settings",
      props: {
        label: { type: PropType.STRING, description: "Label text next to the switch", required: true },
        checked: {
          type: PropType.BOOLEAN,
          description: "Whether the switch is initially on",
          required: false,
          defaultValue: false,
        },
      },
      nesting: false,
    },
    {
      name: "Checkbox",
      description: "A checkbox input for selecting options",
      props: {
        label: { type: PropType.STRING, description: "Label text next to the checkbox", required: true },
        checked: {
          type: PropType.BOOLEAN,
          description: "Whether the checkbox is initially checked",
          required: false,
          defaultValue: false,
        },
      },
      nesting: false,
    },
    {
      name: "Select",
      description: "A dropdown select menu for choosing from options",
      props: {
        options: {
          type: PropType.ARRAY,
          description: "Array of string options to display in the dropdown",
          required: true,
        },
        placeholder: { type: PropType.STRING, description: "Placeholder text", required: false },
      },
      nesting: false,
    },
    {
      name: "Dialog",
      description: "A modal dialog window for alerts, confirmations, or forms",
      props: {
        title: { type: PropType.STRING, description: "Dialog title", required: true },
      },
      nesting: true, // Dialog can contain content
    },
    {
      name: "Tabs",
      description: "Tabbed container showing one panel at a time",
      props: {
        tabs: {
          type: PropType.ARRAY,
          description: "Array of tab labels as strings (e.g. ['Overview', 'Details', 'Settings'])",
          required: true,
        },
      },
      nesting: true, // Tabs can contain tab panels
    },
  ])

  return registry
}
