# Random Nickname System Design

토스 기술 블로그 스타일의 랜덤 닉네임 시스템을 네이티브 댓글에 적용한다.

## 요구사항

- 로그인 없이 "형용사 + 동물" 조합의 랜덤 닉네임 자동 배정
- 동물 이모지 아바타 함께 표시
- 닉네임은 전역 고정 (모든 글에서 동일)
- 닉네임은 완전 자동 — 사용자가 변경하거나 직접 입력할 수 없음
- 서버 연동 최소화 — 닉네임 관리는 클라이언트 전용

## 아키텍처 결정

### 저장 방식: localStorage 전용 (Zustand persist)

- 서버에 닉네임 매핑 저장하지 않음
- Zustand `persist` 미들웨어가 `localStorage["oddn-nickname"]`에 자동 저장/복원
- 기존 `authorName` 필드에 닉네임 텍스트를 그대로 전송 — Worker API, DB 스키마 변경 없음

### 구현 방식: Zustand store

React Context 대비 장점:
- Provider 래핑 불필요
- `persist` 미들웨어로 localStorage 보일러플레이트 제거
- `native-comments.tsx`가 이미 복잡한 상태를 관리 중 — 닉네임 상태를 store로 분리

## 파일 구조

### 새 파일

| 파일 | 역할 |
|---|---|
| `src/utils/nickname.ts` | 형용사/동물 배열, `generateNickname()`, `getEmojiForNickname()` |
| `src/stores/nickname-store.ts` | Zustand store (persist + skipHydration) |

### 수정 파일

| 파일 | 변경 |
|---|---|
| `src/components/native-comments.tsx` | `authorName` state → `useNicknameStore()`, input → 읽기 전용 닉네임 표시, 레이아웃 조정, 이모지 표시, hydration 처리 |

### 새 의존성

| 패키지 | 크기 (gzip) |
|---|---|
| `zustand` | ~1.1KB |

## 상세 설계

### 1. 닉네임 생성 (`src/utils/nickname.ts`)

형용사 30개 + 동물 30개 = 900가지 조합.

```ts
const ADJECTIVES = ["용감한", "느긋한", "활기찬", "씩씩한", ...] as const
const ANIMALS = [
  { name: "펭귄", emoji: "🐧" },
  { name: "수달", emoji: "🦦" },
  { name: "고양이", emoji: "🐱" },
  ...
] as const

interface Nickname {
  text: string   // "용감한펭귄"
  emoji: string  // "🐧"
}

export function generateNickname(): Nickname {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
  return { text: `${adj}${animal.name}`, emoji: animal.emoji }
}

export function getEmojiForNickname(nickname: string): string {
  const animal = ANIMALS.find(a => nickname.endsWith(a.name))
  return animal?.emoji ?? "💬"
}
```

- 순수 함수, 외부 의존성 없음
- 닉네임 길이: 4~8자 (한글 기준)
- `getEmojiForNickname`: 서버에서 내려온 `authorName`으로부터 이모지 복원. 매칭 실패 시 `💬` 폴백.

### 2. Zustand Store (`src/stores/nickname-store.ts`)

```ts
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { generateNickname } from "../utils/nickname"

interface NicknameState {
  nickname: string
  emoji: string
  init: () => void
}

export const useNicknameStore = create<NicknameState>()(
  persist(
    (set, get) => ({
      nickname: "",
      emoji: "",
      init: () => {
        if (get().nickname) return  // 이미 닉네임이 있으면 유지
        const { text, emoji } = generateNickname()
        set({ nickname: text, emoji })
      },
    }),
    {
      name: "oddn-nickname",
      skipHydration: true,
    }
  )
)
```

- `skipHydration: true`: SSR 시 빈 문자열, 클라이언트에서 수동 hydration
- `init()`: 첫 방문 시에만 닉네임 생성. 이미 존재하면 무시.

### 3. `native-comments.tsx` 변경

#### 상태 변경

- 제거: `const [authorName, setAuthorName] = React.useState("")`
- 추가: `const { nickname, emoji } = useNicknameStore()`

#### Hydration 처리

```ts
React.useEffect(() => {
  useNicknameStore.persist.rehydrate()
  useNicknameStore.getState().init()
}, [])
```

#### UI 변경: 이름 입력 → 읽기 전용 닉네임 표시

기존 `<input type="text" placeholder="이름">` 제거. 대체:

```tsx
<div className="flex items-center gap-2">
  <span className="이모지">{emoji}</span>
  <span className="닉네임 텍스트">{nickname}</span>
</div>
```

- 완전 읽기 전용 — 사용자가 변경하거나 직접 입력할 수 없음
- 닉네임이 빈 문자열인 동안(hydration 전) 영역 숨김

#### 레이아웃 조정

기존 2컬럼 그리드(`sm:grid-cols-[12rem_minmax(0,1fr)]`) → 단일 컬럼. 닉네임 표시를 textarea 위에 배치.

#### 제출 로직

- `authorName: trimmedAuthor` → `authorName: nickname`
- 이름 빈 값 검증 제거 (store가 항상 유효한 닉네임 보장)
- 제출 성공 후 `setAuthorName("")` 제거 (닉네임 유지)

#### 댓글 목록 이모지 표시

```tsx
<p className="닉네임">
  <span>{getEmojiForNickname(comment.authorName)}</span>
  {comment.authorName}
</p>
```

기존 댓글(자유 입력)은 매칭 실패 → `💬` 기본 이모지.

### 4. SSR/Hydration 전략

| 단계 | nickname 값 | 렌더링 |
|---|---|---|
| SSR (빌드) | `""` | 닉네임 영역 숨김 |
| 클라이언트 mount | `""` → rehydrate → localStorage 값 또는 신규 생성 | 닉네임 표시 |

댓글 폼 자체가 이미 클라이언트에서 fetch 후 활성화되므로 hydration 지연이 UX에 영향 없음.

## 변경하지 않는 것

- Worker API (`worker/src/index.ts`) — 변경 없음
- DB 스키마 (`migrations/`) — 변경 없음
- Turnstile 스팸 방지 — 그대로 유지
- 댓글 승인 플로우 — 그대로 유지
- Giscus 프로바이더 — 영향 없음 (NativeComments만 수정)

## 위험 요소 및 롤백

| 위험 | 대응 |
|---|---|
| Zustand hydration mismatch | `skipHydration` + 수동 rehydrate로 해결 |
| 기존 댓글 이모지 매칭 실패 | `💬` 기본 이모지 폴백 |
| 번들 사이즈 증가 | zustand ~1.1KB gzip — 미미 |
| 롤백 | `zustand` 제거 + `native-comments.tsx` git revert (1 commit) |
