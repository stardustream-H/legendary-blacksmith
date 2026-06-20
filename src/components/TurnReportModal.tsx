import { useGameStore } from '../store/gameStore'
export default function TurnReportModal() {
  const { pendingTurnReport, clearTurnReport } = useGameStore()
  if (!pendingTurnReport) return null

  const r = pendingTurnReport

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-forge-bg border border-forge-border rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto flex flex-col gap-4">
        {/* 헤더 */}
        <div className="text-center">
          <div className="text-2xl font-bold text-forge-text">📋 {r.turn}턴 보고서</div>
          <div className="text-forge-text-dim text-xs mt-1">새로운 턴이 시작되었습니다</div>
        </div>

        {/* 신성력 회복 */}
        <div className="bg-forge-card border border-forge-border rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <div className="text-sm font-bold text-forge-text">신성력 회복</div>
            <div className="text-forge-text-dim text-xs">+{r.divinePowerGain} 획득 → 총 {r.newDivinePower}</div>
          </div>
        </div>

        {/* 월 결산 */}
        {r.isMonthlyTurn && (
          <div className={`border rounded-xl p-3 ${r.monthlyReport?.startsWith('⚠️') ? 'bg-red-950/40 border-red-800' : 'bg-green-950/40 border-green-800'}`}>
            <div className="text-sm font-bold text-forge-text mb-1">📅 월 결산</div>
            {r.income > 0 && (
              <div className="text-xs text-forge-text-dim">
                수입: <span className="text-green-400">+{r.income}G</span>
                {r.salary > 0 && <> / 봉급: <span className="text-red-400">-{r.salary}G</span> / 순이익: <span className={r.income - r.salary >= 0 ? 'text-green-400' : 'text-red-400'}>{r.income - r.salary >= 0 ? '+' : ''}{r.income - r.salary}G</span></>}
              </div>
            )}
            {r.monthlyReport && (
              <div className="text-xs text-forge-text mt-1">{r.monthlyReport}</div>
            )}
          </div>
        )}

        {/* 새 의뢰 */}
        {r.newCommissions.length > 0 && (
          <div className="bg-forge-card border border-forge-border rounded-xl p-3">
            <div className="text-sm font-bold text-forge-text mb-2">📌 새 의뢰 ({r.newCommissions.length}건)</div>
            <div className="flex flex-col gap-1">
              {r.newCommissions.map(c => (
                <div key={c.id} className="flex items-center justify-between text-xs">
                  <span className="text-forge-text">
                    [<span className={c.grade === 'premium' ? 'text-yellow-400' : c.grade === 'urgent' ? 'text-orange-400' : 'text-gray-400'}>
                      {({'normal':'일반','urgent':'긴급','premium':'특별'} as Record<string,string>)[c.grade] ?? c.grade}
                    </span>] {c.name}
                  </span>
                  <span className="text-yellow-400">+{c.reward}G</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 상인 방문 */}
        {r.merchantVisited.length > 0 && (
          <div className="bg-forge-card border border-forge-border rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">🛒</span>
            <div>
              <div className="text-sm font-bold text-forge-text">상인 방문</div>
              <div className="text-forge-text-dim text-xs">{r.merchantVisited.join(', ')}의 새 상품이 도착했습니다</div>
            </div>
          </div>
        )}

        {/* 모험가 회복 */}
        {r.adventurerRecovered.length > 0 && (
          <div className="bg-forge-card border border-forge-border rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">💊</span>
            <div>
              <div className="text-sm font-bold text-forge-text">모험가 회복</div>
              <div className="text-forge-text-dim text-xs">{r.adventurerRecovered.join(', ')}이(가) 부상에서 회복했습니다</div>
            </div>
          </div>
        )}

        {/* 새 모험가 */}
        {r.newAdventurerName && (
          <div className="bg-blue-950/40 border border-blue-800 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">⚔️</span>
            <div>
              <div className="text-sm font-bold text-forge-text">새 모험가 등장</div>
              <div className="text-forge-text-dim text-xs">{r.newAdventurerName}이(가) 길드에 합류했습니다</div>
            </div>
          </div>
        )}

        {/* 왕국 파견 */}
        {r.kingdomRequestAvailable && (
          <div className="bg-purple-950/40 border border-purple-800 rounded-xl p-3 flex items-center gap-3">
            <span className="text-2xl">👑</span>
            <div>
              <div className="text-sm font-bold text-forge-text">왕국 파견 요청</div>
              <div className="text-forge-text-dim text-xs">영주성에서 왕국 파견 요청을 처리할 수 있습니다</div>
            </div>
          </div>
        )}

        {/* 웨이브 경고 */}
        {r.waveWarning && (
          <div className="bg-red-950/60 border border-red-600 rounded-xl p-3 flex items-center gap-3 animate-pulse">
            <span className="text-2xl">⚔️</span>
            <div>
              <div className="text-sm font-bold text-red-400">⚠️ 파도 공격 임박!</div>
              <div className="text-forge-text-dim text-xs">적군의 공격이 시작됩니다. 방어를 준비하세요!</div>
            </div>
          </div>
        )}

        {/* 확인 버튼 */}
        <button
          onClick={clearTurnReport}
          className="w-full bg-forge-accent hover:bg-forge-accent/80 text-white font-bold py-3 rounded-xl transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  )
}
