/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 */

const path = require("path")
const fs = require("fs")

const POSTS_PER_PAGE = 10
const CATEGORY_DEFINITIONS = [
  { name: "Engineering", slug: "engineering" },
  { name: "Design", slug: "design" },
  { name: "Product", slug: "product" },
  { name: "일상", slug: "daily" },
  { name: "블로그", slug: "blog" },
]

const estimateReadingMinutes = source => {
  if (!source) return 1

  const withoutFrontmatter = source.replace(/^---[\s\S]*?---\s*/, "")

  let codeCharCount = 0
  const withoutCodeBlocks = withoutFrontmatter.replace(/```[\s\S]*?```/g, match => {
    codeCharCount += match.length
    return " "
  })
  const withoutInlineCode = withoutCodeBlocks.replace(/`[^`\n]+`/g, match => {
    codeCharCount += match.length
    return " "
  })

  const prose = withoutInlineCode
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1")
    .replace(/<[^>]*>/g, " ")
    .replace(/[#>*_~\-|]/g, " ")

  const koreanCharCount = (prose.match(/[가-힣]/g) || []).length
  const latinWordCount = (prose.match(/[A-Za-z0-9]+/g) || []).length

  const minutes = koreanCharCount / 420 + latinWordCount / 220 + codeCharCount / 900

  return Math.max(1, Math.ceil(minutes))
}

const isVisibleInPublicLists = node =>
  node.frontmatter?.draft !== true || node.frontmatter?.inProgress === true

const shouldCreateDetailPage = node =>
  !(node.frontmatter?.draft === true && node.frontmatter?.inProgress === true)

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  createTypes(`
    type MdxReference {
      label: String
      url: String!
    }

    type MdxFrontmatter {
      title: String
      date: Date @dateformat
      description: String
      tags: [String]
      references: [MdxReference]
      author: String
      thumbnail: File @fileByRelativePath
      draft: Boolean
      inProgress: Boolean
    }
  `)
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const blogPostTemplate = path.resolve("./src/templates/blog-post.tsx")
  const articlesListTemplate = path.resolve("./src/templates/articles-list.tsx")
  const categoryListTemplate = path.resolve("./src/templates/category-list.tsx")
  const draftListTemplate = path.resolve("./src/templates/draft-list.tsx")

  const result = await graphql(`
    query {
      allMdx(sort: { frontmatter: { date: DESC } }) {
        nodes {
          id
          internal {
            contentFilePath
          }
          frontmatter {
            draft
            inProgress
            tags
          }
          parent {
            ... on File {
              name
              relativeDirectory
            }
          }
        }
      }
    }
  `)

  if (result.errors) {
    throw result.errors
  }

  const allNodes = result.data.allMdx.nodes
  const listedNodes = allNodes.filter(isVisibleInPublicLists)
  const publishedNodes = allNodes.filter(node => node.frontmatter?.draft !== true)
  const draftNodes = allNodes.filter(node => node.frontmatter?.draft === true)

  const createPaginatedPages = ({ items, template, basePath, extraContext = {} }) => {
    const totalPages = Math.max(1, Math.ceil(items.length / POSTS_PER_PAGE))

    Array.from({ length: totalPages }).forEach((_, index) => {
      const currentPage = index + 1

      createPage({
        path: currentPage === 1 ? basePath : `${basePath}/page/${currentPage}`,
        component: template,
        context: {
          limit: POSTS_PER_PAGE,
          skip: index * POSTS_PER_PAGE,
          currentPage,
          totalPages,
          totalCount: items.length,
          basePath,
          ...extraContext,
        },
      })
    })
  }

  createPaginatedPages({
    items: listedNodes,
    template: articlesListTemplate,
    basePath: "/articles",
  })

  const categories = new Map(CATEGORY_DEFINITIONS.map(category => [category.name, []]))
  listedNodes.forEach(node => {
    ;(node.frontmatter?.tags ?? []).forEach(tag => {
      if (!categories.has(tag)) {
        categories.set(tag, [])
      }
      categories.get(tag).push(node)
    })
  })

  categories.forEach((nodes, categoryName) => {
    const categorySlug =
      CATEGORY_DEFINITIONS.find(category => category.name === categoryName)?.slug ||
      String(categoryName)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")

    createPaginatedPages({
      items: nodes,
      template: categoryListTemplate,
      basePath: `/category/${categorySlug}`,
      extraContext: {
        categoryName,
        categorySlug,
      },
    })
  })

  createPaginatedPages({
    items: draftNodes,
    template: draftListTemplate,
    basePath: "/draft",
  })

  allNodes.forEach(node => {
    if (!shouldCreateDetailPage(node)) return

    const dir = node.parent.relativeDirectory
    const isDraft = node.frontmatter?.draft === true
    const basePath = isDraft ? "draft" : "blog"
    const slug = dir ? `/${basePath}/${dir}` : `/${basePath}/${node.parent.name}`
    let readingTime = 1

    try {
      const source = fs.readFileSync(node.internal.contentFilePath, "utf8")
      readingTime = estimateReadingMinutes(source)
    } catch (error) {
      readingTime = 1
    }

    createPage({
      path: slug,
      component: `${blogPostTemplate}?__contentFilePath=${node.internal.contentFilePath}`,
      context: {
        id: node.id,
        isDraft,
        readingTime,
      },
    })
  })
}
