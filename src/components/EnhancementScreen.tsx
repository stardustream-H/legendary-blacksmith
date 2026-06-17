import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { GRADE_NAMES, GRADE_COLORS } from '../types'
import {
  getEnhancementProbability,
  attemptEnhancement,
  applyEnhancementResult,
  getGradeConfig,
} from '../systems/enhancementSystem'
import ResultPopup from './ResultPopup'

export default function EnhancementScreen() {
  const {
    equipment,
    selectedEquipmentId,
    setScreen,
    updateEquipment,
    removeEquipment,
    setLastEnhancementResult,
    lastEnhancementResult,
    divinePower,
    spendDivinePower,
  } = useGameStore()

  const [isAnimating, setIsAnimating] = useState(false)
  const [usePowerBoost, setUsePowerBoost] = useState(false)
  const [useDestroyProtect, setUseDestroyProtect] = useState(false)

  const POWER_BOOST_COST = 15
  const DESTROY_PROTECT_COST = 20

  const selected = equipment.find((eq) => eq.id === selectedEquipmentId)

  useEffect(() => {
    if (!selected && !lastEnhancementResult) {
      setScreen('forge')
    }
  }, [selected, lastEnhancementResult, setScreen])

  if (!selected && !lastEnhancementResult) return null

  const config = selected ? getGradeConfig(selected.grade) : null
  const boostAmount = usePowerBoost ? 15 : 0
  const probability = selected ? getEnhancementProbability(selected, boostAmount) : 0

  const canBoost = divinePower >= POWER_BOOST_COST
  const canProtect = divinePower >= DESTROY_PROTECT_COST

  const handleEnhance = async () => {
    if (isAnimating || !selected || !config) return

    // 신성력 소모
    if (usePowerBoost && !spendDivinePower(POWER_BOOST_COST)) return
    if (useDestroyProtect && !spendDivinePower(DESTROY_PROTECT_COST)) return

    setIsAnimating(true)
    await new Promise((r) => setTimeout(r, 600))

    const result = attemptEnhancement(
      selected,
      config,
      boostAmount,
      useDestroyProtect,
      false
    )

    if (result.outcome === 'destroy') {
      removeEquipment(selected.id)
    } else {
      const updated = applyEnhancementResult(selected, result)
      if (updated) updateEquipment(updated)
    }

    setLastEnhancementResult(result)
    setIsAnimating(false)
    setUsePowerBoost(false)
    setUseDestroyProtect(false)
  }

  const PENALTY_NAMES: Record<string, string> = {
    NONE: '없음',
    LEVEL_DOWN: `레벨 하락`,
    LEVEL_RESET: '+0 초기화',
    DURABILITY_DAMAGE: '내구도 손상',
    MAX_LEVEL_REDUCE: '최대강화 감소',
    EQUIPMENT_DESTROY: '장비 파괴',
    ENHANCEMENT_LOCK: '강화 잠금',
  }

  const activePenalties = (config?.penalties ?? []).filter(
    (p) =>
      selected &&
      p.fromLevel <= selected.currentLevel &&
      (p.toLevel === -1 || p.toLevel >= selected.currentLevel)
  )

  if (!selected && lastEnhancementResult) {
    return (
      <ResultPopup
        result={lastEnhancementResult}
        equipmentName="(파괴됨)"
        gradeColor="#ff4444"
        onClose={() => {
          setLastEnhancementResult(null)
          setScreen('forge')
        }}
      />
    )
  }

  if (!selected) return null

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('forge')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors"
        >
          ← 대장간으로
        </button>
        <h2 className="text-forge-gold text-xl font-bold">⚡ 장비 강화</h2>
      </div>

      <div className="flex gap-6 flex-1">
        {/* 장비 정보 */}
        <div className="flex-1 flex flex-col gap-4">
          {/* 장비 카드 */}
          <div
            className={`
              bg-forge-card border-2 rounded-xl p-6 text-center
              transition-all duration-300
              ${isAnimating ? 'animate-pulse scale-105' : ''}
            `}
            style={{ borderColor: GRADE_COLORS[selected.grade] }}
          >
            <div
              className="text-5xl font-black mb-2"
              style={{ color: GRADE_COLORS[selected.grade] }}
            >
              +{selected.currentLevel}
            </div>
            <div
              className="text-xl font-bold"
              style={{ color: GRADE_COLORS[selected.grade] }}
            >
              {selected.name}
            </div>
            <div className="text-forge-text-dim text-sm mt-1">
              [{GRADE_NAMES[selected.grade]}]
            </div>
            <div className="mt-3 text-sm text-forge-text-dim">
              내구도: {selected.currentDurability}/{selected.maxDurability}
            </div>

            {/* 강화 단계 바 */}
            <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(selected.currentLevel / selected.maxLevel) * 100}%`,
                  backgroundColor: GRADE_COLORS[selected.grade],
                }}
              />
            </div>
            <div className="text-xs text-forge-text-dim mt-1">
              {selected.currentLevel} / {selected.maxLevel === 9999 ? '∞' : selected.maxLevel}
            </div>
          </div>

          {/* 성공 확률 */}
          <div className="bg-forge-card border border-forge-border rounded-lg p-4">
            <div className="text-forge-text-dim text-sm mb-2">현재 성공 확률</div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-forge-gold">
                {probability.toFixed(2)}%
              </span>
              {usePowerBoost && (
                <span className="text-green-400 text-sm mb-1">
                  (+{boostAmount}% 신성력 보조)
                </span>
              )}
            </div>
            <div className="mt-2 w-full bg-gray-800 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, probability)}%`,
                  background:
                    probability > 50
                      ? '#4a7c59'
                      : probability > 20
                      ? '#c9a227'
                      : '#7c1a1a',
                }}
              />
            </div>
          </div>

          {/* 현재 구간 페널티 */}
          <div className="bg-forge-card border border-forge-border rounded-lg p-4">
            <div className="text-forge-text-dim text-sm mb-2">실패 시 페널티</div>
            {activePenalties.length === 0 ? (
              <span className="text-green-400 text-sm">없음 (안전 구간)</span>
            ) : (
              <div className="flex flex-col gap-1">
                {activePenalties.map((p, i) => (
                  <div key={i} className="text-sm">
                    <span className="text-red-400">{PENALTY_NAMES[p.penaltyType]}</span>
                    {p.magnitude > 0 && (
                      <span className="text-forge-text-dim"> (×{p.magnitude})</span>
                    )}
                    <span className="text-forge-text-dim text-xs ml-1">
                      발동 확률 {p.triggerChance}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 신성력 보조 + 강화 버튼 */}
        <div className="w-56 flex flex-col gap-3">
          <h3 className="text-forge-text font-bold text-sm border-b border-forge-border pb-1">
            ✨ 신성력 보조
          </h3>

          {/* 확률 상승 */}
          <label
            className={`
              flex items-center gap-2 p-3 rounded-lg border cursor-pointer
              transition-all
              ${
                usePowerBoost
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-forge-border hover:border-blue-500/50'
              }
              ${!canBoost ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={usePowerBoost}
              onChange={(e) => canBoost && setUsePowerBoost(e.target.checked)}
              className="accent-blue-500"
              disabled={!canBoost}
            />
            <div>
              <div className="text-forge-text text-sm font-bold">확률 +15%</div>
              <div className="text-forge-text-dim text-xs">
                신성력 {POWER_BOOST_COST} 소모
              </div>
            </div>
          </label>

          {/* 파괴 방지 */}
          <label
            className={`
              flex items-center gap-2 p-3 rounded-lg border cursor-pointer
              transition-all
              ${
                useDestroyProtect
                  ? 'border-purple-500 bg-purple-900/30'
                  : 'border-forge-border hover:border-purple-500/50'
              }
              ${!canProtect ? 'opacity-40 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={useDestroyProtect}
              onChange={(e) => canProtect && setUseDestroyProtect(e.target.checked)}
              className="accent-purple-500"
              disabled={!canProtect}
            />
            <div>
              <div className="text-forge-text text-sm font-bold">파괴 방지</div>
              <div className="text-forge-text-dim text-xs">
                신성력 {DESTROY_PROTECT_COST} 소모
              </div>
            </div>
          </label>

          <div className="text-forge-text-dim text-xs text-center mt-1">
            현재 신성력: <span className="text-blue-400">{divinePower}</span>
          </div>

          {/* 강화 버튼 */}
          <button
            onClick={handleEnhance}
            disabled={isAnimating}
            className={`
              mt-auto w-full py-4 rounded-xl font-black text-xl
              transition-all duration-200
              ${
                isAnimating
                  ? 'bg-gray-700 cursor-wait text-gray-400'
                  : 'bg-forge-gold text-forge-bg hover:bg-forge-gold-light hover:scale-105 shadow-lg'
              }
            `}
          >
            {isAnimating ? '강화 중...' : '⚡ 강 화'}
          </button>

          <p className="text-forge-text-dim text-xs text-center">
            강화는 무료 · 무제한
          </p>
        </div>
      </div>

      {/* 결과 팝업 */}
      {lastEnhancementResult && (
        <ResultPopup
          result={lastEnhancementResult}
          equipmentName={selected?.name ?? '장비'}
          gradeColor={selected ? GRADE_COLORS[selected.grade] : '#fff'}
          onClose={() => {
            setLastEnhancementResult(null)
            if (lastEnhancementResult.outcome === 'destroy') {
              setScreen('forge')
            }
          }}
        />
      )}
    </div>
  )
}
