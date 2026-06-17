import { EquipmentInstance, EnhancementResult, PenaltyType, GradeConfig } from '../types'
import { GRADE_CONFIGS } from '../data/gradeConfigs'

// ===== 확률 계산 =====
export function getEnhancementProbability(
  equipment: EquipmentInstance,
  divinePowerBoost: number = 0
): number {
  const config = GRADE_CONFIGS[equipment.grade]
  if (!config) return 0

  const level = equipment.currentLevel
  const probs = config.probabilities
  // 마지막 값 반복 적용 (무제한 등급용)
  const baseProbability = level < probs.length ? probs[level] : probs[probs.length - 1]

  return Math.min(100, baseProbability + divinePowerBoost)
}

// ===== 강화 시도 =====
export function attemptEnhancement(
  equipment: EquipmentInstance,
  config: GradeConfig,
  divinePowerBoost: number = 0,
  destroyProtection: boolean = false,
  levelDropProtection: boolean = false,
): EnhancementResult {
  const probability = getEnhancementProbability(equipment, divinePowerBoost)
  const roll = Math.random() * 100

  const previousLevel = equipment.currentLevel

  if (roll < probability) {
    // ===== 성공 =====
    const godComment = pickRandom(config.godComments.success)
    return {
      outcome: 'success',
      previousLevel,
      newLevel: previousLevel + 1,
      penaltyApplied: 'NONE',
      penaltyMagnitude: 0,
      godComment,
      probabilityUsed: probability,
    }
  }

  // ===== 실패 - 페널티 계산 =====
  const activePenalties = config.penalties.filter(
    (p) =>
      p.fromLevel <= previousLevel &&
      (p.toLevel === -1 || p.toLevel >= previousLevel)
  )

  let penaltyApplied: PenaltyType = 'NONE'
  let penaltyMagnitude = 0
  let newLevel = previousLevel

  for (const penaltyConfig of activePenalties) {
    const penaltyRoll = Math.random() * 100
    if (penaltyRoll >= penaltyConfig.triggerChance) continue

    // 보호 아이템 처리
    if (penaltyConfig.penaltyType === 'EQUIPMENT_DESTROY' && destroyProtection) {
      continue
    }
    if (
      (penaltyConfig.penaltyType === 'LEVEL_DOWN' ||
        penaltyConfig.penaltyType === 'LEVEL_RESET') &&
      levelDropProtection
    ) {
      continue
    }

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
        // 내구도 데미지는 별도로 처리 (여러 개 중복 가능)
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
  const godComment = isDestroyed
    ? pickRandom(config.godComments.destroy)
    : pickRandom(config.godComments.failure)

  return {
    outcome: isDestroyed ? 'destroy' : 'failure',
    previousLevel,
    newLevel,
    penaltyApplied,
    penaltyMagnitude,
    godComment,
    probabilityUsed: probability,
  }
}

// ===== 강화 결과를 장비 인스턴스에 적용 =====
export function applyEnhancementResult(
  equipment: EquipmentInstance,
  result: EnhancementResult
): EquipmentInstance | null {
  if (result.outcome === 'destroy') return null

  const updated = { ...equipment }
  updated.currentLevel = result.newLevel

  if (result.penaltyApplied === 'DURABILITY_DAMAGE') {
    updated.currentDurability = Math.max(
      0,
      updated.currentDurability - result.penaltyMagnitude
    )
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
