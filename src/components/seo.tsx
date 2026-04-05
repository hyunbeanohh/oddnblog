import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

interface SeoProps {
  description?: string
  title: string
  pathname?: string
  image?: string
  type?: "website" | "article"
  robots?: string
  publishedTime?: string
  modifiedTime?: string
  author?: string
  tags?: string[]
  children?: React.ReactNode
}

function Seo({
  description,
  title,
  pathname,
  image,
  type = "website",
  robots = "index,follow",
  publishedTime,
  modifiedTime,
  author,
  tags,
  children,
}: SeoProps) {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            author
            siteUrl
            language
            social {
              github
              linkedin
              portfolio
            }
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title
  const siteUrl = site.siteMetadata?.siteUrl ?? ""
  const siteLanguage = site.siteMetadata?.language ?? "ko-KR"
  const authorName = author || site.siteMetadata?.author || ""
  const canonicalUrl = pathname ? `${siteUrl}${pathname}` : siteUrl
  const ogImage = image || `${siteUrl}/profile.jpeg`
  return (
    <>
      <title>{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <link rel="canonical" href={canonicalUrl} />
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robots} />
      <meta name="author" content={authorName} />
      <meta
        name="google-site-verification"
        content="EK1ZEYzDdGlQadzLMP0b55kKcLLYtZ0JXDDYEUhcqhw"
      />
      <meta property="og:title" content={defaultTitle ? `${title} | ${defaultTitle}` : title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={defaultTitle} />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={authorName} />
      <meta name="twitter:title" content={defaultTitle ? `${title} | ${defaultTitle}` : title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:label1" content="작성자" />
      <meta name="twitter:data1" content={authorName} />
      <meta name="content-language" content={siteLanguage} />
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === "article" && authorName && <meta property="article:author" content={authorName} />}
      {type === "article" &&
        tags?.map(tag => <meta key={tag} property="article:tag" content={tag} />)}
      {children}
    </>
  )
}

export default Seo
