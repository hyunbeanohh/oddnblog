import * as React from "react"
import { useStaticQuery, graphql } from "gatsby"

interface SeoProps {
  description?: string
  title: string
  pathname?: string
  image?: string
  type?: "website" | "article"
  robots?: string
  children?: React.ReactNode
}

function Seo({
  description,
  title,
  pathname,
  image,
  type = "website",
  robots = "index,follow",
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
          }
        }
      }
    `
  )

  const metaDescription = description || site.siteMetadata.description
  const defaultTitle = site.siteMetadata?.title
  const siteUrl = site.siteMetadata?.siteUrl ?? ""
  const canonicalUrl = pathname ? `${siteUrl}${pathname}` : siteUrl
  const ogImage = image || `${siteUrl}/profile.jpeg`

  return (
    <>
      <title>{defaultTitle ? `${title} | ${defaultTitle}` : title}</title>
      <link rel="canonical" href={canonicalUrl} />
      <meta name="description" content={metaDescription} />
      <meta name="robots" content={robots} />
      <meta
        name="google-site-verification"
        content="EK1ZEYzDdGlQadzLMP0b55kKcLLYtZ0JXDDYEUhcqhw"
      />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={defaultTitle} />
      <meta property="og:locale" content="ko_KR" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:creator" content={site.siteMetadata?.author || ``} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />
      {children}
    </>
  )
}

export default Seo
