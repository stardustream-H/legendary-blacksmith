import { useGameStore } from '../store/gameStore'
import { STAT_GRADE_VALUE, STAT_GRADE_COLORS, CHARACTER_CLASS_NAMES, TROOP_TYPE_NAMES, WAVE_SCHEDULE } from '../types'

// 병과 아이콘
const TROOP_ICONS: Record<string, string> = {
  knight:   '⚔️',
  infantry: '🛡️',
  archer:   '🏹',
  mage:     '🔮',
  healer:   '✨',
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
    pendingWaveEvent, waveResult, resolveWave, clearWaveResult, wall,
  } = useGameStore()

  const waveNum = waveNumber + 1
  const entry = WAVE_SCHEDULE[waveNum - 1] ?? WAVE_SCHEDULE[WAVE_SCHEDULE.length - 1]
  const isFinal = entry.isFinal === true

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
  const troopPower = troopPreviews.reduce((s, t) => s + t.power, 0)
  const wallPowerVal = Math.floor(wall.level * 20 * (wall.durability / wall.maxDurability))
  const totalDefense = troopPower + wallPowerVal

  // ─── 웨이브 결과 화면 ───────────────────────────────────────────────
  if (!pendingWaveEvent && waveResult) {
    const {
      outcome, defensePower, enemyStrength: es, goldChange, divinePowerChange,
      waveDefenseBonusGained, waveNumber: wn, waveName, isFinalWave,
    } = waveResult
    const resultEntry = WAVE_SCHEDULE[wn - 1] ?? WAVE_SCHEDULE[WAVE_SCHEDULE.length - 1]
    const maxPow = Math.max(defensePower, es, 1)

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
        <div className="bg-forge-bg border-2 border-forge-border rounded-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

          {/* 결과 헤더 */}
          <div className={`py-6 text-center ${
            outcome === 'victory'
              ? isFinalWave ? 'bg-yellow-900/60' : 'bg-green-900/40'
              : 'bg-red-900/40'
          }`}>
            <div className="text-5xl mb-2">
              {outcome === 'victory' ? (isFinalWave ? '👑' : '🏆') : '💔'}
            </div>
            <h2 className={`text-2xl font-bold ${
              outcome === 'victory'
                ? isFinalWave ? 'text-yellow-300' : 'text-green-300'
                : 'text-red-300'
            }`}>
              {outcome === 'victory'
                ? isFinalWave ? '전설이 되다!' : '방어 성공!'
                : isFinalWave ? '영지 함락...' : '방어 실패...'}
            </h2>
            <p className="text-forge-text-dim text-sm mt-1">
              {resultEntry.icon} {waveName}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* 최종 웨이브 특별 메시지 */}
            {isFinalWave && outcome === 'victory' && (
              <div className="bg-yellow-950/40 border border-yellow-600/50 rounded-xl p-4 text-sm text-yellow-200 leading-relaxed">
                마왕이 쓰러졌다. 세상은 평화를 되찾았다.<br/>
                <span className="text-yellow-400/70 text-xs">하지만 세월이 흐르면, 역사는 반복될 것이다...</span>
              </div>
            )}
            {isFinalWave && outcome === 'defeat' && (
              <div className="bg-red-950/40 border border-red-700/50 rounded-xl p-4 text-sm text-red-200 leading-relaxed">
                마왕의 군대가 영지를 짓밟았다. 모든 것이 무너졌다.
              </div>
            )}

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
            {!isFinalWave && (
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
                {divinePowerChange !== 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-forge-text-dim">신격</span>
                    <span className={divinePowerChange > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      신성력 {divinePowerChange > 0 ? '+' : ''}{divinePowerChange}
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
            )}

            {/* 병력 기여 */}
            <div>
              <h3 className="text-xs text-forge-text-dim tracking-wider mb-2">병력 기여</h3>
              <div className="space-y-2">
                {waveResult.combatDetails.map(d => (
                  <div key={d.troopId} className="flex items-center justify-between bg-forge-card rounded-lg p-2.5 text-sm">
                    <div>
                      <span className="mr-1">{TROOP_ICONS[d.troopType] ?? '🗡️'}</span>
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

            {!isFinalWave && (
              <p className="text-forge-text-dim text-xs text-center">
                다음 웨이브까지 {Math.max(0, nextWaveTurn - turn)}턴 남았습니다
              </p>
            )}
          </div>

          <div className="p-4 border-t border-forge-border">
            <button
              onClick={clearWaveResult}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                isFinalWave && outcome === 'victory'
                  ? 'bg-yellow-600 text-white hover:bg-yellow-500'
                  : 'bg-forge-gold text-forge-bg hover:bg-forge-gold/90'
              }`}>
              {isFinalWave ? (outcome === 'victory' ? '엔딩 보기' : '결과 확인') : '계속하기'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── 웨이브 대기 화면 (pendingWaveEvent = true) ──────────────────────
  if (!pendingWaveEvent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="bg-forge-bg border-2 border-forge-border rounded-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* 웨이브 헤더 */}
        <div className={`border-b py-6 text-center ${
          isFinal
            ? 'bg-yellow-950/70 border-yellow-700'
            : 'bg-red-950/60 border-red-800'
        }`}>
          <div className={`text-5xl mb-2 ${isFinal ? 'animate-bounce' : 'animate-pulse'}`}>
            {entry.icon}
          </div>
          <p className={`text-xs tracking-widest mb-1 ${isFinal ? 'text-yellow-400' : 'text-red-400'}`}>
            {isFinal ? '⚠️ 최후의 결전 ⚠️' : `제${waveNum}차 마왕군 침략`}
          </p>
          <h2 className={`text-xl font-bold ${isFinal ? 'text-yellow-300' : 'text-red-300'}`}>
            {entry.name}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* 상황 설명 */}
          <div className="bg-forge-card border border-forge-border rounded-xl p-4">
            <p className="text-forge-text-dim text-sm leading-relaxed">{entry.enemyDescription}</p>
          </div>

          {/* 특이사항 (용사 파티 합류 등) */}
          {entry.specialNote && (
            <div className={`border rounded-xl p-3 text-xs leading-relaxed ${
              isFinal
                ? 'bg-yellow-950/30 border-yellow-700/50 text-yellow-300'
                : 'bg-blue-950/30 border-blue-700/50 text-blue-300'
            }`}>
              📌 {entry.specialNote}
            </div>
          )}

          {/* 적 전력 */}
          <div className={`border rounded-xl p-4 ${
            isFinal ? 'bg-yellow-950/20 border-yellow-700/50' : 'bg-red-950/30 border-red-800/50'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-bold ${isFinal ? 'text-yellow-300' : 'text-red-300'}`}>
                ⚔️ 적 전력
              </span>
              <span className={`font-bold text-lg ${isFinal ? 'text-yellow-300' : 'text-red-300'}`}>
                {entry.enemyStrength}
              </span>
            </div>
            <PowerBar
              value={entry.enemyStrength}
              max={Math.max(entry.enemyStrength, totalDefense, 1)}
              color={isFinal ? '#fbbf24' : '#f87171'}
            />
          </div>

          {/* 수비 병력 */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xs text-forge-text-dim tracking-wider">수비 병력</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-forge-text-dim">총 전력</span>
                <span className={`font-bold text-sm ${totalDefense >= entry.enemyStrength ? 'text-green-300' : 'text-red-300'}`}>
                  {totalDefense}
                </span>
                <span className="text-forge-text-dim text-xs">(병력 {troopPower} + 성벽 {wallPowerVal})</span>
              </div>
            </div>
            <div className="mb-3">
              <PowerBar
                value={totalDefense}
                max={Math.max(entry.enemyStrength, totalDefense, 1)}
                color={totalDefense >= entry.enemyStrength ? '#4ade80' : '#facc15'}
              />
            </div>
            <div className="space-y-2">
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

          {/* 전력 판정 메시지 */}
          {totalDefense < entry.enemyStrength ? (
            <div className="bg-red-950/30 border border-red-700/50 rounded-xl p-3 text-xs text-red-400 text-center">
              ⚠️ 수비 전력이 부족합니다!{isFinal ? ' 패배 시 게임 오버입니다.' : ' 패배 시 골드와 신격을 잃습니다.'}
            </div>
          ) : (
            <div className="bg-green-950/30 border border-green-700/50 rounded-xl p-3 text-xs text-green-400 text-center">
              ✅ 수비 전력이 충분합니다. 방어에 성공할 것입니다!
            </div>
          )}
        </div>

        {/* 방어 시작 버튼 */}
        <div className="p-4 border-t border-forge-border">
          <button
            onClick={resolveWave}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
              isFinal
                ? 'bg-yellow-700 text-white hover:bg-yellow-600'
                : 'bg-red-700 text-white hover:bg-red-600'
            }`}>
            {isFinal ? '☠️ 최후의 결전 시작' : '⚔️ 방어 시작'}
          </button>
        </div>
      </div>
    </div>
  )
}
