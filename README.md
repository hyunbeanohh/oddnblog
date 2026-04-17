# 오또니의 개발 블로그

Gatsby + MDX + Tailwind CSS로 만든 개인 기술 블로그입니다.

## 기술 스택

| 분류 | 기술 |
|---|---|
| 프레임워크 | [Gatsby 5](https://www.gatsbyjs.com/) |
| 언어 | TypeScript |
| 스타일링 | [Tailwind CSS](https://tailwindcss.com/) |
| 콘텐츠 | MDX (`gatsby-plugin-mdx`) |
| 댓글 | [Giscus](https://giscus.app/) + Cloudflare 전환 골격 |
| 배포 | Netlify 운영 중, Cloudflare Workers 마이그레이션 준비 완료 |

## 시작하기

### 요구사항

> Node.js **18 ~ 22** 버전을 사용해야 합니다.
> Node.js 23 이상에서는 Gatsby LMDB 호환 문제로 `ERR_BUFFER_OUT_OF_BOUNDS` 오류가 발생할 수 있습니다.

```bash
# nvm 사용 시 (프로젝트 루트의 .nvmrc에 22 지정됨)
nvm use
```

`npm run dev`는 현재 Node 버전이 지원 범위(`18~22`)가 아니면 바로 종료하면서 `nvm use`를 안내하도록 정리했습니다. 또한 Gatsby가 홈 디렉터리 설정 파일을 쓰지 않도록 임시 config 경로를 사용하고, `detect-port`가 멈추는 환경에서는 dev 전용 사전 포트 체크로 우회하도록 맞췄습니다.

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:8000)
npm run dev

# MDX 파일 변경 감지와 함께 개발 서버 실행
npm run dev:watch

# 프로덕션 빌드
npm run build

# 빌드 결과물 로컬 미리보기
npm run serve

# 빌드 캐시 초기화
npm run clean
```

## 프로젝트 구조

```
.
├── content/
│   └── blog/          # MDX 블로그 포스트
├── src/
│   ├── components/    # 재사용 컴포넌트
│   ├── context/       # React Context
│   ├── pages/         # 페이지 컴포넌트
│   └── templates/     # 포스트 템플릿
├── static/            # 정적 파일
├── gatsby-config.js   # Gatsby 설정
├── gatsby-node.js     # 빌드 시 페이지 생성 로직
├── tailwind.config.js # Tailwind CSS 설정
├── watch-mdx.js       # MDX 파일 변경 감지 스크립트
└── netlify.toml       # Netlify 배포 설정
```

## 블로그 포스트 작성

`content/blog/` 디렉터리에 `.mdx` 파일을 추가합니다.

```mdx
---
title: 포스트 제목
date: "2026-01-01"
description: 포스트 요약
tags: ["태그"]
author: 오또니
---

본문 내용
```

## 배포

Netlify를 통해 자동 배포됩니다. `main` 브랜치에 푸시하면 빌드 및 배포가 트리거됩니다.

## Cloudflare 마이그레이션

정적 페이지는 Gatsby가 계속 빌드하고, Cloudflare는 `public` 정적 자산과 `/api/*` Worker를 같이 서빙하는 방식으로 옮길 수 있게 골격을 추가했습니다.

### 포함된 것

- `wrangler.jsonc`: Static Assets + Worker + D1 + Vectorize 바인딩
- `worker/src/index.ts`: `likes`, `comments`, `recent-comments`, `search`, `search reindex` API
- `migrations/0001_cloudflare_features.sql`: 추천/댓글용 D1 스키마
- `scripts/generate-search-documents.js`: MDX를 검색용 청크 JSON으로 생성

### 권장 이전 순서

1. Cloudflare에서 D1 데이터베이스와 Vectorize 인덱스를 만듭니다.
2. `wrangler.jsonc`의 `database_id`를 실제 값으로 바꿉니다.
3. 비밀값은 Cloudflare secret으로 설정합니다.
4. D1 마이그레이션을 적용합니다.
5. Gatsby 빌드 후 Worker를 배포합니다.
6. 관리자 토큰으로 검색 인덱스를 적재합니다.

### 필요한 비밀값

```bash
wrangler secret put GITHUB_TOKEN
wrangler secret put TURNSTILE_SECRET_KEY
wrangler secret put SEARCH_SYNC_TOKEN
wrangler secret put ADMIN_API_TOKEN
```

### Gatsby 빌드용 공개 환경변수

Cloudflare 댓글 UI를 켜려면 Gatsby 빌드 시 아래 값을 넣어야 합니다.

```bash
GATSBY_COMMENTS_PROVIDER=cloudflare
GATSBY_TURNSTILE_SITE_KEY=your_turnstile_site_key
```

기본값은 `giscus`이며, 값을 주지 않으면 기존 댓글 UI가 유지됩니다.

### 주요 명령

```bash
# Gatsby 산출물 생성
npm run build:ci

# 로컬 Worker 개발
npm run cf:dev

# D1 마이그레이션
npm run cf:d1:migrate:local
npm run cf:d1:migrate:remote

# 배포
npm run cf:deploy
```

### 검색 인덱스 적재

`npm run build:ci` 이후 `/search-documents.json`이 생성됩니다. 배포 후 아래처럼 관리자 엔드포인트를 호출하면 Vectorize에 청크를 올릴 수 있습니다.

```bash
curl -X POST https://your-domain.com/api/admin/search/reindex \
  -H "Authorization: Bearer $SEARCH_SYNC_TOKEN"
```

### 현재 운영 방침

- 포스트 본문 댓글 UI는 계속 `giscus`를 사용합니다.
- 홈의 최신 댓글 위젯은 `/api/recent-comments`로 Cloudflare Worker를 타도록 바뀌었습니다.
- 포스트 상세에는 D1 기반 추천 버튼이 추가되었습니다.
- 검색 오버레이는 기존 제목 검색을 유지하면서 Cloudflare semantic search 결과를 함께 보여줍니다.

### 네이티브 댓글 moderation

`GATSBY_COMMENTS_PROVIDER=cloudflare`로 빌드하면 포스트 상세에서 D1 기반 댓글 작성 UI가 활성화됩니다. 댓글은 기본적으로 `pending` 상태로 저장되며, 관리자 API로 승인해야 공개됩니다.

```bash
# 대기 중 댓글 조회
curl "https://your-domain.com/api/admin/comments?status=pending" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN"

# 댓글 승인
curl -X POST "https://your-domain.com/api/admin/comments/moderate" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"status":"approved"}'

# 댓글 숨김
curl -X POST "https://your-domain.com/api/admin/comments/moderate" \
  -H "Authorization: Bearer $ADMIN_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":1,"status":"deleted"}'
```

## 라이선스

0BSD
