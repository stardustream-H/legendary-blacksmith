import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { GRADE_NAMES, GRADE_COLORS } from '../types'
import { attemptQuickRepair, QUICK_REPAIR_RATES, getMinigameConfig } from '../systems/repairSystem'

export default function RepairScreen() {
  const { equipment, selectedEquipmentId, setScreen, updateEquipment } = useGameStore()
  const [lastResult, setLastResult] = useState<{ success: boolean; msg: string } | null>(null)

  const selected = equipment.find((eq) => eq.id === selectedEquipmentId)
  if (!selected) { setScreen('forge'); return null }

  const isFull = selected.currentDurability >= selected.maxDurability
  const isDestroyed = selected.maxDurability <= 0

  const quickRate = QUICK_REPAIR_RATES[selected.grade] ?? 50
  const minigameConfig = getMinigameConfig(selected.grade)
  const durPct = selected.maxDurability > 0
    ? (selected.currentDurability / selected.maxDurability) * 100
    : 0

  const handleQuickRepair = () => {
    const { success, updated } = attemptQuickRepair(selected)
    updateEquipment(updated)
    setLastResult({
      success,
      msg: success
        ? `딸깍! 내구도 +1 회복 (${updated.currentDurability}/${updated.maxDurability})`
        : `실패... 최대 내구도 -1 (${updated.currentDurability}/${updated.maxDurability})`,
    })
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setScreen('forge')} className="text-forge-text-dim hover:text-forge-gold transition-colors">
          &larr; 대장간으로
        </button>
        <h2 className="text-forge-gold text-xl font-bold">수리</h2>
      </div>

      {/* 장비 정보 */}
      <div className="bg-forge-card border-2 rounded-xl p-5 text-center"
        style={{ borderColor: GRADE_COLORS[selected.grade] }}>
        <div className="text-lg font-bold mb-1" style={{ color: GRADE_COLORS[selected.grade] }}>
          {selected.name} +{selected.currentLevel}
        </div>
        <div className="text-forge-text-dim text-sm mb-3">[{GRADE_NAMES[selected.grade]}]</div>
        <div className="text-sm text-forge-text-dim mb-1">
          내구도: <span className={durPct < 30 ? 'text-red-400 font-bold' : 'text-forge-text'}>
            {selected.currentDurability}
          </span> / {selected.maxDurability}
        </div>
        <div className="w-full bg-gray-800 rounded-full h-4 mb-1">
          <div
            className="h-4 rounded-full transition-all duration-500"
            style={{
              width: `${durPct}%`,
              background: durPct < 30 ? '#7c1a1a' : durPct < 60 ? '#c9a227' : '#4a7c59',
            }}
          />
        </div>
        <div className="text-xs text-forge-text-dim mt-1">
          {durPct.toFixed(0)}% 남음
        </div>
        {isDestroyed && <div className="text-red-400 text-sm font-bold mt-2">최대 내구도 소진 — 장비 파괴</div>}
      </div>

      {/* 결과 메시지 */}
      {lastResult && (
        <div className={`p-3 rounded-lg text-center text-sm font-bold border ${
          lastResult.success
            ? 'border-green-600 text-green-400 bg-green-900/20'
            : 'border-red-800 text-red-400 bg-red-900/20'
        }`}>
          {lastResult.success ? '✓ ' : '✗ '}{lastResult.msg}
        </div>
      )}

      {/* 수리 모드 선택 */}
      <div className="grid grid-cols-2 gap-4">

        {/* 딸깍 수리 */}
        <div className="bg-forge-card border border-forge-border rounded-xl p-5 flex flex-col gap-3">
          <div className="text-center">
            <div className="text-3xl mb-2">망치</div>
            <div className="text-forge-text font-bold mb-1">딸깍 수리</div>
            <div className="text-forge-text-dim text-xs leading-relaxed">
              내구도 1 즉시 회복 시도<br/>
              실패 시 최대 내구도 1 감소
            </div>
          </div>

          {/* 성공 확률 표시 */}
          <div className="bg-forge-bg rounded-lg p-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-forge-text-dim text-xs">성공 확률</span>
              <span className={`font-black ${quickRate >= 70 ? 'text-green-400' : quickRate >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                {quickRate}%
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div className="h-2 rounded-full transition-all"
                style={{
                  width: `${quickRate}%`,
                  background: quickRate >= 70 ? '#4a7c59' : quickRate >= 40 ? '#c9a227' : '#7c1a1a',
                }}
              />
            </div>
          </div>

          <button
            onClick={handleQuickRepair}
            disabled={isFull || isDestroyed}
            className="w-full py-2 rounded-lg text-sm font-bold bg-forge-gold text-forge-bg
              hover:bg-forge-gold-light transition-all hover:scale-105
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isFull ? '내구도 최대' : '수리 시도'}
          </button>
        </div>

        {/* 정밀 수리 */}
        <div className="bg-forge-card border border-forge-border rounded-xl p-5 flex flex-col gap-3">
          <div className="text-center">
            <div className="text-3xl mb-2">과녁</div>
            <div className="text-forge-text font-bold mb-1">정밀 수리</div>
            <div className="text-forge-text-dim text-xs leading-relaxed">
              손상 지점을 직접 탐색<br/>
              성공 시 내구도 <span className="text-green-400 font-bold">완전 회복</span>
            </div>
          </div>

          {/* 미니게임 정보 */}
          <div className="bg-forge-bg rounded-lg p-3 text-xs flex flex-col gap-1">
            <div className="flex justify-between text-forge-text-dim">
              <span>그리드</span>
              <span className="text-forge-text">{minigameConfig.rows}×{minigameConfig.cols}</span>
            </div>
            <div className="flex justify-between text-forge-text-dim">
              <span>손상 지점</span>
              <span className="text-red-400 font-bold">{minigameConfig.damageSpots}개</span>
            </div>
            <div className="flex justify-between text-forge-text-dim">
              <span>시도 횟수</span>
              <span className={minigameConfig.maxAttempts <= minigameConfig.damageSpots + 1 ? 'text-orange-400 font-bold' : 'text-forge-text'}>
                {minigameConfig.maxAttempts}회
              </span>
            </div>
          </div>

          <button
            onClick={() => setScreen('repair-minigame')}
            disabled={isFull || isDestroyed}
            className="w-full py-2 rounded-lg text-sm font-bold border border-forge-gold text-forge-gold
              hover:bg-forge-gold/20 transition-all hover:scale-105
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isFull ? '내구도 최대' : '미니게임 시작'}
          </button>
        </div>

      </div>

      <div className="text-forge-text-dim text-xs text-center">
        정밀 수리 성공 시 내구도가 최대치로 완전 회복됩니다
      </div>
    </div>
  )
}
