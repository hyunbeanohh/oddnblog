exports.handler = async event => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" }
  }

  let body
  try {
    body = JSON.parse(event.body ?? "{}")
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON" }),
    }
  }

  const { password, redirect } = body
  const validPassword = process.env.DRAFT_PASSWORD
  const accessToken = process.env.DRAFT_ACCESS_TOKEN

  if (!validPassword || !accessToken) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server configuration error" }),
    }
  }

  if (password !== validPassword) {
    // 브루트 포스 억제: 실패 시 300ms 지연
    await new Promise(resolve => setTimeout(resolve, 300))
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "비밀번호가 올바르지 않습니다." }),
    }
  }

  // redirect 파라미터 검증: /draft 하위 경로만 허용 (open redirect 방지)
  const safeRedirect =
    typeof redirect === "string" && redirect.startsWith("/draft")
      ? redirect
      : "/draft"

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      // Secure 플래그: HTTPS 전송 시에만 쿠키 전달
      // HttpOnly: JavaScript 접근 차단 (XSS 방어)
      // SameSite=Strict: CSRF 방어
      // Max-Age=86400: 24시간 유효
      "Set-Cookie": `draft_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
    },
    body: JSON.stringify({ redirect: safeRedirect }),
  }
}
