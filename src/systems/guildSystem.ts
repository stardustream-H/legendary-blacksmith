import {
  Adventurer, AdventurerGrade, AdventurerRole, RoleCategory,
  Region, Expedition, ExpeditionOutcome, ExpeditionResult,
  EquipmentInstance, GradeType, CharacterStats, StatGrade, STAT_GRADE_VALUE, EquipmentType,
} from '../types'
import { ADVENTURER_POOL } from '../data/adventurers'

// ===== 등급별 기본 스탯 보너스 =====
const GRADE_STAT_BONUS: Record<AdventurerGrade, number> = {
  rookie:  0,
  veteran: 2,
  elite:   3,
  legend:  5,
}

// StatGrade → 수치 변환 (등급 보너스 포함)
function statVal(grade: StatGrade, adventurerGrade: AdventurerGrade): number {
  return Math.min(6, STAT_GRADE_VALUE[grade] + GRADE_STAT_BONUS[adventurerGrade])
}

// ===== 역할 카테고리 분류 =====
export function getRoleCategory(role: AdventurerRole): RoleCategory {
  if (role === 'tank') return 'tank'
  if (role === 'healer' || role === 'buffer' || role === 'debuffer') return 'support'
  return 'dps'
}

// ===== 파티 성공률 계산 =====
export function calculateSuccessRate(
  region: Region,
  party: Adventurer[],
  lentEquipment: EquipmentInstance | null
): number {
  if (party.length === 0) return 0

  // 기본 성공률 (난이도 반비례)
  const base = Math.max(15, 85 - region.difficulty * 7)

  // 인원 보너스
  const sizeBonus = [0, 0, 5, 10, 13, 15][party.length] ?? 15

  // 역할 균형 보너스
  const categories = new Set(party.map(a => getRoleCategory(a.role)))
  const balanceBonus = categories.size >= 3 ? 15 : categories.size === 2 ? 7 : 0

  // 전문성 기반 전투 기여 (평균 전문성 → 최대 +15)
  const avgProficiency = party.reduce(
    (s, a) => s + statVal(a.stats.proficiency, a.grade), 0
  ) / party.length
  const combatBonus = Math.min(15, Math.floor(avgProficiency * 2.5))

  // 판단력 기반 성공률 보정 (평균 판단력 → 최대 +12)
  const avgJudgment = party.reduce(
    (s, a) => s + statVal(a.stats.judgment, a.grade), 0
  ) / party.length
  const judgmentBonus = Math.min(12, Math.floor(avgJudgment * 2))

  // 대여 장비 보너스 (강화 수치 * 2, 최대 +15)
  const equipBonus = lentEquipment
    ? Math.min(15, lentEquipment.currentLevel * 2)
    : 0

  if (region.status === 'liberated') {
    return Math.min(98, 75 + sizeBonus + equipBonus)
  }

  return Math.min(95, base + sizeBonus + balanceBonus + combatBonus + judgmentBonus + equipBonus)
}

// ===== 귀환 턴 계산 (체력 반영) =====
export function calculateReturnTurn(
  region: Region,
  party: Adventurer[],
  lentEquipment: EquipmentInstance | null,
  currentTurn: number
): number {
  const successRate = calculateSuccessRate(region, party, lentEquipment)
  // 성공률이 높을수록 빨리 돌아옴
  const ratio = Math.max(0, Math.min(1, (successRate - 20) / 75))
  const range = region.maxTurns - region.minTurns
  const baseTurns = region.maxTurns - Math.floor(ratio * range)

  // 체력 평균이 높으면 약간 빨리 귀환
  const avgVitality = party.reduce(
    (s, a) => s + statVal(a.stats.vitality, a.grade), 0
  ) / party.length
  const vitalityBonus = avgVitality >= 4 ? 1 : 0

  const jitter = Math.floor(Math.random() * 2)
  return currentTurn + Math.max(region.minTurns, Math.min(region.maxTurns, baseTurns - jitter - vitalityBonus))
}

// ===== 원정 결과 계산 =====
export function resolveExpedition(
  region: Region,
  expedition: Expedition,
  party: Adventurer[],
  lentEquipment: EquipmentInstance | null
): Omit<ExpeditionResult, 'justLiberated' | 'liberationRewardEquipment'> {
  const successRate = calculateSuccessRate(region, party, lentEquipment)
  const roll = Math.random() * 100

  let outcome: ExpeditionOutcome
  if (roll <= successRate * 0.5) outcome = 'great_success'
  else if (roll <= successRate) outcome = 'success'
  else if (roll <= successRate + (100 - successRate) * 0.45) outcome = 'partial'
  else outcome = 'failure'

  const [minGold, maxGold] = region.rewardGoldRange
  const [minDP, maxDP] = region.rewardDivinePowerRange

  const multipliers: Record<ExpeditionOutcome, number> = {
    great_success: 2.0,
    success:       1.0,
    partial:       0.4,
    failure:       0,
  }
  const mult = multipliers[outcome]

  const liberationGain: Record<ExpeditionOutcome, number> = {
    great_success: 25,
    success:       15,
    partial:       5,
    failure:       0,
  }

  const goldEarned = Math.floor(
    (minGold + Math.random() * (maxGold - minGold)) * mult
  )
  const dpEarned = Math.floor(
    (minDP + Math.random() * (maxDP - minDP)) * mult
  )

  // 장비 드랍 (대성공/성공만)
  let equipmentEarned: EquipmentInstance | null = null
  if ((outcome === 'great_success' || outcome === 'success') &&
      Math.random() * 100 < region.rewardEquipmentChance) {
    const grades = region.rewardEquipmentGrades
    const grade = grades[Math.floor(Math.random() * grades.length)]
    equipmentEarned = generateRewardEquipment(grade)
  }

  // 부상자 처리 (체력에 따라 부상 확률 조정)
  const injuredIds: string[] = []
  if (outcome === 'partial') {
    // 체력 낮은 멤버가 더 부상당하기 쉬움
    const sorted = [...party].sort(
      (a, b) => statVal(a.stats.vitality, a.grade) - statVal(b.stats.vitality, b.grade)
    )
    injuredIds.push(sorted[0].id)
  } else if (outcome === 'failure') {
    // 실패: 체력 낮은 순으로 절반 부상
    const sorted = [...party].sort(
      (a, b) => statVal(a.stats.vitality, a.grade) - statVal(b.stats.vitality, b.grade)
    )
    sorted.slice(0, Math.ceil(party.length / 2)).forEach(a => injuredIds.push(a.id))
  }

  // 담력이 낮으면 부상 회복이 더 오래 걸림 (스토어에서 활용)
  const lostEquipmentId = outcome === 'failure' ? expedition.lentEquipmentId : null
  const report = generateReport(outcome, party)

  return {
    outcome,
    regionId: region.id,
    liberationGain: liberationGain[outcome],
    goldEarned,
    divinePowerEarned: dpEarned,
    equipmentEarned,
    injuredAdventurerIds: injuredIds,
    lostEquipmentId,
    report,
  }
}

// ===== 보상 장비 생성 =====
let rewardEqCounter = 1000

export function generateRewardEquipment(grade: GradeType): EquipmentInstance {
  const id = `reward_eq_${rewardEqCounter++}`

  // [이름, 타입] 쌍으로 관리 — 무기 6종 + 갑옷 4종(천옷/경갑/중갑/판금)
  type EqEntry = { name: string; type: EquipmentType }
  const poolByGrade: Record<string, EqEntry[]> = {
    common: [
      { name: '낡은 검',       type: 'sword' },
      { name: '녹슨 도끼',     type: 'axe' },
      { name: '목창',          type: 'spear' },
      { name: '나무 단궁',     type: 'bow' },
      { name: '나무 지팡이',   type: 'staff' },
      { name: '철제 단검',     type: 'dagger' },
      { name: '낡은 마포의',   type: 'cloth' },
      { name: '가죽 경갑',     type: 'light_armor' },
      { name: '철제 중갑',     type: 'medium_armor' },
      { name: '낡은 판금갑옷', type: 'plate' },
    ],
    fine: [
      { name: '강철 롱소드',   type: 'sword' },
      { name: '강철 전투도끼', type: 'axe' },
      { name: '철촉 장창',     type: 'spear' },
      { name: '사냥꾼의 활',   type: 'bow' },
      { name: '은제 지팡이',   type: 'staff' },
      { name: '은장 단검',     type: 'dagger' },
      { name: '견고한 법복',   type: 'cloth' },
      { name: '강화 가죽갑옷', type: 'light_armor' },
      { name: '사슬 중갑',     type: 'medium_armor' },
      { name: '강철 판금갑옷', type: 'plate' },
    ],
    rare: [
      { name: '정예 검사의 검',   type: 'sword' },
      { name: '광폭의 전투도끼',  type: 'axe' },
      { name: '용사의 장창',      type: 'spear' },
      { name: '엘프의 활',        type: 'bow' },
      { name: '마법사의 지팡이',  type: 'staff' },
      { name: '독사의 단검',      type: 'dagger' },
      { name: '현자의 법의',      type: 'cloth' },
      { name: '정예 경갑',        type: 'light_armor' },
      { name: '용사의 중갑',      type: 'medium_armor' },
      { name: '기사의 판금',      type: 'plate' },
    ],
    hero: [
      { name: '영웅의 대검',       type: 'sword' },
      { name: '파멸의 대도끼',     type: 'axe' },
      { name: '천공을 가르는 창',  type: 'spear' },
      { name: '천공의 활',         type: 'bow' },
      { name: '현자의 지팡이',     type: 'staff' },
      { name: '어둠의 블레이드',   type: 'dagger' },
      { name: '대현자의 법의',     type: 'cloth' },
      { name: '영웅의 경갑',       type: 'light_armor' },
      { name: '영웅의 중갑',       type: 'medium_armor' },
      { name: '영웅의 판금갑옷',   type: 'plate' },
    ],
    legendary: [
      { name: '전설의 성검',         type: 'sword' },
      { name: '신화의 마왕도끼',     type: 'axe' },
      { name: '신수의 성창',         type: 'spear' },
      { name: '신궁의 활',           type: 'bow' },
      { name: '대마법사의 지팡이',   type: 'staff' },
      { name: '신화급 레이피어',     type: 'dagger' },
      { name: '신화 대현자의 법의',  type: 'cloth' },
      { name: '전설의 경갑',         type: 'light_armor' },
      { name: '전설의 판갑',         type: 'medium_armor' },
      { name: '신화의 성판금',       type: 'plate' },
    ],
  }
  const maxLevels: Record<string, number> = {
    common: 5, fine: 10, rare: 15, hero: 20, legendary: 30,
  }
  const pool = poolByGrade[grade] ?? poolByGrade['common']
  const entry = pool[Math.floor(Math.random() * pool.length)]

  return {
    id,
    name: entry.name,
    grade: grade as GradeType,
    type: entry.type,
    currentLevel: 0,
    maxLevel: maxLevels[grade] ?? 10,
    currentDurability: 100,
    maxDurability: 100,
    isOwned: true,
    isRelic: false,
    enhancementLockTurns: 0,
    failureCount: 0,
  }
}

// ===== 개그 보고서 =====
const REPORTS: Record<ExpeditionOutcome, string[]> = {
  great_success: [
    '적들이 파티를 보자마자 자진해서 무릎을 꿇었습니다. 아마 평판이 자자한 모양입니다.',
    '임무 완료. 강철근이 방패를 거의 한 번도 쓰지 않았다고 자랑스럽게 보고했습니다.',
    '최 궁수가 화살 10발 모두 명중시켰습니다. 기적은 가끔 일어납니다.',
    '예상보다 훨씬 빨리 돌아왔습니다. 왕복 빠른 길을 재빠른 박이 "우연히" 알고 있었다고 합니다.',
  ],
  success: [
    '임무 완료. 치료사 임이 무릎을 살짝 긁힌 것 외엔 별다른 부상이 없었습니다.',
    '고생했지만 해냈습니다. 강철근은 방패에 긁힌 자국을 훈장처럼 자랑하고 있습니다.',
    '성공적으로 복귀했습니다. 재빠른 박의 가방에 출처 불명의 물건이 늘어난 것은 모른 척하기로 했습니다.',
    '임무 성공. 치료사 임이 신에게 기도를 올렸고, 이번엔 신도 깨어 계셨던 것 같습니다.',
  ],
  partial: [
    '고전 끝에 귀환. 최 궁수의 10번째 화살이 예상치 못한 곳에 박히며 혼란이 있었습니다.',
    '임무는 부분 완료. 음유시인의 노래가 아군인지 적군인지 헷갈리게 만든 것이 원인으로 보입니다.',
    '수확은 있었으나 힘들었습니다. 돌아오는 길에 재빠른 박이 지도를 거꾸로 들고 있었다는 게 밝혀졌습니다.',
    '고생 많이 했습니다. 강철근이 방패 대신 방향을 잘못 틀어 초반에 혼란이 있었다고 합니다.',
  ],
  failure: [
    '전략적 후퇴를 선택했습니다. 강철근은 이것을 "전술적 재배치"라고 불렀습니다.',
    '적의 저항이 강했습니다. 최 궁수의 마지막 화살이 아군을 맞힌 것이 결정타였습니다.',
    '임무 실패. 치료사 임이 신에게 기도했으나 신은 이번에 정말로 주무셨던 것 같습니다.',
    '후퇴. 재빠른 박이 "전략물자 확보"를 위해 너무 많이 들고 뛰어 속도가 너무 느렸습니다.',
  ],
}

function generateReport(outcome: ExpeditionOutcome, party: Adventurer[]): string {
  const pool = REPORTS[outcome]
  let report = pool[Math.floor(Math.random() * pool.length)]
  if (party.length > 0 && Math.random() < 0.3) {
    const a = party[Math.floor(Math.random() * party.length)]
    report = `[${a.name}] ` + report
  }
  return report
}

// ===== 신규 용병 생성 =====
let adventurerCounter = 100

export function generateNewAdventurer(): Adventurer {
  const template = ADVENTURER_POOL[Math.floor(Math.random() * ADVENTURER_POOL.length)]
  return {
    ...template,
    id: `adv_${adventurerCounter++}`,
    status: 'available',
    lentEquipmentId: null,
    injuredUntilTurn: null,
    dispatchedRegionId: null,
  }
}

// ===== 부상 회복 턴 계산 (담력 반영) =====
export function calcInjuryDuration(stats: CharacterStats): number {
  const courageVal = STAT_GRADE_VALUE[stats.courage]
  // 담력 E(1)=4턴, D(2)=4턴, C(3)=3턴, B(4)=2턴, A(5)=2턴, S(6)=1턴
  if (courageVal >= 6) return 1
  if (courageVal >= 4) return 2
  if (courageVal >= 3) return 3
  return 4
}
