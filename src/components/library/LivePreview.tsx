'use client'

import { SandpackProvider, SandpackPreview } from '@codesandbox/sandpack-react'

interface LivePreviewProps {
    code: string
    language?: string
}

function ensureDefaultExport(code: string): string {
    if (/export\s+default/.test(code)) return code
    return `export default function Preview() {\n  return (\n    <>\n${code}\n    </>\n  )\n}`
}

export function LivePreview({ code }: LivePreviewProps) {
    const wrappedCode = ensureDefaultExport(code)

    return (
        <SandpackProvider
            template="react-ts"
            theme="dark"
            files={{ '/App.tsx': wrappedCode }}
            customSetup={{
                dependencies: { tailwindcss: 'latest' },
            }}
            options={{ autorun: true }}
        >
            <SandpackPreview
                style={{ height: '360px', borderRadius: '8px' }}
                showNavigator={false}
                showOpenInCodeSandbox={false}
                showRefreshButton
            />
        </SandpackProvider>
    )
}
