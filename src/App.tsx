import { useGameStore } from './store/gameStore'
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
import ShopScreen from './components/ShopScreen'
import DefenseScreen from './components/DefenseScreen'

function TitleScreen() {
  const setScreen = useGameStore((s) => s.setScreen)
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
          onClick={() => setScreen('hub')}
          className="bg-forge-gold text-forge-bg font-bold py-3 px-6 rounded-lg hover:bg-forge-gold-light transition-colors text-lg shadow-lg hover:scale-105"
        >
          게임 시작
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
      <p className="text-forge-text-dim">마왕의 군대에 영지가 무너졌습니다.</p>
      <button onClick={resetGame} className="bg-red-900 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-lg">
        다시 시작
      </button>
    </div>
  )
}

export default function App() {
  const { currentScreen, isGameOver, pendingWaveEvent, waveResult } = useGameStore()

  if (isGameOver) return <GameOverScreen />

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {currentScreen !== 'title' && <TopBar />}
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
      </div>
    </div>
  )
}
