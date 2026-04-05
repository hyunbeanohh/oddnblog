import * as React from "react"
import { Link } from "gatsby"
import { GatsbyImage, getImage, IGatsbyImageData } from "gatsby-plugin-image"

import { badgeClass, getPostSlug } from "../utils/posts"

interface ThumbnailNode {
  childImageSharp: {
    gatsbyImageData: IGatsbyImageData
  }
}

export interface ArticleListPost {
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

const DraftThumbnailPlaceholder = () => (
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

const ArticleCard = ({ post }: { post: ArticleListPost }) => {
  const { title, date, description, tags, author, thumbnail, draft, inProgress } = post.frontmatter
  const tag = tags?.[0] ?? "일반"
  const slug = getPostSlug(post)
  const img = thumbnail ? getImage(thumbnail.childImageSharp.gatsbyImageData) : null
  const cardClassName =
    "flex justify-between items-start gap-6 py-8 group -mx-4 px-4 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"

  return (
    <article className="relative border-b border-gray-100 dark:border-gray-800 last:border-0">
      {inProgress && (
        <span className="absolute top-0 right-0 z-10 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
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

export default ArticleCard
