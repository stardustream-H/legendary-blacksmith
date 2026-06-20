import { Commission, CommissionType, CommissionGrade, EquipmentInstance, GradeType } from '../types'

let idCounter = 1000

function genId() { return `comm_${idCounter++}` }
function genEqId() { return `ceq_${idCounter++}` }

const GRADE_POOL_BY_RANK: { minRank: number; grades: GradeType[] }[] = [
  { minRank: 0, grades: ['common', 'common', 'common', 'fine'] },
  { minRank: 1, grades: ['common', 'fine', 'fine', 'rare'] },
  { minRank: 2, grades: ['fine', 'fine', 'rare', 'rare'] },
  { minRank: 3, grades: ['fine', 'rare', 'rare', 'hero'] },
  { minRank: 4, grades: ['rare', 'hero', 'hero', 'legendary'] },
  { minRank: 5, grades: ['hero', 'legendary', 'legendary', 'legendary_relic'] },
]

const EQUIPMENT_NAMES: Partial<Record<GradeType, string[]>> = {
  common:    ['낡은 검', '녹슨 단검', '나무 방패', '낡은 갑옷'],
  fine:      ['철제 롱소드', '강철 단검', '철 방패', '체인메일'],
  rare:      ['미스릴 검', '엘프의 단검', '룬 방패', '드워프 갑옷'],
  hero:      ['영웅의 검', '어둠의 단검', '빛의 방패', '영웅의 갑옷'],
  legendary: ['전설의 검', '전설의 단검', '전설의 방패', '전설의 갑옷'],
}

const MAX_LEVELS: Record<string, number> = {
  common: 9, fine: 12, rare: 15, hero: 20,
  legendary: 9999, legendary_relic: 9999, ancient: 9999, mythic: 9999,
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateCommissionEquipment(grade: GradeType): EquipmentInstance {
  const maxLevel = MAX_LEVELS[grade] ?? 9
  const currentLevel = Math.floor(Math.random() * Math.min(5, maxLevel))
  const maxDur = 20 + Math.floor(Math.random() * 30)
  const names = EQUIPMENT_NAMES[grade] ?? ['의뢰 장비']
  return {
    id: genEqId(),
    name: pickRandom(names),
    grade,
    type: 'sword',
    isRelic: grade === 'legendary_relic' || grade === 'ancient' || grade === 'mythic',
    currentLevel,
    maxLevel,
    currentDurability: Math.max(1, Math.floor(maxDur * (0.3 + Math.random() * 0.4))),
    maxDurability: maxDur,
    isOwned: false,
    enhancementLockTurns: 0,
    failureCount: 0,
  }
}

function gradeMultiplier(grade: GradeType): number {
  const map: Record<string, number> = {
    common: 1, fine: 1.5, rare: 2.5, hero: 4,
    legendary: 8, legendary_relic: 12, ancient: 20, mythic: 30,
  }
  return map[grade] ?? 1
}

export function generateCommissions(divineRank: number, turn: number): Commission[] {
  const baseCount = divineRank <= 1 ? 2 : divineRank <= 4 ? 3 : 4
  const pool = [...GRADE_POOL_BY_RANK].reverse().find((p) => divineRank >= p.minRank)
    ?? GRADE_POOL_BY_RANK[0]

  const commissions: Commission[] = []

  for (let i = 0; i < baseCount; i++) {
    const grade = pickRandom(pool.grades)
    const equipment = generateCommissionEquipment(grade)
    const mult = gradeMultiplier(grade)
    const wantsRepair = equipment.currentDurability < equipment.maxDurability * 0.5
    const type: CommissionType = wantsRepair || Math.random() < 0.4 ? 'repair' : 'enhance'
    const gradeRoll = Math.random()
    const commGrade: CommissionGrade =
      gradeRoll > 0.9 ? 'premium' : gradeRoll > 0.75 ? 'urgent' : 'normal'

    const baseGold = Math.floor(70 * mult * (commGrade === 'premium' ? 3 : commGrade === 'urgent' ? 1.8 : 1))
    const basePower = Math.floor(12 * mult * (commGrade === 'premium' ? 2 : 1))

    const targetLevel = type === 'enhance'
      ? Math.min(equipment.maxLevel, equipment.currentLevel + 1 + Math.floor(Math.random() * 3))
      : undefined

    commissions.push({
      id: genId(),
      equipment,
      type,
      targetLevel,
      rewardGold: baseGold,
      rewardDivinePower: basePower,
      grade: commGrade,
      accepted: false,
      processed: false,
      expiresThisTurn: commGrade === 'urgent' || commGrade === 'premium',
    })
  }

  if (turn % 10 === 0 && divineRank >= 2) {
    const grade = pickRandom(pool.grades)
    const equipment = generateCommissionEquipment(grade)
    const mult = gradeMultiplier(grade)
    commissions.push({
      id: genId(),
      equipment,
      type: 'enhance',
      targetLevel: Math.min(equipment.maxLevel, equipment.currentLevel + 3),
      rewardGold: Math.floor(280 * mult),
      rewardDivinePower: Math.floor(30 * mult),
      grade: 'premium',
      accepted: false,
      processed: false,
      expiresThisTurn: true,
    })
  }

  return commissions
}

export function evaluateEnhanceCommission(commission: Commission, resultLevel: number): boolean {
  if (!commission.targetLevel) return false
  return resultLevel >= commission.targetLevel
}

export function getRankDelta(success: boolean, grade: GradeType, commGrade: CommissionGrade): number {
  const mult = gradeMultiplier(grade)
  const commMult = commGrade === 'premium' ? 2.5 : commGrade === 'urgent' ? 1.5 : 1
  const base = Math.round(mult * commMult)
  return success ? base : -base
}
