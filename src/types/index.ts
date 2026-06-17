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

export type RegionStatus = 'available' | 'liberated'

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

export interface WaveCombatDetail {
  troopId: string
  troopType: string
  commanderName: string | null
  power: number
}

export interface WaveResult {
  waveNumber: number
  enemyStrength: number
  defensePower: number
  outcome: WaveOutcome
  goldChange: number
  divineRankChange: number
  waveDefenseBonusGained: number
  combatDetails: WaveCombatDetail[]
}
