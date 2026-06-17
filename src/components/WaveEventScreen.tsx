import { useGameStore } from '../store/gameStore'
import { STAT_GRADE_VALUE, STAT_GRADE_COLORS, CHARACTER_CLASS_NAMES, TROOP_TYPE_NAMES } from '../types'

// 병과 아이콘
const TROOP_ICONS: Record<string, string> = {
  knight:   '⚔️',
  infantry: '🛡️',
  archer:   '🏹',
  mage:     '🔮',
  healer:   '✨',
}

// 적 웨이브 묘사
const WAVE_DESCRIPTIONS = [
  { title: '마왕군 선발대', desc: '마왕의 정찰대가 당신의 영지를 향해 진군하고 있습니다. 초소와 외곽 방어선을 노리는 것으로 보입니다.', icon: '💀' },
  { title: '마왕군 제2진', desc: '선발대의 패배에 격분한 마왕이 정예 부대를 파견했습니다. 이전보다 훨씬 강력한 전력입니다.', icon: '👹' },
  { title: '마왕군 주력부대', desc: '마왕군의 주력이 총공세를 펼칩니다. 화염과 어둠의 마력으로 뒤덮인 대군입니다.', icon: '🔥' },
  { title: '마왕의 오른팔', desc: '마왕의 직속 부장이 직접 지휘하는 정예 군단이 밀려옵니다.', icon: '⚡' },
  { title: '마왕군 총공세', desc: '이것은 결전입니다. 마왕이 모든 전력을 쏟아붓고 있습니다.', icon: '☠️' },
]

function getWaveDesc(waveNum: number) {
  return WAVE_DESCRIPTIONS[Math.min(waveNum - 1, WAVE_DESCRIPTIONS.length - 1)]
}

// 전투력 바
function PowerBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100)
  return (
    <div className="w-full h-3 bg-forge-border rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function WaveEventScreen() {
  const {
    troopSlots, retainers, waveNumber, nextWaveTurn, turn,
    pendingWaveEvent, waveResult, resolveWave, clearWaveResult,
  } = useGameStore()

  const waveNum = waveNumber + 1
  const waveDesc = getWaveDesc(waveNum)
  const enemyStrength = 60 + waveNum * 40

  // 각 병력 전투력 미리보기
  const troopPreviews = troopSlots.map(slot => {
    const commander = slot.commanderId
      ? retainers.find(r => r.id === slot.commanderId) ?? null
      : null
    let power = 8
    if (commander) {
      const prof = STAT_GRADE_VALUE[commander.stats.proficiency] ?? 1
      const cour = STAT_GRADE_VALUE[commander.stats.courage] ?? 1
      power = prof * 15 + cour * 10 + 20
    }
    return { slot, commander, power }
  })
  const totalDefense = troopPreviews.reduce((s, t) => s + t.power, 0)

  // 웨이브 결과 팝업
  if (!pendingWaveEvent && waveResult) {
    const { outcome, defensePower, enemyStrength: es, goldChange, divineRankChange,
            waveDefenseBonusGained, waveNumber: wn } = waveResult
    const maxPow = Math.max(defensePower, es, 1)

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="bg-forge-bg border-2 border-forge-border rounded-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
          {/* 결과 헤더 */}
          <div className={`py-6 text-center ${outcome === 'victory' ? 'bg-green-900/40' : 'bg-red-900/40'}`}>
            <div className="text-5xl mb-2">{outcome === 'victory' ? '🏆' : '💔'}</div>
            <h2 className={`text-2xl font-bold ${outcome === 'victory' ? 'text-green-300' : 'text-red-300'}`}>
              {outcome === 'victory' ? '방어 성공!' : '방어 실패...'}
            </h2>
            <p className="text-forge-text-dim text-sm mt-1">제{wn}차 마왕군 침략</p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 전투력 비교 */}
            <div className="space-y-3">
              <h3 className="text-xs text-forge-text-dim tracking-wider">전투력 비교</h3>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-300">🛡️ 수비 전력</span>
                  <span className="font-bold text-blue-300">{defensePower}</span>
                </div>
                <PowerBar value={defensePower} max={maxPow} color="#60a5fa" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-300">⚔️ 적 전력</span>
                  <span className="font-bold text-red-300">{es}</span>
                </div>
                <PowerBar value={es} max={maxPow} color="#f87171" />
              </div>
            </div>

            {/* 결과 상세 */}
            <div className="bg-forge-card border border-forge-border rounded-xl p-4 space-y-2">
              <h3 className="text-xs text-forge-text-dim tracking-wider mb-3">전투 결과</h3>
              {goldChange !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-forge-text-dim">골드</span>
                  <span className={goldChange > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                    {goldChange > 0 ? '+' : ''}{goldChange}G
                  </span>
                </div>
              )}
              {divineRankChange !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-forge-text-dim">신격</span>
                  <span className={divineRankChange > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                    {divineRankChange > 0 ? '+' : ''}{divineRankChange}
                  </span>
                </div>
              )}
              {waveDefenseBonusGained > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-forge-text-dim">월 수입 증가</span>
                  <span className="text-forge-gold font-bold">+{waveDefenseBonusGained}G / 월</span>
                </div>
              )}
            </div>

            {/* 각 병력 기여 */}
            <div>
              <h3 className="text-xs text-forge-text-dim tracking-wider mb-2">병력 기여</h3>
              <div className="space-y-2">
                {waveResult.combatDetails.map(d => (
                  <div key={d.troopId} className="flex items-center justify-between bg-forge-card rounded-lg p-2.5 text-sm">
                    <div>
                      <span className="mr-1">{TROOP_ICONS[d.troopType.replace(' 병력','').trim()] ?? '🗡️'}</span>
                      <span className="text-forge-text">{d.troopType}</span>
                      {d.commanderName && (
                        <span className="text-forge-text-dim text-xs ml-2">({d.commanderName})</span>
                      )}
                      {!d.commanderName && (
                        <span className="text-red-400 text-xs ml-2">(지휘관 없음)</span>
                      )}
                    </div>
                    <span className="text-blue-300 font-bold">{d.power}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-forge-text-dim text-xs text-center">
              다음 웨이브까지 {nextWaveTurn - turn}턴 남았습니다
            </p>
          </div>

          <div className="p-4 border-t border-forge-border">
            <button
              onClick={clearWaveResult}
              className="w-full py-3 rounded-xl font-bold text-sm bg-forge-gold text-forge-bg hover:bg-forge-gold/90 transition-colors">
              계속하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 웨이브 대기 화면 (pendingWaveEvent = true)
  if (!pendingWaveEvent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="bg-forge-bg border-2 border-forge-border rounded-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* 웨이브 헤더 */}
        <div className="bg-red-950/60 border-b border-red-800 py-6 text-center">
          <div className="text-5xl mb-2 animate-pulse">{waveDesc.icon}</div>
          <p className="text-red-400 text-xs tracking-widest mb-1">제{waveNum}차 마왕군 침략</p>
          <h2 className="text-xl font-bold text-red-300">{waveDesc.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 상황 설명 */}
          <div className="bg-forge-card border border-forge-border rounded-xl p-4">
            <p className="text-forge-text-dim text-sm leading-relaxed">{waveDesc.desc}</p>
          </div>

          {/* 적 전력 */}
          <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-red-300 text-sm font-bold">⚔️ 적 전력</span>
              <span className="text-red-300 font-bold text-lg">{enemyStrength}</span>
            </div>
            <PowerBar value={enemyStrength} max={Math.max(enemyStrength, totalDefense, 1)} color="#f87171" />
          </div>

          {/* 수비 병력 */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs text-forge-text-dim tracking-wider">수비 병력</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-forge-text-dim">총 전력</span>
                <span className={`font-bold text-sm ${totalDefense >= enemyStrength ? 'text-green-300' : 'text-red-300'}`}>
                  {totalDefense}
                </span>
              </div>
            </div>
            <div className="mb-2">
              <PowerBar
                value={totalDefense}
                max={Math.max(enemyStrength, totalDefense, 1)}
                color={totalDefense >= enemyStrength ? '#4ade80' : '#facc15'}
              />
            </div>
            <div className="space-y-2 mt-3">
              {troopPreviews.map(({ slot, commander, power }) => (
                <div key={slot.id} className="flex items-center justify-between bg-forge-card rounded-lg p-3">
                  <div>
                    <span className="mr-2">{TROOP_ICONS[slot.troopType] ?? '🗡️'}</span>
                    <span className="text-forge-text text-sm">{TROOP_TYPE_NAMES[slot.troopType]}</span>
                    {commander ? (
                      <div className="text-xs text-forge-text-dim mt-0.5">
                        지휘관: <span className="text-forge-gold">{commander.name}</span>
                        {' '}({CHARACTER_CLASS_NAMES[commander.characterClass]})
                        {' '}— 전문성 <span style={{ color: STAT_GRADE_COLORS[commander.stats.proficiency] }}>{commander.stats.proficiency}</span>
                        {' '}담력 <span style={{ color: STAT_GRADE_COLORS[commander.stats.courage] }}>{commander.stats.courage}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-red-400 mt-0.5">지휘관 없음 (전력 약화)</div>
                    )}
                  </div>
                  <span className={`font-bold text-sm ${commander ? 'text-blue-300' : 'text-forge-text-dim'}`}>
                    {power}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 전력 차이 안내 */}
          {totalDefense < enemyStrength && (
            <div className="bg-red-950/30 border border-red-700/50 rounded-xl p-3 text-xs text-red-400 text-center">
              ⚠️ 수비 전력이 부족합니다! 패배 시 골드와 신격을 잃습니다.
            </div>
          )}
          {totalDefense >= enemyStrength && (
            <div className="bg-green-950/30 border border-green-700/50 rounded-xl p-3 text-xs text-green-400 text-center">
              ✅ 수비 전력이 충분합니다. 방어에 성공할 것입니다!
            </div>
          )}
        </div>

        {/* 방어 시작 버튼 */}
        <div className="p-4 border-t border-forge-border">
          <button
            onClick={resolveWave}
            className="w-full py-3 rounded-xl font-bold text-sm bg-red-700 text-white hover:bg-red-600 transition-colors">
            ⚔️ 방어 시작
          </button>
        </div>
      </div>
    </div>
  )
}
