import { notFound } from "next/navigation"

import { getCategoryBySlug, getComponents } from "@/lib/actions"
import { ComponentGrid } from "@/components/library/ComponentGrid"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface CategoryPageProps {
  params: { slug: string }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const category = await getCategoryBySlug(params.slug)

  if (!category) {
    notFound()
  }

  const components = await getComponents(category.id)

  return (
    <div className="mx-auto w-full min-w-0 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
          <h1 className="text-3xl font-bold tracking-tight">{category.name}</h1>
          <p className="text-muted-foreground">
            {category.description || "Explore curated UI patterns in this category."}
          </p>
        </div>
      </div>

      <ComponentGrid components={components} />
    </div>
  )
}
