import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"
import { useTheme } from "../context/ThemeContext"
import Header from "./header"
import "./layout.css"

interface LayoutProps {
  children: React.ReactNode
  location?: { pathname?: string; search?: string }
  containerClassName?: string
}

const SunIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
)

const MoonIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
)

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      aria-label={theme === "light" ? "다크 모드로 전환" : "라이트 모드로 전환"}
      className="fixed bottom-6 right-6 z-[100] w-11 h-11 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex items-center justify-center cursor-pointer shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
    >
      {theme === "light" ? <MoonIcon /> : <SunIcon />}
    </button>
  )
}

const Layout = ({ children, location, containerClassName }: LayoutProps) => {
  const data = useStaticQuery(graphql`
    query SiteTitleQuery {
      site {
        siteMetadata {
          title
        }
      }
    }
  `)

  return (
    <>
      <Header
        siteTitle={data.site.siteMetadata?.title || `Title`}
        location={location}
      />
      <div
        className={`${containerClassName ?? "max-w-5xl"} mx-auto px-6 min-h-[calc(100vh-60px)] flex flex-col`}
      >
        <main className="flex-1">{children}</main>
        <footer className="mt-16 pt-6 pb-8 border-t border-gray-100 dark:border-gray-800 flex justify-center items-center flex-wrap gap-2 text-sm text-gray-400 dark:text-gray-500 text-center">
          <span>© {new Date().getFullYear()} 오또니 블로그</span>
        </footer>
      </div>

      <ThemeToggle />
    </>
  )
}

export default Layout
