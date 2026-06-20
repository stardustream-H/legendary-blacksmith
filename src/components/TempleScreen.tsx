import { useGameStore } from '../store/gameStore'

export default function TempleScreen() {
  const { setScreen } = useGameStore()

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('hub')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors"
        >
          &larr; 영지로
        </button>
        <h2 className="text-forge-gold text-xl font-bold">버려진 신전</h2>
      </div>

      {/* 외관 묘사 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-7xl opacity-40">🏛️</div>

        <div className="max-w-xs text-center space-y-4">
          <p className="text-forge-text-dim text-sm leading-relaxed">
            영지 한켠에 자리한 낡은 신전.
          </p>
          <p className="text-forge-text-dim text-sm leading-relaxed">
            영지가 낙후되면서 돌보는 이가 없어졌고,
            그렇게 오랫동안 방치되어 왔다.
          </p>
          <div className="border-t border-forge-border/30 pt-4">
            <p className="text-stone-600 text-xs italic">
              ...언젠가는 쓸모가 생길지도 모른다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
