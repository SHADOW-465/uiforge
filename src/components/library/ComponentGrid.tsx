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
