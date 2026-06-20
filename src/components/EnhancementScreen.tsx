import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { GRADE_NAMES, GRADE_COLORS, ENHANCE_COST, LEVEL_PRICE_MULTIPLIER } from '../types'
import {
  getEnhancementProbability,
  attemptEnhancement,
  applyEnhancementResult,
  getGradeConfig,
  canEnhance,
} from '../systems/enhancementSystem'
import ResultPopup from './ResultPopup'

// ===== CSS 키프레임 =====
const ANIM_STYLE = `
  @keyframes hammer-swing {
    0%   { transform: rotate(-40deg) translate(-4px, -8px); }
    45%  { transform: rotate(15deg)  translate(4px, 12px); }
    55%  { transform: rotate(15deg)  translate(4px, 12px); }
    100% { transform: rotate(-40deg) translate(-4px, -8px); }
  }
  @keyframes eq-shake {
    0%,100% { transform: translateX(0) rotate(0deg); }
    15%     { transform: translateX(-8px) rotate(-2deg); }
    30%     { transform: translateX(8px)  rotate(2deg); }
    45%     { transform: translateX(-6px) rotate(-1deg); }
    60%     { transform: translateX(6px)  rotate(1deg); }
    75%     { transform: translateX(-3px); }
    90%     { transform: translateX(3px); }
  }
  @keyframes gold-burst {
    0%   { transform: scale(0.8); opacity: 0; }
    30%  { transform: scale(1.25); opacity: 1; }
    70%  { transform: scale(1.1);  opacity: 1; }
    100% { transform: scale(1.15); opacity: 0.9; }
  }
  @keyframes red-flash {
    0%,100% { opacity: 0; }
    30%     { opacity: 0.55; }
    60%     { opacity: 0.3; }
  }
  @keyframes dark-explode {
    0%   { transform: scale(0.7); opacity: 0; }
    25%  { transform: scale(1.3); opacity: 1; }
    100% { transform: scale(1.1); opacity: 0.85; }
  }
  @keyframes level-pop {
    0%   { transform: scale(0.5) translateY(20px); opacity: 0; }
    60%  { transform: scale(1.2) translateY(-4px); opacity: 1; }
    100% { transform: scale(1)   translateY(0);    opacity: 1; }
  }
  @keyframes spin-slow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes particle {
    0%   { transform: translate(0,0) scale(1); opacity: 1; }
    100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
  }
`

type AnimPhase = 'idle' | 'hammering' | 'success' | 'failure' | 'destroy'

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ===== 파티클 위치 (성공 시) =====
const PARTICLES = [
  { dx: '-60px', dy: '-70px' }, { dx: '0px', dy: '-80px' }, { dx: '60px', dy: '-70px' },
  { dx: '-80px', dy: '-20px' }, { dx: '80px', dy: '-20px' },
  { dx: '-65px', dy: '50px' }, { dx: '0px', dy: '65px' }, { dx: '65px', dy: '50px' },
]

// ===== 강화 애니메이션 오버레이 =====
function EnhancementAnimOverlay({
  phase, gradeColor, equipName, currentLevel,
}: {
  phase: AnimPhase
  gradeColor: string
  equipName: string
  currentLevel: number
}) {

  if (phase === 'idle') return null

  const overlayBg =
    phase === 'success' ? 'rgba(10,8,2,0.92)' :
    phase === 'failure' ? 'rgba(5,2,2,0.92)' :
    phase === 'destroy' ? 'rgba(2,2,2,0.96)' :
    'rgba(8,6,2,0.88)'

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
      style={{ background: overlayBg }}
    >
      {/* ── 망치질 단계 ── */}
      {phase === 'hammering' && (
        <>
          {/* 장비 카드 (흔들림) */}
          <div
            className="relative text-center"
            style={{ animation: 'eq-shake 0.38s ease-in-out infinite' }}
          >
            <div className="text-6xl font-black mb-1" style={{ color: gradeColor }}>
              +{currentLevel}
            </div>
            <div className="text-lg font-bold" style={{ color: gradeColor }}>{equipName}</div>
          </div>

          {/* 망치 */}
          <div style={{ animation: 'hammer-swing 0.38s ease-in-out infinite', fontSize: 64 }}>
            ⚒️
          </div>

          {/* 텍스트 */}
          <div className="text-forge-text-dim text-sm tracking-widest animate-pulse">
            신의 힘이 깃드는 중...
          </div>

          {/* 원형 게이지 */}
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent"
            style={{
              borderColor: gradeColor,
              borderTopColor: 'transparent',
              animation: 'spin-slow 0.7s linear infinite',
            }}
          />
        </>
      )}

      {/* ── 성공 ── */}
      {phase === 'success' && (
        <>
          {/* 파티클 */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {PARTICLES.map((p, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  background: gradeColor,
                  '--dx': p.dx,
                  '--dy': p.dy,
                  animation: `particle 0.8s ease-out ${i * 60}ms forwards`,
                } as React.CSSProperties}
              />
            ))}
          </div>

          {/* 황금 빛 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${gradeColor}40 0%, transparent 65%)`,
              animation: 'gold-burst 0.9s ease-out forwards',
            }}
          />

          <div style={{ animation: 'gold-burst 0.7s ease-out forwards', textAlign: 'center' }}>
            <div className="text-7xl mb-2">✨</div>
            <div className="text-5xl font-black" style={{ color: gradeColor }}>
              +{currentLevel + 1}
            </div>
            <div className="text-xl font-bold mt-1" style={{ color: gradeColor }}>{equipName}</div>
          </div>

          <div
            className="text-2xl font-black tracking-widest"
            style={{ color: gradeColor, animation: 'level-pop 0.6s 0.2s ease-out both' }}
          >
            강화 성공!
          </div>
        </>
      )}

      {/* ── 실패 ── */}
      {phase === 'failure' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(120,0,0,0.25)', animation: 'red-flash 0.9s ease-out forwards' }}
          />
          <div style={{ animation: 'eq-shake 0.4s ease-in-out 2', textAlign: 'center' }}>
            <div className="text-7xl mb-2">💔</div>
            <div className="text-4xl font-black text-red-400">+{currentLevel}</div>
            <div className="text-lg font-bold text-red-300/70 mt-1">{equipName}</div>
          </div>
          <div
            className="text-2xl font-black text-red-400 tracking-widest"
            style={{ animation: 'level-pop 0.5s 0.15s ease-out both' }}
          >
            강화 실패...
          </div>
        </>
      )}

      {/* ── 파괴 ── */}
      {phase === 'destroy' && (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'rgba(60,0,0,0.5)', animation: 'red-flash 0.9s ease-out forwards' }}
          />
          <div style={{ animation: 'dark-explode 0.8s ease-out forwards', textAlign: 'center' }}>
            <div className="text-8xl mb-2">💥</div>
            <div className="text-4xl font-black text-stone-500 line-through">+{currentLevel}</div>
            <div className="text-lg font-bold text-stone-600 mt-1">{equipName}</div>
          </div>
          <div
            className="text-2xl font-black text-red-600 tracking-widest"
            style={{ animation: 'level-pop 0.5s 0.2s ease-out both' }}
          >
            장비 파괴
          </div>
        </>
      )}
    </div>
  )
}

// ===== 메인 화면 =====
export default function EnhancementScreen() {
  const {
    equipment, selectedEquipmentId,
    setScreen, updateEquipment, removeEquipment,
    setLastEnhancementResult, lastEnhancementResult,
    divinePower, spendDivinePower, divineRank,
    gold, spendGold,
  } = useGameStore()

  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle')
  const [usePowerBoost, setUsePowerBoost] = useState(false)
  const [useDestroyProtect, setUseDestroyProtect] = useState(false)

  const POWER_BOOST_COST = 15
  const DESTROY_PROTECT_COST = 20

  const selected = equipment.find((eq) => eq.id === selectedEquipmentId)

  useEffect(() => {
    if (!selected && !lastEnhancementResult) setScreen('forge')
  }, [selected, lastEnhancementResult, setScreen])

  if (!selected && !lastEnhancementResult) return null

  const config = selected ? getGradeConfig(selected.grade) : null
  const boostAmount = usePowerBoost ? 15 : 0
  const probability = selected ? getEnhancementProbability(selected, boostAmount, divineRank) : 0

  const canBoost = divinePower >= POWER_BOOST_COST
  const canProtect = divinePower >= DESTROY_PROTECT_COST

  const enhanceCheck = selected ? canEnhance(selected) : { ok: false, reason: '' }
  const enhanceCost = selected ? (ENHANCE_COST[selected.grade as keyof typeof ENHANCE_COST] ?? 10) : 0
  const canAfford = gold >= enhanceCost

  const GRADE_BASE_SELL: Record<string, number> = {
    common: 22, fine: 55, rare: 180, hero: 450,
    legendary: 1200, legendary_relic: 2000, ancient: 3500, mythic: 6000,
  }
  const gradeBase = selected ? (GRADE_BASE_SELL[selected.grade] ?? 30) : 30
  const levelIdx = selected ? Math.min(selected.currentLevel, LEVEL_PRICE_MULTIPLIER.length - 1) : 0
  const currentSellValue = selected ? Math.floor(gradeBase * LEVEL_PRICE_MULTIPLIER[levelIdx]) : 0
  const nextSellValue = selected
    ? Math.floor(gradeBase * LEVEL_PRICE_MULTIPLIER[Math.min(levelIdx + 1, LEVEL_PRICE_MULTIPLIER.length - 1)])
    : 0
  const isAtMaxLevel = selected ? selected.currentLevel >= selected.maxLevel : false
  const isAnimating = animPhase !== 'idle'

  const handleEnhance = async () => {
    if (isAnimating || !selected || !config) return
    if (!enhanceCheck.ok || !canAfford) return

    spendGold(enhanceCost)
    if (usePowerBoost && !spendDivinePower(POWER_BOOST_COST)) return
    if (useDestroyProtect && !spendDivinePower(DESTROY_PROTECT_COST)) return

    // ── 1단계: 망치질 ──
    setAnimPhase('hammering')
    await sleep(600)

    // ── 결과 계산 ──
    const result = attemptEnhancement(selected, config, boostAmount, useDestroyProtect, false, divineRank)

    // ── 2단계: 결과 연출 ──
    if (result.outcome === 'destroy')       setAnimPhase('destroy')
    else if (result.outcome === 'success')  setAnimPhase('success')
    else                                    setAnimPhase('failure')

    await sleep(600)

    // ── 상태 반영 ──
    if (result.outcome === 'destroy') {
      removeEquipment(selected.id)
    } else {
      const updated = applyEnhancementResult(selected, result)
      if (updated) updateEquipment(updated)
    }

    setLastEnhancementResult(result)
    setAnimPhase('idle')
    setUsePowerBoost(false)
    setUseDestroyProtect(false)
  }

  const PENALTY_NAMES: Record<string, string> = {
    NONE: '없음', LEVEL_DOWN: '레벨 하락', LEVEL_RESET: '+0 초기화',
    DURABILITY_DAMAGE: '내구도 손상', MAX_LEVEL_REDUCE: '최대강화 감소',
    EQUIPMENT_DESTROY: '장비 파괴', ENHANCEMENT_LOCK: '강화 잠금',
  }

  const activePenalties = (config?.penalties ?? []).filter(
    p => selected &&
      p.fromLevel <= selected.currentLevel &&
      (p.toLevel === -1 || p.toLevel >= selected.currentLevel)
  )

  if (!selected && lastEnhancementResult) {
    return (
      <ResultPopup
        result={lastEnhancementResult}
        equipmentName="(파괴됨)"
        gradeColor="#ff4444"
        onClose={() => { setLastEnhancementResult(null); setScreen('forge') }}
      />
    )
  }
  if (!selected) return null

  const gradeColor = GRADE_COLORS[selected.grade]

  return (
    <>
      <style>{ANIM_STYLE}</style>

      {/* 강화 애니메이션 오버레이 */}
      <EnhancementAnimOverlay
        phase={animPhase}
        gradeColor={gradeColor}
        equipName={selected.name}
        currentLevel={selected.currentLevel}
      />

      <div className="flex-1 flex flex-col p-4 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen('forge')}
            className="text-forge-text-dim hover:text-forge-gold transition-colors">
            &larr; 대장간으로
          </button>
          <h2 className="text-forge-gold text-xl font-bold">장비 강화</h2>
        </div>

        <div className="flex gap-6 flex-1">
          {/* 좌측: 장비 정보 */}
          <div className="flex-1 flex flex-col gap-4">
            {/* 장비 카드 */}
            <div
              className="bg-forge-card border-2 rounded-xl p-6 text-center"
              style={{ borderColor: gradeColor }}
            >
              <div className="text-5xl font-black mb-2" style={{ color: gradeColor }}>
                +{selected.currentLevel}
              </div>
              <div className="text-xl font-bold" style={{ color: gradeColor }}>{selected.name}</div>
              <div className="text-forge-text-dim text-sm mt-1">[{GRADE_NAMES[selected.grade]}]</div>
              <div className="mt-3 text-sm text-forge-text-dim">
                내구도: {selected.currentDurability}/{selected.maxDurability}
              </div>
              <div className="mt-3 w-full bg-gray-800 rounded-full h-2">
                <div className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${selected.maxLevel > 0 && selected.maxLevel < 9999
                      ? (selected.currentLevel / selected.maxLevel) * 100 : 0}%`,
                    backgroundColor: gradeColor,
                  }}
                />
              </div>
              <div className="text-xs text-forge-text-dim mt-1">
                {selected.currentLevel} / {selected.maxLevel === 9999 ? '무한' : selected.maxLevel}
              </div>
            </div>

            {isAtMaxLevel && (
              <div className="bg-green-900/30 border border-green-600 rounded-lg p-3 text-center text-green-400 text-sm font-bold">
                최대 강화 단계 달성! (+{selected.currentLevel})
              </div>
            )}

            {!isAtMaxLevel && (
              <div className="bg-forge-card border border-forge-border rounded-lg p-4">
                <div className="text-forge-text-dim text-sm mb-2">현재 성공 확률</div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-black text-forge-gold">{probability.toFixed(2)}%</span>
                  {usePowerBoost && (
                    <span className="text-green-400 text-sm mb-1">(+{boostAmount}% 신성력 보조)</span>
                  )}
                </div>
                <div className="mt-2 w-full bg-gray-800 rounded-full h-3">
                  <div className="h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, probability)}%`,
                      background: probability > 50 ? '#4a7c59' : probability > 20 ? '#c9a227' : '#7c1a1a',
                    }}
                  />
                </div>
              </div>
            )}

            {!isAtMaxLevel && (
              <div className="bg-forge-card border border-forge-border rounded-lg p-4">
                <div className="text-forge-text-dim text-sm mb-2">실패 시 페널티</div>
                {activePenalties.length === 0 ? (
                  <span className="text-green-400 text-sm">없음 (안전 구간)</span>
                ) : (
                  <div className="flex flex-col gap-1">
                    {activePenalties.map((p, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-red-400">{PENALTY_NAMES[p.penaltyType]}</span>
                        {p.magnitude > 0 && <span className="text-forge-text-dim"> (x{p.magnitude})</span>}
                        <span className="text-forge-text-dim text-xs ml-1">발동 {p.triggerChance}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 우측: 옵션 + 버튼 */}
          <div className="w-56 flex flex-col gap-3">
            {!isAtMaxLevel && (
              <>
                <h3 className="text-forge-text font-bold text-sm border-b border-forge-border pb-1">
                  신성력 보조
                </h3>
                <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                  ${usePowerBoost ? 'border-blue-500 bg-blue-900/30' : 'border-forge-border hover:border-blue-500/50'}
                  ${!canBoost ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <input type="checkbox" checked={usePowerBoost}
                    onChange={e => canBoost && setUsePowerBoost(e.target.checked)}
                    className="accent-blue-500" disabled={!canBoost} />
                  <div>
                    <div className="text-forge-text text-sm font-bold">확률 +15%</div>
                    <div className="text-forge-text-dim text-xs">신성력 {POWER_BOOST_COST} 소모</div>
                  </div>
                </label>
                <label className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all
                  ${useDestroyProtect ? 'border-purple-500 bg-purple-900/30' : 'border-forge-border hover:border-purple-500/50'}
                  ${!canProtect ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <input type="checkbox" checked={useDestroyProtect}
                    onChange={e => canProtect && setUseDestroyProtect(e.target.checked)}
                    className="accent-purple-500" disabled={!canProtect} />
                  <div>
                    <div className="text-forge-text text-sm font-bold">파괴 방지</div>
                    <div className="text-forge-text-dim text-xs">신성력 {DESTROY_PROTECT_COST} 소모</div>
                  </div>
                </label>
                <div className="text-forge-text-dim text-xs text-center mt-1">
                  현재 신성력: <span className="text-blue-400">{divinePower}</span>
                </div>
                <div className="bg-forge-card border border-forge-border rounded-lg p-3 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-forge-text-dim">강화 비용</span>
                    <span className={canAfford ? 'text-forge-gold font-bold' : 'text-red-400 font-bold'}>
                      {enhanceCost}G
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-text-dim">현재 판매가</span>
                    <span className="text-forge-text">{currentSellValue.toLocaleString()}G</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-text-dim">성공 시 판매가</span>
                    <span className="text-green-400">▲ {nextSellValue.toLocaleString()}G</span>
                  </div>
                  <div className="flex justify-between border-t border-forge-border/40 pt-1.5">
                    <span className="text-forge-text-dim">보유 골드</span>
                    <span className={canAfford ? 'text-forge-text' : 'text-red-400'}>
                      {gold.toLocaleString()}G
                    </span>
                  </div>
                </div>
              </>
            )}

            <button
              onClick={handleEnhance}
              disabled={isAnimating || !enhanceCheck.ok || !canAfford}
              className={`mt-auto w-full py-4 rounded-xl font-black text-xl transition-all duration-200 ${
                isAnimating
                  ? 'bg-gray-700 cursor-wait text-gray-400'
                  : (!enhanceCheck.ok || !canAfford)
                  ? 'bg-gray-800 cursor-not-allowed text-gray-600'
                  : 'bg-forge-gold text-forge-bg hover:bg-forge-gold-light hover:scale-105 shadow-lg'
              }`}
            >
              {isAnimating ? '강화 중...'
                : !enhanceCheck.ok ? enhanceCheck.reason
                : !canAfford ? `골드 부족 (${enhanceCost}G 필요)`
                : `강화 (${enhanceCost}G)`}
            </button>

            {!enhanceCheck.ok && !isAnimating && (
              <p className="text-forge-text-dim text-xs text-center">
                {selected.enhancementLockTurns > 0
                  ? `${selected.enhancementLockTurns}턴 후 재시도 가능`
                  : isAtMaxLevel ? '더 이상 강화할 수 없습니다'
                  : ''}
              </p>
            )}
          </div>
        </div>

        {lastEnhancementResult && (
          <ResultPopup
            result={lastEnhancementResult}
            equipmentName={selected?.name ?? '장비'}
            gradeColor={selected ? GRADE_COLORS[selected.grade] : '#fff'}
            onClose={() => {
              setLastEnhancementResult(null)
              if (lastEnhancementResult.outcome === 'destroy') setScreen('forge')
            }}
          />
        )}
      </div>
    </>
  )
}
