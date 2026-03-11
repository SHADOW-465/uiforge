"use client"

import { useEffect, useMemo, useState } from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Layers, Copy, Download, Sparkles, GripVertical, Trash2, Code, FileText, Check, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { useStackStore } from "@/store/useStackStore"

type Provider = "anthropic" | "groq" | "openrouter"

type ModelOption = {
    id: string
    label: string
    provider: Provider
    model: string
    isFree: boolean
}

const MODEL_OPTIONS: ModelOption[] = [
    {
        id: "groq:llama-3.1-8b-instant",
        label: "Groq • Llama 3.1 8B Instant (fast, free-tier)",
        provider: "groq",
        model: "llama-3.1-8b-instant",
        isFree: true,
    },
    {
        id: "openrouter:meta-llama/llama-3.1-8b-instruct:free",
        label: "OpenRouter • Llama 3.1 8B Instruct (free)",
        provider: "openrouter",
        model: "meta-llama/llama-3.1-8b-instruct:free",
        isFree: true,
    },
    {
        id: "anthropic:claude-3-5-sonnet-latest",
        label: "Anthropic • Claude 3.5 Sonnet",
        provider: "anthropic",
        model: "claude-3-5-sonnet-latest",
        isFree: false,
    },
]

const DEFAULT_MODEL_ID = MODEL_OPTIONS.find((option) => option.isFree)?.id ?? MODEL_OPTIONS[0].id

export function StackPanel() {
    const { items, removeItem, reorderItems } = useStackStore()
    const [mounted, setMounted] = useState(false)
    const [isCopied, setIsCopied] = useState(false)
    const [promptOutput, setPromptOutput] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [errorCode, setErrorCode] = useState<string | null>(null)
    const [modelId, setModelId] = useState(DEFAULT_MODEL_ID)

    const selectedModel = useMemo(
        () => MODEL_OPTIONS.find((option) => option.id === modelId) ?? MODEL_OPTIONS[0],
        [modelId]
    )

    const lowCredits = useMemo(() => {
        if (!errorMessage) return false
        if (errorCode === "insufficient_credits") return true
        return errorMessage.toLowerCase().includes("credit balance is too low")
    }, [errorCode, errorMessage])

    // Avoid hydration mismatch for DND rendering
    useEffect(() => {
        setMounted(true)
    }, [])

    const stackDetails = useMemo(
        () => items.map((item, i) => `${i + 1}. [${item.type}] ${item.name}`).join("\n"),
        [items]
    )

    const buildBasePrompt = () => `You are an expert AI Frontend Engineer focusing on Next.js 14/16, Tailwind CSS v3, and shadcn/ui.
Build the following application interface matching a modern, premium dark-mode aesthetic with oklch variables and glassmorphism.

DESIGN SYSTEM:
- Framework: Next.js (App Router) + React Server Components
- Styling: Tailwind CSS
- Component Library: shadcn/ui + lucide-react + framer-motion

UI ARCHITECTURE STACK:
Implement the layout strictly adhering to the following component hierarchy top-to-bottom:

\`\`\`
${stackDetails}
\`\`\`

INSTRUCTIONS:
1. Do not use generic, default colors. Use the defined semantic variables (bg-background, text-foreground, primary).
2. Ensure strict TypeScript constraints.
3. Make it fully responsive taking a mobile-first approach.
4. Output the complete, exact code required to render this application state.`

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination) return
        reorderItems(result.source.index, result.destination.index)
    }

    const generatePrompt = async () => {
        const basePrompt = buildBasePrompt()
        setPromptOutput(basePrompt)
        setIsOpen(true)
        setIsCopied(false)
        setIsGenerating(true)
        setErrorMessage(null)
        setErrorCode(null)

        try {
            const response = await fetch("/api/inference", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: basePrompt,
                    provider: selectedModel.provider,
                    model: selectedModel.model,
                }),
            })

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}))
                setErrorMessage(errorBody?.error || "Inference request failed")
                setErrorCode(errorBody?.code || null)
                return
            }

            const data = await response.json()
            if (!data?.output) {
                throw new Error("Inference response was empty")
            }

            setPromptOutput(data.output)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Inference request failed"
            setErrorMessage(message)
            setErrorCode(message.toLowerCase().includes("credit balance is too low") ? "insufficient_credits" : null)
        } finally {
            setIsGenerating(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(promptOutput)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    if (!mounted) {
        return (
            <div className="flex flex-col h-full bg-background/50 animate-pulse p-4">
                <div className="h-6 w-32 bg-muted rounded mb-4"></div>
                <div className="flex-1 space-y-4">
                    {/* Skeleton loaders */}
                    <div className="h-16 bg-muted rounded"></div>
                    <div className="h-16 bg-muted rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full bg-background/50">
            <div className="flex items-center justify-between p-4 border-b border-border/40">
                <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-lg tracking-tight">UI Stack</h2>
                </div>
                <div className="text-xs font-medium bg-muted px-2 py-1 rounded-full text-muted-foreground">
                    {items.length} items
                </div>
            </div>

            <ScrollArea className="flex-1 p-4">
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="ui-stack">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="flex flex-col space-y-3 min-h-[100px]"
                            >
                                {items.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground text-sm border border-dashed rounded-lg">
                                        Stack is empty. Add components from the library.
                                    </div>
                                ) : (
                                    items.map((item, index) => (
                                        <Draggable key={item.id} draggableId={item.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`group relative flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-card transition-colors ${snapshot.isDragging ? "shadow-lg border-primary/50 opacity-90" : "hover:bg-muted/50"}`}
                                                >
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="flex items-center justify-center p-1 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100"
                                                    >
                                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-[10px] uppercase font-bold tracking-wider w-fit px-1.5 py-0.5 rounded border ${item.color || "bg-muted text-muted-foreground"} mb-1.5`}>
                                                            {item.type}
                                                        </div>
                                                        <h4 className="text-sm font-medium leading-none truncate mb-1 text-foreground/90">{item.name}</h4>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => removeItem(item.id)}
                                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))
                                )}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>

                <div className="mt-4 p-4 rounded-lg border border-dashed border-border flex flex-col items-center justify-center text-center text-muted-foreground cursor-pointer hover:bg-muted/30 hover:border-primary/50 transition-colors">
                    <div className="p-2 rounded-full bg-muted mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm font-medium">AI Suggestions</p>
                    <p className="text-xs mt-1">Let UIForge suggest components for your stack</p>
                </div>
            </ScrollArea>

            <div className="p-4 border-t border-border/40 bg-background/95 backdrop-blur backdrop-filter sticky bottom-0">
                <Separator className="mb-4" />

                <div className="mb-3 space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Preferred model</label>
                    <select
                        className="h-9 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
                        value={modelId}
                        onChange={(event) => setModelId(event.target.value)}
                    >
                        {MODEL_OPTIONS.map((option) => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger render={
                        <Button onClick={generatePrompt} disabled={items.length === 0 || isGenerating} className="w-full mb-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg shadow-primary/20">
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            {isGenerating ? "Generating..." : "Generate Prompt"}
                        </Button>
                    } />
                    <DialogContent className="sm:max-w-[700px] border-border/50 bg-background/95 backdrop-blur">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <FileText className="h-5 w-5 text-primary" />
                                Generated UI Architecture Prompt
                            </DialogTitle>
                            <DialogDescription>
                                Copy this structured prompt and paste it into Claude, ChatGPT, or your preferred AI coding agent.
                            </DialogDescription>
                        </DialogHeader>

                        {lowCredits ? (
                            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                                Claude is out of credits. Switch to a free model or add credits to your Anthropic account.
                            </div>
                        ) : null}

                        {errorMessage ? (
                            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                                Inference failed: {errorMessage}
                            </div>
                        ) : null}

                        <div className="relative mt-4">
                            <div className="absolute right-3 top-3 flex items-center gap-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={copyToClipboard}
                                    className="h-8 gap-1 shadow-sm border border-border/50 bg-background hover:bg-muted"
                                >
                                    {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                    {isCopied ? "Copied!" : "Copy prompt"}
                                </Button>
                            </div>
                            <pre className="p-4 rounded-md bg-muted/30 border border-border/50 text-xs sm:text-sm overflow-auto max-h-[400px] text-foreground/80 font-mono leading-relaxed whitespace-pre-wrap">
                                {promptOutput}
                            </pre>
                        </div>
                    </DialogContent>
                </Dialog>

                <div className="flex gap-2">
                    <Button disabled={items.length === 0} variant="outline" className="flex-1 bg-background text-xs">
                        <Code className="mr-2 h-3.5 w-3.5" />
                        Code
                    </Button>
                    <Button disabled={items.length === 0} variant="outline" className="flex-1 bg-background text-xs">
                        <Download className="mr-2 h-3.5 w-3.5" />
                        Export JSON
                    </Button>
                </div>
            </div>
        </div>
    )
}
