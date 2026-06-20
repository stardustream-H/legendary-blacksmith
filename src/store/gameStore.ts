import { create } from 'zustand'
import {
  EquipmentInstance, ScreenType, EnhancementResult, Commission,
  Adventurer, Region, ExpeditionResult, Retainer, TroopSlot, WaveResult,
  STAT_GRADE_VALUE, TROOP_TYPE_NAMES, MerchantGuild, ShopItem,
  DIVINE_TURN_RECOVERY, DIVINE_RANK_TIERS, BarracksTroop, BarracksTroopType,
  GRADE_BUY_PRICE, GRADE_SELL_PRICE, LEVEL_PRICE_MULTIPLIER, WallState,
  WALL_MAX_DURABILITY, WALL_UPGRADE_COST, WALL_REPAIR_COST_PER_POINT,
  WALL_DEFENSE_POWER, WALL_MAX_LEVEL, GradeType, StatGrade, CharacterClass,
  WAVE_SCHEDULE, TurnReport,
} from '../types'
import { STARTING_EQUIPMENT } from '../data/startingEquipment'
import { STARTING_ADVENTURERS } from '../data/adventurers'
import { STARTING_REGIONS } from '../data/regions'
import { STARTING_RETAINERS, STARTING_TROOP_SLOTS } from '../data/retainers'
import { STARTING_BARRACKS, TROOP_CONFIGS, calcTotalBarracksPower } from '../data/barracksData'
import { STARTING_MERCHANT_GUILDS } from '../data/shop'
import { generateCommissions } from '../systems/commissionSystem'
import {
  resolveExpedition, calculateReturnTurn, generateNewAdventurer,
  generateRewardEquipment, calcInjuryDuration,
} from '../systems/guildSystem'


// ===== 왕국 파견 요청 후보 생성 =====
const KINGDOM_CANDIDATE_NAMES = [
  '용감한 고도', '강인한 박서현', '냉철한 이준', '날렵한 최아름', '충직한 정우성',
  '독한 오민재', '지략가 강혜린', '흔들림없는 한동현', '단호한 신지연', '영리한 윤태오',
  '강철의 임수빈', '전장의 남궁철', '매서운 백현우', '끈질긴 조성민', '예리한 황다은',
]

const CANDIDATE_CLASSES: CharacterClass[] = [
  'knight', 'swordsman', 'archer', 'spearman', 'mage', 'priest', 'rogue',
]

const GRADE_POOL: StatGrade[] = ['E', 'D', 'C', 'B', 'A']
const GRADE_WEIGHTS =                [5,   15,  40,  30,  10]

function weightedGrade(): StatGrade {
  const total = GRADE_WEIGHTS.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < GRADE_POOL.length; i++) {
    r -= GRADE_WEIGHTS[i]
    if (r <= 0) return GRADE_POOL[i]
  }
  return 'C'
}

function generateKingdomCandidate(idx: number): Retainer {
  const name = KINGDOM_CANDIDATE_NAMES[Math.floor(Math.random() * KINGDOM_CANDIDATE_NAMES.length)]
  const cls = CANDIDATE_CLASSES[Math.floor(Math.random() * CANDIDATE_CLASSES.length)]
  const salaryBase: Record<string, number> = {
    knight: 80, swordsman: 60, archer: 65, spearman: 55, mage: 90, priest: 75, rogue: 50,
  }
  return {
    id: `cand_${Date.now()}_${idx}`,
    name,
    characterClass: cls,
    stats: {
      proficiency: weightedGrade(),
      judgment:    weightedGrade(),
      vitality:    weightedGrade(),
      courage:     weightedGrade(),
    },
    loyalty: 60 + Math.floor(Math.random() * 20),
    salary: (salaryBase[cls] ?? 60) + Math.floor(Math.random() * 3) * 10,
    equippedWeaponId: null,
    equippedArmorId: null,
    isActive: true,
    quirk: '',
  }
}

// ===== 웨이브 전투력 계산 =====
function calcTroopPower(slot: TroopSlot, retainers: Retainer[]): number {
  if (!slot.commanderId) return 8 // 지휘관 없는 기본 전력
  const commander = retainers.find(r => r.id === slot.commanderId)
  if (!commander) return 8
  const prof = STAT_GRADE_VALUE[commander.stats.proficiency] ?? 1
  const cour = STAT_GRADE_VALUE[commander.stats.courage] ?? 1
  return prof * 15 + cour * 10 + 20 // 지휘관 보너스
}

function getWaveEntry(waveNumber: number) {
  return WAVE_SCHEDULE[waveNumber - 1] ?? WAVE_SCHEDULE[WAVE_SCHEDULE.length - 1]
}

interface GameState {
  // ===== 화면 =====
  currentScreen: ScreenType
  setScreen: (screen: ScreenType) => void

  // ===== 턴 시스템 =====
  turn: number
  week: number
  month: number
  year: number
  advanceTurn: () => void

  // ===== 자원 =====
  gold: number
  divineRank: number
  divinePower: number
  addGold: (amount: number) => void
  spendGold: (amount: number) => boolean
  addDivinePower: (amount: number) => void
  spendDivinePower: (amount: number) => boolean
  adjustDivineRank: (delta: number) => void
  upgradeDivineRank: () => boolean

  // ===== 장비 =====
  equipment: EquipmentInstance[]
  selectedEquipmentId: string | null
  selectEquipment: (id: string | null) => void
  updateEquipment: (updated: EquipmentInstance) => void
  removeEquipment: (id: string) => void
  addEquipment: (item: EquipmentInstance) => void

  // ===== 강화 결과 팝업 =====
  lastEnhancementResult: EnhancementResult | null
  setLastEnhancementResult: (result: EnhancementResult | null) => void

  // ===== 의뢰 시스템 =====
  commissions: Commission[]
  commissionEquipmentId: string | null
  setCommissions: (commissions: Commission[]) => void
  acceptCommission: (id: string) => void
  completeCommission: (id: string, success: boolean) => void
  setCommissionEquipment: (id: string | null) => void

  // ===== 모험가 길드 =====
  adventurers: Adventurer[]
  regions: Region[]
  pendingExpeditionResult: ExpeditionResult | null
  nextRecruitTurn: number
  dispatchExpedition: (regionId: string, partyIds: string[], lentEquipmentId: string | null) => void

  // ===== 왕국 파견 요청 (가신 영입) =====
  lastKingdomRequestMonth: number
  kingdomCandidates: Retainer[]
  requestKingdomDispatch: () => boolean
  recruitCandidate: (retainerId: string) => void
  dismissKingdomCandidates: () => void
  receiveExpeditionResult: (regionId: string) => void
  clearExpeditionResult: () => void

  // ===== 영지 가신단 =====
  retainers: Retainer[]
  troopSlots: TroopSlot[]
  barracks: BarracksTroop[]
  unlockOrUpgradeTroop: (type: BarracksTroopType) => boolean
  equipWeapon: (retainerId: string, equipmentId: string | null) => void
  equipArmor: (retainerId: string, equipmentId: string | null) => void
  assignCommander: (troopSlotId: string, retainerId: string | null) => void
  updateRetainer: (updated: Retainer) => void

  // ===== 영지 경제 =====
  baseTerritoryIncome: number
  waveDefenseBonus: number
  lastMonthlyReport: string | null
  clearMonthlyReport: () => void
  addWaveDefenseBonus: (amount: number) => void

  // ===== 웨이브 시스템 =====
  nextWaveTurn: number
  waveNumber: number       // 처리된 웨이브 수
  pendingTurnReport: TurnReport | null
  clearTurnReport: () => void
  pendingWaveEvent: boolean
  waveResult: WaveResult | null
  resolveWave: () => void
  clearWaveResult: () => void

  // ===== 상점 시스템 =====
  merchantGuilds: MerchantGuild[]
  sellEquipment: (equipmentId: string) => void
  buyShopItem: (guildId: string, itemId: string) => boolean
  visitMerchant: (guildId: string) => void   // 내부용 (advanceTurn 호출)

  // ===== 성벽 =====
  wall: WallState
  upgradeWall: () => boolean
  repairWall: (amount: number) => boolean

  // ===== 게임 상태 =====
  isGameOver: boolean
  isClear: boolean
  tutorialSeen: boolean
  triggerGameOver: () => void
  triggerClear: () => void
  completeTutorial: () => void
  resetGame: () => void
}

const calcDate = (turn: number) => ({
  week: ((turn - 1) % 4) + 1,
  month: Math.floor((turn - 1) / 4) + 1,
  year: Math.floor((turn - 1) / 48) + 1,
})

const initialState = {
  currentScreen: 'title' as ScreenType,
  turn: 1, week: 1, month: 1, year: 1,
  gold: 800,
  divineRank: 0,
  divinePower: 50,
  equipment: [...STARTING_EQUIPMENT],
  selectedEquipmentId: null,
  lastEnhancementResult: null,
  commissions: [] as Commission[],
  commissionEquipmentId: null,
  adventurers: [...STARTING_ADVENTURERS],
  regions: STARTING_REGIONS.map(r => ({ ...r })),
  pendingExpeditionResult: null,
  nextRecruitTurn: 4,
  lastKingdomRequestMonth: 0,
  kingdomCandidates: [] as Retainer[],
  retainers: [...STARTING_RETAINERS],
  troopSlots: [...STARTING_TROOP_SLOTS],
  barracks: STARTING_BARRACKS.map(t => ({ ...t })),
  baseTerritoryIncome: 200,
  waveDefenseBonus: 0,
  lastMonthlyReport: null,
  nextWaveTurn: 24,
  waveNumber: 0,
  pendingTurnReport: null,
  pendingWaveEvent: false,
  waveResult: null as WaveResult | null,
  merchantGuilds: STARTING_MERCHANT_GUILDS.map(g => ({ ...g })),
  wall: { level: 1, durability: 150, maxDurability: 150 } as WallState,
  isGameOver: false,
  isClear: false,
  tutorialSeen: false,
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initialState,

  setScreen: (screen) => set({ currentScreen: screen }),

  advanceTurn: () => {
    const state = get()
    const nextTurn = state.turn + 1
    const date = calcDate(nextTurn)
    const recovery = DIVINE_TURN_RECOVERY[state.divineRank] ?? 6
    const newDivinePower = state.divinePower + recovery

    const updatedEquipment = state.equipment.map((eq) =>
      eq.enhancementLockTurns > 0
        ? { ...eq, enhancementLockTurns: eq.enhancementLockTurns - 1 }
        : eq
    )

    const updatedAdventurers = state.adventurers.map((a) => {
      if (a.status === 'injured' && a.injuredUntilTurn !== null && a.injuredUntilTurn <= nextTurn) {
        return { ...a, status: 'available' as const, injuredUntilTurn: null }
      }
      return a
    })

    let finalAdventurers = updatedAdventurers
    let nextRecruitTurn = state.nextRecruitTurn
    if (nextTurn >= state.nextRecruitTurn) {
      finalAdventurers = [...updatedAdventurers, generateNewAdventurer()]
      nextRecruitTurn = nextTurn + 3 + Math.floor(Math.random() * 5)
    }

    const newCommissions = generateCommissions(state.divineRank, nextTurn)

    // 월 결산 (4턴 = 1개월)
    let updatedRetainers = state.retainers
    let monthlyReport: string | null = null
    let goldAfterMonth = state.gold

    if (nextTurn % 4 === 0) {
      const liberatedIncome = state.regions
        .filter(r => r.status === 'liberated')
        .reduce((sum, r) => sum + r.liberationMonthlyIncome, 0)
      const totalIncome = state.baseTerritoryIncome + state.waveDefenseBonus + liberatedIncome
      const totalSalary = state.retainers
        .filter(r => r.isActive && r.salary > 0)
        .reduce((sum, r) => sum + r.salary, 0)

      goldAfterMonth = state.gold + totalIncome

      if (goldAfterMonth >= totalSalary) {
        goldAfterMonth -= totalSalary
        updatedRetainers = state.retainers.map(r =>
          r.isActive && r.salary > 0
            ? { ...r, loyalty: Math.min(100, r.loyalty + 2) }
            : r
        )
        monthlyReport = `📅 월 결산: 수입 +${totalIncome}G / 봉급 -${totalSalary}G / 순이익 +${totalIncome - totalSalary}G`
      } else {
        updatedRetainers = state.retainers.map(r => {
          if (!r.isActive || r.salary <= 0) return r
          const newLoyalty = Math.max(0, r.loyalty - 15)
          return { ...r, loyalty: newLoyalty, isActive: newLoyalty > 0 }
        })
        monthlyReport = `⚠️ 봉급 미지급! 수입 +${totalIncome}G — 봉급 ${totalSalary}G 부족. 가신들의 충성도가 하락했습니다.`
      }
    }

    // 웨이브 체크
    const pendingWaveEvent = nextTurn >= state.nextWaveTurn && !state.pendingWaveEvent

    // 상인 방문 체크
    const updatedGuilds = state.merchantGuilds.map(guild => {
      if (nextTurn >= guild.nextVisitTurn) {
        // 새 재고 생성 (3~6개)
        const count = 3 + Math.floor(Math.random() * 4)
        const grades: GradeType[] = ['common', 'common', 'fine', 'fine', 'fine', 'rare']
        const newInventory: ShopItem[] = []
        for (let i = 0; i < count; i++) {
          const grade = grades[Math.floor(Math.random() * grades.length)]
          const eq = generateRewardEquipment(grade)
          newInventory.push({
            id: `shop_${nextTurn}_${i}`,
            equipment: eq,
            buyPrice: GRADE_BUY_PRICE[grade],
            soldOut: false,
          })
        }
        const interval = 4 + Math.floor(Math.random() * 5) // 4~8턴
        return { ...guild, inventory: newInventory, nextVisitTurn: nextTurn + interval }
      }
      return guild
    })

    // 모험가 회복 목록
    const recoveredAdventurers = updatedAdventurers
      .filter(a => {
        const prev = state.adventurers.find(p => p.id === a.id)
        return prev && prev.status === 'injured' && a.status === 'available'
      })
      .map(a => a.name)

    // 새 모험가
    const newAdventurerName = finalAdventurers.length > updatedAdventurers.length
      ? finalAdventurers[finalAdventurers.length - 1].name
      : null

    // 상인 방문
    const merchantVisited = updatedGuilds
      .filter((g, i) => g.inventory.length > 0 && state.merchantGuilds[i].nextVisitTurn === nextTurn)
      .map(g => g.name)

    // 월 결산 수입
    let reportIncome = 0
    let reportSalary = 0
    if (nextTurn % 4 === 0) {
      const liberatedIncome = state.regions
        .filter(r => r.status === 'liberated')
        .reduce((sum, r) => sum + r.liberationMonthlyIncome, 0)
      reportIncome = state.baseTerritoryIncome + state.waveDefenseBonus + liberatedIncome
      reportSalary = state.retainers
        .filter(r => r.isActive && r.salary > 0)
        .reduce((sum, r) => sum + r.salary, 0)
    }

    // 왕국 파견 가능 여부
    const kingdomRequestAvailable = state.kingdomCandidates.length > 0

    // 웨이브 경고
    const waveWarning = pendingWaveEvent

    const turnReport: TurnReport = {
      turn: nextTurn,
      divinePowerGain: recovery,
      newDivinePower: newDivinePower,
      monthlyReport: monthlyReport,
      isMonthlyTurn: nextTurn % 4 === 0,
      income: reportIncome,
      salary: reportSalary,
      newCommissions: newCommissions.map(c => ({
        id: c.id,
        name: c.equipment.name,
        grade: c.grade,
        reward: c.rewardGold,
      })),
      merchantVisited,
      adventurerRecovered: recoveredAdventurers,
      newAdventurerName,
      kingdomRequestAvailable,
      waveWarning,
    }

    set({
      turn: nextTurn, ...date,
      divinePower: newDivinePower,
      equipment: updatedEquipment,
      adventurers: finalAdventurers,
      nextRecruitTurn,
      commissions: newCommissions,
      commissionEquipmentId: null,
      retainers: updatedRetainers,
      gold: goldAfterMonth,
      lastMonthlyReport: monthlyReport,
      pendingWaveEvent: pendingWaveEvent ? true : state.pendingWaveEvent,
      merchantGuilds: updatedGuilds,
      pendingTurnReport: turnReport,
    })
  },

  clearTurnReport: () => set({ pendingTurnReport: null }),
  addGold: (amount) => set((s) => ({ gold: s.gold + amount })),
  spendGold: (amount) => {
    if (get().gold < amount) return false
    set((s) => ({ gold: s.gold - amount }))
    return true
  },
  addDivinePower: (amount) =>
    set((s) => ({ divinePower: s.divinePower + amount })),
  spendDivinePower: (amount) => {
    if (get().divinePower < amount) return false
    set((s) => ({ divinePower: s.divinePower - amount }))
    return true
  },
  adjustDivineRank: (delta) =>
    set((s) => ({ divinePower: Math.max(0, s.divinePower + delta) })),
  unlockOrUpgradeTroop: (type) => {
    const state = get()
    const troop = state.barracks.find(t => t.type === type)
    const cfg = TROOP_CONFIGS.find(c => c.type === type)
    if (!troop || !cfg) return false
    const nextTier = troop.tier + 1
    if (nextTier > 3) return false
    const cost = cfg.upgradeCosts[nextTier - 1]
    if (cost > 0 && state.gold < cost) return false
    if (cost > 0) get().spendGold(cost)
    set((s) => ({
      barracks: s.barracks.map(t =>
        t.type === type ? { ...t, tier: nextTier } : t
      ),
    }))
    return true
  },
  upgradeDivineRank: () => {
    const state = get()
    if (state.divineRank >= 6) return false
    const nextTier = DIVINE_RANK_TIERS[state.divineRank + 1]
    if (!nextTier || state.divinePower < nextTier.upgradeCost) return false
    set((s) => ({ divineRank: s.divineRank + 1, divinePower: s.divinePower - nextTier.upgradeCost }))
    return true
  },

  selectEquipment: (id) => set({ selectedEquipmentId: id }),
  updateEquipment: (updated) =>
    set((s) => ({ equipment: s.equipment.map((eq) => (eq.id === updated.id ? updated : eq)) })),
  removeEquipment: (id) =>
    set((s) => ({
      equipment: s.equipment.filter((eq) => eq.id !== id),
      selectedEquipmentId: s.selectedEquipmentId === id ? null : s.selectedEquipmentId,
    })),
  addEquipment: (item) => set((s) => ({ equipment: [...s.equipment, item] })),

  setLastEnhancementResult: (result) => set({ lastEnhancementResult: result }),

  setCommissions: (commissions) => set({ commissions }),
  acceptCommission: (id) =>
    set((s) => ({
      commissions: s.commissions.map((c) => c.id === id ? { ...c, accepted: true } : c),
    })),
  completeCommission: (id, success) => {
    const store = get()
    const comm = store.commissions.find((c) => c.id === id)
    if (!comm) return
    if (success) {
      store.addGold(comm.rewardGold)
      store.addDivinePower(comm.rewardDivinePower)
    }
    set((s) => ({
      commissions: s.commissions.map((c) => c.id === id ? { ...c, processed: true } : c),
      equipment: s.equipment.filter((eq) => eq.id !== comm.equipment.id),
      selectedEquipmentId:
        s.selectedEquipmentId === comm.equipment.id ? null : s.selectedEquipmentId,
      commissionEquipmentId: null,
    }))
  },
  setCommissionEquipment: (id) => set({ commissionEquipmentId: id }),

  // ===== 길드 액션 =====
  dispatchExpedition: (regionId, partyIds, lentEquipmentId) => {
    const state = get()
    const region = state.regions.find(r => r.id === regionId)
    const party = state.adventurers.filter(a => partyIds.includes(a.id))
    const lentEquipment = lentEquipmentId
      ? state.equipment.find(eq => eq.id === lentEquipmentId) ?? null
      : null
    if (!region || party.length === 0) return

    const returnsOnTurn = calculateReturnTurn(region, party, lentEquipment, state.turn)
    set((s) => ({
      regions: s.regions.map(r =>
        r.id === regionId
          ? { ...r, currentExpedition: { partyIds, lentEquipmentId, departedOnTurn: state.turn, returnsOnTurn } }
          : r
      ),
      adventurers: s.adventurers.map(a =>
        partyIds.includes(a.id)
          ? { ...a, status: 'dispatched' as const, dispatchedRegionId: regionId, lentEquipmentId }
          : a
      ),
    }))
  },

  receiveExpeditionResult: (regionId) => {
    const state = get()
    const region = state.regions.find(r => r.id === regionId)
    if (!region?.currentExpedition) return

    const expedition = region.currentExpedition
    const party = state.adventurers.filter(a => expedition.partyIds.includes(a.id))
    const lentEquipment = expedition.lentEquipmentId
      ? state.equipment.find(eq => eq.id === expedition.lentEquipmentId) ?? null
      : null

    const baseResult = resolveExpedition(region, expedition, party, lentEquipment)
    if (baseResult.goldEarned > 0) get().addGold(baseResult.goldEarned)
    if (baseResult.divinePowerEarned > 0) get().addDivinePower(baseResult.divinePowerEarned)

    const newProgress = Math.min(100, region.liberationProgress + baseResult.liberationGain)
    const newStatus = newProgress >= 100 ? 'liberated' as const : region.status
    const justLiberated = newStatus === 'liberated' && region.status !== 'liberated'

    const liberationRewardEquipment: EquipmentInstance[] = []
    if (justLiberated) {
      for (let i = 0; i < region.liberationEquipmentCount; i++) {
        const grades = region.rewardEquipmentGrades
        liberationRewardEquipment.push(
          generateRewardEquipment(grades[Math.floor(Math.random() * grades.length)])
        )
      }
    }

    set((s) => {
      let newEquipment = baseResult.equipmentEarned
        ? [...s.equipment.filter(eq => eq.id !== baseResult.lostEquipmentId), baseResult.equipmentEarned]
        : s.equipment.filter(eq => eq.id !== baseResult.lostEquipmentId)
      if (liberationRewardEquipment.length > 0) newEquipment = [...newEquipment, ...liberationRewardEquipment]

      // 이 지역이 해방되면 업데이트된 지역 목록으로 잠금 해제 체크
      const updatedRegions = s.regions.map(r =>
        r.id === regionId
          ? { ...r, liberationProgress: newProgress, status: newStatus, currentExpedition: null }
          : r
      )

      // 잠금 해제 로직: unlockRequires 조건 충족 시 locked → available, hidden → available
      const liberatedIds = new Set(updatedRegions.filter(r => r.status === 'liberated').map(r => r.id))
      const unlockedRegions = updatedRegions.map(r => {
        if ((r.status === 'locked' || r.status === 'hidden') && r.unlockRequires && r.unlockRequires.length > 0) {
          const mode = r.unlockMode ?? 'any'
          const meetsCondition = mode === 'all'
            ? r.unlockRequires.every(reqId => liberatedIds.has(reqId))
            : r.unlockRequires.some(reqId => liberatedIds.has(reqId))
          if (meetsCondition) {
            return { ...r, status: 'available' as const }
          }
        }
        return r
      })

      // 진엔딩: isTrueEndingTrigger 지역이 방금 해방됐는지 체크
      const justTriggeredTrueEnding = justLiberated &&
        region.isTrueEndingTrigger === true

      return {
        regions: unlockedRegions,
        equipment: newEquipment,
        adventurers: s.adventurers.map(a => {
          if (!expedition.partyIds.includes(a.id)) return a
          const isInjured = baseResult.injuredAdventurerIds.includes(a.id)
          return {
            ...a,
            status: isInjured ? ('injured' as const) : ('available' as const),
            injuredUntilTurn: isInjured ? s.turn + calcInjuryDuration(a.stats) : null,
            dispatchedRegionId: null,
            lentEquipmentId: null,
          }
        }),
        pendingExpeditionResult: { ...baseResult, justLiberated, liberationRewardEquipment },
        ...(justTriggeredTrueEnding ? { isClear: true } : {}),
      }
    })
  },

  clearExpeditionResult: () => set({ pendingExpeditionResult: null }),

  // ===== 가신 장비 =====
  equipWeapon: (retainerId, equipmentId) =>
    set((s) => ({
      retainers: s.retainers.map(r =>
        r.id === retainerId ? { ...r, equippedWeaponId: equipmentId } : r
      ),
    })),

  equipArmor: (retainerId, equipmentId) =>
    set((s) => ({
      retainers: s.retainers.map(r =>
        r.id === retainerId ? { ...r, equippedArmorId: equipmentId } : r
      ),
    })),

  // ===== 병력 슬롯 지휘관 배치 =====
  assignCommander: (troopSlotId, retainerId) =>
    set((s) => ({
      troopSlots: s.troopSlots.map(t =>
        t.id === troopSlotId ? { ...t, commanderId: retainerId } : t
      ),
    })),

  updateRetainer: (updated) =>
    set((s) => ({
      retainers: s.retainers.map(r => r.id === updated.id ? updated : r),
    })),

  // ===== 영지 경제 =====
  clearMonthlyReport: () => set({ lastMonthlyReport: null }),
  addWaveDefenseBonus: (amount) =>
    set((s) => ({ waveDefenseBonus: s.waveDefenseBonus + amount })),

  // ===== 웨이브 해결 =====
  resolveWave: () => {
    const state = get()
    const waveNumber = state.waveNumber + 1
    const entry = getWaveEntry(waveNumber)
    const enemyStrength = entry.enemyStrength
    const isFinalWave = entry.isFinal === true

    // 병력 전투력 계산
    const combatDetails = state.troopSlots.map(slot => {
      const commander = slot.commanderId
        ? state.retainers.find(r => r.id === slot.commanderId) ?? null
        : null
      const power = calcTroopPower(slot, state.retainers)
      return {
        troopId: slot.id,
        troopType: TROOP_TYPE_NAMES[slot.troopType],
        commanderName: commander ? commander.name : null,
        power,
      }
    })
    const troopPower = combatDetails.reduce((sum, d) => sum + d.power, 0)
    const barracksPower = calcTotalBarracksPower(state.barracks)

    // 성벽 방어력 추가
    const wallPower = WALL_DEFENSE_POWER(state.wall.level, state.wall.durability, state.wall.maxDurability)
    const defensePower = troopPower + wallPower + barracksPower

    // 성벽 내구도 소모 (적 전력의 25%, 최소 10)
    const durabilityDamage = Math.max(10, Math.floor(enemyStrength * 0.25))
    const newDurability = Math.max(0, state.wall.durability - durabilityDamage)

    const outcome = defensePower >= enemyStrength ? 'victory' as const : 'defeat' as const
    let goldChange = 0
    let divineRankChange = 0
    let waveDefenseBonusGained = 0

    if (outcome === 'victory') {
      waveDefenseBonusGained = isFinalWave ? 0 : 30
      goldChange = isFinalWave ? 0 : 50 + waveNumber * 20
      divineRankChange = isFinalWave ? 0 : 20
    } else {
      if (isFinalWave) {
        // 최종 웨이브 패배 = 게임 오버
        goldChange = 0
        divineRankChange = 0
      } else {
        goldChange = -(100 + waveNumber * 30)
        divineRankChange = -30
      }
    }

    // 다음 웨이브 타이밍 — WAVE_SCHEDULE 기반
    const nextEntry = WAVE_SCHEDULE[waveNumber] // waveNumber는 이미 +1된 상태, 다음 인덱스
    const nextWaveTurn = nextEntry ? nextEntry.triggerTurn : 9999

    const result: WaveResult = {
      waveNumber,
      enemyStrength,
      defensePower,
      outcome,
      goldChange,
      divinePowerChange: divineRankChange,
      waveDefenseBonusGained,
      combatDetails,
      waveName: entry.name,
      isFinalWave,
    }

    // 최종 웨이브 패배 시 게임 오버 처리
    if (isFinalWave && outcome === 'defeat') {
      set((s) => ({
        waveNumber,
        nextWaveTurn,
        pendingTurnReport: null,
  pendingWaveEvent: false,
        waveResult: result,
        gold: Math.max(0, s.gold + goldChange),
        divinePower: Math.max(0, s.divinePower + divineRankChange),
        waveDefenseBonus: s.waveDefenseBonus + waveDefenseBonusGained,
        wall: { ...s.wall, durability: newDurability },
        isGameOver: true,
      }))
      return
    }

    // 최종 웨이브 승리 시 클리어 처리
    if (isFinalWave && outcome === 'victory') {
      set((s) => ({
        waveNumber,
        nextWaveTurn,
        pendingTurnReport: null,
  pendingWaveEvent: false,
        waveResult: result,
        gold: Math.max(0, s.gold + goldChange),
        divinePower: Math.max(0, s.divinePower + divineRankChange),
        waveDefenseBonus: s.waveDefenseBonus + waveDefenseBonusGained,
        wall: { ...s.wall, durability: newDurability },
        isClear: true,
      }))
      return
    }

    set((s) => ({
      waveNumber,
      nextWaveTurn,
      pendingTurnReport: null,
  pendingWaveEvent: false,
      waveResult: result,
      gold: Math.max(0, s.gold + goldChange),
      divinePower: Math.max(0, s.divinePower + divineRankChange),
      waveDefenseBonus: s.waveDefenseBonus + waveDefenseBonusGained,
      wall: { ...s.wall, durability: newDurability },
    }))
  },

  clearWaveResult: () => set({ waveResult: null }),
  // ===== 상점 액션 =====
  sellEquipment: (equipmentId) => {
    const state = get()
    const eq = state.equipment.find(e => e.id === equipmentId)
    if (!eq || !eq.isOwned) return
    const base = GRADE_SELL_PRICE[eq.grade as GradeType] ?? 30
    const levelIdx = Math.min(eq.currentLevel, LEVEL_PRICE_MULTIPLIER.length - 1)
    const sellPrice = Math.floor(base * LEVEL_PRICE_MULTIPLIER[levelIdx])
    get().addGold(sellPrice)
    set((s) => ({
      equipment: s.equipment.filter(e => e.id !== equipmentId),
      selectedEquipmentId: s.selectedEquipmentId === equipmentId ? null : s.selectedEquipmentId,
    }))
  },

  buyShopItem: (guildId, itemId) => {
    const state = get()
    const guild = state.merchantGuilds.find(g => g.id === guildId)
    const item = guild?.inventory.find(i => i.id === itemId)
    if (!item || item.soldOut) return false
    if (state.gold < item.buyPrice) return false
    get().spendGold(item.buyPrice)
    const boughtEq = { ...item.equipment, isOwned: true }
    set((s) => ({
      equipment: [...s.equipment, boughtEq],
      merchantGuilds: s.merchantGuilds.map(g =>
        g.id === guildId
          ? { ...g, inventory: g.inventory.map(i => i.id === itemId ? { ...i, soldOut: true } : i) }
          : g
      ),
    }))
    return true
  },

  visitMerchant: (guildId) => {
    // 수동 방문 (테스트용 — 실제로는 advanceTurn이 처리)
    const state = get()
    const grades: GradeType[] = ['common', 'common', 'fine', 'fine', 'fine', 'rare']
    const count = 3 + Math.floor(Math.random() * 4)
    const newInventory: ShopItem[] = []
    for (let i = 0; i < count; i++) {
      const grade = grades[Math.floor(Math.random() * grades.length)]
      const eq = generateRewardEquipment(grade)
      newInventory.push({
        id: `shop_manual_${Date.now()}_${i}`,
        equipment: eq,
        buyPrice: GRADE_BUY_PRICE[grade],
        soldOut: false,
      })
    }
    const interval = 4 + Math.floor(Math.random() * 5)
    set((s) => ({
      merchantGuilds: s.merchantGuilds.map(g =>
        g.id === guildId
          ? { ...g, inventory: newInventory, nextVisitTurn: state.turn + interval }
          : g
      ),
    }))
  },

  // ===== 성벽 액션 =====
  upgradeWall: () => {
    const state = get()
    if (state.wall.level >= WALL_MAX_LEVEL) return false
    const cost = WALL_UPGRADE_COST(state.wall.level)
    if (state.gold < cost) return false
    get().spendGold(cost)
    const newLevel = state.wall.level + 1
    const newMax = WALL_MAX_DURABILITY(newLevel)
    set(() => ({
      wall: { level: newLevel, durability: newMax, maxDurability: newMax },
    }))
    return true
  },

  repairWall: (amount) => {
    const state = get()
    const missing = state.wall.maxDurability - state.wall.durability
    const repairAmount = Math.min(amount, missing)
    if (repairAmount <= 0) return false
    const cost = repairAmount * WALL_REPAIR_COST_PER_POINT
    if (state.gold < cost) return false
    get().spendGold(cost)
    set(() => ({
      wall: { ...state.wall, durability: state.wall.durability + repairAmount },
    }))
    return true
  },



  // ===== 왕국 파견 요청 (가신 영입) =====
  requestKingdomDispatch: () => {
    const state = get()
    const currentMonth = Math.floor((state.turn - 1) / 4) + 1
    if (state.lastKingdomRequestMonth >= currentMonth) return false
    const count = 2 + Math.floor(Math.random() * 4) // 2~5명
    const candidates: Retainer[] = []
    for (let i = 0; i < count; i++) {
      candidates.push(generateKingdomCandidate(i))
    }
    set({ kingdomCandidates: candidates, lastKingdomRequestMonth: currentMonth })
    return true
  },

  recruitCandidate: (retainerId) =>
    set((s) => ({
      retainers: [...s.retainers, ...s.kingdomCandidates.filter(c => c.id === retainerId)],
      kingdomCandidates: [],
    })),

  dismissKingdomCandidates: () => set({ kingdomCandidates: [] }),



  triggerGameOver: () => set({ isGameOver: true }),
  triggerClear: () => set({ isClear: true }),
  completeTutorial: () => set({ tutorialSeen: true }),
  resetGame: () =>
    set({
      ...initialState,
      equipment: STARTING_EQUIPMENT.map(eq => ({ ...eq })),
      adventurers: [...STARTING_ADVENTURERS],
      regions: STARTING_REGIONS.map(r => ({ ...r })),
      retainers: [...STARTING_RETAINERS],
      troopSlots: [...STARTING_TROOP_SLOTS],
      barracks: STARTING_BARRACKS.map(t => ({ ...t })),
      commissions: [],
      merchantGuilds: STARTING_MERCHANT_GUILDS.map(g => ({ ...g })),
      wall: { level: 1, durability: 150, maxDurability: 150 },
    }),
}))
