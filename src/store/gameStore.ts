import { create } from 'zustand'
import { EquipmentInstance, ScreenType, EnhancementResult } from '../types'
import { STARTING_EQUIPMENT } from '../data/startingEquipment'

interface GameState {
  // ===== 화면 =====
  currentScreen: ScreenType
  setScreen: (screen: ScreenType) => void

  // ===== 턴 시스템 =====
  turn: number          // 전체 턴 수
  week: number          // 1~4
  month: number
  year: number
  advanceTurn: () => void

  // ===== 자원 =====
  gold: number
  divineRank: number    // 0~100
  divinePower: number
  maxDivinePower: number
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  addDivinePower: (amount: number) => void
  spendDivinePower: (amount: number) => boolean
  adjustDivineRank: (delta: number) => void

  // ===== 장비 =====
  equipment: EquipmentInstance[]
  selectedEquipmentId: string | null
  selectEquipment: (id: string | null) => void
  updateEquipment: (updated: EquipmentInstance) => void
  removeEquipment: (id: string) => void
  addEquipment: (item: EquipmentInstance) => void

  // ===== 강화 결과 (팝업용) =====
  lastEnhancementResult: EnhancementResult | null
  setLastEnhancementResult: (result: EnhancementResult | null) => void

  // ===== 게임 상태 =====
  isGameOver: boolean
  isClear: boolean
  triggerGameOver: () => void
  triggerClear: () => void
  resetGame: () => void
}

const calcDate = (turn: number) => ({
  week: ((turn - 1) % 4) + 1,
  month: Math.floor((turn - 1) / 4) + 1,
  year: Math.floor((turn - 1) / 48) + 1,
})

const initialState = {
  currentScreen: 'title' as ScreenType,
  turn: 1,
  week: 1,
  month: 1,
  year: 1,
  gold: 500,
  divineRank: 10,
  divinePower: 50,
  maxDivinePower: 100,
  equipment: [...STARTING_EQUIPMENT],
  selectedEquipmentId: null,
  lastEnhancementResult: null,
  isGameOver: false,
  isClear: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setScreen: (screen) => set({ currentScreen: screen }),

  advanceTurn: () => {
    const nextTurn = get().turn + 1
    const date = calcDate(nextTurn)
    // 매 턴 신성력 소폭 회복
    const newDivinePower = Math.min(
      get().divinePower + 5,
      get().maxDivinePower
    )
    // 강화 잠금 턴 감소
    const updatedEquipment = get().equipment.map((eq) =>
      eq.enhancementLockTurns > 0
        ? { ...eq, enhancementLockTurns: eq.enhancementLockTurns - 1 }
        : eq
    )
    set({
      turn: nextTurn,
      ...date,
      divinePower: newDivinePower,
      equipment: updatedEquipment,
    })
  },

  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),
  spendGold: (amount) => {
    if (get().gold < amount) return false
    set((s) => ({ gold: s.gold - amount }))
    return true
  },

  addDivinePower: (amount) =>
    set((s) => ({
      divinePower: Math.min(s.divinePower + amount, s.maxDivinePower),
    })),
  spendDivinePower: (amount) => {
    if (get().divinePower < amount) return false
    set((s) => ({ divinePower: s.divinePower - amount }))
    return true
  },

  adjustDivineRank: (delta) =>
    set((s) => ({
      divineRank: Math.max(0, Math.min(100, s.divineRank + delta)),
    })),

  selectEquipment: (id) => set({ selectedEquipmentId: id }),

  updateEquipment: (updated) =>
    set((s) => ({
      equipment: s.equipment.map((eq) =>
        eq.id === updated.id ? updated : eq
      ),
    })),

  removeEquipment: (id) =>
    set((s) => ({
      equipment: s.equipment.filter((eq) => eq.id !== id),
      selectedEquipmentId:
        s.selectedEquipmentId === id ? null : s.selectedEquipmentId,
    })),

  addEquipment: (item) =>
    set((s) => ({ equipment: [...s.equipment, item] })),

  setLastEnhancementResult: (result) =>
    set({ lastEnhancementResult: result }),

  triggerGameOver: () => set({ isGameOver: true }),
  triggerClear: () => set({ isClear: true }),

  resetGame: () =>
    set({
      ...initialState,
      equipment: STARTING_EQUIPMENT.map((eq) => ({ ...eq })),
    }),
}))
