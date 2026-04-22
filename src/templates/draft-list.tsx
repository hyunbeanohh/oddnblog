import * as React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import PostListSection from "../components/post-list-section"
import Seo from "../components/seo"
import { ArticleListPost } from "../components/article-card"

interface DraftListData {
  allMdx?: {
    nodes: ArticleListPost[]
  }
}

interface DraftListPageProps {
  data: DraftListData
  location: { pathname: string }
  pageContext: {
    currentPage: number
    totalPages: number
    basePath: string
    totalCount: number
  }
}

const DraftListTemplate = ({ data, location, pageContext }: DraftListPageProps) => {
  const posts = data?.allMdx?.nodes ?? []
  const { currentPage, totalPages, basePath, totalCount } = pageContext

  return (
    <Layout location={location}>
      <div className="py-14">
        <PostListSection
          title="임시 글 목록"
          description="임시 저장 상태의 글 목록입니다."
          countLabel={`${totalCount}개`}
          posts={posts}
          emptyMessage="임시 저장된 글이 없습니다."
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
  pageContext: DraftListPageProps["pageContext"]
}) => {
  const title = pageContext.currentPage > 1 ? `임시 글 목록 - ${pageContext.currentPage}페이지` : "임시 글 목록"
  return <Seo title={title} pathname={location.pathname} robots="noindex,nofollow" />
}

export const query = graphql`
  query DraftListTemplate($skip: Int!, $limit: Int!) {
    allMdx(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { draft: { eq: true } } }
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

export default DraftListTemplate
