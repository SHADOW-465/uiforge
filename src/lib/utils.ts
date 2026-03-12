import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
