interface VectorSearchMatch {
  id?: string
  score?: number
  metadata?: {
    slug?: string
    title?: string
    excerpt?: string
    tags?: string[]
    content?: string
  }
}

interface SearchDocument {
  id: string
  slug: string
  title: string
  excerpt: string
  tags: string[]
  content: string
}

interface AssetFetcher {
  fetch(request: Request): Promise<Response>
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<unknown>
  all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>
}

interface D1Binding {
  prepare(query: string): D1PreparedStatement
}

interface AiBinding {
  run(model: string, payload: Record<string, unknown>): Promise<unknown>
}

interface Env {
  ASSETS: AssetFetcher
  DB: D1Binding
  AI?: AiBinding
  BLOG_SEARCH_INDEX?: {
    query(vector: number[], options?: Record<string, unknown>): Promise<{ matches?: VectorSearchMatch[] }>
    upsert(vectors: Array<Record<string, unknown>>): Promise<unknown>
  }
  GITHUB_TOKEN?: string
  GISCUS_REPO?: string
  GISCUS_CATEGORY_ID?: string
  TURNSTILE_SECRET_KEY?: string
  SEARCH_SYNC_TOKEN?: string
  ADMIN_API_TOKEN?: string
  SEMANTIC_SEARCH_MODEL?: string
}

const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
}

const RECENT_COMMENTS_QUERY = `
  query RecentComments($owner: String!, $repo: String!, $categoryId: ID!) {
    repository(owner: $owner, name: $repo) {
      discussions(
        first: 10
        categoryId: $categoryId
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        nodes {
          title
          url
          comments(last: 3) {
            nodes {
              author {
                login
                avatarUrl
              }
              body
              createdAt
              url
            }
          }
        }
      }
    }
  }
`

const createJsonResponse = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: {
      ...JSON_HEADERS,
      ...(init?.headers ?? {}),
    },
  })

const parseCookies = (value: string | null) =>
  Object.fromEntries(
    (value ?? "")
      .split(/;\s*/)
      .filter(Boolean)
      .map(entry => {
        const index = entry.indexOf("=")
        return index >= 0
          ? [entry.slice(0, index), decodeURIComponent(entry.slice(index + 1))]
          : [entry, ""]
      })
  )

const getVisitorId = (request: Request) => {
  const cookies = parseCookies(request.headers.get("Cookie"))
  return cookies.oddn_vid || null
}

const createVisitorId = () => crypto.randomUUID().replace(/-/g, "")

const appendVisitorCookie = (response: Response, visitorId: string) => {
  response.headers.append(
    "Set-Cookie",
    `oddn_vid=${visitorId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000; Secure`
  )
  return response
}

const normalizeSlug = (value: unknown) => {
  if (typeof value !== "string") return ""
  const slug = value.trim()
  return slug.startsWith("/") ? slug : ""
}

const parseNumericId = (value: unknown) => {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : 0
}

const getAdminToken = (env: Env) => env.ADMIN_API_TOKEN || env.SEARCH_SYNC_TOKEN || ""

const isAuthorizedAdmin = (request: Request, env: Env) =>
  request.headers.get("Authorization") === `Bearer ${getAdminToken(env)}`

const stripMarkdown = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const tokenize = (value: string) =>
  stripMarkdown(value)
    .toLowerCase()
    .split(/\s+/)
    .filter(token => token.length > 1)

const scoreDocument = (query: string, document: SearchDocument) => {
  const terms = tokenize(query)
  if (terms.length === 0) return 0

  const haystack = `${document.title} ${document.excerpt} ${document.tags.join(" ")} ${document.content}`.toLowerCase()
  return terms.reduce((score, term) => {
    if (!haystack.includes(term)) return score
    if (document.title.toLowerCase().includes(term)) return score + 6
    if (document.tags.some(tag => tag.toLowerCase().includes(term))) return score + 4
    if (document.excerpt.toLowerCase().includes(term)) return score + 3
    return score + 1
  }, 0)
}

const getSearchDocuments = async (request: Request, env: Env): Promise<SearchDocument[]> => {
  const url = new URL(request.url)
  url.pathname = "/search-documents.json"
  url.search = ""

  const response = await env.ASSETS.fetch(new Request(url.toString(), { method: "GET" }))
  if (!response.ok) return []

  const payload = (await response.json()) as { chunks?: SearchDocument[] }
  return Array.isArray(payload.chunks) ? payload.chunks : []
}

const embedText = async (env: Env, text: string) => {
  if (!env.AI) return null

  const result = (await env.AI.run(env.SEMANTIC_SEARCH_MODEL || "@cf/baai/bge-m3", {
    text: [text],
  })) as { data?: number[][]; response?: number[][] }

  const vector = result.data?.[0] ?? result.response?.[0]
  return Array.isArray(vector) ? vector : null
}

const verifyTurnstile = async (request: Request, env: Env, token: string | null) => {
  if (!env.TURNSTILE_SECRET_KEY) return true
  if (!token) return false

  const ip = request.headers.get("CF-Connecting-IP") || ""
  const form = new URLSearchParams()
  form.set("secret", env.TURNSTILE_SECRET_KEY)
  form.set("response", token)
  if (ip) form.set("remoteip", ip)

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  })

  if (!response.ok) return false

  const data = (await response.json()) as { success?: boolean }
  return data.success === true
}

const handleLikesGet = async (request: Request, env: Env) => {
  const url = new URL(request.url)
  const slug = normalizeSlug(url.searchParams.get("slug"))
  if (!slug) return createJsonResponse({ error: "slug is required" }, { status: 400 })

  const visitorId = getVisitorId(request)
  const countResult = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM post_likes WHERE post_slug = ?"
  )
    .bind(slug)
    .first<{ count: number }>()

  let liked = false
  if (visitorId) {
    const likedResult = await env.DB.prepare(
      "SELECT 1 AS liked FROM post_likes WHERE post_slug = ? AND visitor_id = ? LIMIT 1"
    )
      .bind(slug, visitorId)
      .first<{ liked: number }>()

    liked = Boolean(likedResult?.liked)
  }

  const response = createJsonResponse({
    count: Number(countResult?.count ?? 0),
    liked,
  })

  if (!visitorId) {
    appendVisitorCookie(response, createVisitorId())
  }

  return response
}

const handleLikesPost = async (request: Request, env: Env) => {
  const payload = (await request.json().catch(() => ({}))) as { slug?: string }
  const slug = normalizeSlug(payload.slug)
  if (!slug) return createJsonResponse({ error: "slug is required" }, { status: 400 })

  const existingVisitorId = getVisitorId(request)
  const visitorId = existingVisitorId || createVisitorId()

  await env.DB.prepare(
    "INSERT OR IGNORE INTO post_likes (post_slug, visitor_id, created_at) VALUES (?, ?, ?)"
  )
    .bind(slug, visitorId, new Date().toISOString())
    .run()

  const countResult = await env.DB.prepare(
    "SELECT COUNT(*) AS count FROM post_likes WHERE post_slug = ?"
  )
    .bind(slug)
    .first<{ count: number }>()

  const response = createJsonResponse({
    count: Number(countResult?.count ?? 0),
    liked: true,
  })

  if (!existingVisitorId) {
    appendVisitorCookie(response, visitorId)
  }

  return response
}

const handleCommentsGet = async (request: Request, env: Env) => {
  const url = new URL(request.url)
  const slug = normalizeSlug(url.searchParams.get("slug"))
  if (!slug) return createJsonResponse({ error: "slug is required" }, { status: 400 })

  try {
    const result = await env.DB.prepare(
      `SELECT id, author_name AS authorName, body, created_at AS createdAt
       FROM post_comments
       WHERE post_slug = ? AND status = 'approved'
       ORDER BY created_at DESC
       LIMIT 50`
    )
      .bind(slug)
      .all()

    return createJsonResponse({
      comments: Array.isArray(result.results) ? result.results : [],
    })
  } catch {
    return createJsonResponse({ error: "failed to fetch comments" }, { status: 500 })
  }
}

const handleCommentsPost = async (request: Request, env: Env) => {
  const payload = (await request.json().catch(() => ({}))) as {
    slug?: string
    authorName?: string
    body?: string
    turnstileToken?: string
  }

  const slug = normalizeSlug(payload.slug)
  const authorName = typeof payload.authorName === "string" ? payload.authorName.trim().slice(0, 40) : ""
  const body = typeof payload.body === "string" ? payload.body.trim().slice(0, 2000) : ""

  if (!slug || !authorName || body.length < 2) {
    return createJsonResponse({ error: "invalid comment payload" }, { status: 400 })
  }

  const isHuman = await verifyTurnstile(request, env, payload.turnstileToken ?? null)
  if (!isHuman) {
    return createJsonResponse({ error: "turnstile verification failed" }, { status: 403 })
  }

  try {
    await env.DB.prepare(
      `INSERT INTO post_comments (post_slug, author_name, body, status, created_at)
       VALUES (?, ?, ?, 'approved', ?)`
    )
      .bind(slug, authorName, body, new Date().toISOString())
      .run()

    return createJsonResponse({ ok: true, status: "approved" }, { status: 201 })
  } catch {
    return createJsonResponse({ error: "댓글 저장에 실패했습니다." }, { status: 500 })
  }
}

const handleAdminCommentsGet = async (request: Request, env: Env) => {
  if (!getAdminToken(env) || !isAuthorizedAdmin(request, env)) {
    return createJsonResponse({ error: "unauthorized" }, { status: 401 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get("status") === "approved" ? "approved" : "pending"
  const result = await env.DB.prepare(
    `SELECT id, post_slug AS postSlug, author_name AS authorName, body, status, created_at AS createdAt
     FROM post_comments
     WHERE status = ?
     ORDER BY created_at DESC
     LIMIT 100`
  )
    .bind(status)
    .all()

  return createJsonResponse({
    comments: Array.isArray(result.results) ? result.results : [],
  })
}

const handleAdminCommentsModerate = async (request: Request, env: Env) => {
  if (!getAdminToken(env) || !isAuthorizedAdmin(request, env)) {
    return createJsonResponse({ error: "unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => ({}))) as {
    id?: number
    status?: string
  }

  const id = parseNumericId(payload.id)
  const status = payload.status === "deleted" ? "deleted" : payload.status === "approved" ? "approved" : ""
  if (!id || !status) {
    return createJsonResponse({ error: "invalid moderation payload" }, { status: 400 })
  }

  await env.DB.prepare("UPDATE post_comments SET status = ? WHERE id = ?")
    .bind(status, id)
    .run()

  return createJsonResponse({ ok: true, id, status })
}

const fetchGiscusRecentComments = async (env: Env) => {
  if (!env.GITHUB_TOKEN || !env.GISCUS_REPO || !env.GISCUS_CATEGORY_ID) return []

  const [owner, repo] = env.GISCUS_REPO.split("/")
  if (!owner || !repo) return []

  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${env.GITHUB_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "my-blog-cloudflare-worker",
    },
    body: JSON.stringify({
      query: RECENT_COMMENTS_QUERY,
      variables: {
        owner,
        repo,
        categoryId: env.GISCUS_CATEGORY_ID,
      },
    }),
  })

  if (!response.ok) return []

  const data = (await response.json()) as {
    data?: {
      repository?: {
        discussions?: {
          nodes?: Array<{
            title?: string
            url?: string
            comments?: {
              nodes?: Array<{
                author?: { login?: string; avatarUrl?: string }
                body?: string
                createdAt?: string
                url?: string
              }>
            }
          }>
        }
      }
    }
  }

  const discussions = data.data?.repository?.discussions?.nodes ?? []

  return discussions
    .flatMap(discussion =>
      (discussion.comments?.nodes ?? []).map(comment => ({
        author: comment.author?.login ?? "익명",
        avatarUrl: comment.author?.avatarUrl ?? "",
        body: stripMarkdown(comment.body ?? "").slice(0, 80),
        postTitle: discussion.title ?? "",
        postUrl: discussion.url ?? "",
        commentUrl: comment.url ?? "",
        createdAt: comment.createdAt ?? "",
      }))
    )
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))
    .slice(0, 5)
}

const handleRecentComments = async (env: Env) => {
  const githubComments = await fetchGiscusRecentComments(env)
  if (githubComments.length > 0) {
    return createJsonResponse(
      { comments: githubComments },
      {
        headers: {
          "Cache-Control": "public, max-age=120",
        },
      }
    )
  }

  const dbComments = await env.DB.prepare(
    `SELECT author_name AS author, body, post_slug AS postSlug, created_at AS createdAt
     FROM post_comments
     WHERE status = 'approved'
     ORDER BY created_at DESC
     LIMIT 5`
  ).all()

  return createJsonResponse({
    comments: (dbComments.results ?? []).map(comment => ({
      ...comment,
      commentUrl: comment.postSlug,
    })),
  })
}

const handleSearch = async (request: Request, env: Env) => {
  const payload =
    request.method === "POST"
      ? ((await request.json().catch(() => ({}))) as { query?: string })
      : { query: new URL(request.url).searchParams.get("q") || "" }

  const query = typeof payload.query === "string" ? payload.query.trim() : ""
  if (query.length < 2) {
    return createJsonResponse({ results: [] })
  }

  const lexicalDocuments = await getSearchDocuments(request, env)
  const lexicalResults = lexicalDocuments
    .map(document => ({
      ...document,
      score: scoreDocument(query, document),
    }))
    .filter(document => document.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map(document => ({
      id: document.id,
      slug: document.slug,
      title: document.title,
      excerpt: document.excerpt,
      content: document.content,
      score: document.score,
      source: "lexical",
    }))

  if (!env.BLOG_SEARCH_INDEX || !env.AI) {
    return createJsonResponse({ results: lexicalResults })
  }

  const queryVector = await embedText(env, query)
  if (!queryVector) {
    return createJsonResponse({ results: lexicalResults })
  }

  const vectorResults = await env.BLOG_SEARCH_INDEX.query(queryVector, {
    topK: 5,
    returnMetadata: true,
  })

  const semanticResults = (vectorResults.matches ?? [])
    .map(match => ({
      id: match.id ?? "",
      slug: match.metadata?.slug ?? "",
      title: match.metadata?.title ?? "",
      excerpt: match.metadata?.excerpt ?? "",
      content: match.metadata?.content ?? "",
      score: match.score ?? 0,
      source: "semantic",
    }))
    .filter(result => result.slug && result.title)

  const deduped = new Map<string, (typeof semanticResults)[number] | (typeof lexicalResults)[number]>()

  for (const result of [...semanticResults, ...lexicalResults]) {
    const key = result.slug
    if (!deduped.has(key)) deduped.set(key, result)
  }

  return createJsonResponse({
    results: Array.from(deduped.values()).slice(0, 6),
  })
}

const handleSearchReindex = async (request: Request, env: Env) => {
  if (!env.BLOG_SEARCH_INDEX || !env.AI || !env.SEARCH_SYNC_TOKEN) {
    return createJsonResponse({ error: "search sync is not configured" }, { status: 400 })
  }

  const authHeader = request.headers.get("Authorization") || ""
  if (authHeader !== `Bearer ${env.SEARCH_SYNC_TOKEN}`) {
    return createJsonResponse({ error: "unauthorized" }, { status: 401 })
  }

  const documents = await getSearchDocuments(request, env)
  if (documents.length === 0) {
    return createJsonResponse({ error: "search-documents.json is missing" }, { status: 404 })
  }

  const vectors = []
  const batchSize = 20

  for (let index = 0; index < documents.length; index += batchSize) {
    const batch = documents.slice(index, index + batchSize)
    const embeddings = (await env.AI.run(env.SEMANTIC_SEARCH_MODEL || "@cf/baai/bge-m3", {
      text: batch.map(document => document.content),
    })) as { data?: number[][]; response?: number[][] }

    const values = embeddings.data ?? embeddings.response ?? []
    for (let batchIndex = 0; batchIndex < batch.length; batchIndex += 1) {
      const document = batch[batchIndex]
      const value = values[batchIndex]
      if (!Array.isArray(value)) continue

      vectors.push({
        id: document.id,
        values: value,
        metadata: {
          slug: document.slug,
          title: document.title,
          excerpt: document.excerpt,
          tags: document.tags,
          content: document.content,
        },
      })
    }
  }

  if (vectors.length === 0) {
    return createJsonResponse({ error: "no vectors generated" }, { status: 500 })
  }

  await env.BLOG_SEARCH_INDEX.upsert(vectors)

  return createJsonResponse({
    ok: true,
    indexedDocuments: documents.length,
    indexedVectors: vectors.length,
  })
}

const routeApiRequest = async (request: Request, env: Env) => {
  const url = new URL(request.url)

  if (url.pathname === "/api/likes" && request.method === "GET") return handleLikesGet(request, env)
  if (url.pathname === "/api/likes" && request.method === "POST") return handleLikesPost(request, env)
  if (url.pathname === "/api/comments" && request.method === "GET") return handleCommentsGet(request, env)
  if (url.pathname === "/api/comments" && request.method === "POST") return handleCommentsPost(request, env)
  if (url.pathname === "/api/admin/comments" && request.method === "GET") {
    return handleAdminCommentsGet(request, env)
  }
  if (url.pathname === "/api/admin/comments/moderate" && request.method === "POST") {
    return handleAdminCommentsModerate(request, env)
  }
  if (url.pathname === "/api/recent-comments" && request.method === "GET") return handleRecentComments(env)
  if (url.pathname === "/api/search" && (request.method === "GET" || request.method === "POST")) {
    return handleSearch(request, env)
  }
  if (url.pathname === "/api/admin/search/reindex" && request.method === "POST") {
    return handleSearchReindex(request, env)
  }

  return createJsonResponse({ error: "not found" }, { status: 404 })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith("/api/")) {
      return routeApiRequest(request, env)
    }

    return env.ASSETS.fetch(request)
  },
}
