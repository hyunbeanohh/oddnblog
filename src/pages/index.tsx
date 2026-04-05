import * as React from "react"
import { graphql, Link } from "gatsby"
import { GatsbyImage, getImage, IGatsbyImageData } from "gatsby-plugin-image"

import Layout from "../components/layout"
import Seo from "../components/seo"

interface ThumbnailNode {
  childImageSharp: {
    gatsbyImageData: IGatsbyImageData
  }
}

interface PostNode {
  id: string
  parent?: { name?: string; relativeDirectory?: string } | null
  frontmatter: {
    title?: string
    date?: string
    description?: string
    tags?: string[]
    author?: string
    thumbnail?: ThumbnailNode
    draft?: boolean
    inProgress?: boolean
  }
  excerpt?: string
}

interface PageData {
  allMdx?: {
    nodes: PostNode[]
  }
}

interface IndexPageProps {
  data: PageData
  location: { search?: string }
}

/* ── Helpers ───────────────────────────────────────── */
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

const getPostSlug = (post: PostNode) => {
  const dir = post.parent?.relativeDirectory
  const base = post.frontmatter.draft ? "draft" : "blog"
  return dir ? `/${base}/${dir}` : post.parent?.name ? `/${base}/${post.parent.name}` : "/"
}

const thumbnailGradient: Record<string, string> = {
  Engineering: "from-slate-700 to-slate-900",
  Design: "from-emerald-400 to-teal-600",
  Product: "from-orange-400 to-rose-500",
  일상: "from-violet-400 to-purple-600",
  블로그: "from-violet-400 to-purple-600",
}

const hasThumbnail = (post: PostNode) => Boolean(post.frontmatter.thumbnail?.childImageSharp)

/* ── Featured Hero Carousel ────────────────────────── */
const CAROUSEL_INTERVAL = 5000

const FeaturedHero = ({ posts }: { posts: PostNode[] }) => {
  const [current, setCurrent] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const total = posts.length

  React.useEffect(() => {
    if (total <= 1 || paused) return
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % total)
    }, CAROUSEL_INTERVAL)
    return () => clearInterval(timer)
  }, [total, paused])

  if (total === 0) return null

  return (
    <section
      className="mb-14"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 h-60 sm:h-72 hover:shadow-xl transition-shadow duration-300">
        {posts.map((post, i) => {
          const { title, description, tags, author, date, thumbnail } = post.frontmatter
          const tag = tags?.[0] ?? "일반"
          const slug = getPostSlug(post)
          const gradient = thumbnailGradient[tag] ?? "from-gray-500 to-gray-700"
          const img = thumbnail ? getImage(thumbnail.childImageSharp.gatsbyImageData) : null
          const isActive = i === current

          return (
            <div
              key={post.id}
              className={`absolute inset-0 transition-opacity duration-700 ${
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              }`}
              aria-hidden={!isActive}
            >
              <Link to={slug} className="group block w-full h-full">
                <div className={`relative w-full h-full ${!img ? `bg-gradient-to-br ${gradient}` : ""}`}>
                  {img ? (
                    <GatsbyImage
                      image={img}
                      alt={title ?? ""}
                      className="!absolute inset-0 w-full h-full group-hover:scale-[1.03] transition-transform duration-500"
                      imgClassName="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-6xl opacity-20 select-none">
                        {tag === "Engineering" ? "⚙️" : tag === "Design" ? "🎨" : "📄"}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-3">
                      <span className={badgeClass(tag)}>{tag}</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight line-clamp-2 group-hover:opacity-90 transition-opacity">
                      {title ?? "제목 없음"}
                    </h2>
                    {(description || post.excerpt) && (
                      <p className="text-sm text-white/70 mt-2 line-clamp-2 leading-relaxed">
                        {description ?? post.excerpt}
                      </p>
                    )}
                    {(author || date) && (
                      <div className="flex items-center gap-1.5 mt-3 text-white/55 text-xs">
                        {author && <span>{author}</span>}
                        {author && date && <span>·</span>}
                        {date && <span>{date}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          )
        })}

        {/* 이전/다음 버튼 */}
        {total > 1 && (
          <>
            <button
              onClick={() => setCurrent(c => (c - 1 + total) % total)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="이전 슬라이드"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => setCurrent(c => (c + 1) % total)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="다음 슬라이드"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}

        {/* 도트 인디케이터 */}
        {total > 1 && (
          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-1.5">
            {posts.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`슬라이드 ${i + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? "w-5 h-1.5 bg-white"
                    : "w-1.5 h-1.5 bg-white/45 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}

        {/* 자동 재생 프로그레스 바 */}
        {total > 1 && !paused && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px] z-20 bg-white/10">
            <div
              key={`${current}-progress`}
              className="h-full bg-white/50 hero-progress"
              style={{ animationDuration: `${CAROUSEL_INTERVAL}ms` }}
            />
          </div>
        )}
      </div>
    </section>
  )
}

/* ── Draft thumbnail placeholder ───────────────────── */
const DraftThumbnailPlaceholder = () => (
  <div className="w-44 h-[120px] rounded-xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
    <div className="text-center select-none pointer-events-none">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-1.5 text-slate-400 dark:text-slate-500">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span className="text-slate-400 dark:text-slate-500 text-[9px] font-bold tracking-[0.2em] uppercase">Locked</span>
    </div>
  </div>
)

/* ── Article card ──────────────────────────────────── */
const ArticleCard = ({ post }: { post: PostNode }) => {
  const { title, date, description, tags, author, thumbnail, draft, inProgress } = post.frontmatter
  const tag = tags?.[0] ?? "일반"
  const slug = getPostSlug(post)
  const img = thumbnail ? getImage(thumbnail.childImageSharp.gatsbyImageData) : null
  const cardClassName =
    "flex justify-between items-start gap-6 py-8 group -mx-4 px-4 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
  const inProgressBadgeClassName =
    "absolute top-0 right-0 z-10 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl"

  return (
    <article className="relative border-b border-gray-100 dark:border-gray-800 last:border-0">
      {inProgress && (
        <span className={inProgressBadgeClassName}>
          작성중
        </span>
      )}
      {draft ? (
        <div className={`${cardClassName} cursor-default`} aria-disabled="true">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className={badgeClass(tag)}>{tag}</span>
              {author && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{author}</span>
              )}
            </div>
            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 text-gray-400 dark:text-gray-500"
                aria-label="임시 저장"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
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
            <DraftThumbnailPlaceholder />
          )}
        </div>
      ) : (
        <Link to={slug} className={cardClassName}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className={badgeClass(tag)}>{tag}</span>
              {author && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{author}</span>
              )}
            </div>
            <h3 className="flex items-center gap-2 text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
          ) : null}
        </Link>
      )}
    </article>
  )
}

/* ── Empty state ───────────────────────────────────── */
const EmptyState = () => (
  <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
      아직 작성된 글이 없습니다.
    </p>
  </div>
)

/* ── Popular posts sidebar ─────────────────────────── */
const rankColor = [
  "bg-blue-500 text-white",
  "bg-blue-400 text-white",
  "bg-blue-300 text-white",
]

const PopularSidebar = ({ posts }: { posts: PostNode[] }) => (
  <div className="bg-[#f5f5f7] dark:bg-gray-800/60 rounded-2xl p-5">
    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5">인기 있는 글</h3>
    <ol className="space-y-4 pl-0">
      {posts.slice(0, 3).map((post, i) => (
        <li key={post.id} className="flex items-start gap-3">
          <span
            className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${rankColor[i]}`}
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <Link
              to={getPostSlug(post)}
              className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {post.frontmatter.title}
            </Link>
            {post.frontmatter.author && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {post.frontmatter.author}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  </div>
)

/* ── Recent comments sidebar ───────────────────────── */
interface CommentItem {
  commentUrl?: string
  avatarUrl?: string
  author?: string
  body?: string
  postTitle?: string
}

const RecentCommentsSidebar = () => {
  const [comments, setComments] = React.useState<CommentItem[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch("/.netlify/functions/recent-comments")
      .then(res => res.json())
      .then(data => {
        setComments(data.comments ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="bg-[#f5f5f7] dark:bg-gray-800/60 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">최신 댓글</h3>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-700 rounded-xl p-4 flex items-start gap-3 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full" />
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && comments.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          아직 작성된 댓글이 없습니다.
        </p>
      )}

      {!loading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((c, i) => (
            <a
              key={i}
              href={c.commentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-gray-700 rounded-xl p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors block"
            >
              {c.avatarUrl ? (
                <img
                  src={c.avatarUrl}
                  alt={c.author}
                  className="w-9 h-9 rounded-full shrink-0 object-cover"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                  {c.author?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{c.author}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">
                  {c.body}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">{c.postTitle}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Page ──────────────────────────────────────────── */
const IndexPage = ({ data, location }: IndexPageProps) => {
  const allPosts = data?.allMdx?.nodes ?? []

  const activeCategory = React.useMemo(() => {
    if (!location?.search) return null
    return new URLSearchParams(location.search).get("category")
  }, [location?.search])

  const posts = activeCategory
    ? allPosts.filter(p => p.frontmatter.tags?.includes(activeCategory))
    : allPosts

  const pageTitle = activeCategory ? `${activeCategory}` : "전체 아티클"
  const heroPosts = React.useMemo(
    () => posts.filter(p => !p.frontmatter.draft && hasThumbnail(p)).slice(0, 3),
    [posts]
  )
  const popularPosts = React.useMemo(
    () => allPosts.filter(p => !p.frontmatter.draft).slice(0, 3),
    [allPosts]
  )
  const showHero = !activeCategory && heroPosts.length > 0

  return (
    <Layout location={location}>
      <div className="py-14">
        {/* Featured Hero — 카테고리 필터 없을 때만 표시, draft 제외, 최대 3개 */}
        {showHero && <FeaturedHero posts={heroPosts} />}

        <div className="flex items-center gap-3 mb-10">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {pageTitle}
          </h1>
          {activeCategory && (
            <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">
              {posts.length}개의 글
            </span>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            {posts.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                {posts.map(post => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </section>

          <aside className="lg:col-span-1 space-y-4">
            {popularPosts.length > 0 && <PopularSidebar posts={popularPosts} />}
            <RecentCommentsSidebar />
          </aside>
        </div>
      </div>
    </Layout>
  )
}

export const Head = ({ location }: { location: { pathname: string } }) => (
  <Seo title="홈" pathname={location.pathname}>
    <script type="application/ld+json">
      {JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "오또니",
        url: "https://oddn.ai.kr",
        description: "오또니의 개발 블로그",
        author: {
          "@type": "Person",
          name: "오또니",
        },
      })}
    </script>
  </Seo>
)

export const query = graphql`
  query HomePageQuery {
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
              gatsbyImageData(width: 800, placeholder: BLURRED, layout: CONSTRAINED, formats: [AUTO, WEBP, AVIF])
            }
          }
        }
        excerpt(pruneLength: 120)
      }
    }
  }
`

export default IndexPage
