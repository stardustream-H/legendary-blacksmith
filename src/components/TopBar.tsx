import { useGameStore } from '../store/gameStore'
import { DIVINE_RANK_TIERS } from '../types'

export default function TopBar() {
  const { turn, week, month, year, gold, divineRank, divinePower } = useGameStore()
  const tierName = DIVINE_RANK_TIERS[divineRank]?.name ?? '잊혀진 신'

  return (
    <div className="w-full bg-forge-card border-b border-forge-border px-4 py-2 flex items-center justify-between text-forge-text text-sm">
      {/* 날짜 */}
      <div className="flex items-center gap-2">
        <span className="text-forge-gold font-bold">⚔ 전설 속 대장장이</span>
        <span className="text-forge-text-dim">|</span>
        <span className="text-forge-text-dim">
          {year}년 {month}월 {week}주차
        </span>
        <span className="text-forge-text-dim text-xs">(턴 {turn})</span>
      </div>

      {/* 자원 */}
      <div className="flex items-center gap-4">
        {/* 골드 */}
        <div className="flex items-center gap-1">
          <span>🪙</span>
          <span className="text-forge-gold font-bold">{gold.toLocaleString()}</span>
        </div>

        {/* 신격 */}
        <div className="flex items-center gap-1">
          <span>⭐</span>
          <span className="text-purple-400 font-bold text-xs">{tierName}</span>
        </div>

        {/* 신성력 */}
        <div className="flex items-center gap-1">
          <span>✨</span>
          <span className="text-blue-400 font-bold">{divinePower.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}
