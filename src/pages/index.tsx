import * as React from "react"
import { graphql, Link } from "gatsby"
import { GatsbyImage, getImage, IGatsbyImageData } from "gatsby-plugin-image"

import ArticleCard, { ArticleListPost } from "../components/article-card"
import Layout from "../components/layout"
import Seo from "../components/seo"
import { badgeClass, getPostSlug, isVisibleInPublicLists } from "../utils/posts"

interface ThumbnailNode {
  childImageSharp: {
    gatsbyImageData: IGatsbyImageData
  }
}

interface HomePostNode extends ArticleListPost {
  frontmatter: ArticleListPost["frontmatter"] & {
    thumbnail?: ThumbnailNode
  }
}

interface PageData {
  latestPosts?: {
    nodes: HomePostNode[]
  }
  heroPosts?: {
    nodes: HomePostNode[]
  }
  publishedPosts?: {
    nodes: HomePostNode[]
  }
}

interface IndexPageProps {
  data: PageData
  location: { pathname: string }
}

const thumbnailGradient: Record<string, string> = {
  Engineering: "from-slate-700 to-slate-900",
  Design: "from-emerald-400 to-teal-600",
  Product: "from-orange-400 to-rose-500",
  일상: "from-violet-400 to-purple-600",
  블로그: "from-violet-400 to-purple-600",
}

const hasThumbnail = (post: HomePostNode) => Boolean(post.frontmatter.thumbnail?.childImageSharp)

const CAROUSEL_INTERVAL = 5000

const FeaturedHero = ({ posts }: { posts: HomePostNode[] }) => {
  const [current, setCurrent] = React.useState(0)
  const [paused, setPaused] = React.useState(false)
  const total = posts.length

  React.useEffect(() => {
    if (total <= 1 || paused) return
    const timer = window.setInterval(() => {
      setCurrent(value => (value + 1) % total)
    }, CAROUSEL_INTERVAL)
    return () => window.clearInterval(timer)
  }, [paused, total])

  if (total === 0) return null

  return (
    <section className="mb-14" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="relative rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 h-60 sm:h-72 hover:shadow-xl transition-shadow duration-300">
        {posts.map((post, index) => {
          const { title, description, tags, author, date, thumbnail } = post.frontmatter
          const tag = tags?.[0] ?? "일반"
          const slug = getPostSlug(post)
          const gradient = thumbnailGradient[tag] ?? "from-gray-500 to-gray-700"
          const img = thumbnail ? getImage(thumbnail.childImageSharp.gatsbyImageData) : null
          const isActive = index === current

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

        {total > 1 && (
          <>
            <button
              onClick={() => setCurrent(value => (value - 1 + total) % total)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="이전 슬라이드"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => setCurrent(value => (value + 1) % total)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
              aria-label="다음 슬라이드"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
  )
}

const PopularSidebar = ({ posts }: { posts: HomePostNode[] }) => (
  <div className="bg-[#f5f5f7] dark:bg-gray-800/60 rounded-2xl p-5">
    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-5">인기 있는 글</h3>
    <ol className="space-y-4 pl-0">
      {posts.slice(0, 3).map((post, index) => (
        <li key={post.id} className="flex items-start gap-3">
          <span className="text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-blue-500 text-white">
            {index + 1}
          </span>
          <div className="min-w-0">
            <Link
              to={getPostSlug(post)}
              className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-snug line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              {post.frontmatter.title}
            </Link>
            {post.frontmatter.author && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{post.frontmatter.author}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  </div>
)

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
          {[1, 2, 3].map(index => (
            <div key={index} className="bg-white dark:bg-gray-700 rounded-xl p-4 flex items-start gap-3 animate-pulse">
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
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">아직 작성된 댓글이 없습니다.</p>
      )}

      {!loading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment, index) => (
            <a
              key={index}
              href={comment.commentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-gray-700 rounded-xl p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors block"
            >
              {comment.avatarUrl ? (
                <img src={comment.avatarUrl} alt={comment.author} className="w-9 h-9 rounded-full shrink-0 object-cover" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                  {comment.author?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">{comment.author}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug line-clamp-2">{comment.body}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 truncate">{comment.postTitle}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

const IndexPage = ({ data, location }: IndexPageProps) => {
  const latestPosts = (data?.latestPosts?.nodes ?? []).filter(isVisibleInPublicLists).slice(0, 6)
  const heroPosts = (data?.heroPosts?.nodes ?? []).filter(hasThumbnail).slice(0, 3)
  const publishedPosts = data?.publishedPosts?.nodes ?? []

  return (
    <Layout location={location}>
      <div className="py-14">
        <FeaturedHero posts={heroPosts} />

        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2">
            <div className="mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">최신 아티클</h1>
              </div>
            </div>
            <div className="rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
              {latestPosts.map(post => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </section>

          <aside className="lg:col-span-1 space-y-4">
            {publishedPosts.length > 0 && <PopularSidebar posts={publishedPosts.slice(0, 3)} />}
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
        inLanguage: "ko-KR",
      })}
    </script>
  </Seo>
)

export const query = graphql`
  query HomePageQuery {
    latestPosts: allMdx(sort: { frontmatter: { date: DESC } }) {
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
    heroPosts: allMdx(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { draft: { ne: true } } }
      limit: 3
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
          thumbnail {
            childImageSharp {
              gatsbyImageData(width: 1200, placeholder: BLURRED, layout: FULL_WIDTH, formats: [AUTO, WEBP, AVIF])
            }
          }
        }
        excerpt(pruneLength: 120)
      }
    }
    publishedPosts: allMdx(
      sort: { frontmatter: { date: DESC } }
      filter: { frontmatter: { draft: { ne: true } } }
      limit: 3
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
          tags
          author
          draft
        }
      }
    }
  }
`

export default IndexPage
