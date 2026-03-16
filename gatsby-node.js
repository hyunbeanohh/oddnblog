/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 */

const path = require("path")
const fs = require("fs")

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

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions
  createTypes(`
    type MdxFrontmatter {
      title: String
      date: Date @dateformat
      description: String
      tags: [String]
      author: String
      thumbnail: File @fileByRelativePath
      draft: Boolean
    }
  `)
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const blogPostTemplate = path.resolve("./src/templates/blog-post.tsx")

  const result = await graphql(`
    query {
      allMdx {
        nodes {
          id
          internal {
            contentFilePath
          }
          frontmatter {
            draft
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

  result.data.allMdx.nodes.forEach(node => {
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
