export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default function SavedPage() {
  return (
    <div className="mx-auto w-full min-w-0 pb-10">
      <div className="mb-6 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Saved Items</h1>
        <p className="text-muted-foreground">
          Your saved components will appear here.
        </p>
      </div>
      <p className="text-muted-foreground text-sm">No saved items yet.</p>
    </div>
  )
}
