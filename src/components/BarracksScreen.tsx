import { useGameStore } from '../store/gameStore'
import { TROOP_CONFIGS, calcTroopPower } from '../data/barracksData'


const TIER_LABELS = ['잠금', '1단계', '2단계', '3단계']
const TIER_COLORS = ['text-gray-500', 'text-green-400', 'text-blue-400', 'text-yellow-400']

export default function BarracksScreen() {
  const { setScreen, gold, barracks, unlockOrUpgradeTroop } = useGameStore()

  const totalPower = barracks.reduce((sum, t) => sum + calcTroopPower(t), 0)

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button onClick={() => setScreen('hub')} className="text-forge-text-dim hover:text-forge-gold transition-colors">
          &larr; 영지로
        </button>
        <h2 className="text-forge-gold text-xl font-bold">🏰 병영</h2>
        <span className="text-forge-text-dim text-sm">— 영지 수비 병력 관리</span>
        <div className="ml-auto text-sm">
          <span className="text-forge-text-dim">총 방어력 </span>
          <span className="text-green-400 font-bold text-lg">{totalPower}</span>
        </div>
      </div>

      {/* 병종 목록 */}
      <div className="grid grid-cols-1 gap-3">
        {TROOP_CONFIGS.map(cfg => {
          const troop = barracks.find(t => t.type === cfg.type)!
          const currentTier = troop.tier
          const isLocked = currentTier === 0
          const isMaxed = currentTier >= 3
          const nextTier = currentTier + 1
          const nextCost = nextTier <= 3 ? cfg.upgradeCosts[nextTier - 1] : 0
          const canAfford = nextCost === 0 || gold >= nextCost
          const currentPower = calcTroopPower(troop)
          const isKnights = (cfg.type as string) === 'knights'

          return (
            <div
              key={cfg.type}
              className={`bg-forge-card border rounded-lg p-4 transition-all ${
                isLocked ? 'border-gray-700 opacity-70' : 'border-forge-border'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* 아이콘 + 이름 */}
                <div className="text-3xl">{cfg.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-forge-text">{cfg.name}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${TIER_COLORS[currentTier]} bg-black/20`}>
                      {TIER_LABELS[currentTier]}
                    </span>
                    {isKnights && (
                      <span className="text-xs text-amber-400 bg-amber-900/30 px-2 py-0.5 rounded">직속</span>
                    )}
                  </div>
                  <p className="text-forge-text-dim text-xs mt-0.5">{cfg.description}</p>
                </div>

                {/* 방어력 */}
                <div className="text-center min-w-[60px]">
                  {isLocked ? (
                    <div className="text-gray-600 text-sm">🔒</div>
                  ) : (
                    <>
                      <div className="text-green-400 font-bold">{currentPower}</div>
                      <div className="text-forge-text-dim text-xs">방어력</div>
                    </>
                  )}
                </div>

                {/* 해금/강화 버튼 */}
                {!isKnights && (
                  <div className="min-w-[100px]">
                    {isMaxed ? (
                      <div className="text-center text-yellow-400 text-sm font-bold">✦ 최대</div>
                    ) : (
                      <button
                        onClick={() => unlockOrUpgradeTroop(cfg.type)}
                        disabled={!canAfford}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                          canAfford
                            ? isLocked
                              ? 'bg-blue-700 hover:bg-blue-600 text-white hover:scale-105'
                              : 'bg-forge-gold hover:bg-yellow-400 text-black hover:scale-105'
                            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {isLocked ? '해금' : '강화'}<br />
                        <span className="text-xs font-normal">
                          {nextCost === 0 ? '무료' : `${nextCost.toLocaleString()}G`}
                        </span>
                      </button>
                    )}
                  </div>
                )}
                {isKnights && (
                  <div className="min-w-[100px] text-center text-forge-text-dim text-xs">
                    성장 예정
                  </div>
                )}
              </div>

              {/* 단계 진행바 (기사단 제외) */}
              {!isKnights && (
                <div className="mt-3 flex gap-1">
                  {[1, 2, 3].map(tier => (
                    <div key={tier} className="flex-1">
                      <div className={`h-1.5 rounded-full ${
                        currentTier >= tier ? 'bg-green-500' : 'bg-gray-700'
                      }`} />
                      <div className="text-center text-xs text-forge-text-dim mt-1">
                        {tier === 1 && currentTier < 1 ? `${cfg.upgradeCosts[0].toLocaleString()}G` :
                         tier === 2 ? `${cfg.upgradeCosts[1].toLocaleString()}G` :
                         tier === 3 ? `${cfg.upgradeCosts[2].toLocaleString()}G` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 하단 안내 */}
      <div className="bg-forge-card border border-forge-border rounded-lg p-3 text-xs text-forge-text-dim">
        ✦ 병영 병력은 웨이브 방어 시 자동으로 참전합니다. 용병 파견 병력과 합산됩니다.
      </div>
    </div>
  )
}
