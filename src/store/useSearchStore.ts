import { create } from 'zustand'

interface SearchState {
    query: string
    activeTags: string[]
    setQuery: (query: string) => void
    toggleTag: (tag: string) => void
    clearTags: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
    query: '',
    activeTags: [],
    setQuery: (query) => set({ query }),
    toggleTag: (tag) =>
        set((state) => ({
            activeTags: state.activeTags.includes(tag)
                ? state.activeTags.filter((t) => t !== tag)
                : [...state.activeTags, tag],
        })),
    clearTags: () => set({ activeTags: [] }),
}))
