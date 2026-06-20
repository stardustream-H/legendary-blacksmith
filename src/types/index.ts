// ===== 장비 등급 =====
export type GradeType =
  | 'common'
  | 'fine'
  | 'rare'
  | 'hero'
  | 'legendary'
  | 'legendary_relic'
  | 'ancient'
  | 'mythic'

export const GRADE_NAMES: Record<GradeType, string> = {
  common: '일반',
  fine: '고급',
  rare: '희귀',
  hero: '영웅',
  legendary: '전설',
  legendary_relic: '전설(유물)',
  ancient: '고대',
  mythic: '신화',
}

export const GRADE_COLORS: Record<GradeType, string> = {
  common: '#a0a0a0',
  fine: '#4a9e4a',
  rare: '#4a6abe',
  hero: '#9b59b6',
  legendary: '#e67e22',
  legendary_relic: '#e74c3c',
  ancient: '#f1c40f',
  mythic: '#ff6b9d',
}

// ===== 등급별 연속 실패 한도 =====
export const MAX_FAILURES_BY_GRADE: Record<GradeType, number> = {
  common: 20,
  fine: 10,
  rare: 5,
  hero: 3,
  legendary: 1,
  legendary_relic: 1,
  ancient: 1,
  mythic: 1,
}

export const FAILURE_LOCK_TURNS = 3

// ===== 페널티 타입 =====
export type PenaltyType =
  | 'NONE'
  | 'LEVEL_DOWN'
  | 'LEVEL_RESET'
  | 'DURABILITY_DAMAGE'
  | 'MAX_LEVEL_REDUCE'
  | 'EQUIPMENT_DESTROY'
  | 'ENHANCEMENT_LOCK'

export interface PenaltyConfig {
  fromLevel: number
  toLevel: number
  penaltyType: PenaltyType
  magnitude: number
  triggerChance: number
}

// ===== 등급 설정 =====
export interface GradeConfig {
  grade: GradeType
  maxLevel: number
  probabilities: number[]
  penalties: PenaltyConfig[]
  godComments: {
    success: string[]
    failure: string[]
    destroy: string[]
  }
}

// ===== 장비 =====
export type EquipmentType = 'sword' | 'axe' | 'spear' | 'bow' | 'staff' | 'dagger'
  | 'armor' | 'helm' | 'shield' | 'gloves' | 'boots'

export const EQUIPMENT_TYPE_NAMES: Record<EquipmentType, string> = {
  sword: '검',
  axe: '도끼',
  spear: '창',
  bow: '활',
  staff: '지팡이',
  dagger: '단검',
  armor: '갑옷',
  helm: '투구',
  shield: '방패',
  gloves: '장갑',
  boots: '부츠',
}

export interface EquipmentInstance {
  id: string
  name: string
  grade: GradeType
  type: EquipmentType
  isRelic: boolean
  currentLevel: number
  maxLevel: number
  currentDurability: number
  maxDurability: number
  isOwned: boolean
  enhancementLockTurns: number
  failureCount: number
}

// ===== 강화 결과 =====
export type EnhancementOutcome = 'success' | 'failure' | 'destroy'

export interface EnhancementResult {
  outcome: EnhancementOutcome
  previousLevel: number
  newLevel: number
  penaltyApplied: PenaltyType
  penaltyMagnitude: number
  godComment: string
  probabilityUsed: number
  newFailureCount: number
  failureLocked: boolean
}

// ===== 화면 타입 =====
export type ScreenType =
  | 'title'
  | 'hub'
  | 'forge'
  | 'enhancement'
  | 'repair'
  | 'repair-minigame'
  | 'commission'
  | 'guild'
  | 'shop'
  | 'defense'
  | 'territory'
  | 'temple'
  | 'wave'
  | 'prologue'
  | 'barracks'

// ===== 수리 시스템 =====
export type HammerType = 'small' | 'cross' | 'x' | 'heavy'

export interface HammerConfig {
  type: HammerType
  name: string
  emoji: string
  description: string
  pattern: [number, number][]
}

export const HAMMER_CONFIGS: Record<HammerType, HammerConfig> = {
  small: {
    type: 'small',
    name: '정밀 망치',
    emoji: '망',
    description: '1칸만 정확히',
    pattern: [[0, 0]],
  },
  cross: {
    type: 'cross',
    name: '십자 망치',
    emoji: '+',
    description: '십자 5칸',
    pattern: [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1]],
  },
  x: {
    type: 'x',
    name: '대각 망치',
    emoji: 'X',
    description: 'X자 5칸',
    pattern: [[0, 0], [-1, -1], [-1, 1], [1, -1], [1, 1]],
  },
  heavy: {
    type: 'heavy',
    name: '대형 망치',
    emoji: '#',
    description: '3x3 전체 9칸',
    pattern: [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],  [0, 0],  [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ],
  },
}

export interface RepairCell {
  isRevealed: boolean
  isDamageSpot: boolean
  isFound: boolean
  distanceHint: number | null
}

export interface RepairMinigameConfig {
  rows: number
  cols: number
  damageSpots: number
  maxAttempts: number
  availableHammers: HammerType[]
}

export const REPAIR_MINIGAME_CONFIGS: Record<string, RepairMinigameConfig> = {
  common:          { rows: 3, cols: 3, damageSpots: 2, maxAttempts: 4, availableHammers: ['small', 'cross'] },
  fine:            { rows: 4, cols: 4, damageSpots: 3, maxAttempts: 5, availableHammers: ['small', 'cross'] },
  rare:            { rows: 4, cols: 4, damageSpots: 4, maxAttempts: 5, availableHammers: ['small', 'cross', 'x'] },
  hero:            { rows: 5, cols: 5, damageSpots: 5, maxAttempts: 6, availableHammers: ['small', 'cross', 'x', 'heavy'] },
  legendary:       { rows: 5, cols: 5, damageSpots: 6, maxAttempts: 6, availableHammers: ['small', 'cross', 'x', 'heavy'] },
  legendary_relic: { rows: 5, cols: 5, damageSpots: 7, maxAttempts: 7, availableHammers: ['small', 'cross', 'x', 'heavy'] },
  ancient:         { rows: 6, cols: 6, damageSpots: 8, maxAttempts: 7, availableHammers: ['small', 'cross', 'x', 'heavy'] },
  mythic:          { rows: 6, cols: 6, damageSpots: 9, maxAttempts: 7, availableHammers: ['small', 'cross', 'x', 'heavy'] },
}

export type RepairOutcome = 'success' | 'partial' | 'failure'

export interface RepairResult {
  outcome: RepairOutcome
  mode: 'quick' | 'minigame'
  durabilityRestored: number
  maxDurabilityLost: number
  spotsFound?: number
  totalSpots?: number
}

// ===== 의뢰 시스템 =====
export type CommissionType = 'enhance' | 'repair'
export type CommissionGrade = 'normal' | 'urgent' | 'premium'

export interface Commission {
  id: string
  equipment: EquipmentInstance
  type: CommissionType
  targetLevel?: number
  rewardGold: number
  rewardDivinePower: number
  grade: CommissionGrade
  accepted: boolean
  processed: boolean
  expiresThisTurn: boolean
}

// ===== 스탯 등급 (E~S) =====
export type StatGrade = 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

export const STAT_GRADE_VALUE: Record<StatGrade, number> = {
  E: 1, D: 2, C: 3, B: 4, A: 5, S: 6,
}

export const STAT_GRADE_COLORS: Record<StatGrade, string> = {
  E: '#6b7280',
  D: '#84cc16',
  C: '#22c55e',
  B: '#3b82f6',
  A: '#a855f7',
  S: '#f59e0b',
}

export interface CharacterStats {
  proficiency: StatGrade  // 전문성: 직업 숙련도, 전투 기여도
  judgment: StatGrade     // 판단력: 원정 성공률 / 지휘 효율
  vitality: StatGrade     // 체력: 부상 저항 / 방어 지속력
  courage: StatGrade      // 담력: 열세 상황 저항
}

export const STAT_NAMES: Record<keyof CharacterStats, string> = {
  proficiency: '전문성',
  judgment:    '판단력',
  vitality:    '체력',
  courage:     '담력',
}

// ===== 캐릭터 직업 (장비 제한용) =====
export type CharacterClass =
  | 'swordsman'   // 검사
  | 'spearman'    // 창병
  | 'rogue'       // 도적
  | 'archer'      // 궁수
  | 'mage'        // 마법사
  | 'priest'      // 사제
  | 'knight'      // 기사 (가신 전용)

export const CHARACTER_CLASS_NAMES: Record<CharacterClass, string> = {
  swordsman: '검사',
  spearman:  '창병',
  rogue:     '도적',
  archer:    '궁수',
  mage:      '마법사',
  priest:    '사제',
  knight:    '기사',
}

// 직업별 허용 무기
export const CLASS_WEAPON_ALLOW: Record<CharacterClass, EquipmentType[]> = {
  swordsman: ['sword', 'axe', 'shield'],
  spearman:  ['spear', 'shield'],
  rogue:     ['dagger', 'sword'],
  archer:    ['bow'],
  mage:      ['staff'],
  priest:    ['staff', 'axe'],
  knight:    ['sword', 'spear', 'shield'],
}

// 직업별 허용 방어구
export const CLASS_ARMOR_ALLOW: Record<CharacterClass, EquipmentType[]> = {
  swordsman: ['armor', 'helm', 'gloves', 'boots'],
  spearman:  ['armor', 'helm', 'gloves', 'boots'],
  rogue:     ['gloves', 'boots'],
  archer:    ['helm', 'gloves', 'boots'],
  mage:      ['helm', 'gloves', 'boots'],
  priest:    ['armor', 'helm', 'gloves', 'boots'],
  knight:    ['armor', 'helm', 'gloves', 'boots'],
}

// ===== 모험가 길드 시스템 =====

export type AdventurerRole = 'tank' | 'melee_dps' | 'ranged_dps' | 'magic_dps' | 'healer' | 'buffer' | 'debuffer'
export type RoleCategory = 'tank' | 'dps' | 'support'

export type AdventurerClass =
  | 'sword_knight'
  | 'shield_warrior'
  | 'rogue'
  | 'mercenary'
  | 'archer'
  | 'spearman'
  | 'fire_mage'
  | 'ice_mage'
  | 'priest'
  | 'herbalist'
  | 'bard'
  | 'tactician'
  | 'cursemancer'
  | 'poisoner'

// AdventurerClass → CharacterClass 매핑 (장비 제한 적용용)
export const ADVENTURER_CLASS_TO_CHARACTER_CLASS: Record<AdventurerClass, CharacterClass> = {
  sword_knight:   'swordsman',
  shield_warrior: 'swordsman',
  rogue:          'rogue',
  mercenary:      'swordsman',
  archer:         'archer',
  spearman:       'spearman',
  fire_mage:      'mage',
  ice_mage:       'mage',
  priest:         'priest',
  herbalist:      'priest',
  bard:           'rogue',
  tactician:      'swordsman',
  cursemancer:    'mage',
  poisoner:       'rogue',
}

export type AdventurerGrade = 'rookie' | 'veteran' | 'elite' | 'legend'
export type AdventurerStatus = 'available' | 'dispatched' | 'injured'

export interface Adventurer {
  id: string
  name: string
  role: AdventurerRole
  class: AdventurerClass
  characterClass: CharacterClass       // 장비 제한용 직업
  grade: AdventurerGrade
  stats: CharacterStats                // 전문성/판단력/체력/담력
  status: AdventurerStatus
  lentEquipmentId: string | null
  injuredUntilTurn: number | null
  quirk: string
  dispatchedRegionId: string | null
}

export interface Expedition {
  partyIds: string[]
  lentEquipmentId: string | null
  departedOnTurn: number
  returnsOnTurn: number
}

export type ExpeditionOutcome = 'great_success' | 'success' | 'partial' | 'failure'

export interface ExpeditionResult {
  outcome: ExpeditionOutcome
  regionId: string
  liberationGain: number
  goldEarned: number
  divinePowerEarned: number
  equipmentEarned: EquipmentInstance | null
  injuredAdventurerIds: string[]
  lostEquipmentId: string | null
  report: string
  justLiberated: boolean                      // 이번 원정으로 해방 달성
  liberationRewardEquipment: EquipmentInstance[] // 해방 보상 장비 목록
}

export type RegionStatus = 'hidden' | 'locked' | 'available' | 'liberated'

export interface Region {
  id: string
  name: string
  description: string
  difficulty: number
  minTurns: number
  maxTurns: number
  liberationProgress: number
  status: RegionStatus
  currentExpedition: Expedition | null
  rewardGoldRange: [number, number]
  rewardDivinePowerRange: [number, number]
  rewardEquipmentChance: number
  rewardEquipmentGrades: GradeType[]
  liberationMonthlyIncome: number         // 해방 시 월 수입 증가량
  liberationEquipmentCount: number        // 해방 보상 장비 수
  unlockRequires?: string[]               // 잠금 해제 조건 (해방된 지역 ID 목록)
  unlockMode?: 'any' | 'all'              // 조건 충족 방식: any=OR(기본), all=AND
  isTrueEndingTrigger?: boolean           // 진엔딩 트리거 지역 여부
}

// ===== 가신 시스템 =====
export type TroopType = 'knight' | 'infantry' | 'archer' | 'mage' | 'healer'

export const TROOP_TYPE_NAMES: Record<TroopType, string> = {
  knight:   '기사단',
  infantry: '보병대',
  archer:   '궁병대',
  mage:     '마법사대',
  healer:   '치유사대',
}

// 지휘관(사람) — 항상 stats·class 보유, 병력 슬롯에 배치될 수 있음
export interface Retainer {
  id: string
  name: string
  characterClass: CharacterClass        // 직업 (무기/방어구 제한용)
  stats: CharacterStats                 // 전문성/판단력/체력/담력
  loyalty: number                       // 0~100
  salary: number                        // 월 봉급 (gold)
  equippedWeaponId: string | null       // 장착 무기 (CLASS_WEAPON_ALLOW 기반)
  equippedArmorId: string | null        // 장착 방어구 (CLASS_ARMOR_ALLOW 기반)
  isActive: boolean                     // false = 이탈 (loyalty 0)
  quirk: string                         // 개그 한 줄 설명
}

// 병력 슬롯 — 지휘관 없이도 존재하는 부대 단위
export interface TroopSlot {
  id: string
  troopType: TroopType
  commanderId: string | null            // 배치된 지휘관 Retainer ID (null = 무지휘)
}

// ===== 표시용 상수 =====
export const ROLE_NAMES: Record<AdventurerRole, string> = {
  tank:       '탱커',
  melee_dps:  '근접딜러',
  ranged_dps: '원거리딜러',
  magic_dps:  '마법딜러',
  healer:     '힐러',
  buffer:     '버퍼',
  debuffer:   '디버퍼',
}

export const CLASS_NAMES: Record<AdventurerClass, string> = {
  sword_knight:   '검방기사',
  shield_warrior: '방패전사',
  rogue:          '도적',
  mercenary:      '용병',
  archer:         '궁수',
  spearman:       '투창병',
  fire_mage:      '화염술사',
  ice_mage:       '냉기술사',
  priest:         '성직자',
  herbalist:      '약초의',
  bard:           '음유시인',
  tactician:      '전술가',
  cursemancer:    '저주술사',
  poisoner:       '독술사',
}

export const ADVENTURER_GRADE_NAMES: Record<AdventurerGrade, string> = {
  rookie:  '신입',
  veteran: '숙련',
  elite:   '정예',
  legend:  '전설',
}

export const EXPEDITION_OUTCOME_NAMES: Record<ExpeditionOutcome, string> = {
  great_success: '대성공',
  success:       '성공',
  partial:       '고전',
  failure:       '실패',
}

// ===== 웨이브 이벤트 =====
export type WaveOutcome = 'victory' | 'defeat'

export type WaveType =
  | 'beast_swarm'
  | 'goblin_raid'
  | 'undead_march'
  | 'commander_wave'
  | 'aerial_assault'
  | 'demon_vanguard'
  | 'demon_army'
  | 'heavenly_king'
  | 'demon_lord_final'

export interface WaveEntry {
  waveNumber: number   // 1~9
  triggerTurn: number
  name: string
  type: WaveType
  enemyStrength: number
  enemyDescription: string
  specialNote?: string
  isFinal?: boolean
  icon: string
}

// ===== 웨이브 스케줄 (총 9회: 8 정규 + 마왕 최종) =====
// 타임라인: 24 / 38 / 50 / 62 / 72 / 82 / 90 / 98 / 108 턴
export const WAVE_SCHEDULE: WaveEntry[] = [
  {
    waveNumber: 1, triggerTurn: 24,
    name: '마물 선발대',
    type: 'beast_swarm',
    enemyStrength: 90,
    enemyDescription:
      '마족 땅에서 흘러 넘쳐온 오염된 야수들과 고블린 무리. 수는 많지만 오합지졸에 가깝다.',
    icon: '🐺',
  },
  {
    waveNumber: 2, triggerTurn: 38,
    name: '고블린 군단',
    type: 'goblin_raid',
    enemyStrength: 140,
    enemyDescription:
      '홉고블린 대장이 지휘하는 조직화된 고블린 군단. 이전과 달리 체계적인 진형을 갖추고 있다.',
    icon: '👺',
  },
  {
    waveNumber: 3, triggerTurn: 50,
    name: '언데드 행군',
    type: 'undead_march',
    enemyStrength: 200,
    enemyDescription:
      '옛 전장에서 일어난 언데드 무리. 오크 전사들이 그 뒤를 따른다. 밤새 쉬지 않고 밀려온다.',
    icon: '💀',
  },
  {
    waveNumber: 4, triggerTurn: 62,
    name: '마족 전위군 출현',
    type: 'commander_wave',
    enemyStrength: 270,
    enemyDescription:
      '이름 있는 마족 야전 지휘관이 처음으로 전장에 모습을 드러냈다. 마족 정규군이 그 뒤를 따른다.',
    specialNote: '용사 파티가 영지에 도착했다. 이제 용사들의 장비를 지원해야 한다.',
    icon: '⚔️',
  },
  {
    waveNumber: 5, triggerTurn: 72,
    name: '공중·거인 혼성 침공',
    type: 'aerial_assault',
    enemyStrength: 350,
    enemyDescription:
      '하피와 드레이크의 비행 편대, 오우거와 트롤의 거인족이 동시에 몰려든다. 지상과 공중을 동시에 대비해야 한다.',
    icon: '🦅',
  },
  {
    waveNumber: 6, triggerTurn: 82,
    name: '마족 정규군 침공',
    type: 'demon_vanguard',
    enemyStrength: 440,
    enemyDescription:
      '마왕 군단장의 직속 정예부대. 마족 마법사와 기사들이 조직적으로 밀고 들어온다.',
    icon: '👿',
  },
  {
    waveNumber: 7, triggerTurn: 90,
    name: '마족·오크 대연합군',
    type: 'demon_army',
    enemyStrength: 540,
    enemyDescription:
      '마족 군단과 오크 대군이 연합해 밀려든다. 파죽지세의 기세로 방어선을 뚫으려 한다.',
    icon: '🔥',
  },
  {
    waveNumber: 8, triggerTurn: 98,
    name: '4천왕 강림',
    type: 'heavenly_king',
    enemyStrength: 650,
    enemyDescription:
      '마왕의 직속 4천왕 중 1인이 직접 전장에 나타났다. 최강의 마족 군단을 이끌고 왔다.',
    specialNote: '용사 파티의 힘이 절실한 순간이다.',
    icon: '👑',
  },
  {
    waveNumber: 9, triggerTurn: 108,
    name: '마왕의 최종 침공',
    type: 'demon_lord_final',
    enemyStrength: 900,
    enemyDescription:
      '마왕이 몸소 전장에 나타났다. 대장장이 말살 전략이 실패하자 직접 결판을 지으러 나선 것이다.',
    specialNote: '이것이 최후의 결전이다. 용사 파티의 장비가 기준치에 미달하면 막을 수 없다.',
    isFinal: true,
    icon: '☠️',
  },
]

export interface WaveCombatDetail {
  troopId: string
  troopType: string
  commanderName: string | null
  power: number
}

export interface TurnReportCommission {
  id: string
  name: string
  grade: string
  reward: number
}

export interface TurnReportAdventurer {
  name: string
  status: 'available' | 'dispatched' | 'injured'
  regionName: string | null
  returnsOnTurn: number | null
}

export interface TurnReport {
  turn: number
  divinePowerGain: number
  newDivinePower: number
  isMonthlyTurn: boolean
  income: number
  salary: number
  newCommissions: TurnReportCommission[]
  merchantVisited: string[]
  adventurerStatuses: TurnReportAdventurer[]
  adventurerRecovered: string[]
  newAdventurerName: string | null
  kingdomRequestAvailable: boolean
  kingdomCandidatesWaiting: boolean
  waveWarning: boolean
}

export interface WaveResult {
  waveNumber: number
  enemyStrength: number
  defensePower: number
  outcome: WaveOutcome
  goldChange: number
  divinePowerChange: number
  waveDefenseBonusGained: number
  combatDetails: WaveCombatDetail[]
  waveName: string
  isFinalWave: boolean
}

// ===== 상점 시스템 =====

// 등급별 기본 판매가 (플레이어→상회)
// 등급별 장비 기본 판매가 (강화 레벨 0 기준)
export const GRADE_SELL_PRICE: Record<GradeType, number> = {
  common:           22,
  fine:             55,
  rare:            180,
  hero:            450,
  legendary:      1200,
  legendary_relic: 2000,
  ancient:         3500,
  mythic:          6000,
}

// 강화 레벨 승수 테이블 — 지수 곡선 (레벨별 판매가 = 기본가 × 이 값)
export const LEVEL_PRICE_MULTIPLIER: number[] = [
  1.0,   // +0
  1.3,   // +1
  1.8,   // +2
  2.5,   // +3
  3.5,   // +4
  5.0,   // +5
  7.5,   // +6
  12,    // +7
  18,    // +8
  28,    // +9
  44,    // +10
  70,    // +11
  110,   // +12
  175,   // +13
  280,   // +14
  450,   // +15
  720,   // +16
  1150,  // +17
  1850,  // +18
  3000,  // +19
  5000,  // +20
]

// 강화 시도 비용 (등급별 고정)
export const ENHANCE_COST: Record<GradeType, number> = {
  common:           10,
  fine:             25,
  rare:             60,
  hero:            130,
  legendary:       280,
  legendary_relic: 400,
  ancient:         600,
  mythic:          900,
}

// 등급별 상점 구매가 (상회→플레이어) — 판매가의 약 2.2배
export const GRADE_BUY_PRICE: Record<GradeType, number> = {
  common:          65,
  fine:           155,
  rare:           330,
  hero:           700,
  legendary:     1550,
  legendary_relic: 2600,
  ancient:        4400,
  mythic:         8800,
}

export interface ShopItem {
  id: string
  equipment: EquipmentInstance
  buyPrice: number   // 구매가
  soldOut: boolean
}

export interface MerchantGuild {
  id: string
  name: string
  description: string
  nextVisitTurn: number   // 다음 방문 턴
  inventory: ShopItem[]
}

// ===== 성벽 시스템 =====
export interface WallState {
  level: number          // 1~5
  durability: number     // 현재 내구도
  maxDurability: number  // 최대 내구도 = level * 50 + 100
}

export const WALL_DEFENSE_POWER = (level: number, durability: number, maxDurability: number): number => {
  if (durability <= 0) return 0
  const ratio = durability / maxDurability
  const base = level * 25
  if (ratio >= 0.5) return base
  return Math.floor(base * (ratio * 2)) // 내구도 50% 미만은 비례 감소
}

export const WALL_UPGRADE_COST = (currentLevel: number): number => currentLevel * 300
export const WALL_MAX_DURABILITY = (level: number): number => level * 50 + 100
export const WALL_REPAIR_COST_PER_POINT = 2
export const WALL_MAX_LEVEL = 5

// ===== 신격 시스템 =====

export interface DivineTierConfig {
  tier: number
  name: string
  upgradeCost: number  // 0 = 시작 등급
}

export const DIVINE_RANK_TIERS: DivineTierConfig[] = [
  { tier: 0, name: '잊혀진 신',  upgradeCost: 0 },
  { tier: 1, name: '최하급 신', upgradeCost: 60 },
  { tier: 2, name: '하급 신',   upgradeCost: 130 },
  { tier: 3, name: '중급 신',   upgradeCost: 280 },
  { tier: 4, name: '상급 신',   upgradeCost: 550 },
  { tier: 5, name: '고위 신',   upgradeCost: 1080 },
  { tier: 6, name: '주신급',    upgradeCost: 2500 },
]

// 신격 등급별 강화 확률 보너스 (%)
export const DIVINE_RANK_PROB_BONUS: Record<number, Partial<Record<GradeType, number>>> = {
  0: {},
  1: { common: 2, fine: 1 },
  2: { common: 4, fine: 2, rare: 1 },
  3: { common: 6, fine: 3, rare: 2 },
  4: { common: 8, fine: 4, rare: 3, hero: 1 },
  5: { common: 10, fine: 5, rare: 4, hero: 2, legendary: 0.5 },
  6: { common: 10, fine: 5, rare: 5, hero: 3, legendary: 1 },
}

// 신격별 턴당 신성력 회복량
export const DIVINE_TURN_RECOVERY: Record<number, number> = {
  0: 6,
  1: 10,
  2: 16,
  3: 24,
  4: 33,
  5: 45,
  6: 65,
}

// ===== 병영 시스템 =====

export type BarracksTroopType = 'infantry' | 'archer' | 'cavalry' | 'mage' | 'cleric' | 'knights'

export interface TroopConfig {
  type: BarracksTroopType
  name: string
  icon: string
  description: string
  basePower: number        // 1단계 기준 방어력
  tierMultiplier: [number, number, number]  // [1단계, 2단계, 3단계] 배율
  upgradeCosts: [number, number, number]    // [1단계, 2단계, 3단계] 비용 (0 = 무료/기본)
  initialTier: number      // 0=잠금, 1=1단계 해금
}

export interface BarracksTroop {
  type: BarracksTroopType
  tier: number  // 0=잠금, 1/2/3=해금 단계
}
