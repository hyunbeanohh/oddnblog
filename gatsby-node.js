/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/
 */

const path = require("path")

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
    createPage({
      path: slug,
      component: `${blogPostTemplate}?__contentFilePath=${node.internal.contentFilePath}`,
      context: {
        id: node.id,
        isDraft,
      },
    })
  })
}
