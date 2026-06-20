import { useGameStore } from '../store/gameStore'
import { DIVINE_RANK_TIERS, DIVINE_RANK_PROB_BONUS, DIVINE_TURN_RECOVERY, GradeType } from '../types'

const GRADE_NAMES_KO: Partial<Record<GradeType, string>> = {
  common: '일반', fine: '고급', rare: '희귀', hero: '영웅', legendary: '전설',
}

export default function SanctuaryScreen() {
  const { divineRank, divinePower, upgradeDivineRank } = useGameStore()

  const currentTier = DIVINE_RANK_TIERS[divineRank]
  const nextTier = divineRank < 6 ? DIVINE_RANK_TIERS[divineRank + 1] : null
  const canUpgrade = nextTier !== null && divinePower >= nextTier.upgradeCost
  const probBonus = DIVINE_RANK_PROB_BONUS[divineRank] ?? {}
  const nextProbBonus = nextTier ? DIVINE_RANK_PROB_BONUS[divineRank + 1] ?? {} : null

  const tierColors = [
    'text-gray-400',        // 0 잊혀진 신
    'text-green-400',       // 1 최하급
    'text-blue-400',        // 2 하급
    'text-indigo-400',      // 3 중급
    'text-purple-400',      // 4 상급
    'text-yellow-400',      // 5 고위
    'text-amber-300',       // 6 주신급
  ]

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
      {/* 현재 신격 패널 */}
      <div className="bg-forge-card border border-purple-800/50 rounded-lg p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">🕍</span>
          <div>
            <div className="text-forge-text-dim text-xs">현재 신격</div>
            <div className={`text-2xl font-black ${tierColors[divineRank]}`}>
              {currentTier.name}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-forge-text-dim text-xs">보유 신성력</div>
            <div className="text-blue-400 text-xl font-bold">{divinePower.toLocaleString()}</div>
          </div>
        </div>

        {/* 등급 진행바 */}
        <div className="flex items-center gap-1 mb-4">
          {DIVINE_RANK_TIERS.map((_rt, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className={`h-2 w-full rounded-full ${i <= divineRank ? 'bg-purple-500' : 'bg-gray-700'}`} />
              <div className={`text-xs hidden sm:block ${i === divineRank ? tierColors[i] + ' font-bold' : 'text-gray-600'}`}>
                {i === 0 ? '잊혀' : i === 6 ? '주신' : i + '등'}
              </div>
            </div>
          ))}
        </div>

        {/* 현재 등급 효과 */}
        <div className="bg-black/20 rounded-lg p-3 mb-4">
          <div className="text-forge-text-dim text-xs mb-2 font-bold">현재 신격 효과</div>
          <div className="text-sm text-forge-text-dim">
            ✦ 턴당 신성력 회복{' '}
            <span className="text-blue-400 font-bold">+{DIVINE_TURN_RECOVERY[divineRank]}</span>
          </div>
          {(Object.keys(probBonus) as GradeType[]).length > 0 ? (
            <div className="text-sm text-forge-text-dim mt-1">
              ✦ 강화 확률 보너스:{' '}
              {(Object.entries(probBonus) as [GradeType, number][]).map(([grade, bonus], idx) => (
                <span key={grade}>
                  {idx > 0 ? ' / ' : ''}
                  <span className="text-purple-400 font-bold">
                    {GRADE_NAMES_KO[grade]} +{bonus}%
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-600 mt-1">✦ 강화 확률 보너스 없음</div>
          )}
        </div>

        {/* 업그레이드 패널 */}
        {nextTier ? (
          <div className={`rounded-lg p-4 border-2 transition-all ${canUpgrade ? 'border-purple-500 bg-purple-900/20' : 'border-forge-border bg-black/10'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="text-forge-text-dim text-xs mb-1">다음 신격</div>
                <div className={`text-lg font-bold ${tierColors[divineRank + 1]}`}>
                  {nextTier.name}
                </div>
                <div className="text-sm text-forge-text-dim mt-1">
                  ✦ 턴당 회복{' '}
                  <span className="text-blue-400">+{DIVINE_TURN_RECOVERY[divineRank + 1]}</span>
                </div>
                {nextProbBonus && (Object.entries(nextProbBonus) as [GradeType, number][]).map(([grade, bonus]) => {
                  const curr = probBonus[grade] ?? 0
                  const diff = bonus - curr
                  return diff > 0 ? (
                    <div key={grade} className="text-sm text-forge-text-dim">
                      ✦ {GRADE_NAMES_KO[grade]} 강화확률{' '}
                      <span className="text-purple-400">+{bonus}%</span>
                      {curr > 0 && <span className="text-green-400 text-xs ml-1">(+{diff}%↑)</span>}
                    </div>
                  ) : null
                })}
                <div className="mt-2 text-sm">
                  필요 신성력:{' '}
                  <span className={canUpgrade ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                    {nextTier.upgradeCost.toLocaleString()}
                  </span>
                  {!canUpgrade && (
                    <span className="text-gray-500 text-xs ml-2">
                      ({(nextTier.upgradeCost - divinePower).toLocaleString()} 부족)
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={upgradeDivineRank}
                disabled={!canUpgrade}
                className={`shrink-0 px-4 py-3 rounded-lg font-bold text-sm transition-all ${
                  canUpgrade
                    ? 'bg-purple-700 hover:bg-purple-600 text-white hover:scale-105'
                    : 'bg-gray-800 text-gray-600 cursor-not-allowed'
                }`}
              >
                신격<br/>승격
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-amber-300 font-bold">
            ✦ 최고 신격 달성 ✦
          </div>
        )}
      </div>

      {/* 신격 등급표 */}
      <div className="bg-forge-card border border-forge-border rounded-lg p-4">
        <div className="text-forge-text-dim text-xs font-bold mb-3">신격 등급표</div>
        <div className="flex flex-col gap-1.5">
          {DIVINE_RANK_TIERS.map((rankTier, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 p-2 rounded text-sm ${i === divineRank ? 'bg-purple-900/30 border border-purple-700' : i < divineRank ? 'opacity-50' : ''}`}
            >
              <div className={`w-24 font-bold ${tierColors[i]}`}>{rankTier.name}</div>
              <div className="text-forge-text-dim text-xs flex-1">
                회복 +{DIVINE_TURN_RECOVERY[i]}/턴
                {DIVINE_RANK_PROB_BONUS[i] && Object.keys(DIVINE_RANK_PROB_BONUS[i]).length > 0 && (
                  <span className="ml-2 text-purple-400">
                    · 강화보너스 있음
                  </span>
                )}
              </div>
              {i > 0 && (
                <div className="text-forge-text-dim text-xs">
                  {i <= divineRank ? '✓' : rankTier.upgradeCost.toLocaleString() + '✨'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 장난의 신 독백 */}
      <div className="bg-forge-card border border-blue-900/40 rounded-lg p-4 text-sm text-forge-text-dim italic">
        <span className="text-blue-400 not-italic font-bold">장난의 신 :</span>{' '}
        {divineRank === 0 && '"잊혀진다는 게 이렇게 불편한 줄 몰랐어. 계속 두드려봐. 내 이름이 다시 들릴 때까지."'}
        {divineRank === 1 && '"오, 조금 나아지는군. 아직 멀었지만... 뭐, 나쁘진 않아."'}
        {divineRank === 2 && '"슬슬 기억해주는 사람들이 생기는 모양이야. 기분이 나쁘지 않네."'}
        {divineRank === 3 && '"중간 정도는 됐군. 근데 진짜 실력은 이제부터야. 크크."'}
        {divineRank === 4 && '"상급 신이라... 이 정도면 옛날 동료들도 날 무시하진 못하겠지."'}
        {divineRank === 5 && '"고위 신. 오래 기다렸어. 이제 진짜 내 힘을 보여줄 수 있겠군."'}
        {divineRank === 6 && '"주신급이라... 이건 나도 예상 못 했어. 진심으로. 잘했다, 대장장이."'}
      </div>
    </div>
  )
}
