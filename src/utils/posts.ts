export const CATEGORY_DEFINITIONS = [
  { name: "Engineering", slug: "engineering" },
  { name: "Design", slug: "design" },
  { name: "Product", slug: "product" },
  { name: "일상", slug: "daily" },
  { name: "블로그", slug: "blog" },
] as const

export type CategoryName = (typeof CATEGORY_DEFINITIONS)[number]["name"]

export const categoryStyle: Record<string, string> = {
  Engineering: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
  Design: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
  Product: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400",
  일상: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
  블로그: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
}

export const badgeClass = (tag: string) =>
  `text-xs px-3 py-1 rounded-full font-medium ${
    categoryStyle[tag] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
  }`

export interface PostSlugNode {
  parent?: { name?: string; relativeDirectory?: string } | null
  frontmatter: {
    draft?: boolean
  }
}

export const getPostSlug = (post: PostSlugNode) => {
  const dir = post.parent?.relativeDirectory
  const base = post.frontmatter.draft ? "draft" : "blog"
  return dir ? `/${base}/${dir}` : post.parent?.name ? `/${base}/${post.parent.name}` : "/"
}

export const getCategorySlug = (categoryName: string) =>
  CATEGORY_DEFINITIONS.find(category => category.name === categoryName)?.slug ?? slugifyCategory(categoryName)

export const getCategoryNameFromSlug = (slug: string) =>
  CATEGORY_DEFINITIONS.find(category => category.slug === slug)?.name ?? null

const slugifyCategory = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")

export const buildPaginatedPath = (basePath: string, pageNumber: number) =>
  pageNumber <= 1 ? basePath : `${basePath}/page/${pageNumber}`
