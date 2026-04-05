import * as React from "react"
import { graphql } from "gatsby"

import Layout from "../components/layout"
import PostListSection from "../components/post-list-section"
import Seo from "../components/seo"
import { ArticleListPost } from "../components/article-card"

interface CategoryListData {
  allMdx?: {
    nodes: ArticleListPost[]
  }
}

interface CategoryListPageProps {
  data: CategoryListData
  location: { pathname: string }
  pageContext: {
    currentPage: number
    totalPages: number
    basePath: string
    totalCount: number
    categoryName: string
  }
}

const CategoryListTemplate = ({ data, location, pageContext }: CategoryListPageProps) => {
  const posts = data?.allMdx?.nodes ?? []
  const { currentPage, totalPages, basePath, totalCount, categoryName } = pageContext

  return (
    <Layout location={location}>
      <div className="py-14">
        <PostListSection
          title={categoryName}
          description={`${categoryName} 카테고리 글 목록입니다.`}
          countLabel={`${totalCount}개의 글`}
          posts={posts}
          emptyMessage="이 카테고리에는 아직 글이 없습니다."
          pagination={{ currentPage, totalPages, basePath }}
        />
      </div>
    </Layout>
  )
}

export const Head = ({
  location,
  pageContext,
}: {
  location: { pathname: string }
  pageContext: CategoryListPageProps["pageContext"]
}) => {
  const title =
    pageContext.currentPage > 1
      ? `${pageContext.categoryName} 글 목록 - ${pageContext.currentPage}페이지`
      : `${pageContext.categoryName} 글 목록`

  return <Seo title={title} pathname={location.pathname} />
}

export const query = graphql`
  query CategoryListTemplate($skip: Int!, $limit: Int!, $categoryName: String!) {
    allMdx(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { draft: { ne: true }, tags: { in: [$categoryName] } } }
      skip: $skip
      limit: $limit
    ) {
      nodes {
        id
        parent {
          ... on File {
            name
            relativeDirectory
          }
        }
        frontmatter {
          title
          date(formatString: "YYYY년 M월 D일")
          description
          tags
          author
          draft
          inProgress
          thumbnail {
            childImageSharp {
              gatsbyImageData(width: 480, placeholder: BLURRED, layout: CONSTRAINED, formats: [AUTO, WEBP, AVIF])
            }
          }
        }
        excerpt(pruneLength: 120)
      }
    }
  }
`

export default CategoryListTemplate
