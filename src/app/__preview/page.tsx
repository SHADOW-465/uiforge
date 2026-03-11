import Preview from "@/ingest-preview/Preview"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-[#0b0f14] text-slate-100">
      <Preview />
    </div>
  )
}
