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
