import { useGameStore } from '../store/gameStore'
import { ScreenType } from '../types'

interface Building {
  id: ScreenType
  name: string
  icon: string
  description: string
  locked: boolean
  position: string
}

const BUILDINGS: Building[] = [
  {
    id: 'commission',
    name: '의뢰 게시판',
    icon: '📋',
    description: '장비 강화·수리 의뢰 수락',
    locked: false,
    position: 'col-start-1 row-start-2',
  },
  {
    id: 'forge',
    name: '대장간',
    icon: '🔥',
    description: '장비를 강화하고 수리하는 신전',
    locked: false,
    position: 'col-start-2 row-start-2',
  },
  {
    id: 'guild',
    name: '모험가 길드',
    icon: '⚔️',
    description: '모험가를 모집하고 탐험 의뢰',
    locked: false,
    position: 'col-start-3 row-start-2',
  },
  {
    id: 'shop',
    name: '상점',
    icon: '🏦',
    description: '장비와 재료를 구매',
    locked: true,
    position: 'col-start-1 row-start-3',
  },
  {
    id: 'defense',
    name: '방어 시설',
    icon: '🛡️',
    description: '영지 수비력 확인 및 강화',
    locked: true,
    position: 'col-start-4 row-start-3',
  },
]

export default function TerritoryHub() {
  const {
    setScreen, advanceTurn,
    week, month, year,
    gold, baseTerritoryIncome, waveDefenseBonus, regions,
    lastMonthlyReport, clearMonthlyReport,
    nextWaveTurn, turn, waveNumber,
  } = useGameStore()

  // 월 수입 미리보기
  const liberatedIncome = regions
    .filter(r => r.status === 'liberated')
    .reduce((sum, r) => sum + r.liberationMonthlyIncome, 0)
  const totalMonthly = baseTerritoryIncome + waveDefenseBonus + liberatedIncome

  // 웨이브 카운트다운
  const turnsUntilWave = Math.max(0, nextWaveTurn - turn)
  const waveUrgent = turnsUntilWave <= 4

  return (
    <div
      className="flex-1 flex flex-col items-center justify-between p-6 relative"
      style={{ background: 'radial-gradient(ellipse at center, #1a1208 0%, #0d0b08 100%)' }}
    >
      {/* ===== 월 결산 팝업 ===== */}
      {lastMonthlyReport && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-forge-card border-2 border-forge-gold rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
            <h3 className="text-forge-gold font-bold text-lg mb-3 text-center">📅 월 결산</h3>
            <p className="text-forge-text text-sm leading-relaxed text-center mb-4">
              {lastMonthlyReport}
            </p>
            <button
              onClick={clearMonthlyReport}
              className="w-full bg-forge-gold text-forge-bg font-bold py-2 rounded-lg hover:bg-forge-gold-light transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="text-center mb-4">
        <h2 className="text-forge-gold text-2xl font-bold tracking-widest">
          ⬜ 황폐한 영지 ⬜
        </h2>
        <p className="text-forge-text-dim text-sm mt-1">
          {year}년 {month}월 {week}주 — 마왕의 군세가 다가오고 있다
        </p>
        <div className="flex gap-4 justify-center mt-2 text-xs text-forge-text-dim">
          <span>💰 <span className="text-forge-gold font-bold">{gold}G</span></span>
          <span>📈 월 수입 예상: <span className="text-green-400 font-bold">+{totalMonthly}G</span></span>
          {liberatedIncome > 0 && (
            <span>🏴 해방 지역 수입: <span className="text-green-300">+{liberatedIncome}G</span></span>
          )}
        </div>
        {/* 웨이브 카운트다운 */}
        <div className={`mt-3 px-4 py-2 rounded-lg text-xs text-center font-bold flex items-center justify-center gap-2 ${waveUrgent ? 'bg-red-950/60 border border-red-700 text-red-300' : 'bg-forge-card border border-forge-border text-forge-text-dim'}`}>
          <span>{waveUrgent ? '⚠️' : '💀'}</span>
          <span>
            제{waveNumber + 1}차 마왕군 침략까지{' '}
            {turnsUntilWave > 0
              ? <span className={waveUrgent ? 'text-red-200' : 'text-forge-text'}>{turnsUntilWave}턴 ({Math.ceil(turnsUntilWave / 4)}개월)</span>
              : <span className="text-red-200">곧 도착!</span>
            }
          </span>
        </div>
      </div>

      {/* 건물 그리드 */}
      <div className="grid grid-cols-4 grid-rows-3 gap-4 w-full max-w-3xl flex-1">
        {/* 영주성 버튼 (활성화) */}
        <div className="col-start-2 col-span-2 row-start-1 flex justify-center">
          <button
            onClick={() => setScreen('territory')}
            className="bg-forge-card border-2 border-forge-gold rounded-lg p-4 text-center w-full max-w-xs hover:scale-105 transition-all duration-200 group shadow-lg hover:shadow-forge-gold/30"
          >
            <div className="text-4xl mb-1 group-hover:scale-110 transition-transform">🏰</div>
            <div className="text-forge-gold font-bold">영주성</div>
            <div className="text-forge-text-dim text-xs">가신단 · 영지 경제</div>
          </button>
        </div>

        {BUILDINGS.map((building) => (
          <div
            key={building.id}
            className={`${building.position} flex justify-center items-center`}
          >
            <button
              onClick={() => !building.locked && setScreen(building.id)}
              disabled={building.locked}
              className={`w-full bg-forge-card border rounded-lg p-4 text-center transition-all duration-200 group ${
                building.locked
                  ? 'border-gray-700 opacity-40 cursor-not-allowed'
                  : 'border-forge-border hover:border-forge-gold hover:scale-105 cursor-pointer'
              }`}
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {building.icon}
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

      {/* 턴 종료 */}
      <div className="mt-6 text-center">
        <button
          onClick={advanceTurn}
          className="bg-forge-gold text-forge-bg font-bold px-8 py-3 rounded-lg hover:bg-forge-gold-light transition-colors duration-200 text-lg tracking-wide shadow-lg"
        >
          ⏳ 턴 종료 (다음 주로)
        </button>
        <p className="text-forge-text-dim text-xs mt-2">
          4턴마다 월 결산이 진행됩니다 · 현재 {week}주차
        </p>
      </div>
    </div>
  )
}
