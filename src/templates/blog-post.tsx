import * as React from "react"
import { graphql, Link } from "gatsby"
import { GatsbyImage, getImage, IGatsbyImageData } from "gatsby-plugin-image"

import Layout from "../components/layout"
import Seo from "../components/seo"
import Comments from "../components/comments"

const SOCIAL_LINKS = {
  github: "https://github.com/hyunbeanohh",
  portfolio: "https://exultant-fuel-232.notion.site/8a98b3b88c4c46b69305ea48e9ba9c26",
  linkedin: "https://www.linkedin.com/in/dev-bean",
}

/* ── Category badge color map ──────────────────────── */
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

/* ── Profile Popover ───────────────────────────────── */
const ProfilePopover = ({ onClose }: { onClose: () => void }) => {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <>
      {/* 투명 클릭 배경 */}
      <div onClick={onClose} className="fixed inset-0 z-[99]" />

      {/* 팝오버 카드 */}
      <div className="absolute bottom-[calc(100%+12px)] left-0 z-[100] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl py-3 px-5 min-w-[280px] whitespace-nowrap">
        {/* 아래 화살표 */}
        <div className="absolute -bottom-[7px] left-[18px] w-3 h-3 bg-white dark:bg-gray-900 border-b border-r border-gray-200 dark:border-gray-700 rotate-45" />

        {/* 프로필 이미지 + 이름 + 소셜 아이콘 */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/profile.jpeg"
              alt="프로필"
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <p className="m-0 font-bold text-[0.9375rem] text-gray-900 dark:text-gray-100">
              오또니
            </p>
          </div>

          <div className="flex gap-1.5 shrink-0">
            {/* GitHub */}
            <a
              href={SOCIAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              title="GitHub"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-[#24292e] hover:text-white transition-all duration-150 hover:scale-110"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23A11.52 11.52 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>

            {/* Portfolio */}
            <a
              href={SOCIAL_LINKS.portfolio || "#"}
              target="_blank"
              rel="noopener noreferrer"
              title="Portfolio"
              className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-500 hover:text-white transition-all duration-150 hover:scale-110 ${!SOCIAL_LINKS.portfolio ? "opacity-35 pointer-events-none" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </a>

            {/* LinkedIn */}
            <a
              href={SOCIAL_LINKS.linkedin || "#"}
              target="_blank"
              rel="noopener noreferrer"
              title="LinkedIn"
              className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-[#0a66c2] hover:text-white transition-all duration-150 hover:scale-110 ${!SOCIAL_LINKS.linkedin ? "opacity-35 pointer-events-none" : ""}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

/* ── Blog post template ────────────────────────────── */
interface ThumbnailNode {
  childImageSharp: {
    gatsbyImageData: IGatsbyImageData
  }
}

interface BlogPostData {
  mdx: {
    frontmatter: {
      title?: string
      date?: string
      dateRaw?: string
      description?: string
      tags?: string[]
      author?: string
      thumbnail?: ThumbnailNode
      draft?: boolean
    }
  }
}

interface BlogPostProps {
  data: BlogPostData
  children: React.ReactNode
  location: { search?: string }
  pageContext: { isDraft?: boolean }
}

/* ── Draft thumbnail placeholder ───────────────────── */
const DraftThumbnail = ({ className }: { className?: string }) => (
  <div
    className={`bg-gradient-to-br from-slate-400 to-slate-700 dark:from-slate-600 dark:to-slate-900 flex items-center justify-center ${className ?? ""}`}
  >
    <div className="text-center select-none pointer-events-none">
      <svg
        width="36"
        height="36"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mx-auto mb-2 opacity-40"
      >
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      <span className="text-white/50 text-xs font-bold tracking-[0.2em] uppercase">
        Draft
      </span>
    </div>
  </div>
)

const BlogPost = ({ data, children, location, pageContext }: BlogPostProps) => {
  const { title, date, description, tags, author, thumbnail } = data.mdx.frontmatter
  const { isDraft } = pageContext
  const [popoverOpen, setPopoverOpen] = React.useState(false)

  return (
    <Layout location={location}>
      <div className="py-10">
        <div className="max-w-2xl mx-auto">
          {/* Back link */}
          <Link
            to={isDraft ? "/draft" : "/"}
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-10 transition-colors group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">←</span>
            목록으로 돌아가기
          </Link>

          {/* Draft banner */}
          {isDraft && (
            <div className="mb-6 px-4 py-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2.5">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-amber-500 shrink-0"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                임시 저장된 글입니다. 관리자만 볼 수 있습니다.
              </span>
            </div>
          )}

          {/* Header */}
          <header className="mb-10 pb-8 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {isDraft && (
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 tracking-wide">
                  DRAFT
                </span>
              )}
              {tags?.map(tag => (
                <span key={tag} className={badgeClass(tag)}>
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-3 tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-4">
                {description}
              </p>
            )}

            {/* Author info */}
            <div className="flex items-center gap-3 mt-4">
              <div className="relative shrink-0">
                {popoverOpen && <ProfilePopover onClose={() => setPopoverOpen(false)} />}
                <button
                  onClick={() => setPopoverOpen(prev => !prev)}
                  className="bg-transparent border-0 p-0 cursor-pointer rounded-full transition-all duration-150 hover:scale-105 hover:opacity-85"
                  title="프로필 보기"
                >
                  <img
                    src="/profile.jpeg"
                    alt="프로필"
                    className="w-11 h-11 rounded-full object-cover block"
                  />
                </button>
              </div>
              <div>
                <p className="m-0 font-semibold text-[0.9375rem] text-gray-900 dark:text-gray-100">
                  {author || "오또니"}
                </p>
                {date && (
                  <p className="m-0 text-[0.8125rem] text-gray-400 dark:text-gray-500">
                    {date}
                  </p>
                )}
              </div>
            </div>
          </header>

          {/* Thumbnail */}
          {isDraft ? (
            <DraftThumbnail className="w-full rounded-2xl mb-10 h-72" />
          ) : thumbnail && (() => {
            const img = getImage(thumbnail.childImageSharp.gatsbyImageData)
            return img ? (
              <GatsbyImage
                image={img}
                alt={title ?? ""}
                className="w-full rounded-2xl mb-10 max-h-80"
              />
            ) : null
          })()}

          {/* MDX Content */}
          <div className="prose prose-gray max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:text-purple-700 dark:prose-code:text-purple-300 prose-code:bg-purple-50 dark:prose-code:bg-purple-950/30 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-pre:bg-gray-900 prose-blockquote:border-purple-300 dark:prose-blockquote:border-purple-700">
            {children}
          </div>

          <hr className="my-14 border-gray-100 dark:border-gray-800" />

          <Comments />
        </div>
      </div>
    </Layout>
  )
}

export const Head = ({
  data,
  location,
}: {
  data: BlogPostData
  location: { pathname: string }
}) => {
  const { title, description, dateRaw, author } = data.mdx.frontmatter

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description,
    datePublished: dateRaw,
    author: {
      "@type": "Person",
      name: author || "오또니",
      url: "https://oddn.ai.kr",
    },
    url: `https://oddn.ai.kr${location.pathname}`,
    image: "https://oddn.ai.kr/profile.jpeg",
    publisher: {
      "@type": "Person",
      name: "오또니",
      url: "https://oddn.ai.kr",
    },
  }

  return (
    <Seo
      title={title ?? ""}
      description={description}
      pathname={location.pathname}
      type="article"
    >
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Seo>
  )
}

export const query = graphql`
  query BlogPost($id: String!) {
    mdx(id: { eq: $id }) {
      frontmatter {
        title
        date(formatString: "YYYY년 M월 D일")
        dateRaw: date
        description
        tags
        author
        draft
        thumbnail {
          childImageSharp {
            gatsbyImageData(width: 800, placeholder: BLURRED, formats: [AUTO, WEBP, AVIF])
          }
        }
      }
    }
  }
`

export default BlogPost
