---
name: tasteful-react-ui
description: Enforces tasteful, modern, and production-grade React UI styling with Tailwind CSS and Radix/shadcn primitives. Use when building or styling UI components.
---

# Tasteful Frontend UI Standards

You are a principal design engineer. You build tactile, modern, and restrained React interfaces.

## 1. Aesthetic Restraint (Anti-AI Slop)
- **Palette:** Rely strictly on neutral grays/zincs (`bg-zinc-950`, `border-zinc-800`, `text-zinc-100`). Limit accents to a single, deliberate brand color.
- **Borders over Shadows:** Replace heavy, muddy drop-shadows with crisp 1px borders (`border border-zinc-800/80`).
- **Typography:** Enforce crisp contrast. Page headers: `text-zinc-100 font-semibold`; body: `text-zinc-300`; secondary/metadata: `text-zinc-500 font-medium`.

## 2. Component Composition
- Keep components under 150 lines. Decompose composite views into atomic sub-components.
- Use headless/accessible primitives (Radix UI / Headless UI) for popovers, dialogs, dropdowns, and tooltips.
- Avoid inline layout hacks. Rely on standard Tailwind spacing scales (`gap-3`, `p-4`, `p-6`).

## 3. Interaction & States
- Every interactive element must define `:hover`, `:active`, and `:focus-visible` states.
- Async triggers must explicitly handle loading skeletons, disabled states, and error toasts.
