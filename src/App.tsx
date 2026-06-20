import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import PrologueScreen from './components/PrologueScreen'
import TopBar from './components/TopBar'
import TerritoryHub from './components/TerritoryHub'
import TerritoryScreen from './components/TerritoryScreen'
import ForgeScreen from './components/ForgeScreen'
import EnhancementScreen from './components/EnhancementScreen'
import RepairScreen from './components/RepairScreen'
import RepairMinigame from './components/RepairMinigame'
import CommissionBoard from './components/CommissionBoard'
import GuildScreen from './components/GuildScreen'
import WaveEventScreen from './components/WaveEventScreen'
import TurnReportModal from './components/TurnReportModal'
import ShopScreen from './components/ShopScreen'
import DefenseScreen from './components/DefenseScreen'
import TempleScreen from './components/TempleScreen'
import BarracksScreen from './components/BarracksScreen'

function TitleScreen() {
  const setScreen = useGameStore((s) => s.setScreen)
  const [showPrologue, setShowPrologue] = useState(false)

  if (showPrologue) {
    return <PrologueScreen onComplete={() => setScreen('hub')} />
  }

  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-8"
      style={{ background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #0d0b08 100%)' }}
    >
      <div className="text-center">
        <div className="text-6xl mb-4">⚒️</div>
        <h1 className="text-4xl font-black text-forge-gold tracking-widest mb-2">
          전설 속 대장장이
        </h1>
        <p className="text-forge-text-dim text-sm">
          영지를 지키고, 장비를 단련하고, 전설이 되어라
        </p>
      </div>
      <div className="flex flex-col gap-3 w-48">
        <button
          onClick={() => setShowPrologue(true)}
          className="bg-forge-gold text-forge-bg font-bold py-3 px-6 rounded-lg hover:bg-forge-gold-light transition-colors text-lg shadow-lg hover:scale-105"
        >
          게임 시작
        </button>
        <button
          onClick={() => setScreen('hub')}
          className="border border-forge-border text-forge-text-dim py-2 px-6 rounded-lg hover:border-forge-gold/50 hover:text-forge-text transition-colors text-sm"
        >
          바로 시작 (스킵)
        </button>
      </div>
    </div>
  )
}

function GameOverScreen() {
  const resetGame = useGameStore((s) => s.resetGame)
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6"
      style={{ background: 'radial-gradient(ellipse at center, #2a0a0a 0%, #0d0b08 100%)' }}
    >
      <div className="text-6xl">💀</div>
      <h2 className="text-red-500 text-3xl font-black">영지 함락</h2>
      <p className="text-forge-text-dim text-center max-w-xs">
        마왕이 몸소 이끄는 군대에 영지가 무너졌습니다.<br/>
        <span className="text-xs text-red-400/60">대장장이는 다시 망치를 들 것이다...</span>
      </p>
      <button onClick={resetGame} className="bg-red-900 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-lg">
        다시 시작
      </button>
    </div>
  )
}

function NormalEndingScreen() {
  const resetGame = useGameStore((s) => s.resetGame)
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6"
      style={{ background: 'radial-gradient(ellipse at center, #1a1200 0%, #0d0b08 100%)' }}
    >
      <div className="text-6xl">⚒️</div>
      <h2 className="text-yellow-400 text-3xl font-black">전설이 되다</h2>
      <div className="max-w-sm text-center space-y-3">
        <p className="text-forge-text text-sm leading-relaxed">
          마왕이 쓰러졌다. 세상은 환호로 가득찼고,<br/>
          오랫동안 잊혀졌던 신앙심이 폭발적으로 되살아났다.
        </p>
        <p className="text-forge-text-dim text-xs leading-relaxed">
          당신이 만든 장비들은 전쟁의 영웅들 손에서 빛을 발했다.<br/>
          주신의 가호가 다시 이 땅을 감쌌다.
        </p>
        <p className="text-yellow-600/60 text-xs italic mt-4">
          하지만 세월이 흐르면, 역사는 반복될 것이다...
        </p>
      </div>
      <button onClick={resetGame} className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg mt-2">
        처음부터
      </button>
    </div>
  )
}

function TrueEndingScreen() {
  const resetGame = useGameStore((s) => s.resetGame)
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6"
      style={{ background: 'radial-gradient(ellipse at center, #001a2e 0%, #000d17 100%)' }}
    >
      <div className="text-6xl">✨</div>
      <h2 className="text-blue-300 text-3xl font-black">진실의 끝</h2>
      <div className="max-w-sm text-center space-y-3">
        <p className="text-forge-text text-sm leading-relaxed">
          봉인의 핵심부가 해방되었다.<br/>
          장난의 신이 오랜 침묵 끝에 행동했다.
        </p>
        <p className="text-forge-text-dim text-xs leading-relaxed">
          마신의 봉인이 풀렸다. 괴물 공장이 멈췄다.<br/>
          마물과 마족은 처음으로 본능의 굴레에서 벗어났다.
        </p>
        <p className="text-forge-text-dim text-xs leading-relaxed mt-2">
          주신의 계획은 어긋났다. 그러나 세상은 처음으로<br/>
          진정한 균형에 가까워졌다.
        </p>
        <p className="text-blue-400/60 text-xs italic mt-4">
          역사는 더 이상 반복되지 않을 것이다.
        </p>
      </div>
      <button onClick={resetGame} className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-lg mt-2">
        처음부터
      </button>
    </div>
  )
}

export default function App() {
  const { currentScreen, isGameOver, isClear, pendingWaveEvent, waveResult, regions, pendingTurnReport } = useGameStore()
  const isTrueEnding = isClear && regions.some(r => r.id === 'region_009' && r.status === 'liberated')

  if (isGameOver) return <GameOverScreen />
  if (isClear) return isTrueEnding ? <TrueEndingScreen /> : <NormalEndingScreen />

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {currentScreen !== 'title' && <TopBar />}
      {pendingTurnReport && !pendingWaveEvent && <TurnReportModal />}
      {(pendingWaveEvent || waveResult) && <WaveEventScreen />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentScreen === 'title'      && <TitleScreen />}
        {currentScreen === 'hub'        && <TerritoryHub />}
        {currentScreen === 'territory'  && <TerritoryScreen />}
        {currentScreen === 'forge'      && <ForgeScreen />}
        {currentScreen === 'enhancement'&& <EnhancementScreen />}
        {currentScreen === 'repair'     && <RepairScreen />}
        {currentScreen === 'repair-minigame' && <RepairMinigame />}
        {currentScreen === 'commission' && <CommissionBoard />}
        {currentScreen === 'guild'      && <GuildScreen />}
        {currentScreen === 'shop'    && <ShopScreen />}
        {currentScreen === 'defense' && <DefenseScreen />}
        {currentScreen === 'temple'  && <TempleScreen />}
        {currentScreen === 'barracks' && <BarracksScreen />}
      </div>
    </div>
  )
}
