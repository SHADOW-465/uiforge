import * as React from "react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button-variants"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    categories?: { id: string; name: string; slug: string }[]
}

export function Sidebar({ className, categories = [] }: SidebarProps) {
    return (
        <div className={`pb-12 ${className}`}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        Discover
                    </h2>
                    <div className="space-y-1">
                        <Link
                            href="/"
                            className={buttonVariants({ variant: "secondary", className: "w-full justify-start" })}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2 h-4 w-4"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <polygon points="10 8 16 12 10 16 10 8" />
                            </svg>
                            All Patterns
                        </Link>
                        <Link
                            href="/saved"
                            className={buttonVariants({ variant: "ghost", className: "w-full justify-start" })}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="mr-2 h-4 w-4"
                            >
                                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
                            </svg>
                            Saved Items
                        </Link>
                    </div>
                </div>
                <div className="py-2">
                    <h2 className="relative px-7 text-lg font-semibold tracking-tight">
                        Categories
                    </h2>
                    <ScrollArea className="h-[300px] px-1 md:h-[calc(100vh-14rem)]">
                        <div className="space-y-1 p-2">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    href={`/category/${category.slug}`}
                                    className={buttonVariants({ variant: "ghost", className: "w-full justify-start font-normal text-muted-foreground hover:text-foreground" })}
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>
        </div>
    )
}
