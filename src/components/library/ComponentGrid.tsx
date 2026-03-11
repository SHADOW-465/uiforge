"use client"

import Image from "next/image"
import { Plus, Eye, Code } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useStackStore } from "@/store/useStackStore"

export type ComponentGridItem = {
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
}

const CATEGORY_BADGES: Record<string, string> = {
  navigation: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  "hero-sections": "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
  "feature-sections": "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cards: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  layouts: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  components: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
  dashboards: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  animations: "bg-lime-500/10 text-lime-400 border-lime-500/30",
  "micro-interactions": "bg-teal-500/10 text-teal-400 border-teal-500/30",
  "visual-effects": "bg-rose-500/10 text-rose-400 border-rose-500/30",
}

function getBadgeClass(slug: string) {
  return CATEGORY_BADGES[slug] ?? "bg-muted text-muted-foreground border-border/60"
}

export function ComponentGrid({ components }: { components: ComponentGridItem[] }) {
  const { addItem } = useStackStore()

  if (!components.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-10 text-center text-sm text-muted-foreground">
        No components found yet. Try another category or seed the database.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {components.map((component) => {
        const primaryVariant = component.variants[0]
        const badgeClass = getBadgeClass(component.category.slug)

        return (
          <div
            key={component.id}
            className="group relative flex h-[320px] flex-col overflow-hidden rounded-xl border border-border/40 bg-card/40 transition-all hover:border-border/80 hover:bg-card hover:shadow-md"
          >
            <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden bg-muted/50 p-6 transition-colors group-hover:bg-muted/70">
              <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent to-background/5" />

              {primaryVariant?.previewImage ? (
                <div className="relative z-20 h-full w-full overflow-hidden rounded-lg border border-border shadow-sm transition-transform duration-500 group-hover:scale-105">
                  <Image
                    src={primaryVariant.previewImage}
                    alt={component.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="z-20 flex h-4/5 w-4/5 flex-col gap-2 rounded-lg border border-border bg-background p-3 opacity-90 shadow-sm transition-transform duration-500 group-hover:scale-105">
                  <div className="mb-2 h-4 w-full rounded-md bg-muted/60" />
                  <div className="h-3 w-2/3 rounded-md bg-muted/40" />
                  <div className="h-3 w-1/2 rounded-md bg-muted/40" />
                  <div className="mt-auto flex h-full items-center justify-center rounded-md border border-primary/10 bg-primary/5">
                    <span className="text-xs font-medium text-primary/40">Preview Region</span>
                  </div>
                </div>
              )}
            </div>

            <div className="relative z-30 border-t border-border/20 bg-card p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${badgeClass}`}>
                  {component.category.name}
                </span>
              </div>
              <h3 className="mb-1 text-sm font-semibold leading-tight">{component.name}</h3>
              <p className="mb-4 line-clamp-1 text-xs text-muted-foreground">
                {component.description || "A highly customizable pattern for modern interfaces."}
              </p>

              <div className="mt-auto flex items-center gap-2">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button className="h-8 w-full text-xs font-medium" variant="secondary">
                        <Eye className="mr-1 h-3 w-3" />
                        View Details
                      </Button>
                    }
                  />
                  <DialogContent className="sm:max-w-[720px] border-border/50 bg-background/95 backdrop-blur">
                    <DialogHeader>
                      <DialogTitle className="text-xl">{component.name}</DialogTitle>
                      <DialogDescription>
                        {component.description || "A curated UI pattern ready for composition."}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 md:grid-cols-[1.1fr_1fr]">
                      <div className="relative min-h-[180px] overflow-hidden rounded-lg border border-border/50 bg-muted/30">
                        {primaryVariant?.previewImage ? (
                          <Image
                            src={primaryVariant.previewImage}
                            alt={`${component.name} preview`}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                            Preview not available
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary Variant</p>
                          <p className="font-medium">{primaryVariant?.name || "Default"}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Prompt Fragment</p>
                          <p className="text-sm text-foreground/90">
                            {primaryVariant?.promptFragment || "No prompt fragment available yet."}
                          </p>
                        </div>
                      </div>
                    </div>

                    {primaryVariant?.codeSnippet?.code ? (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <Code className="h-3.5 w-3.5" />
                          Code Snippet
                        </div>
                        <pre className="max-h-[220px] overflow-auto rounded-md border border-border/50 bg-muted/30 p-3 text-xs text-foreground/80">
                          {primaryVariant.codeSnippet.code}
                        </pre>
                      </div>
                    ) : null}
                  </DialogContent>
                </Dialog>

                <Button
                  className="h-8 shrink-0 text-xs"
                  variant="outline"
                  onClick={() =>
                    addItem({
                      componentId: component.id,
                      name: component.name,
                      type: component.category.name,
                      categorySlug: component.category.slug,
                      variantId: primaryVariant?.id,
                      color: badgeClass,
                    })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
