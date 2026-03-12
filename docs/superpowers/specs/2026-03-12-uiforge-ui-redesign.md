# UIForge UI Redesign — Design Spec
**Date:** 2026-03-12
**Status:** Approved

---

## 1. Overview

Rebuild the UIForge frontend to match the product vision: a fast, visual UI pattern library browser where developers assemble component stacks and export AI prompts. The current app has the correct routing structure and data layer but lacks usable UI — cards don't render meaningfully, search doesn't exist, and the preview modal is incomplete.

This spec covers the MVP redesign. No new backend work is required beyond one addition to the `getComponents` query.

---

## 2. Scope

### In
- Redesigned component cards (uniform grid, hover overlay)
- Live search in the navbar
- Tag filter pills above the component grid
- Preview modal with three tabs: Live Preview / Code / Prompt Fragment
- Live sandboxed component renderer (renders actual React UI, not a screenshot)
- Stack panel polish

### Out (future)
- AI suggestion system ("describe your app")
- Design presets (Glassmorphism, Brutalist, etc.)
- Screenshot UI analyzer
- Figma plugin
- Team collaboration / saved items (placeholder page exists)

---

## 3. Layout

The app shell stays the same: top navbar, left sidebar, main content area, right stack panel.

```
┌─────────────────────────────────────────────────────────┐
│  Navbar: Logo | Search | Generate Prompt button         │
├──────────┬──────────────────────────────┬───────────────┤
│ Sidebar  │  Tag filter pills            │  Stack Panel  │
│          │  ──────────────────────────  │               │
│ Discover │  Component Grid (3-col)      │  Added items  │
│ All      │                              │  + Generate   │
│ Saved    │                              │    Prompt btn │
│          │                              │               │
│ Categories                              │               │
│  ...list │                              │               │
└──────────┴──────────────────────────────┴───────────────┘
```

---

## 4. Component Cards

**Grid:** 3 columns (`lg:grid-cols-3`), uniform card size. Responsive: 2 columns on tablet (`md:grid-cols-2`), 1 on mobile. This changes the existing 4-column layout.

**Card anatomy:**
- Top section: preview image fills the card (16:9 aspect ratio, `object-cover`). If no image, show a dark placeholder with the component name centered.
- Bottom section: component name (semibold), category badge (colored pill).

**Hover state:**
- Card border highlights with indigo glow.
- Dark semi-transparent overlay appears over the image.
- Two buttons centered in the overlay: `+ Add` (indigo, filled) and `Preview` (ghost).

**Empty state:** If no components match the current filters, show a centered message: "No components found."

---

## 5. Navbar Search

- Search input lives in the Navbar, which is a Client Component (`"use client"`).
- Search state is stored in a new Zustand slice or a dedicated `useSearchStore` (consistent with the existing `useStackStore` pattern).
- `ComponentGrid` reads the search query from the store and filters client-side.
- Matches against component name and category name (case-insensitive).
- Clearing the input restores all results.
- No URL param or router navigation — filtering is purely in-memory on the client.

---

## 6. Tag Filter Pills

- Rendered above the component grid, below the page heading.
- Tags are derived from all unique tags across currently displayed components.
- First pill is always "All" (selected by default, clears all tag filters).
- Multiple tags can be selected simultaneously. Logic is **OR** — a component is shown if it has any of the selected tags. This is the standard expected behavior for multi-select filter pills.
- Active pills are indigo-filled; inactive are ghost/muted.
- Filtering is client-side. Tag filter state lives alongside search state in the same store.

**Data note:** Tags come from the `ComponentTag` → `Tag` join. The `getComponents` server action must include tags in its select query (see Section 9).

---

## 7. Preview Modal

Opens when the user clicks "Preview" on a card hover overlay. Implemented as a Client Component.

**Layout:**
- Full-screen overlay with centered modal (max-width: 720px).
- Header: component name left, category badge, `+ Add to Stack` button right, close (✕) button.
- Tab bar immediately below header: **Preview** | **Code** | **Prompt Fragment**.
- Tab content fills the rest of the modal.
- Tag pills at the very bottom of the modal.

**There is no static screenshot in the modal.** The Preview tab renders the actual component live.

**Tab content:**

- **Preview tab:** Renders the component's code snippet live in a sandboxed iframe using Sandpack (`@codesandbox/sandpack-react`). The user sees and can interact with the actual rendered UI — a real navbar renders as a navbar, a button renders as a button. Sandpack is configured with React + Tailwind CDN. The editor pane is hidden; only the preview iframe is shown. If no code is available, falls back to the static `previewImage` if present, or a placeholder. If the component has multiple variants, a pill-tab row appears above the sandbox listing variant names — switching variants re-renders the sandbox with that variant's code.
- **Code tab:** Syntax-highlighted code snippet for the selected variant. Language label (e.g., `TSX`) in the top-right corner. Copy-to-clipboard button.
- **Prompt tab:** The `promptFragment` text for the selected variant in a pre/monospace block. Copy button.

**Keyboard:** Escape closes the modal.

### Sandpack configuration

```ts
<Sandpack
  template="react"
  theme="dark"
  files={{ "/App.tsx": variantCode }}
  customSetup={{
    dependencies: { "tailwindcss": "^3" }
  }}
  options={{
    showTabs: false,
    showNavigator: false,
    showLineNumbers: false,
    showInlineErrors: true,
    editorWidthPercentage: 0,  // preview only, no editor
    autorun: true,
  }}
/>
```

The component code must export a default function. If the stored snippet does not (e.g., it is a JSX fragment), wrap it: `export default function Preview() { return ( <>{snippet}</> ) }`.

---

## 8. Stack Panel

The stack panel already exists with drag-and-drop reordering and a Generate Prompt button that calls `/api/inference` and displays the result in a dialog overlay. **Keep the dialog/modal output behavior** — do not move it inline.

Polish only:
- Show a placeholder state when the stack is empty: "Add components to build your stack."
- Stack items show: component name, variant name (if applicable), remove (✕) button.

---

## 9. Data Changes

### `getComponents` server action
Add tags to the select query:
```
tags:ComponentTag( tag:Tag( id, name ) )
```

### Shared type file
Move `ComponentGridItem` from `ComponentGrid.tsx` into `src/lib/types.ts` to prevent circular imports. `actions.ts` currently imports it from the component file — this is an anti-pattern. Both `actions.ts` and all component files will import the type from `src/lib/types.ts`.

Extended `ComponentGridItem`:
```ts
export interface ComponentGridItem {
  id: string
  name: string
  description?: string
  category: { id: string; name: string; slug: string }
  variants: {
    id: string
    name: string
    previewImage?: string
    promptFragment?: string
    codeSnippet?: { language: string; code: string }
  }[]
  tags: { tag: { id: string; name: string } }[]
}
```

---

## 10. File Map

| File | Change |
|------|--------|
| `src/lib/types.ts` | New — shared `ComponentGridItem` type |
| `src/lib/actions.ts` | Add tags to select; import type from `src/lib/types.ts` |
| `src/components/library/ComponentGrid.tsx` | Full rewrite — reads search/tag state from store, renders cards, tag pills |
| `src/components/library/ComponentCard.tsx` | New — extracted card component with hover overlay |
| `src/components/library/PreviewModal.tsx` | New — tabbed preview modal with live Sandpack renderer |
| `src/components/library/LivePreview.tsx` | New — Sandpack wrapper (preview-only, no editor, dark theme) |
| `src/components/layout/Navbar.tsx` | Convert to Client Component, add live search input wired to store |
| `src/components/stack/StackPanel.tsx` | Add empty state; keep existing generate behavior |
| `src/store/useSearchStore.ts` | New — Zustand store for search query + active tag filters |

---

## 11. Acceptance Criteria

- [ ] Component cards render with preview image (or placeholder), name, and category badge
- [ ] Hovering a card shows Add and Preview buttons in an overlay
- [ ] Clicking Add adds the component to the stack panel
- [ ] Clicking Preview opens the tabbed modal
- [ ] Modal Preview tab renders the component live in a sandboxed iframe (actual UI, not a screenshot)
- [ ] Interacting with the rendered component works (hover, click, etc.)
- [ ] Falls back to static image or placeholder if no code is available
- [ ] Modal Code tab shows the code snippet with a copy button
- [ ] Modal Prompt tab shows the prompt fragment with a copy button
- [ ] If a component has multiple variants, a variant switcher appears in the modal
- [ ] Search input in navbar filters cards in real time (by name and category)
- [ ] Tag filter pills filter cards using OR logic; "All" clears filters
- [ ] Stack panel shows empty state when empty
- [ ] Generate Prompt button produces output in its dialog (existing behavior retained)
- [ ] Grid is 3 columns on desktop, 2 on tablet, 1 on mobile
- [ ] No TypeScript errors; builds cleanly on Vercel
