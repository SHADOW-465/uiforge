"use server"

import { prisma } from "@/lib/db";

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function getCategoryBySlug(slug: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug }
    });
    return category;
  } catch (error) {
    console.error(`Failed to fetch category ${slug}:`, error);
    return null;
  }
}

export async function getComponents(categoryId?: string) {
  try {
    const whereClause = categoryId ? { categoryId } : undefined;

    const components = await prisma.component.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          select: {
            id: true,
            name: true,
            previewImage: true,
            promptFragment: true,
            codeSnippet: {
              select: {
                language: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' }
    });
    return components;
  } catch (error) {
    console.error("Failed to fetch components:", error);
    return [];
  }
}
