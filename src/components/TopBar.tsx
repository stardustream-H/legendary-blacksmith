import { useGameStore } from '../store/gameStore'

export default function TopBar() {
  const { turn, week, month, year, gold, divineRank, divinePower, maxDivinePower } = useGameStore()

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
          <span className="text-purple-400 font-bold">신격 {divineRank}</span>
          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500"
              style={{ width: `${divineRank}%` }}
            />
          </div>
        </div>

        {/* 신성력 */}
        <div className="flex items-center gap-1">
          <span>✨</span>
          <span className="text-blue-400 font-bold">
            {divinePower}/{maxDivinePower}
          </span>
          <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${(divinePower / maxDivinePower) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
