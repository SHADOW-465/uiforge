# UIForge UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the UIForge frontend — redesigned cards with hover overlay, live Sandpack component preview, navbar search, tag filter pills, and stack panel polish.

**Architecture:** All changes are client-side only except adding tags to the `getComponents` query. A shared Zustand store (`useSearchStore`) holds search query and active tag filters; Navbar writes to it, ComponentGrid reads from it. Sandpack renders component code live in an isolated iframe inside the preview modal.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS, Zustand, `@codesandbox/sandpack-react`, shadcn/ui (Base UI dialect), lucide-react.

**Spec:** `docs/superpowers/specs/2026-03-12-uiforge-ui-redesign.md`

---

## Chunk 1: Foundation — Types, Data, Store

### Task 1: Create shared types file

**Files:**
- Create: `src/lib/types.ts`

- [ ] Create `src/lib/types.ts` with the extended `ComponentGridItem` type including tags:

```ts
export interface ComponentGridItem {
  id: string
  name: string
  description: string | null
  category: {
    id: string
    name: string
    slug: string
  }
  variants: Array<{
    id: string
    name: string
    previewImage: string | null
    promptFragment: string | null
    codeSnippet: {
      language: string
      code: string
    } | null
  }>
  tags: Array<{
    tag: {
      id: string
      name: string
    }
  }>
}
```

- [ ] Commit:
```bash
git add src/lib/types.ts
git commit -m "feat: add shared ComponentGridItem type with tags"
```

---

### Task 2: Update `actions.ts` — add tags to query, fix import

**Files:**
- Modify: `src/lib/actions.ts`

- [ ] Replace the file content. Key changes: import type from `src/lib/types.ts` (not from ComponentGrid), add `tags:ComponentTag(tag:Tag(id,name))` to the select:

```ts
"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import type { ComponentGridItem } from "@/lib/types"

export async function getCategories() {
  try {
    const { data, error } = await getSupabaseServerClient()
      .from('Category')
      .select('id, name, slug, description, createdAt, updatedAt')
      .order('name')
    if (error) throw error
    return data ?? []
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return []
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const { data, error } = await getSupabaseServerClient()
      .from('Category')
      .select('id, name, slug, description, createdAt, updatedAt')
      .eq('slug', slug)
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Failed to fetch category ${slug}:`, error)
    return null
  }
}

export async function getComponents(categoryId?: string) {
  try {
    let query = getSupabaseServerClient()
      .from('Component')
      .select(`
        id, name, description,
        category:Category( id, name, slug ),
        variants:ComponentVariant( id, name, previewImage, promptFragment,
          codeSnippet:CodeSnippet( language, code )
        ),
        tags:ComponentTag( tag:Tag( id, name ) )
      `)
      .order('name')

    if (categoryId) {
      query = query.eq('categoryId', categoryId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as ComponentGridItem[]
  } catch (error) {
    console.error("Failed to fetch components:", error)
    return [] as ComponentGridItem[]
  }
}
```

- [ ] Commit:
```bash
git add src/lib/actions.ts
git commit -m "feat: add tags to getComponents query, import type from lib/types"
```

---

### Task 3: Create `useSearchStore`

**Files:**
- Create: `src/store/useSearchStore.ts`

- [ ] Create the Zustand store using **single quotes and 4-space indentation** to match the existing `useStackStore.ts` style exactly:

```ts
import { create } from 'zustand'

interface SearchState {
    query: string
    activeTags: string[]
    setQuery: (query: string) => void
    toggleTag: (tag: string) => void
    clearTags: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
    query: '',
    activeTags: [],
    setQuery: (query) => set({ query }),
    toggleTag: (tag) =>
        set((state) => ({
            activeTags: state.activeTags.includes(tag)
                ? state.activeTags.filter((t) => t !== tag)
                : [...state.activeTags, tag],
        })),
    clearTags: () => set({ activeTags: [] }),
}))
```

- [ ] Commit:
```bash
git add src/store/useSearchStore.ts
git commit -m "feat: add useSearchStore for search query and tag filters"
```

---

## Chunk 2: Component Card & Grid

### Task 4: Create `getBadgeClass` util + `ComponentCard`

**Files:**
- Modify: `src/lib/utils.ts` (add `getBadgeClass` — avoids coupling ComponentGrid → ComponentCard for this shared helper)
- Create: `src/components/library/ComponentCard.tsx`

- [ ] Add `getBadgeClass` to `src/lib/utils.ts`. The file may already exist with a `cn` helper — append to it:

```ts
export const CATEGORY_BADGES: Record<string, string> = {
    navigation: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'hero-sections': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    'feature-sections': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    cards: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    layouts: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    components: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    dashboards: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
    animations: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
    'micro-interactions': 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    'visual-effects': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
}

export function getBadgeClass(slug: string): string {
    return CATEGORY_BADGES[slug] ?? 'bg-muted text-muted-foreground border-border/60'
}
```

- [ ] Commit the utils change before proceeding:
```bash
git add src/lib/utils.ts
git commit -m "feat: add getBadgeClass to shared utils"
```

- [ ] Create the extracted card component. Accepts a `ComponentGridItem` and callbacks for `onAdd` and `onPreview`. Import `getBadgeClass` from `@/lib/utils` (not defined locally):

```tsx
'use client'

import Image from 'next/image'
import { Plus, Eye } from 'lucide-react'
import type { ComponentGridItem } from '@/lib/types'
import { getBadgeClass } from '@/lib/utils'

interface ComponentCardProps {
  component: ComponentGridItem
  onAdd: () => void
  onPreview: () => void
}

export function ComponentCard({ component, onAdd, onPreview }: ComponentCardProps) {
  const primaryVariant = component.variants[0]
  const badgeClass = getBadgeClass(component.category.slug)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/40 bg-card/40 transition-all hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/5">
      {/* Image area */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted/50">
        {primaryVariant?.previewImage ? (
          <Image
            src={primaryVariant.previewImage}
            alt={component.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted/30">
            <div className="h-4 w-2/3 rounded bg-muted/60" />
            <div className="h-3 w-1/2 rounded bg-muted/40" />
            <div className="h-3 w-1/3 rounded bg-muted/40" />
            <span className="mt-2 text-[10px] text-muted-foreground/50">{component.name}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
          <button
            onClick={onPreview}
            className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>

      {/* Bottom info */}
      <div className="flex flex-col gap-1.5 border-t border-border/20 bg-card p-3">
        <span
          className={`w-fit rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}
        >
          {component.category.name}
        </span>
        <h3 className="text-sm font-semibold leading-tight">{component.name}</h3>
      </div>
    </div>
  )
}
```

- [ ] Commit:
```bash
git add src/components/library/ComponentCard.tsx
git commit -m "feat: add ComponentCard with hover overlay"
```

---

### Task 5: Rewrite `ComponentGrid`

**Files:**
- Modify: `src/components/library/ComponentGrid.tsx`

- [ ] Rewrite ComponentGrid. It now: reads search + tag state from `useSearchStore`, derives available tags from the components prop, renders tag filter pills, filters the component list, renders `ComponentCard` per item, and holds modal open state:

```tsx
"use client"

import { useMemo, useState } from "react"
import { useSearchStore } from "@/store/useSearchStore"
import { useStackStore } from "@/store/useStackStore"
import { ComponentCard } from "@/components/library/ComponentCard"
import { PreviewModal } from "@/components/library/PreviewModal"
import { getBadgeClass } from "@/lib/utils"
import type { ComponentGridItem } from "@/lib/types"

export type { ComponentGridItem }

interface ComponentGridProps {
  components: ComponentGridItem[]
}

export function ComponentGrid({ components }: ComponentGridProps) {
  const { query, activeTags, toggleTag, clearTags } = useSearchStore()
  const { addItem } = useStackStore()
  const [previewComponent, setPreviewComponent] = useState<ComponentGridItem | null>(null)

  // Derive unique tags from all components
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    components.forEach((c) => c.tags?.forEach((t) => tagSet.add(t.tag.name)))
    return Array.from(tagSet).sort()
  }, [components])

  // Filter by search query and active tags (OR logic for tags)
  const filtered = useMemo(() => {
    let result = components

    if (query.trim()) {
      const q = query.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.category.name.toLowerCase().includes(q)
      )
    }

    if (activeTags.length > 0) {
      result = result.filter((c) =>
        c.tags?.some((t) => activeTags.includes(t.tag.name))
      )
    }

    return result
  }, [components, query, activeTags])

  return (
    <div>
      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            onClick={clearTags}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeTags.length === 0
                ? "bg-indigo-600 text-white"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeTags.includes(tag)
                  ? "bg-indigo-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
          No components found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((component) => {
            const primaryVariant = component.variants[0]
            const badgeClass = getBadgeClass(component.category.slug)
            return (
              <ComponentCard
                key={component.id}
                component={component}
                onAdd={() =>
                  addItem({
                    componentId: component.id,
                    name: component.name,
                    type: component.category.name,
                    categorySlug: component.category.slug,
                    variantId: primaryVariant?.id,
                    color: badgeClass,
                  })
                }
                onPreview={() => setPreviewComponent(component)}
              />
            )
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewComponent && (
        <PreviewModal
          component={previewComponent}
          onClose={() => setPreviewComponent(null)}
          onAdd={(component) => {
            const primaryVariant = component.variants[0]
            const badgeClass = getBadgeClass(component.category.slug)
            addItem({
              componentId: component.id,
              name: component.name,
              type: component.category.name,
              categorySlug: component.category.slug,
              variantId: primaryVariant?.id,
              color: badgeClass,
            })
          }}
        />
      )}
    </div>
  )
}
```

- [ ] Commit:
```bash
git add src/components/library/ComponentGrid.tsx
git commit -m "feat: rewrite ComponentGrid with search/tag filtering and card extraction"
```

---

## Chunk 3: Live Preview & Modal

### Task 6: Install Sandpack

**Files:** `package.json`, `package-lock.json`

- [ ] Install the Sandpack package:
```bash
npm install @codesandbox/sandpack-react
```

- [ ] Commit:
```bash
git add package.json package-lock.json
git commit -m "feat: install @codesandbox/sandpack-react for live component preview"
```

---

### Task 7: Create `LivePreview`

**Files:**
- Create: `src/components/library/LivePreview.tsx`

- [ ] Create the Sandpack wrapper. Uses `SandpackProvider` + `SandpackPreview` (preview-only, no editor). Uses `customSetup.dependencies` to include Tailwind — **do not use a CDN `index.html` override**, as `SandpackProvider` with `react-ts` template does not reliably honor `/public/index.html`. Ensures the code has a default export:

```tsx
'use client'

import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react'

interface LivePreviewProps {
    code: string
    language?: string
}

function ensureDefaultExport(code: string): string {
    if (/export\s+default/.test(code)) return code
    return `export default function Preview() {\n  return (\n    <>\n${code}\n    </>\n  )\n}`
}

export function LivePreview({ code }: LivePreviewProps) {
    const wrappedCode = ensureDefaultExport(code)

    return (
        <SandpackProvider
            template="react-ts"
            theme="dark"
            files={{ '/App.tsx': wrappedCode }}
            customSetup={{
                dependencies: { tailwindcss: 'latest' },
            }}
            options={{ autorun: true }}
        >
            <SandpackPreview
                style={{ height: '360px', borderRadius: '8px' }}
                showNavigator={false}
                showOpenInCodeSandbox={false}
                showRefreshButton
            />
        </SandpackProvider>
    )
}
```

- [ ] Commit:
```bash
git add src/components/library/LivePreview.tsx
git commit -m "feat: add LivePreview component using Sandpack (preview-only, Tailwind via customSetup)"
```

---

### Task 8: Create `PreviewModal`

**Files:**
- Create: `src/components/library/PreviewModal.tsx`

- [ ] Create the tabbed preview modal. Tabs: Preview (Sandpack) / Code / Prompt Fragment. Variant switcher if multiple variants. Copy button on Code and Prompt tabs. Keyboard Escape to close:

```tsx
"use client"

import { useEffect, useState } from "react"
import { X, Plus, Copy, Check } from "lucide-react"
import dynamic from "next/dynamic"
import Image from "next/image"
import type { ComponentGridItem } from "@/lib/types"
import { getBadgeClass } from "@/lib/utils"

// Lazy-load Sandpack to keep initial bundle small
const LivePreview = dynamic(
  () => import("@/components/library/LivePreview").then((m) => m.LivePreview),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[360px] items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
        Loading preview...
      </div>
    ),
  }
)

type Tab = "preview" | "code" | "prompt"

interface PreviewModalProps {
  component: ComponentGridItem
  onClose: () => void
  onAdd: (component: ComponentGridItem) => void
}

export function PreviewModal({ component, onClose, onAdd }: PreviewModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("preview")
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const variant = component.variants[activeVariantIndex]
  const badgeClass = getBadgeClass(component.category.slug)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold">{component.name}</h2>
            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeClass}`}>
              {component.category.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAdd(component)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500"
            >
              <Plus className="h-3.5 w-3.5" />
              Add to Stack
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Variant switcher */}
        {component.variants.length > 1 && (
          <div className="flex gap-1 border-b border-border/40 px-5 py-2">
            {component.variants.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setActiveVariantIndex(i)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  i === activeVariantIndex
                    ? "bg-indigo-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border/40">
          {(["preview", "code", "prompt"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-indigo-500 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "prompt" ? "Prompt Fragment" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {activeTab === "preview" && (
            <div>
              {variant?.codeSnippet?.code ? (
                <LivePreview
                  code={variant.codeSnippet.code}
                  language={variant.codeSnippet.language}
                />
              ) : variant?.previewImage ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border/50">
                  <Image
                    src={variant.previewImage}
                    alt={component.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-[360px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                  No preview available for this variant.
                </div>
              )}
            </div>
          )}

          {activeTab === "code" && (
            <div className="relative">
              <div className="absolute right-3 top-3 flex items-center gap-2">
                {variant?.codeSnippet?.language && (
                  <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase text-muted-foreground">
                    {variant.codeSnippet.language}
                  </span>
                )}
                <button
                  onClick={() => copyText(variant?.codeSnippet?.code ?? "")}
                  className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              {variant?.codeSnippet?.code ? (
                <pre className="max-h-[360px] overflow-auto rounded-lg border border-border/50 bg-muted/30 p-4 pt-10 text-xs text-foreground/80">
                  {variant.codeSnippet.code}
                </pre>
              ) : (
                <div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                  No code snippet available.
                </div>
              )}
            </div>
          )}

          {activeTab === "prompt" && (
            <div className="relative">
              <button
                onClick={() => copyText(variant?.promptFragment ?? "")}
                className="absolute right-3 top-3 flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              {variant?.promptFragment ? (
                <pre className="max-h-[360px] overflow-auto rounded-lg border border-border/50 bg-muted/30 p-4 pt-10 font-mono text-xs text-foreground/80 whitespace-pre-wrap">
                  {variant.promptFragment}
                </pre>
              ) : (
                <div className="flex h-[180px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-sm text-muted-foreground">
                  No prompt fragment available.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tags */}
        {component.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-border/40 px-5 py-3">
            {component.tags.map((t) => (
              <span
                key={t.tag.id}
                className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] text-muted-foreground"
              >
                {t.tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] Commit:
```bash
git add src/components/library/PreviewModal.tsx
git commit -m "feat: add PreviewModal with live Sandpack preview, code, and prompt tabs"
```

---

## Chunk 4: Navbar Search

### Task 9: Update Navbar to wire search

**Files:**
- Modify: `src/components/layout/Navbar.tsx`

- [ ] Add `"use client"` directive, import `useSearchStore`, wire the Input's `value` and `onChange` to the store's `query` and `setQuery`. **Remove the decorative Generate Prompt button** from the Navbar — this is intentional. The spec's Section 3 layout diagram shows it in the Navbar, but Section 8 is authoritative: the real Generate Prompt button lives in the StackPanel with the actual inference logic. The Navbar button was non-functional and is removed to avoid user confusion:

```tsx
"use client"

import Link from "next/link"
import { Search, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useSearchStore } from "@/store/useSearchStore"

export function Navbar() {
  const { query, setQuery } = useSearchStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">UIForge</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search UI patterns..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 md:w-[300px] lg:w-[400px] pl-9 bg-muted/50 border-transparent focus-visible:bg-background"
              />
            </div>
          </div>
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Avatar className="h-8 w-8">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
```

- [ ] Commit:
```bash
git add src/components/layout/Navbar.tsx
git commit -m "feat: wire Navbar search to useSearchStore for live filtering"
```

---

## Chunk 5: Final Polish & Deploy

### Task 10: Stack panel — verify empty state

**Files:**
- Read: `src/components/stack/StackPanel.tsx` (lines 196–199)

- [ ] The StackPanel already has an empty state at line 197. Use an exact find-and-replace matching the file's 4-space indentation:

Find this exact text (4-space indent, verbatim):
```
                                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg">
                                        Stack is empty. Add components from the library.
                                    </div>
```

Replace with:
```
                                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg">
                                        Add components to build your stack.
                                    </div>
```

- [ ] Commit:
```bash
git add src/components/stack/StackPanel.tsx
git commit -m "fix: update stack panel empty state copy"
```

---

### Task 11: TypeScript check + push

- [ ] Run a local TypeScript check to catch any errors before pushing:
```bash
npx tsc --noEmit
```
Fix any errors found. Common issues to watch for:
- Missing imports from the old `ComponentGrid.tsx` type export (now in `types.ts`)
- Sandpack types (install `@types` if needed — they're bundled with the package)

- [ ] Push to trigger Vercel build:
```bash
git push
```

- [ ] Verify in Vercel dashboard that the build passes with no TypeScript errors.

---

## Acceptance Checklist

Run through these manually after deploy:

- [ ] Component cards render with image or placeholder, name badge
- [ ] Hovering a card shows Add + Preview buttons
- [ ] Clicking Add adds item to stack panel
- [ ] Clicking Preview opens the modal
- [ ] Modal Preview tab renders the component live in Sandpack iframe
- [ ] Interacting with the rendered component works (hover effects, etc.)
- [ ] Falls back to static image / placeholder if no code snippet
- [ ] Modal Code tab shows code with copy button
- [ ] Modal Prompt tab shows prompt fragment with copy button
- [ ] Multiple variants show variant switcher pills
- [ ] Escape key closes modal
- [ ] Navbar search filters cards in real time
- [ ] Tag pills filter by OR logic; All clears filters
- [ ] Stack panel shows empty state when empty
- [ ] Generate Prompt button works in stack panel
- [ ] Grid is 3 columns on desktop, 2 on tablet, 1 on mobile
- [ ] No TypeScript errors; Vercel build passes
