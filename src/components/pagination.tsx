import * as React from "react"
import { Link } from "gatsby"
import { buildPaginatedPath } from "../utils/posts"

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
}

const getVisiblePages = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  if (currentPage <= 3) {
    pages.add(2)
    pages.add(3)
    pages.add(4)
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1)
    pages.add(totalPages - 2)
    pages.add(totalPages - 3)
  }

  return Array.from(pages)
    .filter(page => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
}

const Pagination = ({ currentPage, totalPages, basePath }: PaginationProps) => {
  if (totalPages <= 1) return null

  const visiblePages = getVisiblePages(currentPage, totalPages)

  return (
    <nav className="mt-10 flex items-center justify-center gap-2 text-sm" aria-label="페이지 이동">
      {currentPage > 1 ? (
        <Link
          to={buildPaginatedPath(basePath, currentPage - 1)}
          className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"
          aria-label="이전 페이지"
        >
          이전
        </Link>
      ) : (
        <span className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-gray-300 dark:border-gray-800 dark:text-gray-600">
          이전
        </span>
      )}

      <div className="flex items-center gap-2">
        {visiblePages.map((page, index) => {
          const previousPage = visiblePages[index - 1]
          const showGap = previousPage && page - previousPage > 1

          return (
            <React.Fragment key={page}>
              {showGap && <span className="px-1 text-gray-400 dark:text-gray-500">...</span>}
              {page === currentPage ? (
                <span
                  aria-current="page"
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-blue-500 px-3 font-semibold text-white"
                >
                  {page}
                </span>
              ) : (
                <Link
                  to={buildPaginatedPath(basePath, page)}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-gray-200 px-3 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"
                  aria-label={`${page}페이지로 이동`}
                >
                  {page}
                </Link>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {currentPage < totalPages ? (
        <Link
          to={buildPaginatedPath(basePath, currentPage + 1)}
          className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-gray-600 transition-colors hover:border-gray-300 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-gray-100"
          aria-label="다음 페이지"
        >
          다음
        </Link>
      ) : (
        <span className="inline-flex items-center rounded-full border border-gray-200 px-4 py-2 text-gray-300 dark:border-gray-800 dark:text-gray-600">
          다음
        </span>
      )}
    </nav>
  )
}

export default Pagination
