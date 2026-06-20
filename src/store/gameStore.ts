import { create } from 'zustand'
import {
  EquipmentInstance, ScreenType, EnhancementResult, Commission,
  Adventurer, Region, ExpeditionResult, Retainer, TroopSlot, WaveResult,
  STAT_GRADE_VALUE, TROOP_TYPE_NAMES, MerchantGuild, ShopItem,
  DIVINE_TURN_RECOVERY, DIVINE_RANK_TIERS, BarracksTroop, BarracksTroopType,
  GRADE_BUY_PRICE, GRADE_SELL_PRICE, LEVEL_PRICE_MULTIPLIER, WallState,
  WALL_MAX_DURABILITY, WALL_UPGRADE_COST, WALL_REPAIR_COST_PER_POINT,
  WALL_DEFENSE_POWER, WALL_MAX_LEVEL, GradeType, StatGrade, CharacterClass,
  WAVE_SCHEDULE, TurnReport, TurnReportAdventurer,
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


// ===== 왕국 파견 후보 생성 시스템 (1~4단계 티어) =====
// 왕국 파견은 공식 군인/관리 계통 — 길드 모험가와 구분
// 게임 진행(턴)이 쌓일수록 고단계 후보 등장 확률 상승

const KINGDOM_LAST_NAMES = ['고', '박', '이', '최', '정', '강', '한', '신', '윤', '남궁', '황', '백', '조', '임', '전']

// 티어 해금 턴 기준 (1 month = 4 turns)
// Tier1: 항상 / Tier2: turn≥12(3개월) / Tier3: turn≥28(7개월/1웨이브 이후) / Tier4: turn≥52(13개월/2~3웨이브)
const TIER_UNLOCK_TURN = [0, 0, 12, 28, 52] as const  // index=tier

// 턴 기반 티어 가중치 계산 (총합=100)
// 해금 직후엔 낮은 확률에서 시작, 턴이 쌓일수록 고단계 비율 증가
function calcTierWeights(turn: number): [number, number, number, number] {
  // 각 티어가 해금됐는지 + 해금 후 몇 턴 지났는지
  const t2Turns = Math.max(0, turn - TIER_UNLOCK_TURN[2])  // tier2 경과 턴
  const t3Turns = Math.max(0, turn - TIER_UNLOCK_TURN[3])  // tier3 경과 턴
  const t4Turns = Math.max(0, turn - TIER_UNLOCK_TURN[4])  // tier4 경과 턴

  // 티어별 가중치: 경과 턴에 비례해 증가 (상한 있음)
  const w2 = t2Turns > 0 ? Math.min(25, 5 + t2Turns * 0.8) : 0
  const w3 = t3Turns > 0 ? Math.min(20, 3 + t3Turns * 0.6) : 0
  const w4 = t4Turns > 0 ? Math.min(15, 2 + t4Turns * 0.4) : 0
  const w1 = Math.max(40, 100 - w2 - w3 - w4)  // tier1은 최소 40% 보장
  return [w1, w2, w3, w4]
}

function pickTier(turn: number): 1 | 2 | 3 | 4 {
  const [w1, w2, w3, w4] = calcTierWeights(turn)
  const total = w1 + w2 + w3 + w4
  let r = Math.random() * total
  if ((r -= w1) <= 0) return 1
  if ((r -= w2) <= 0) return 2
  if ((r -= w3) <= 0) return 3
  return 4
}

// ===== 직종별 티어 데이터 =====
interface KingdomTierData {
  titles: string[]
  salary: number
  // 스탯 가중치 [E,D,C,B,A] — 티어 높을수록 전반적으로 우수
  profW: number[]; judgW: number[]; vitaW: number[]; courW: number[]
}
interface KingdomClassDef {
  cls: CharacterClass
  tiers: [KingdomTierData, KingdomTierData, KingdomTierData, KingdomTierData]  // [t1,t2,t3,t4]
  quirks: string[]
}

const KINGDOM_CLASSES: KingdomClassDef[] = [
  // ── 검사/보병 계열 ─────────────────────────────────────────────
  {
    cls: 'swordsman',
    tiers: [
      { titles: ['보병', '전사', '검사'],           salary: 55,
        profW:[10,25,40,20,5], judgW:[15,30,35,15,5], vitaW:[5,15,40,30,10], courW:[5,15,35,30,15] },
      { titles: ['베테랑보병', '방패전사', '돌격전사'], salary: 70,
        profW:[5,15,35,30,15], judgW:[10,25,40,20,5], vitaW:[2,8,35,35,20], courW:[2,8,30,35,25] },
      { titles: ['정예보병', '정예검사', '도끼전사'],   salary: 90,
        profW:[2,8,30,35,25], judgW:[5,15,35,30,15], vitaW:[0,5,25,40,30], courW:[0,5,20,40,35] },
      { titles: ['왕립보병', '왕립검사', '광전사'],     salary: 115,
        profW:[0,3,15,40,42], judgW:[2,8,25,40,25], vitaW:[0,2,10,35,53], courW:[0,2,8,35,55] },
    ],
    quirks: [
      '검 하나로 뭐든 해결한다는 신념이 있다. 대부분은 실제로 가능하다.',
      '전투 전날 반드시 검을 닦는다. 3시간이 걸린다.',
      '군복을 절대 입지 않겠다고 했다가 임관하자마자 군복을 입었다.',
      '전장에서 웃는 사람이다. 겁이 없는 게 아니라 겁이 뭔지를 모른다.',
    ],
  },
  // ── 창병 계열 ──────────────────────────────────────────────────
  {
    cls: 'spearman',
    tiers: [
      { titles: ['창병', '투창병'],                   salary: 50,
        profW:[10,25,40,20,5], judgW:[15,30,35,15,5], vitaW:[5,15,40,30,10], courW:[5,10,35,35,15] },
      { titles: ['베테랑창병', '장창병'],               salary: 65,
        profW:[5,15,35,30,15], judgW:[10,25,40,20,5], vitaW:[2,8,35,35,20], courW:[2,7,30,38,23] },
      { titles: ['정예창병', '창기병'],                 salary: 80,
        profW:[2,8,30,35,25], judgW:[5,15,35,30,15], vitaW:[0,5,25,40,30], courW:[0,4,22,42,32] },
      { titles: ['왕립창병', '왕립기병'],               salary: 105,
        profW:[0,3,15,40,42], judgW:[2,8,25,40,25], vitaW:[0,2,12,38,48], courW:[0,2,10,38,50] },
    ],
    quirks: [
      '창이 닿는 거리 안에 적을 들이면 반드시 이긴다. 문제는 그 전 단계이다.',
      '창 길이를 재는 습관이 있다. 매일 조금씩 달라진다고 주장한다.',
      '말 위에서 싸우는 게 더 자연스럽다. 말이 없어도 마찬가지다.',
    ],
  },
  // ── 궁수 계열 ──────────────────────────────────────────────────
  {
    cls: 'archer',
    tiers: [
      { titles: ['궁병', '사수'],                     salary: 55,
        profW:[8,20,40,25,7], judgW:[8,20,40,25,7], vitaW:[15,30,35,15,5], courW:[10,20,38,25,7] },
      { titles: ['베테랑궁병', '명사수', '추적자'],     salary: 70,
        profW:[3,10,35,35,17], judgW:[3,10,35,35,17], vitaW:[10,25,40,20,5], courW:[5,15,38,30,12] },
      { titles: ['정예궁수', '저격수', '레인저'],       salary: 90,
        profW:[0,5,20,40,35], judgW:[0,5,20,40,35], vitaW:[8,20,40,22,10], courW:[2,10,30,38,20] },
      { titles: ['왕립궁수', '호크아이', '왕립저격수'], salary: 115,
        profW:[0,2,10,38,50], judgW:[0,2,10,38,50], vitaW:[5,15,38,28,14], courW:[0,5,20,40,35] },
    ],
    quirks: [
      '눈을 감고도 100보 밖 과녁을 맞힌다. 눈을 뜨면 더 잘 맞힌다.',
      '바람의 방향을 읽는 능력이 있다. 비가 올 때는 그냥 감으로 한다.',
      '화살 재고를 항상 정확히 파악하고 있다. 하나가 사라지면 온종일 찾는다.',
      '쏘기 전에 숨을 참는 버릇이 있다. 대화 중에도 갑자기 숨을 참는다.',
    ],
  },
  // ── 마법사 계열 ────────────────────────────────────────────────
  {
    cls: 'mage',
    tiers: [
      { titles: ['마법사', '전투마도사'],               salary: 80,
        profW:[5,15,35,30,15], judgW:[5,15,35,30,15], vitaW:[20,35,30,12,3], courW:[15,25,35,20,5] },
      { titles: ['상급마법사', '전투마법사'],            salary: 100,
        profW:[2,8,25,40,25], judgW:[2,8,25,40,25], vitaW:[15,30,35,15,5], courW:[10,22,35,23,10] },
      { titles: ['수석마법사', '전장마도사'],            salary: 130,
        profW:[0,3,15,38,44], judgW:[0,3,15,38,44], vitaW:[12,25,38,18,7], courW:[5,15,35,30,15] },
      { titles: ['궁정마법사', '대마법사'],              salary: 170,
        profW:[0,0,5,30,65], judgW:[0,0,5,30,65], vitaW:[10,20,38,22,10], courW:[3,10,28,35,24] },
    ],
    quirks: [
      '마법 공식을 암기하는 속도가 놀랍다. 이름은 잘 못 외운다.',
      '적을 쓰러뜨리는 것보다 마법 구현이 더 중요하다고 생각한다.',
      '마법서를 항상 들고 다닌다. 마법서 없이도 마법을 쓸 수 있다.',
      '왕립 마법학교 수석 졸업. 졸업식 축하 마법에서 천장을 날려버렸다.',
      '왕국에서 가장 파괴적인 마법을 구사한다. 아군도 거리를 둔다.',
    ],
  },
  // ── 사제 계열 ──────────────────────────────────────────────────
  {
    cls: 'priest',
    tiers: [
      { titles: ['사제', '치유사'],                    salary: 65,
        profW:[8,20,38,25,9], judgW:[5,15,38,28,14], vitaW:[10,22,40,22,6], courW:[8,18,38,25,11] },
      { titles: ['신관', '축복사'],                     salary: 85,
        profW:[3,10,30,35,22], judgW:[2,8,28,38,24], vitaW:[7,18,40,25,10], courW:[5,13,35,30,17] },
      { titles: ['고위사제', '전투사제'],               salary: 110,
        profW:[0,5,20,40,35], judgW:[0,3,18,40,39], vitaW:[5,14,38,28,15], courW:[2,8,28,38,24] },
      { titles: ['대신관', '성직자장'],                 salary: 145,
        profW:[0,2,10,35,53], judgW:[0,0,8,32,60], vitaW:[3,10,32,30,25], courW:[0,4,20,38,38] },
    ],
    quirks: [
      '신의 가호는 무한하다고 믿는다. 하지만 본인 체력은 유한하다.',
      '기도 시간이 길다. 전투 중에도 기도를 멈추지 않는다.',
      '치료하면서 설교를 병행한다. 환자가 회복보다 설교 종료를 더 기다린다.',
      '신성력이 높은 영주를 섬기고 싶었다. 여기가 맞는 것 같기도 하다.',
      '신이 직접 말을 건다고 한다. 실제로 전장에서 상당히 정확한 판단을 내린다.',
    ],
  },
  // ── 기사 계열 (가장 희귀) ──────────────────────────────────────
  {
    cls: 'knight',
    tiers: [
      { titles: ['기사', '수비기사'],                  salary: 90,
        profW:[5,10,30,35,20], judgW:[8,18,35,28,11], vitaW:[2,7,25,40,26], courW:[2,5,20,40,33] },
      { titles: ['왕립기사', '수호기사'],               salary: 120,
        profW:[2,5,20,40,33], judgW:[4,10,28,38,20], vitaW:[0,3,15,42,40], courW:[0,2,12,40,46] },
      { titles: ['성기사', '신성기사', '성전사'],       salary: 160,
        profW:[0,2,12,38,48], judgW:[0,4,20,38,38], vitaW:[0,0,8,38,54], courW:[0,0,5,32,63] },
      { titles: ['기사단장', '왕국기사단장'],            salary: 210,
        profW:[0,0,5,28,67], judgW:[0,2,12,35,51], vitaW:[0,0,3,28,69], courW:[0,0,0,22,78] },
    ],
    quirks: [
      '기사도를 목숨보다 중요하게 여긴다. 기사도에 맞지 않는 일은 절대 하지 않는다.',
      '왕국 최고의 기사 중 하나였다. 여기까지 어떻게 흘러온 것인지 본인도 모른다.',
      '갑옷을 절대 벗지 않는다. 잘 때도 갑옷을 입는다고 한다.',
      '영지를 지키는 것이 기사의 의무라고 말한다. 왜 여기에 있는지는 설명하지 않는다.',
      '왕국 기사단에서 전설로 불렸다. 그 전설이 여기 있다.',
    ],
  },
]

// 직종 가중치 (knight는 희귀, mage도 희귀)
// swordsman, spearman, archer, mage, priest, knight
const KINGDOM_CLASS_WEIGHTS = [30, 20, 20, 10, 15, 5]

function weightedKingdomClass(): KingdomClassDef {
  const total = KINGDOM_CLASS_WEIGHTS.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < KINGDOM_CLASSES.length; i++) {
    r -= KINGDOM_CLASS_WEIGHTS[i]
    if (r <= 0) return KINGDOM_CLASSES[i]
  }
  return KINGDOM_CLASSES[0]
}

function weightedStat(weights: number[]): StatGrade {
  const pool: StatGrade[] = ['E', 'D', 'C', 'B', 'A']
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return 'C'
}

function generateKingdomCandidate(idx: number, turn: number): Retainer {
  const classDef = weightedKingdomClass()
  const tier = pickTier(turn)
  const tierData = classDef.tiers[tier - 1]
  const lastName = KINGDOM_LAST_NAMES[Math.floor(Math.random() * KINGDOM_LAST_NAMES.length)]
  const title = tierData.titles[Math.floor(Math.random() * tierData.titles.length)]
  const quirk = classDef.quirks[Math.floor(Math.random() * classDef.quirks.length)]
  const salaryVar = Math.floor(Math.random() * 4) * 5  // +0~15
  return {
    id: `cand_${Date.now()}_${idx}`,
    name: `${title} ${lastName}`,
    characterClass: classDef.cls,
    stats: {
      proficiency: weightedStat(tierData.profW),
      judgment:    weightedStat(tierData.judgW),
      vitality:    weightedStat(tierData.vitaW),
      courage:     weightedStat(tierData.courW),
    },
    loyalty: 50 + (tier - 1) * 8 + Math.floor(Math.random() * 15),
    salary: tierData.salary + salaryVar,
    equippedWeaponId: null,
    equippedArmorId: null,
    isActive: true,
    quirk,
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

    // 왕국 파견 가능 여부: 이번 달 아직 요청 안 함 OR 후보 대기 중
    const nextMonth = Math.floor((nextTurn - 1) / 4) + 1
    const kingdomRequestAvailable =
      state.lastKingdomRequestMonth < nextMonth || state.kingdomCandidates.length > 0

    // 웨이브 경고
    const waveWarning = pendingWaveEvent

    // 모험가 상태 목록 (파견중/부상/대기)
    const adventurerStatuses: TurnReportAdventurer[] = finalAdventurers.map(a => {
      if (a.dispatchedRegionId) {
        const region = state.regions.find(r => r.id === a.dispatchedRegionId)
        const returnsOnTurn = region?.currentExpedition?.returnsOnTurn ?? null
        return { name: a.name, status: a.status, regionName: region?.name ?? null, returnsOnTurn }
      }
      return { name: a.name, status: a.status, regionName: null, returnsOnTurn: null }
    })

    const turnReport: TurnReport = {
      turn: nextTurn,
      divinePowerGain: recovery,
      newDivinePower: newDivinePower,
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
      adventurerStatuses,
      adventurerRecovered: recoveredAdventurers,
      newAdventurerName,
      kingdomRequestAvailable,
      kingdomCandidatesWaiting: state.kingdomCandidates.length > 0,
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
      candidates.push(generateKingdomCandidate(i, state.turn))
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
