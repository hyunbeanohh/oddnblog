/**
 * 빌드 전 실행되는 콘텐츠 인덱스 생성 스크립트.
 *
 * MDX 파일의 frontmatter를 파싱하여 content/content-index.json을 생성합니다.
 * Gatsby 부트스트랩 단계에서 GraphQL 런타임 집계 없이 태그/최신 포스트 목록을
 * 정적 JSON으로 사전 계산함으로써 노드 수 증가에 따른 빌드 비용을 억제합니다.
 */

"use strict"

const fs = require("fs")
const path = require("path")
const matter = require("gray-matter")

const CONTENT_DIR = path.join(__dirname, "..", "content", "blog")
const OUTPUT_FILE = path.join(__dirname, "..", "content", "content-index.json")

/** @returns {string[]} MDX 파일 절대 경로 목록 */
function collectMdxFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return collectMdxFiles(fullPath)
    if (/\.(mdx|md)$/.test(entry.name)) return [fullPath]
    return []
  })
}

/** @param {string} filePath */
function parsePost(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8")
  const { data } = matter(raw)

  const relFromContent = path.relative(CONTENT_DIR, filePath)
  const dir = path.dirname(relFromContent)
  const name = path.basename(relFromContent, path.extname(relFromContent))
  const slug = dir !== "." ? `/blog/${dir}` : `/blog/${name}`

  return {
    slug,
    title: data.title ?? "",
    date: data.date ? new Date(data.date).toISOString() : null,
    description: data.description ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    author: data.author ?? "",
    draft: data.draft === true,
  }
}

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.warn("[content-index] content/blog 디렉토리가 없습니다. 건너뜁니다.")
    return
  }

  const files = collectMdxFiles(CONTENT_DIR)
  const posts = files
    .map(parsePost)
    .filter(p => !p.draft)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))

  /** @type {Record<string, number>} */
  const tagCounts = {}
  for (const post of posts) {
    for (const tag of post.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1
    }
  }

  const tags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))

  const index = {
    generatedAt: new Date().toISOString(),
    totalPosts: posts.length,
    tags,
    posts,
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2), "utf-8")
  console.log(
    `[content-index] ${posts.length}개 포스트, ${tags.length}개 태그 → ${path.relative(process.cwd(), OUTPUT_FILE)}`
  )
}

main()
