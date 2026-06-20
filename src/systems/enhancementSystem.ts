import { EquipmentInstance, EnhancementResult, PenaltyType, GradeConfig, GradeType, MAX_FAILURES_BY_GRADE, DIVINE_RANK_PROB_BONUS } from '../types'
import { GRADE_CONFIGS } from '../data/gradeConfigs'

// ===== 확률 계산 =====
export function getEnhancementProbability(
  equipment: EquipmentInstance,
  divinePowerBoost: number = 0,
  divineRankTier: number = 0
): number {
  const config = GRADE_CONFIGS[equipment.grade]
  if (!config) return 0

  const level = equipment.currentLevel
  const probs = config.probabilities
  const baseProbability = level < probs.length ? probs[level] : probs[probs.length - 1]
  const rankBonus = DIVINE_RANK_PROB_BONUS[divineRankTier]?.[equipment.grade as GradeType] ?? 0

  return Math.min(100, baseProbability + divinePowerBoost + rankBonus)
}

// ===== 최대 실패 한도 확인 =====
export function getMaxFailures(grade: string): number {
  return MAX_FAILURES_BY_GRADE[grade as keyof typeof MAX_FAILURES_BY_GRADE] ?? 5
}

// ===== 강화 가능 여부 확인 =====
export function canEnhance(equipment: EquipmentInstance): { ok: boolean; reason: string } {
  if (equipment.currentLevel >= equipment.maxLevel) {
    return { ok: false, reason: '최대 강화 달성' }
  }
  if (equipment.enhancementLockTurns > 0) {
    return { ok: false, reason: `${equipment.enhancementLockTurns}턴 강화 잠금` }
  }
  return { ok: true, reason: '' }
}

// ===== 강화 시도 =====
export function attemptEnhancement(
  equipment: EquipmentInstance,
  config: GradeConfig,
  divinePowerBoost: number = 0,
  destroyProtection: boolean = false,
  levelDropProtection: boolean = false,
  divineRankTier: number = 0,
): EnhancementResult {
  const probability = getEnhancementProbability(equipment, divinePowerBoost, divineRankTier)
  const roll = Math.random() * 100
  const previousLevel = equipment.currentLevel

  if (roll < probability) {
    // ===== 성공 =====
    // 실패 횟수는 총 누적이므로 성공해도 리셋하지 않음
    return {
      outcome: 'success',
      previousLevel,
      newLevel: previousLevel + 1,
      penaltyApplied: 'NONE',
      penaltyMagnitude: 0,
      godComment: pickRandom(config.godComments.success),
      probabilityUsed: probability,
      newFailureCount: equipment.failureCount,
      failureLocked: false,
    }
  }

  // ===== 실패 =====
  const activePenalties = config.penalties.filter(
    (p) =>
      p.fromLevel <= previousLevel &&
      (p.toLevel === -1 || p.toLevel >= previousLevel)
  )

  let penaltyApplied: PenaltyType = 'NONE'
  let penaltyMagnitude = 0
  let newLevel = previousLevel

  for (const penaltyConfig of activePenalties) {
    if (Math.random() * 100 >= penaltyConfig.triggerChance) continue

    if (penaltyConfig.penaltyType === 'EQUIPMENT_DESTROY' && destroyProtection) continue
    if (
      (penaltyConfig.penaltyType === 'LEVEL_DOWN' || penaltyConfig.penaltyType === 'LEVEL_RESET') &&
      levelDropProtection
    ) continue

    switch (penaltyConfig.penaltyType) {
      case 'EQUIPMENT_DESTROY':
        penaltyApplied = 'EQUIPMENT_DESTROY'
        penaltyMagnitude = 1
        break
      case 'LEVEL_DOWN':
        if (penaltyApplied !== 'EQUIPMENT_DESTROY') {
          penaltyApplied = 'LEVEL_DOWN'
          penaltyMagnitude = penaltyConfig.magnitude
          newLevel = Math.max(0, previousLevel - penaltyConfig.magnitude)
        }
        break
      case 'LEVEL_RESET':
        if (penaltyApplied !== 'EQUIPMENT_DESTROY') {
          penaltyApplied = 'LEVEL_RESET'
          penaltyMagnitude = previousLevel
          newLevel = 0
        }
        break
      case 'DURABILITY_DAMAGE':
        if (penaltyApplied !== 'EQUIPMENT_DESTROY') {
          penaltyMagnitude += penaltyConfig.magnitude
          if (penaltyApplied === 'NONE') penaltyApplied = 'DURABILITY_DAMAGE'
        }
        break
      default:
        break
    }
  }

  const isDestroyed = penaltyApplied === 'EQUIPMENT_DESTROY'

  // 총 실패 횟수 증가 (성공 시 리셋 없음)
  const maxFail = getMaxFailures(equipment.grade)
  const newFailureCount = equipment.failureCount + 1
  const failureLocked = newFailureCount >= maxFail  // 이번 실패로 한도 도달 → 영구 강화 불가

  return {
    outcome: isDestroyed ? 'destroy' : 'failure',
    previousLevel,
    newLevel,
    penaltyApplied,
    penaltyMagnitude,
    godComment: isDestroyed ? pickRandom(config.godComments.destroy) : pickRandom(config.godComments.failure),
    probabilityUsed: probability,
    newFailureCount,
    failureLocked,
  }
}

// ===== 결과를 장비에 적용 =====
export function applyEnhancementResult(
  equipment: EquipmentInstance,
  result: EnhancementResult
): EquipmentInstance | null {
  if (result.outcome === 'destroy') return null

  const updated: EquipmentInstance = { ...equipment }
  updated.currentLevel = result.newLevel
  // 총 실패 횟수 업데이트 (성공/실패 모두 적용, 리셋 없음)
  updated.failureCount = result.newFailureCount

  if (result.penaltyApplied === 'DURABILITY_DAMAGE') {
    updated.currentDurability = Math.max(0, updated.currentDurability - result.penaltyMagnitude)
  }

  if (result.penaltyApplied === 'MAX_LEVEL_REDUCE') {
    updated.maxLevel = Math.max(updated.currentLevel, updated.maxLevel - result.penaltyMagnitude)
  }

  if (result.penaltyApplied === 'ENHANCEMENT_LOCK') {
    updated.enhancementLockTurns = result.penaltyMagnitude
  }

  return updated
}

// ===== 유틸 =====
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getGradeConfig(grade: string): GradeConfig {
  return GRADE_CONFIGS[grade]
}
