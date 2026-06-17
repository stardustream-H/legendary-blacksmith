import { useState, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { GRADE_NAMES, GRADE_COLORS, HammerType, HAMMER_CONFIGS, RepairCell } from '../types'
import {
  createMinigameGrid,
  applyHammer,
  checkWin,
  getMinigameConfig,
  applyMinigameResult,
} from '../systems/repairSystem'

type Phase = 'playing' | 'won' | 'lost'

export default function RepairMinigame() {
  const { equipment, selectedEquipmentId, setScreen, updateEquipment } = useGameStore()
  const selected = equipment.find((eq) => eq.id === selectedEquipmentId)
  const config = selected ? getMinigameConfig(selected.grade) : null

  const [grid, setGrid] = useState<RepairCell[][]>(() =>
    config ? createMinigameGrid(config) : []
  )
  const [selectedHammer, setSelectedHammer] = useState<HammerType>(
    config?.availableHammers[0] ?? 'small'
  )
  const [attemptsLeft, setAttemptsLeft] = useState(config?.maxAttempts ?? 4)
  const [spotsFound, setSpotsFound] = useState(0)
  const [phase, setPhase] = useState<Phase>('playing')

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (phase !== 'playing') return
      if (!config) return
      const cell = grid[row][col]
      if (cell.isRevealed) return

      const { grid: newGrid, foundThisStrike } = applyHammer(grid, row, col, selectedHammer)
      const newFound = spotsFound + foundThisStrike
      const newAttempts = attemptsLeft - 1

      setGrid(newGrid)
      setSpotsFound(newFound)
      setAttemptsLeft(newAttempts)

      if (checkWin(newGrid)) {
        setPhase('won')
        const { updated } = applyMinigameResult(selected!, newFound, config.damageSpots, true)
        updateEquipment(updated)
      } else if (newAttempts <= 0) {
        setPhase('lost')
        const { updated } = applyMinigameResult(selected!, newFound, config.damageSpots, false)
        updateEquipment(updated)
      }
    },
    [grid, phase, config, selectedHammer, attemptsLeft, spotsFound, selected, updateEquipment]
  )

  if (!selected || !config) {
    setScreen('forge')
    return null
  }

  const totalSpots = config.damageSpots
  const gradeColor = GRADE_COLORS[selected.grade]

  const renderCell = (cell: RepairCell, r: number, c: number) => {
    if (!cell.isRevealed) {
      return (
        <button
          key={`${r}-${c}`}
          onClick={() => handleCellClick(r, c)}
          className="w-full aspect-square rounded-md border border-forge-border bg-forge-card hover:bg-forge-gold/20 hover:border-forge-gold transition-all active:scale-95 text-lg font-bold text-forge-text-dim flex items-center justify-center"
          disabled={phase !== 'playing'}
        >
          ?
        </button>
      )
    }

    if (cell.isFound) {
      return (
        <div
          key={`${r}-${c}`}
          className="w-full aspect-square rounded-md border-2 border-red-500 bg-red-900/40 flex items-center justify-center text-xl"
        >
          X
        </div>
      )
    }

    const dist = cell.distanceHint
    const distColor =
      dist === null    ? 'text-forge-text-dim' :
      dist <= 1        ? 'text-red-400' :       // 직선 1칸 (바로 옆)
      dist <= 1.5      ? 'text-orange-400' :    // 대각 1칸
      dist <= 2        ? 'text-yellow-400' :    // 2칸 거리
      dist <= 3        ? 'text-green-400' :     // 3칸 거리
      'text-blue-400'                           // 멀리

    return (
      <div
        key={`${r}-${c}`}
        className="w-full aspect-square rounded-md border border-forge-border/50 bg-forge-bg/60 flex items-center justify-center text-lg font-bold"
      >
        <span className={distColor}>
          {dist === null ? '-' : Number.isInteger(dist) ? dist : dist.toFixed(1)}
        </span>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-3 overflow-y-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('repair')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors"
        >
          &larr; 수리 선택으로
        </button>
        <h2 className="text-forge-gold text-lg font-bold">정밀 수리 미니게임</h2>
      </div>

      <div className="flex items-center justify-between bg-forge-card rounded-lg px-4 py-2 border border-forge-border">
        <div>
          <span className="font-bold text-sm" style={{ color: gradeColor }}>
            {selected.name}
          </span>
          <span className="text-forge-text-dim text-xs ml-2">
            [{GRADE_NAMES[selected.grade]}]
          </span>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-forge-text-dim">
            남은 손상: <span className="text-red-400 font-bold">{totalSpots - spotsFound}</span>
          </span>
          <span className={`font-bold ${attemptsLeft <= 2 ? 'text-red-400' : 'text-forge-gold'}`}>
            남은 횟수: {attemptsLeft}
          </span>
        </div>
      </div>

      {phase !== 'playing' && (
        <div className={`p-4 rounded-xl text-center border-2 ${phase === 'won' ? 'border-green-500 bg-green-900/30 text-green-400' : 'border-red-700 bg-red-900/30 text-red-400'}`}>
          <div className="text-3xl mb-2">{phase === 'won' ? 'O' : 'X'}</div>
          <div className="font-bold text-lg mb-1">
            {phase === 'won' ? '수리 성공!' : '수리 실패...'}
          </div>
          <div className="text-sm opacity-80">
            {phase === 'won'
              ? '모든 손상 지점을 찾았습니다. 내구도가 회복됩니다.'
              : '시도 횟수를 소진했습니다. 최대 내구도가 감소합니다.'}
          </div>
          <div className="text-xs mt-1 opacity-60">
            발견: {spotsFound} / {totalSpots}
          </div>
          <div className="flex gap-3 justify-center mt-3">
            <button
              onClick={() => setScreen('repair')}
              className="bg-forge-card border border-forge-border rounded-lg px-4 py-2 text-forge-text hover:border-forge-gold transition-colors text-sm"
            >
              수리 화면으로
            </button>
            <button
              onClick={() => setScreen('forge')}
              className="bg-forge-card border border-forge-border rounded-lg px-4 py-2 text-forge-text hover:border-forge-gold transition-colors text-sm"
            >
              대장간으로
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {config.availableHammers.map((type: HammerType) => {
          const h = HAMMER_CONFIGS[type]
          return (
            <button
              key={type}
              onClick={() => setSelectedHammer(type)}
              disabled={phase !== 'playing'}
              className={`flex-1 p-2 rounded-lg border text-center transition-all text-xs ${selectedHammer === type ? 'border-forge-gold bg-forge-gold/20 text-forge-gold' : 'border-forge-border bg-forge-card text-forge-text-dim hover:border-forge-gold/50'} disabled:opacity-50`}
            >
              <div className="font-bold">{h.name}</div>
              <div className="text-xs opacity-70">{h.description}</div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-center">
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
            width: `${Math.min(config.cols * 64, 320)}px`,
          }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => renderCell(cell, r, c))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-center text-xs text-forge-text-dim mt-1">
        <span className="text-red-400">1 = 직선 바로 옆</span>
        <span className="text-orange-400">1.5 = 대각 바로 옆</span>
        <span className="text-yellow-400">2 = 2칸</span>
        <span className="text-green-400">3+ = 멀리</span>
        <span>X = 발견</span>
        <span>? = 미탐색</span>
      </div>

      <div className="bg-forge-card/50 rounded-lg p-2 text-xs text-forge-text-dim text-center">
        숫자는 가장 가까운 미발견 손상 지점까지의 거리 (대각선 = 1칸)
      </div>
    </div>
  )
}
