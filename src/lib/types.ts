export interface ComponentGridItem {
  id: string
  name: string
  description: string | null
  category: {
    id: string
    name: string
    slug: string
  }
  variants: Array<{
    id: string
    name: string
    previewImage: string | null
    promptFragment: string | null
    codeSnippet: {
      language: string
      code: string
    } | null
  }>
  tags: Array<{
    tag: {
      id: string
      name: string
    }
  }>
}
