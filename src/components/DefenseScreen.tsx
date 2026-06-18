import { useGameStore } from '../store/gameStore'
import {
  WALL_UPGRADE_COST, WALL_MAX_LEVEL, WALL_REPAIR_COST_PER_POINT,
  WALL_MAX_DURABILITY, WALL_DEFENSE_POWER,
} from '../types'

export default function DefenseScreen() {
  const { setScreen, gold, wall, upgradeWall, repairWall } = useGameStore()

  const missing = wall.maxDurability - wall.durability
  const repairFullCost = missing * WALL_REPAIR_COST_PER_POINT
  const repairHalfCost = Math.ceil(missing / 2) * WALL_REPAIR_COST_PER_POINT
  const upgradeCost = WALL_UPGRADE_COST(wall.level)
  const nextLevelPower = wall.level < WALL_MAX_LEVEL ? (wall.level + 1) * 25 : null
  const currentPower = WALL_DEFENSE_POWER(wall.level, wall.durability, wall.maxDurability)
  const durabilityPct = Math.round((wall.durability / wall.maxDurability) * 100)

  const durabilityColor =
    durabilityPct >= 70 ? '#4ade80' :
    durabilityPct >= 40 ? '#facc15' : '#f87171'

  return (
    <div className="flex-1 flex flex-col bg-forge-bg text-forge-text overflow-hidden">
      {/* 상단 바 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-forge-border bg-forge-card">
        <button onClick={() => setScreen('hub')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors text-sm">
          ← 영주성
        </button>
        <h1 className="text-lg font-bold text-forge-gold">🏰 방어 시설</h1>
        <span className="ml-auto text-forge-gold font-bold">💰 {gold}G</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* ===== 성벽 카드 ===== */}
        <div className="bg-forge-card border-2 border-forge-border rounded-2xl overflow-hidden">
          {/* 헤더 */}
          <div className="bg-stone-900/60 px-4 py-3 border-b border-forge-border flex items-center justify-between">
            <div>
              <h2 className="font-bold text-forge-text text-lg">🧱 성벽</h2>
              <p className="text-forge-text-dim text-xs">레벨 {wall.level} / {WALL_MAX_LEVEL}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-forge-text-dim">방어력</div>
              <div className="text-2xl font-black text-blue-300">{currentPower}</div>
            </div>
          </div>

          {/* 내구도 */}
          <div className="px-4 py-4 border-b border-forge-border">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-forge-text-dim">내구도</span>
              <span className="font-bold text-sm" style={{ color: durabilityColor }}>
                {wall.durability} / {wall.maxDurability}
              </span>
            </div>
            <div className="h-4 bg-forge-bg rounded-full overflow-hidden border border-forge-border">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${durabilityPct}%`, background: durabilityColor }} />
            </div>
            {durabilityPct < 50 && (
              <p className="text-xs text-red-400 mt-1">
                ⚠️ 내구도가 낮아 방어력이 저하됩니다 ({durabilityPct}%)
              </p>
            )}
          </div>

          {/* 수리 */}
          <div className="px-4 py-4 border-b border-forge-border">
            <h3 className="text-sm font-bold text-forge-text mb-3">수리</h3>
            {missing === 0 ? (
              <p className="text-green-400 text-xs text-center py-2">✅ 성벽 상태가 완벽합니다</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-forge-text-dim mb-1">
                  <span>손상량: {missing} ({WALL_REPAIR_COST_PER_POINT}G/내구도)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => repairWall(Math.ceil(missing / 2))}
                    disabled={gold < repairHalfCost || missing === 0}
                    className="flex-1 py-2 text-xs font-bold border border-forge-border rounded-lg text-forge-text-dim hover:border-forge-gold hover:text-forge-gold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    절반 수리<br />
                    <span className="text-forge-gold">{repairHalfCost}G</span>
                  </button>
                  <button
                    onClick={() => repairWall(missing)}
                    disabled={gold < repairFullCost || missing === 0}
                    className="flex-1 py-2 text-xs font-bold bg-forge-gold/10 border border-forge-gold/40 rounded-lg text-forge-gold hover:bg-forge-gold/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    완전 수리<br />
                    <span>{repairFullCost}G</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 강화 */}
          <div className="px-4 py-4">
            <h3 className="text-sm font-bold text-forge-text mb-3">강화</h3>
            {wall.level >= WALL_MAX_LEVEL ? (
              <p className="text-forge-gold text-xs text-center py-2">✨ 최대 레벨 달성</p>
            ) : (
              <div>
                <div className="bg-forge-bg rounded-lg p-3 mb-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-forge-text-dim">현재 방어력</span>
                    <span className="text-blue-300 font-bold">{wall.level * 25}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-text-dim">강화 후 방어력</span>
                    <span className="text-green-300 font-bold">▲ {nextLevelPower}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-forge-text-dim">최대 내구도</span>
                    <span className="text-forge-text font-bold">
                      {wall.maxDurability} → {WALL_MAX_DURABILITY(wall.level + 1)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={upgradeWall}
                  disabled={gold < upgradeCost}
                  className="w-full py-3 font-bold text-sm rounded-xl bg-forge-gold text-forge-bg hover:bg-forge-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  성벽 강화 — {upgradeCost}G
                </button>
                {gold < upgradeCost && (
                  <p className="text-red-400 text-xs text-center mt-1">
                    골드가 {upgradeCost - gold}G 부족합니다
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 예고 — 추후 추가 */}
        <div className="bg-forge-card border border-dashed border-forge-border rounded-xl p-4 opacity-50">
          <h3 className="text-forge-text-dim text-sm font-bold mb-1">🏹 방어 아티팩트</h3>
          <p className="text-forge-text-dim text-xs">영지가 발전하면 발리스타, 마법 포탑 등을 설치할 수 있습니다.</p>
        </div>

      </div>
    </div>
  )
}
