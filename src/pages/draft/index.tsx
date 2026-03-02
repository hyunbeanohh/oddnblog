import * as React from "react"
import { graphql, Link } from "gatsby"
import { GatsbyImage, getImage, IGatsbyImageData } from "gatsby-plugin-image"

import Layout from "../../components/layout"
import Seo from "../../components/seo"

interface ThumbnailNode {
  childImageSharp: {
    gatsbyImageData: IGatsbyImageData
  }
}

interface DraftPostNode {
  id: string
  parent?: { name?: string; relativeDirectory?: string } | null
  frontmatter: {
    title?: string
    date?: string
    description?: string
    tags?: string[]
    author?: string
    thumbnail?: ThumbnailNode
  }
  excerpt?: string
}

interface PageData {
  allMdx?: {
    nodes: DraftPostNode[]
  }
}

interface DraftIndexPageProps {
  data: PageData
  location: { search?: string; pathname: string }
}

/* ── Helpers ────────────────────────────────────────── */
const categoryStyle: Record<string, string> = {
  Engineering: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
  Design: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
  Product: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400",
  일상: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
  블로그: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400",
}

const badgeClass = (tag: string) =>
  `text-xs px-3 py-1 rounded-full font-medium ${
    categoryStyle[tag] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
  }`

const getDraftPostSlug = (post: DraftPostNode) => {
  const dir = post.parent?.relativeDirectory
  return dir ? `/draft/${dir}` : post.parent?.name ? `/draft/${post.parent.name}` : "/draft"
}

/* ── Draft thumbnail placeholder ───────────────────── */
const DraftThumbnail = () => (
  <div className="w-44 h-[120px] rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
    <div className="text-center select-none pointer-events-none">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto mb-1.5 text-slate-400 dark:text-slate-500"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold tracking-[0.2em] uppercase">
        Locked
      </span>
    </div>
  </div>
)

/* ── Draft Article Card ─────────────────────────────── */
const DraftArticleCard = ({ post }: { post: DraftPostNode }) => {
  const { title, date, description, tags, author, thumbnail } = post.frontmatter
  const tag = tags?.[0] ?? "일반"
  const slug = getDraftPostSlug(post)
  const img = thumbnail ? getImage(thumbnail.childImageSharp.gatsbyImageData) : null

  return (
    <article className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <Link
        to={slug}
        className="flex justify-between items-start gap-6 py-8 group -mx-4 px-4 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 tracking-wide">
              DRAFT
            </span>
            <span className={badgeClass(tag)}>{tag}</span>
            {author && (
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{author}</span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title ?? "제목 없음"}
          </h3>
          {(description || post.excerpt) && (
            <p className="text-sm text-gray-400 dark:text-gray-500 line-clamp-2 leading-relaxed">
              {description ?? post.excerpt}
            </p>
          )}
          {date && (
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-3 block">{date}</span>
          )}
        </div>
        {img ? (
          <div className="w-44 h-[120px] rounded-xl flex-shrink-0 overflow-hidden">
            <GatsbyImage
              image={img}
              alt={title ?? ""}
              className="w-full h-full"
              imgClassName="object-cover"
            />
          </div>
        ) : (
          <DraftThumbnail />
        )}
      </Link>
    </article>
  )
}

/* ── Page ───────────────────────────────────────────── */
const DraftIndexPage = ({ data, location }: DraftIndexPageProps) => {
  const posts = data?.allMdx?.nodes ?? []

  return (
    <Layout location={location}>
      <div className="py-14">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            임시 글 목록
          </h1>
          <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">
            {posts.length}개
          </span>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-10">
          관리자만 볼 수 있는 임시 저장 글입니다.
        </p>

        {posts.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              임시 저장된 글이 없습니다.
            </p>
          </div>
        ) : (
          <div className="rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {posts.map(post => (
              <DraftArticleCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export const Head = ({ location }: { location: { pathname: string } }) => (
  <Seo title="임시 글 목록" pathname={location.pathname} />
)

export const query = graphql`
  query DraftIndexQuery {
    allMdx(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { draft: { eq: true } } }
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
          thumbnail {
            childImageSharp {
              gatsbyImageData(width: 800, placeholder: BLURRED, layout: CONSTRAINED, formats: [AUTO, WEBP, AVIF])
            }
          }
        }
        excerpt(pruneLength: 120)
      }
    }
  }
`

export default DraftIndexPage
