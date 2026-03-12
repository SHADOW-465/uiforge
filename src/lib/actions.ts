"use server"

import { getSupabaseServerClient } from "@/lib/supabase-server"
import type { ComponentGridItem } from "@/lib/types"

export async function getCategories() {
  try {
    const { data, error } = await getSupabaseServerClient()
      .from('Category')
      .select('id, name, slug, description, createdAt, updatedAt')
      .order('name')
    if (error) throw error
    return data ?? []
  } catch (error) {
    console.error("Failed to fetch categories:", error)
    return []
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const { data, error } = await getSupabaseServerClient()
      .from('Category')
      .select('id, name, slug, description, createdAt, updatedAt')
      .eq('slug', slug)
      .single()
    if (error) throw error
    return data
  } catch (error) {
    console.error(`Failed to fetch category ${slug}:`, error)
    return null
  }
}

export async function getComponents(categoryId?: string) {
  try {
    let query = getSupabaseServerClient()
      .from('Component')
      .select(`
        id, name, description,
        category:Category( id, name, slug ),
        variants:ComponentVariant( id, name, previewImage, promptFragment,
          codeSnippet:CodeSnippet( language, code )
        ),
        tags:ComponentTag( tag:Tag( id, name ) )
      `)
      .order('name')

    if (categoryId) {
      query = query.eq('categoryId', categoryId)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as unknown as ComponentGridItem[]
  } catch (error) {
    console.error("Failed to fetch components:", error)
    return [] as ComponentGridItem[]
  }
}
