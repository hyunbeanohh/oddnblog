import * as React from "react"

import ArticleCard, { ArticleListPost } from "./article-card"
import Pagination from "./pagination"

interface PostListSectionProps {
  title: string
  description?: string
  countLabel?: string
  posts: ArticleListPost[]
  emptyMessage: string
  pagination?: {
    currentPage: number
    totalPages: number
    basePath: string
  }
}

const PostListSection = ({
  title,
  description,
  countLabel,
  posts,
  emptyMessage,
  pagination,
}: PostListSectionProps) => (
  <section>
    <div className="flex items-center gap-3 mb-2">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h1>
      {countLabel && (
        <span className="text-sm text-gray-400 dark:text-gray-500 font-normal">{countLabel}</span>
      )}
    </div>
    {description && (
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-10">{description}</p>
    )}

    {posts.length === 0 ? (
      <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    ) : (
      <>
        <div className="rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          {posts.map(post => (
            <ArticleCard key={post.id} post={post} />
          ))}
        </div>
        {pagination && <Pagination {...pagination} />}
      </>
    )}
  </section>
)

export default PostListSection
