import { create } from 'zustand'

export type StackComponent = {
    id: string; // Unique ID for the stack entry (needed for dragging)
    componentId: string; // Original component DB ID
    name: string;
    type: string;
    categorySlug: string;
    variantId?: string;
    color?: string; // Cosmetic for the UI MVP
}

interface StackState {
    items: StackComponent[];
    addItem: (item: Omit<StackComponent, 'id'>) => void;
    removeItem: (id: string) => void;
    reorderItems: (startIndex: number, endIndex: number) => void;
    clearStack: () => void;
}

export const useStackStore = create<StackState>((set) => ({
    items: [],

    addItem: (item) => set((state) => ({
        items: [...state.items, { ...item, id: `stack_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }]
    })),

    removeItem: (id) => set((state) => ({
        items: state.items.filter((item) => item.id !== id)
    })),

    reorderItems: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.items);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { items: result };
    }),

    clearStack: () => set({ items: [] }),
}))
