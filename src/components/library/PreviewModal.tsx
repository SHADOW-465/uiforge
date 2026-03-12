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
  const [copied, setCopied] = useState<string | null>(null)

  const variant = component.variants[activeVariantIndex]
  const badgeClass = getBadgeClass(component.category.slug)

  useEffect(() => {
    setActiveVariantIndex(0)
  }, [component.id])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [onClose])

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // clipboard write failed silently
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div role="dialog" aria-modal="true" aria-labelledby="preview-modal-title" className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
          <div className="flex items-center gap-3">
            <h2 id="preview-modal-title" className="text-base font-semibold">{component.name}</h2>
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
              aria-label="Close"
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
        <div role="tablist" className="flex border-b border-border/40">
          {(["preview", "code", "prompt"] as Tab[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
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
                  onClick={() => copyText(variant?.codeSnippet?.code ?? "", 'code')}
                  className="flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  {copied === 'code' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copied === 'code' ? "Copied!" : "Copy"}
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
                onClick={() => copyText(variant?.promptFragment ?? "", 'prompt')}
                className="absolute right-3 top-3 flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                {copied === 'prompt' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                {copied === 'prompt' ? "Copied!" : "Copy"}
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
