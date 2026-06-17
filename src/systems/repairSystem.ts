import {
  EquipmentInstance,
  RepairCell,
  RepairMinigameConfig,
  HammerType,
  HAMMER_CONFIGS,
  REPAIR_MINIGAME_CONFIGS,
  RepairResult,
} from '../types'

// ===== 딸깍 수리 확률 (등급별) =====
export const QUICK_REPAIR_RATES: Record<string, number> = {
  // 최저 85% - 어지간하면 성공하지만 실패 1번이 치명적 (최대 내구도 영구 감소)
  // 이 '혹시나' 불안감이 정밀 수리로 유도하는 핵심
  common:          98,
  fine:            97,
  rare:            95,
  hero:            93,
  legendary:       91,
  legendary_relic: 89,
  ancient:         87,
  mythic:          85,
}

// ===== 딸깍 수리 =====
export function attemptQuickRepair(equipment: EquipmentInstance): {
  success: boolean
  result: RepairResult
  updated: EquipmentInstance
} {
  const rate = QUICK_REPAIR_RATES[equipment.grade] ?? 50
  const success = Math.random() * 100 < rate

  if (success) {
    const restored = 1
    const updated: EquipmentInstance = {
      ...equipment,
      currentDurability: Math.min(
        equipment.currentDurability + restored,
        equipment.maxDurability
      ),
    }
    return {
      success: true,
      result: { outcome: 'success', mode: 'quick', durabilityRestored: restored, maxDurabilityLost: 0 },
      updated,
    }
  } else {
    const lost = 1
    const updated: EquipmentInstance = {
      ...equipment,
      maxDurability: Math.max(0, equipment.maxDurability - lost),
    }
    return {
      success: false,
      result: { outcome: 'failure', mode: 'quick', durabilityRestored: 0, maxDurabilityLost: lost },
      updated,
    }
  }
}

// ===== 가중 거리 (직선=1, 대각=1.5) =====
// 대각 이동 비용을 1.5로 설정하여 직선/대각 구분 가능
// 최적 경로: min(대각 수 * 1.5 + 직선 수, 순수 직선 이동)
function weightedDistance(r1: number, c1: number, r2: number, c2: number): number {
  const dr = Math.abs(r1 - r2)
  const dc = Math.abs(c1 - c2)
  const diag = Math.min(dr, dc)
  const ortho = Math.abs(dr - dc)
  const withDiag = diag * 1.5 + ortho   // 대각 활용 경로
  const withOrtho = dr + dc              // 순수 직선 경로
  return Math.min(withDiag, withOrtho)
}

// ===== 미니게임 초기 그리드 생성 =====
export function createMinigameGrid(config: RepairMinigameConfig): RepairCell[][] {
  const { rows, cols, damageSpots } = config
  const grid: RepairCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isRevealed: false,
      isDamageSpot: false,
      isFound: false,
      distanceHint: null,
    }))
  )

  // 손상 지점 랜덤 배치
  let placed = 0
  while (placed < damageSpots) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    if (!grid[r][c].isDamageSpot) {
      grid[r][c].isDamageSpot = true
      placed++
    }
  }
  return grid
}

// ===== 거리 힌트 재계산 =====
// 미발견 손상 지점까지의 최소 체비쇼프 거리 반환
export function recalculateHints(grid: RepairCell[][]): RepairCell[][] {
  const rows = grid.length
  const cols = grid[0].length

  // 미발견 손상 지점 목록
  const unfoundSpots: [number, number][] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].isDamageSpot && !grid[r][c].isFound) {
        unfoundSpots.push([r, c])
      }
    }
  }

  return grid.map((row, r) =>
    row.map((cell, c) => {
      if (!cell.isRevealed || cell.isDamageSpot) return cell
      if (unfoundSpots.length === 0) return { ...cell, distanceHint: null }

      const minDist = Math.min(
        ...unfoundSpots.map(([sr, sc]) => weightedDistance(r, c, sr, sc))
      )
      return { ...cell, distanceHint: minDist }
    })
  )
}

// ===== 망치로 칸 공개 =====
export function applyHammer(
  grid: RepairCell[][],
  targetRow: number,
  targetCol: number,
  hammerType: HammerType
): { grid: RepairCell[][]; foundThisStrike: number } {
  const rows = grid.length
  const cols = grid[0].length
  const pattern = HAMMER_CONFIGS[hammerType].pattern
  let foundThisStrike = 0

  let newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))

  for (const [dr, dc] of pattern) {
    const r = targetRow + dr
    const c = targetCol + dc
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue
    if (newGrid[r][c].isRevealed) continue

    newGrid[r][c].isRevealed = true

    if (newGrid[r][c].isDamageSpot) {
      newGrid[r][c].isFound = true
      foundThisStrike++
    }
  }

  // 발견이 있었으면 거리 힌트 전체 재계산
  newGrid = recalculateHints(newGrid)
  return { grid: newGrid, foundThisStrike }
}

// ===== 승리 조건 확인 =====
export function checkWin(grid: RepairCell[][]): boolean {
  return grid.every((row) =>
    row.every((cell) => !cell.isDamageSpot || cell.isFound)
  )
}

// ===== 미니게임 설정 가져오기 =====
export function getMinigameConfig(grade: string): RepairMinigameConfig {
  return REPAIR_MINIGAME_CONFIGS[grade] ?? REPAIR_MINIGAME_CONFIGS['common']
}

// ===== 미니게임 결과 적용 =====
export function applyMinigameResult(
  equipment: EquipmentInstance,
  spotsFound: number,
  totalSpots: number,
  won: boolean
): { result: RepairResult; updated: EquipmentInstance } {
  if (won) {
    // 정밀 수리 성공 시 내구도 완전 회복
    const restored = equipment.maxDurability - equipment.currentDurability
    return {
      result: {
        outcome: 'success',
        mode: 'minigame',
        durabilityRestored: restored,
        maxDurabilityLost: 0,
        spotsFound,
        totalSpots,
      },
      updated: { ...equipment, currentDurability: equipment.maxDurability },
    }
  } else {
    const lost = 1
    return {
      result: {
        outcome: 'failure',
        mode: 'minigame',
        durabilityRestored: 0,
        maxDurabilityLost: lost,
        spotsFound,
        totalSpots,
      },
      updated: {
        ...equipment,
        maxDurability: Math.max(0, equipment.maxDurability - lost),
      },
    }
  }
}
