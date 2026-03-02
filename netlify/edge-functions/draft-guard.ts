import type { Context } from "netlify:edge"

export default async (request: Request, context: Context) => {
  const url = new URL(request.url)
  const { pathname } = url

  // 로그인 페이지와 해당 page-data는 인증 없이 통과
  const isLoginPage =
    pathname === "/draft/login" || pathname === "/draft/login/"
  const isLoginPageData =
    pathname === "/page-data/draft/login/page-data.json"

  if (isLoginPage || isLoginPageData) {
    return context.next()
  }

  const cookieHeader = request.headers.get("Cookie") ?? ""
  const token = parseCookie(cookieHeader)["draft_token"]
  const validToken = Netlify.env.get("DRAFT_ACCESS_TOKEN") ?? ""

  if (!validToken || !token || !timingSafeEqual(token, validToken)) {
    const loginUrl = new URL("/draft/login", url.origin)
    loginUrl.searchParams.set("redirect", pathname)
    return Response.redirect(loginUrl.toString(), 302)
  }

  return context.next()
}

function parseCookie(cookieStr: string): Record<string, string> {
  if (!cookieStr) return {}
  return Object.fromEntries(
    cookieStr.split(";").flatMap(part => {
      const eqIdx = part.indexOf("=")
      if (eqIdx === -1) return []
      const key = part.slice(0, eqIdx).trim()
      const val = part.slice(eqIdx + 1).trim()
      try {
        return [[key, decodeURIComponent(val)]]
      } catch {
        return [[key, val]]
      }
    })
  )
}

/**
 * 타이밍 공격 방지를 위한 고정 시간 문자열 비교.
 * 길이가 다르더라도 동일한 시간을 소비한 후 false 반환.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder()
  // 길이를 동일하게 맞춰 비교 (길이 차이로 인한 조기 종료 방지)
  const maxLen = Math.max(a.length, b.length)
  const aBytes = enc.encode(a.padEnd(maxLen, "\0"))
  const bBytes = enc.encode(b.padEnd(maxLen, "\0"))

  let diff = a.length === b.length ? 0 : 1
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i]
  }
  return diff === 0
}
