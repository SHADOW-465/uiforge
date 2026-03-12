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
