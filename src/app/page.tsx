import { getComponents } from "@/lib/actions"
import { ComponentGrid } from "@/components/library/ComponentGrid"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default async function Home() {
  const components = await getComponents()

  return (
    <div className="mx-auto w-full min-w-0 pb-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">All Patterns</h1>
          <p className="text-muted-foreground">
            Browse and assemble building blocks for your next UI architecture.
          </p>
        </div>
      </div>

      <ComponentGrid components={components} />
    </div>
  )
}
