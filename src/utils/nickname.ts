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
