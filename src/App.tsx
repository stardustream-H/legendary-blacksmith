import { useGameStore } from './store/gameStore'
import TopBar from './components/TopBar'
import TerritoryHub from './components/TerritoryHub'
import ForgeScreen from './components/ForgeScreen'
import EnhancementScreen from './components/EnhancementScreen'

function TitleScreen() {
  const setScreen = useGameStore((s) => s.setScreen)
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-8"
      style={{
        background: 'radial-gradient(ellipse at center, #1a0a0a 0%, #0d0b08 100%)',
      }}
    >
      <div className="text-center">
        <div className="text-6xl mb-4">⚒️</div>
        <h1 className="text-4xl font-black text-forge-gold tracking-widest mb-2">
          전설 속 대장장이
        </h1>
        <p className="text-forge-text-dim text-sm">
          장난의 신의 힘을 빌려, 전설을 다시 쓰다
        </p>
      </div>

      <div className="flex flex-col gap-3 w-48">
        <button
          onClick={() => setScreen('hub')}
          className="
            bg-forge-gold text-forge-bg font-bold py-3 px-6 rounded-lg
            hover:bg-forge-gold-light transition-colors text-lg
            shadow-lg hover:scale-105 transition-all
          "
        >
          ⚔ 게임 시작
        </button>
        <div className="text-forge-text-dim text-xs text-center">
          Phase 1 — 강화 시스템 플레이테스트
        </div>
      </div>

      <div className="text-forge-text-dim text-xs text-center max-w-xs">
        <p>※ 현재 버전: 영지 허브, 대장간, 강화 시스템</p>
        <p className="mt-1">수리·제작·모험가 길드는 다음 업데이트에서</p>
      </div>
    </div>
  )
}

function ComingSoonScreen({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
      <div className="text-4xl">🚧</div>
      <h2 className="text-forge-gold text-xl font-bold">{name}</h2>
      <p className="text-forge-text-dim">다음 업데이트에서 오픈됩니다</p>
      <button
        onClick={onBack}
        className="text-forge-text-dim hover:text-forge-gold transition-colors"
      >
        ← 영지로 돌아가기
      </button>
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
      <p className="text-forge-text-dim">모든 것이 사라졌습니다. 다시 시작하십시오.</p>
      <button
        onClick={resetGame}
        className="bg-red-900 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-lg"
      >
        처음부터 다시
      </button>
    </div>
  )
}

export default function App() {
  const { currentScreen, setScreen, isGameOver } = useGameStore()

  if (isGameOver) return <GameOverScreen />

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {currentScreen !== 'title' && <TopBar />}

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentScreen === 'title' && <TitleScreen />}
        {currentScreen === 'hub' && <TerritoryHub />}
        {currentScreen === 'forge' && <ForgeScreen />}
        {currentScreen === 'enhancement' && <EnhancementScreen />}
        {currentScreen === 'guild' && (
          <ComingSoonScreen name="모험가 길드" onBack={() => setScreen('hub')} />
        )}
        {currentScreen === 'shop' && (
          <ComingSoonScreen name="상점" onBack={() => setScreen('hub')} />
        )}
        {currentScreen === 'defense' && (
          <ComingSoonScreen name="방어 시설" onBack={() => setScreen('hub')} />
        )}
      </div>
    </div>
  )
}
