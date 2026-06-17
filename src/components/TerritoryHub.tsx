import { useGameStore } from '../store/gameStore'
import { ScreenType } from '../types'

interface Building {
  id: ScreenType
  name: string
  emoji: string
  description: string
  locked: boolean
  position: string
}

const BUILDINGS: Building[] = [
  {
    id: 'forge',
    name: '대장간',
    emoji: '🔥',
    description: '장비를 강화하고 수리하는 신전',
    locked: false,
    position: 'col-start-2 row-start-2',
  },
  {
    id: 'guild',
    name: '모험가 길드',
    emoji: '⚔️',
    description: '모험가들을 모집하고 탐험을 의뢰',
    locked: false,
    position: 'col-start-3 row-start-2',
  },
  {
    id: 'shop',
    name: '상점',
    emoji: '🏪',
    description: '장비와 재료를 구매',
    locked: false,
    position: 'col-start-1 row-start-3',
  },
  {
    id: 'defense',
    name: '방어 시설',
    emoji: '🛡️',
    description: '영지 수비력 확인 및 강화',
    locked: false,
    position: 'col-start-4 row-start-3',
  },
]

export default function TerritoryHub() {
  const { setScreen, advanceTurn, week, month, year } = useGameStore()

  const handleBuilding = (building: Building) => {
    if (building.locked) return
    setScreen(building.id)
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-between p-6"
      style={{
        background: 'radial-gradient(ellipse at center, #1a1208 0%, #0d0b08 100%)',
      }}
    >
      {/* 영지 타이틀 */}
      <div className="text-center mb-4">
        <h2 className="text-forge-gold text-2xl font-bold tracking-widest">
          ⚜ 황폐한 영지 ⚜
        </h2>
        <p className="text-forge-text-dim text-sm mt-1">
          {year}년 {month}월 {week}주 — 마왕의 군세가 다가오고 있다
        </p>
      </div>

      {/* 건물 그리드 */}
      <div className="grid grid-cols-4 grid-rows-3 gap-4 w-full max-w-3xl flex-1">
        {/* 영주성 (중앙 상단, 크게) */}
        <div className="col-start-2 col-span-2 row-start-1 flex justify-center">
          <div className="bg-forge-card border border-forge-border rounded-lg p-4 text-center w-full max-w-xs opacity-60 cursor-not-allowed">
            <div className="text-4xl mb-1">🏰</div>
            <div className="text-forge-text font-bold">영주성</div>
            <div className="text-forge-text-dim text-xs">차후 개방</div>
          </div>
        </div>

        {/* 나머지 건물들 */}
        {BUILDINGS.map((building) => (
          <div
            key={building.id}
            className={`${building.position} flex justify-center items-center`}
          >
            <button
              onClick={() => handleBuilding(building)}
              disabled={building.locked}
              className={`
                w-full bg-forge-card border rounded-lg p-4 text-center
                transition-all duration-200 group
                ${
                  building.locked
                    ? 'border-gray-700 opacity-40 cursor-not-allowed'
                    : 'border-forge-border hover:border-forge-gold hover:bg-opacity-80 hover:scale-105 cursor-pointer'
                }
              `}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {building.emoji}
              </div>
              <div className="text-forge-text font-bold text-sm">{building.name}</div>
              <div className="text-forge-text-dim text-xs mt-1 leading-tight">
                {building.description}
              </div>
              {building.locked && (
                <div className="text-red-500 text-xs mt-1">🔒 잠김</div>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* 턴 종료 버튼 */}
      <div className="mt-6 text-center">
        <button
          onClick={advanceTurn}
          className="
            bg-forge-gold text-forge-bg font-bold px-8 py-3 rounded-lg
            hover:bg-forge-gold-light transition-colors duration-200
            text-lg tracking-wide shadow-lg
            hover:shadow-forge-gold/30 hover:shadow-xl
          "
        >
          ⏳ 턴 종료 (다음 주로)
        </button>
        <p className="text-forge-text-dim text-xs mt-2">
          턴을 종료하면 의뢰가 갱신되고 신성력이 회복됩니다
        </p>
      </div>
    </div>
  )
}
