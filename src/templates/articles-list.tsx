import * as React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import PostListSection from "../components/post-list-section"
import Seo from "../components/seo"
import { ArticleListPost } from "../components/article-card"
import { isVisibleInPublicLists } from "../utils/posts"

interface ArticlesListData {
  allMdx?: {
    nodes: ArticleListPost[]
  }
}

interface ArticlesListPageProps {
  data: ArticlesListData
  location: { pathname: string }
  pageContext: {
    currentPage: number
    totalPages: number
    basePath: string
    totalCount: number
    skip: number
    limit: number
  }
}

const ArticlesListTemplate = ({ data, location, pageContext }: ArticlesListPageProps) => {
  const allPosts = data?.allMdx?.nodes ?? []
  const { currentPage, totalPages, basePath, totalCount, skip, limit } = pageContext
  const posts = allPosts.filter(isVisibleInPublicLists).slice(skip, skip + limit)
  const _title = currentPage > 1 ? `전체 아티클 - ${currentPage}페이지` : "전체 아티클"

  return (
    <Layout location={location}>
      <div className="py-14">
        <PostListSection
          title="전체 아티클"
          description="최신순으로 정리한 공개 글 목록입니다."
          countLabel={`${totalCount}개의 글`}
          posts={posts}
          emptyMessage="아직 작성된 글이 없습니다."
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
  pageContext: ArticlesListPageProps["pageContext"]
}) => {
  const title = pageContext.currentPage > 1 ? `전체 아티클 - ${pageContext.currentPage}페이지` : "전체 아티클"
  return <Seo title={title} pathname={location.pathname} />
}

export const query = graphql`
  query ArticlesListTemplate {
    allMdx(sort: { frontmatter: { date: DESC } }) {
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

export default ArticlesListTemplate
