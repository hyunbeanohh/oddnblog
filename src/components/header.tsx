import * as React from "react"
import { Link, navigate, useStaticQuery, graphql } from "gatsby"
import { StaticImage } from "gatsby-plugin-image"
import { useTheme } from "../context/ThemeContext"

const CATEGORIES = ["Engineering", "Design", "Product"]

interface PostNode {
  id: string
  parent?: { name?: string; relativeDirectory?: string } | null
  frontmatter: {
    title?: string
    tags?: string[]
    draft?: boolean
  }
  excerpt?: string
}

interface SearchablePost {
  post: PostNode
  searchableText: string
}

const getPostSlug = (post: PostNode) => {
  const dir = post.parent?.relativeDirectory
  const base = post.frontmatter.draft ? "draft" : "blog"
  return dir ? `/${base}/${dir}` : post.parent?.name ? `/${base}/${post.parent.name}` : "/"
}

/* ── SVG icons ─────────────────────────────────────── */
const SearchIcon = ({ className = "" }: { className?: string }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
)

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
)

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
  </svg>
)

const GitHubIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
)

/* ── Header ─────────────────────────────────────────── */
interface HeaderProps {
  siteTitle: string
  location?: { search?: string }
}

const Header = ({ siteTitle, location }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme()

  const data = useStaticQuery(graphql`
    query HeaderSearchQuery {
      allMdx(filter: { frontmatter: { draft: { ne: true } } }) {
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
            draft
          }
          excerpt(pruneLength: 80)
        }
      }
    }
  `)
  const allPosts: PostNode[] = data?.allMdx?.nodes ?? []

  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchInput, setSearchInput] = React.useState("")
  const [searchQuery, setSearchQuery] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const activeCategory = React.useMemo(() => {
    if (!location?.search) return null
    return new URLSearchParams(location.search).get("category")
  }, [location?.search])

  React.useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 150)
    return () => clearTimeout(timer)
  }, [searchInput])

  const searchablePosts = React.useMemo<SearchablePost[]>(
    () =>
      allPosts.map(post => ({
        post,
        searchableText: `${post.frontmatter.title ?? ""} ${post.excerpt ?? ""}`.toLowerCase(),
      })),
    [allPosts]
  )

  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return searchablePosts
      .filter(item => item.searchableText.includes(q))
      .slice(0, 10)
      .map(item => item.post)
  }, [searchQuery, searchablePosts])

  React.useEffect(() => {
    if (!searchOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [searchOpen])

  const openSearch = () => {
    setSearchOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    setSearchInput("")
    setSearchQuery("")
  }

  const handleCategoryClick = (cat: string) => {
    navigate(activeCategory === cat ? "/" : `/?category=${cat}`)
  }

  /* ── icon button base classes ── */
  const iconBtnCls =
    "w-9 h-9 rounded-full border-0 bg-transparent flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer transition-colors duration-150"

  return (
    <>
      {/* ── Header bar ──────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-6 h-[60px] flex items-center justify-between">

          {/* ── Left: Logo ── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 font-bold text-[0.9375rem] text-gray-900 dark:text-gray-100 tracking-tight no-underline"
          >
            <StaticImage
              src="../images/profile.jpeg"
              alt="프로필"
              className="!w-8 !h-8 rounded-full overflow-hidden shrink-0"
              imgClassName="rounded-full"
              width={64}
              height={64}
              quality={85}
              formats={["auto", "webp", "avif"]}
              loading="eager"
              placeholder="blurred"
            />
            {siteTitle}
          </Link>

          {/* ── Right: Category nav + Search ── */}
          <nav className="flex items-center gap-0.5">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-4 py-1.5 rounded-full text-sm border-0 cursor-pointer transition-colors duration-150 ${
                  activeCategory === cat
                    ? "font-semibold bg-blue-500 text-white"
                    : "font-medium bg-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}

            <span className="w-px h-[18px] bg-gray-200 dark:bg-gray-700 mx-1.5" />

            <button onClick={openSearch} aria-label="검색" className={iconBtnCls}>
              <SearchIcon />
            </button>

            <button
              onClick={toggleTheme}
              aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
              className={`${iconBtnCls} relative`}
            >
              <span className="theme-icon-wrap">
                <span className="theme-icon-sun">
                  <SunIcon />
                </span>
                <span className="theme-icon-moon">
                  <MoonIcon />
                </span>
              </span>
            </button>

            <span className="w-px h-[18px] bg-gray-200 dark:bg-gray-700 mx-1.5" />

            <a
              href="https://github.com/hyunbeanohh/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub 저장소"
              className={iconBtnCls}
            >
              <GitHubIcon />
            </a>
          </nav>
        </div>
      </header>

      {/* ── Search overlay ────────────────────────────── */}
      {searchOpen && (
        <div
          onClick={closeSearch}
          className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-[540px] overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            {/* Search input row */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <SearchIcon className="text-gray-400 dark:text-gray-500 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="검색어를 입력하세요..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="flex-1 text-base border-0 outline-none text-gray-900 dark:text-gray-100 bg-transparent placeholder-gray-400 dark:placeholder-gray-600"
              />
              <button
                onClick={closeSearch}
                className="border-0 bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer flex items-center p-1 rounded shrink-0 transition-colors"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Search results */}
            {searchResults.length > 0 ? (
              <ul className="max-h-72 overflow-y-auto py-2 m-0 list-none">
                {searchResults.map(post => (
                  <li key={post.id}>
                    <Link
                      to={getPostSlug(post)}
                      onClick={closeSearch}
                      className="w-full text-left px-5 py-3 block hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <p className="text-[0.9375rem] font-semibold text-gray-900 dark:text-gray-100 m-0">
                        {post.frontmatter.title}
                      </p>
                      {post.excerpt && (
                        <p className="text-[0.8125rem] text-gray-500 dark:text-gray-400 mt-0.5 mb-0 line-clamp-1">
                          {post.excerpt}
                        </p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : searchInput.trim() ? (
              <div className="py-10 px-6 text-center text-sm text-gray-400 dark:text-gray-500">
                <span className="text-gray-900 dark:text-gray-100 font-semibold">
                  &ldquo;{searchInput}&rdquo;
                </span>
                에 대한 결과가 없습니다.
              </div>
            ) : (
              <div className="py-10 px-6 text-center text-sm text-gray-400 dark:text-gray-500">
                검색어를 입력하면 글을 찾아드려요.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default Header
