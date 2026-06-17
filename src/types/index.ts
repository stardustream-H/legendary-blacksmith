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
  toLevel: number          // -1 이면 무한
  penaltyType: PenaltyType
  magnitude: number        // LevelDown이면 몇 단계, DurabilityDamage면 데미지 수치
  triggerChance: number    // 0~100, 페널티 발동 확률
}

// ===== 등급 설정 =====
export interface GradeConfig {
  grade: GradeType
  maxLevel: number         // 9999 = 무제한
  probabilities: number[]  // 인덱스 i = +i 에서 시도 시 성공 확률 (%)
                           // 마지막 값이 그 이후 모든 레벨에 반복 적용
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
  currentLevel: number       // 현재 강화 단계
  maxLevel: number           // 이 장비의 최대 강화 단계 (MaxLevelReduce 페널티로 감소 가능)
  currentDurability: number
  maxDurability: number
  isOwned: boolean           // true = 내 장비, false = 의뢰 장비
  enhancementLockTurns: number // 0이면 강화 가능
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
}

// ===== 화면 타입 =====
export type ScreenType = 'title' | 'hub' | 'forge' | 'enhancement' | 'guild' | 'shop' | 'defense'
