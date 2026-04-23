# Random Nickname System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 토스 기술 블로그 스타일의 "형용사 + 동물" 랜덤 닉네임을 네이티브 댓글 시스템에 적용한다.

**Architecture:** 닉네임 생성은 순수 유틸리티 함수, 상태 관리는 Zustand store (persist 미들웨어로 localStorage 자동 동기화), UI는 기존 native-comments.tsx 수정. 서버/DB 변경 없음.

**Tech Stack:** React 18, TypeScript, Zustand (persist middleware), Gatsby 5

---

## File Structure

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/utils/nickname.ts` | 형용사/동물 배열, `generateNickname()`, `getEmojiForNickname()` |
| Create | `src/stores/nickname-store.ts` | Zustand store — nickname + emoji 상태, init 액션, localStorage persist |
| Modify | `src/components/native-comments.tsx` | authorName 입력 → 읽기 전용 닉네임 표시, hydration, 이모지 |

---

### Task 1: Install zustand

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install zustand**

```bash
npm install zustand
```

- [ ] **Step 2: Verify installation**

```bash
node -e "require('zustand')" && echo "OK"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add zustand dependency for nickname store"
```

---

### Task 2: Create nickname utility (`src/utils/nickname.ts`)

**Files:**
- Create: `src/utils/nickname.ts`

- [ ] **Step 1: Create the nickname utility file**

```ts
const ADJECTIVES = [
  "용감한",
  "느긋한",
  "활기찬",
  "씩씩한",
  "재미있는",
  "똑똑한",
  "다정한",
  "호기심많은",
  "당당한",
  "명랑한",
  "엉뚱한",
  "신비로운",
  "유쾌한",
  "차분한",
  "열정적인",
  "소심한",
  "영리한",
  "상냥한",
  "대담한",
  "천진난만한",
  "듬직한",
  "깜찍한",
  "낙천적인",
  "정직한",
  "수줍은",
  "쾌활한",
  "침착한",
  "따뜻한",
  "부지런한",
  "지혜로운",
] as const

const ANIMALS = [
  { name: "펭귄", emoji: "🐧" },
  { name: "수달", emoji: "🦦" },
  { name: "고양이", emoji: "🐱" },
  { name: "여우", emoji: "🦊" },
  { name: "부엉이", emoji: "🦉" },
  { name: "햄스터", emoji: "🐹" },
  { name: "너구리", emoji: "🦝" },
  { name: "판다", emoji: "🐼" },
  { name: "돌고래", emoji: "🐬" },
  { name: "토끼", emoji: "🐰" },
  { name: "강아지", emoji: "🐶" },
  { name: "코알라", emoji: "🐨" },
  { name: "사자", emoji: "🦁" },
  { name: "호랑이", emoji: "🐯" },
  { name: "곰", emoji: "🐻" },
  { name: "기린", emoji: "🦒" },
  { name: "코끼리", emoji: "🐘" },
  { name: "다람쥐", emoji: "🐿️" },
  { name: "원숭이", emoji: "🐵" },
  { name: "앵무새", emoji: "🦜" },
  { name: "나비", emoji: "🦋" },
  { name: "거북이", emoji: "🐢" },
  { name: "고래", emoji: "🐳" },
  { name: "물개", emoji: "🦭" },
  { name: "오리", emoji: "🦆" },
  { name: "꿀벌", emoji: "🐝" },
  { name: "양", emoji: "🐑" },
  { name: "사슴", emoji: "🦌" },
  { name: "문어", emoji: "🐙" },
  { name: "하마", emoji: "🦛" },
] as const

export interface Nickname {
  text: string
  emoji: string
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

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit src/utils/nickname.ts 2>&1 || echo "check with full build"
npm run build 2>&1 | tail -5
```

Expected: no type errors related to nickname.ts

- [ ] **Step 3: Commit**

```bash
git add src/utils/nickname.ts
git commit -m "feat: add nickname generation utility (adjective + animal)"
```

---

### Task 3: Create Zustand store (`src/stores/nickname-store.ts`)

**Files:**
- Create: `src/stores/nickname-store.ts`

- [ ] **Step 1: Create the store file**

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
        if (get().nickname) return
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

- [ ] **Step 2: Verify build passes**

```bash
npm run build 2>&1 | tail -5
```

Expected: build succeeds, no type errors

- [ ] **Step 3: Commit**

```bash
git add src/stores/nickname-store.ts
git commit -m "feat: add Zustand nickname store with localStorage persist"
```

---

### Task 4: Update native-comments.tsx — replace authorName input with nickname display

**Files:**
- Modify: `src/components/native-comments.tsx`

- [ ] **Step 1: Add imports**

Add at the top of `native-comments.tsx`, after existing imports:

```ts
import { useNicknameStore } from "../stores/nickname-store"
import { getEmojiForNickname } from "../utils/nickname"
```

- [ ] **Step 2: Replace authorName state with Zustand store**

Remove this line (~line 85):
```ts
const [authorName, setAuthorName] = React.useState("")
```

Add in its place:
```ts
const { nickname, emoji } = useNicknameStore()
```

- [ ] **Step 3: Add hydration useEffect**

Add a new `useEffect` after the existing Turnstile effect (after ~line 151):

```ts
React.useEffect(() => {
  useNicknameStore.persist.rehydrate()
  useNicknameStore.getState().init()
}, [])
```

- [ ] **Step 4: Replace the name input with read-only nickname display**

Replace the grid and input section (~lines 217-234):

```tsx
{/* Before: grid with input + textarea */}
<div className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)]">
  <input
    type="text"
    value={authorName}
    onChange={event => setAuthorName(event.target.value)}
    placeholder="이름"
    maxLength={40}
    className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500"
  />
  <textarea ... />
</div>
```

Replace with:

```tsx
<div className="space-y-3">
  {nickname && (
    <div className="flex items-center gap-2">
      <span className="text-lg leading-none">{emoji}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
        {nickname}
      </span>
    </div>
  )}
  <textarea
    value={body}
    onChange={event => setBody(event.target.value)}
    placeholder="댓글을 남겨주세요."
    rows={4}
    maxLength={2000}
    className="w-full min-h-[7rem] rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500"
  />
</div>
```

- [ ] **Step 5: Update submit handler**

In `handleSubmit` (~line 160-165), replace:

```ts
const trimmedAuthor = authorName.trim()
const trimmedBody = body.trim()
if (!trimmedAuthor || trimmedBody.length < 2) {
  setErrorMessage("이름과 댓글 내용을 입력해주세요.")
  return
}
```

With:

```ts
const trimmedBody = body.trim()
if (trimmedBody.length < 2) {
  setErrorMessage("댓글 내용을 입력해주세요.")
  return
}
```

In the fetch body (~line 186), replace:

```ts
authorName: trimmedAuthor,
```

With:

```ts
authorName: nickname,
```

Remove the line (~line 198):

```ts
setAuthorName("")
```

- [ ] **Step 6: Add emoji to comment list items**

In the comment list rendering (~line 273), replace:

```tsx
<p className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100">{comment.authorName}</p>
```

With:

```tsx
<p className="m-0 text-sm font-semibold text-gray-900 dark:text-gray-100">
  <span className="mr-1.5">{getEmojiForNickname(comment.authorName)}</span>
  {comment.authorName}
</p>
```

- [ ] **Step 7: Run lint**

```bash
npm run lint
```

Expected: no errors in native-comments.tsx

- [ ] **Step 8: Run build**

```bash
npm run build
```

Expected: build succeeds

- [ ] **Step 9: Commit**

```bash
git add src/components/native-comments.tsx
git commit -m "feat: replace name input with auto-generated random nickname"
```

---

### Task 5: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

- [ ] **Step 2: Verify nickname generation**

Open any blog post with native comments. Confirm:
- Random nickname (형용사 + 동물) is displayed with emoji above the textarea
- No name input field exists
- Nickname persists on page refresh (same nickname)
- Nickname persists across different blog posts (same nickname)

- [ ] **Step 3: Verify comment submission**

Submit a test comment. Confirm:
- Comment is submitted with the generated nickname as authorName
- Success message appears
- Nickname remains after submission (not cleared)

- [ ] **Step 4: Verify comment list emoji**

Check existing comments in the list. Confirm:
- Comments with matching animal names show the correct emoji
- Comments with non-matching names show the default 💬 emoji

- [ ] **Step 5: Verify localStorage**

Open browser DevTools > Application > Local Storage. Confirm:
- Key `oddn-nickname` exists with JSON containing `nickname` and `emoji` fields

- [ ] **Step 6: Verify SSR**

View page source (Ctrl+U). Confirm:
- No nickname text in the HTML source (rendered client-side only)
- No hydration mismatch warnings in the browser console

---

### Task 6: Final lint + build verification

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings related to changed files

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: build succeeds with no errors

- [ ] **Step 3: Run tests (if applicable)**

```bash
npm run test 2>&1 | tail -20
```

Expected: existing E2E tests pass (comment-related tests may need the dev server running)

- [ ] **Step 4: Final commit (if any lint fixes were needed)**

```bash
git add -A
git commit -m "fix: lint fixes for nickname system"
```

Only if step 1 required changes.
