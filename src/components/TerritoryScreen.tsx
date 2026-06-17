import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  TroopType, TROOP_TYPE_NAMES,
  CHARACTER_CLASS_NAMES, STAT_GRADE_COLORS, STAT_GRADE_VALUE, STAT_NAMES,
  Retainer, StatGrade,
} from '../types'
import CharacterDetailPopup from './CharacterDetailPopup'

type TerritoryTab = 'retainers' | 'troops'

const TROOP_ICONS: Record<TroopType, string> = {
  knight:   '⚔️',
  infantry: '🛡️',
  archer:   '🏹',
  mage:     '🔮',
  healer:   '✨',
}

// ===== 미니 스탯 바 =====
function MiniStatBar({ grade }: { grade: StatGrade }) {
  const val = STAT_GRADE_VALUE[grade] ?? 1
  const color = STAT_GRADE_COLORS[grade] ?? '#6b7280'
  return (
    <div className="flex gap-0.5 items-center">
      {(['E','D','C','B','A','S'] as StatGrade[]).map((_, i) => (
        <div key={i} className="w-2 h-2 rounded-sm"
          style={{ background: i < val ? color : '#374151', opacity: i < val ? 1 : 0.3 }} />
      ))}
      <span className="text-xs font-bold ml-1" style={{ color }}>{grade}</span>
    </div>
  )
}

// ===== 가신 카드 (목록 / 후보 공용) =====
function RetainerCard({
  retainer,
  onDetail,
  actions,
}: {
  retainer: Retainer
  onDetail?: () => void
  actions?: React.ReactNode
}) {
  const { troopSlots } = useGameStore()
  const assignedTroop = troopSlots.find(t => t.commanderId === retainer.id)

  return (
    <div className="bg-forge-card border border-forge-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-forge-gold">{retainer.name}</span>
            <span className="text-xs text-forge-text-dim bg-forge-bg px-1.5 py-0.5 rounded">
              {CHARACTER_CLASS_NAMES[retainer.characterClass]}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {(Object.entries(STAT_NAMES) as [keyof typeof STAT_NAMES, string][]).map(([key, label]) => (
              <div key={key} className="flex items-center gap-1 text-xs text-forge-text-dim">
                <span className="w-10">{label}</span>
                <MiniStatBar grade={retainer.stats[key]} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {assignedTroop && (
            <div className="text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-700">
              {TROOP_ICONS[assignedTroop.troopType]} {TROOP_TYPE_NAMES[assignedTroop.troopType]}
            </div>
          )}
          {retainer.loyalty > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-forge-text-dim">
              <span>충성</span>
              <div className="w-14 h-1.5 bg-forge-border rounded-full overflow-hidden">
                <div className="h-full rounded-full"
                  style={{
                    width: `${retainer.loyalty}%`,
                    background: retainer.loyalty >= 60 ? '#4ade80' : retainer.loyalty >= 30 ? '#facc15' : '#f87171',
                  }} />
              </div>
              <span>{retainer.loyalty}%</span>
            </div>
          )}
          {retainer.salary > 0 && (
            <span className="text-xs text-forge-text-dim">{retainer.salary}G / 월</span>
          )}
          {onDetail && (
            <button onClick={onDetail}
              className="px-3 py-1 text-xs bg-forge-gold/10 border border-forge-gold/40 text-forge-gold rounded-lg hover:bg-forge-gold/20 transition-colors">
              상세보기
            </button>
          )}
          {actions}
        </div>
      </div>
    </div>
  )
}

// ===== 왕국 파견 요청 모달 =====
function KingdomDispatchModal({ onClose }: { onClose: () => void }) {
  const {
    turn, lastKingdomRequestMonth, kingdomCandidates,
    requestKingdomDispatch, recruitCandidate, dismissKingdomCandidates,
  } = useGameStore()

  const currentMonth = Math.floor((turn - 1) / 4) + 1
  const alreadyRequested = lastKingdomRequestMonth >= currentMonth
  const hasCandidates = kingdomCandidates.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}>
      <div
        className="bg-forge-bg border-2 border-forge-border rounded-xl w-full max-w-sm mx-4 max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border">
          <div>
            <h3 className="text-forge-gold font-bold">🏰 왕국 파견 요청</h3>
            <p className="text-forge-text-dim text-xs">
              {alreadyRequested && !hasCandidates
                ? `${currentMonth}월 요청 완료 — 다음 달에 다시 요청 가능`
                : '왕국에서 인재를 파견받습니다 (월 1회)'}
            </p>
          </div>
          <button onClick={onClose} className="text-forge-text-dim hover:text-forge-gold text-xl leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* 후보 없음 + 미요청 */}
          {!hasCandidates && !alreadyRequested && (
            <div className="flex flex-col items-center gap-4 py-6">
              <p className="text-forge-text-dim text-sm text-center">
                왕국에 파견을 요청하면 지원자 명단을 받아볼 수 있습니다.<br />
                <span className="text-forge-gold">월 1회</span>만 요청 가능합니다.
              </p>
              <button
                onClick={() => requestKingdomDispatch()}
                className="px-6 py-3 bg-forge-gold text-forge-bg font-bold rounded-xl hover:bg-forge-gold/90 transition-colors">
                파견 요청하기
              </button>
            </div>
          )}

          {/* 이번 달 이미 요청함 + 후보 없음 */}
          {!hasCandidates && alreadyRequested && (
            <div className="flex flex-col items-center gap-3 py-8 text-forge-text-dim">
              <p className="text-4xl">📋</p>
              <p className="text-sm">이번 달 파견 요청은 이미 처리됐습니다.</p>
              <p className="text-xs">다음 달이 되면 다시 요청할 수 있습니다.</p>
            </div>
          )}

          {/* 후보 목록 */}
          {hasCandidates && (
            <div className="space-y-3">
              <p className="text-forge-text-dim text-xs text-center mb-2">
                {kingdomCandidates.length}명의 지원자가 도착했습니다. 한 명을 영입하거나 모두 돌려보내세요.
              </p>
              {kingdomCandidates.map(candidate => (
                <RetainerCard
                  key={candidate.id}
                  retainer={candidate}
                  actions={
                    <button
                      onClick={() => { recruitCandidate(candidate.id); onClose() }}
                      className="px-3 py-1 text-xs bg-green-800 border border-green-600 text-green-300 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap">
                      영입
                    </button>
                  }
                />
              ))}
              <button
                onClick={() => { dismissKingdomCandidates(); onClose() }}
                className="w-full py-2 text-xs text-forge-text-dim border border-forge-border rounded-lg hover:text-forge-text hover:border-forge-text-dim transition-colors mt-2">
                모두 돌려보내기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ===== 메인 화면 =====
export default function TerritoryScreen() {
  const { retainers, troopSlots, assignCommander, setScreen, turn, lastKingdomRequestMonth, kingdomCandidates } = useGameStore()
  const [activeTab, setActiveTab] = useState<TerritoryTab>('retainers')
  const [detailRetainerId, setDetailRetainerId] = useState<string | null>(null)
  const [assigningTroopId, setAssigningTroopId] = useState<string | null>(null)
  const [showKingdomModal, setShowKingdomModal] = useState(false)

  const assigningTroop = assigningTroopId ? troopSlots.find(t => t.id === assigningTroopId) : null
  const currentMonth = Math.floor((turn - 1) / 4) + 1
  const canRequest = lastKingdomRequestMonth < currentMonth || kingdomCandidates.length > 0

  return (
    <div className="min-h-screen bg-forge-bg text-forge-text flex flex-col">
      {/* 상단 바 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-forge-border bg-forge-card">
        <button onClick={() => setScreen('hub')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors text-sm">
          ← 영주성
        </button>
        <h1 className="text-lg font-bold text-forge-gold">가신단 관리</h1>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-forge-border bg-forge-card">
        {([
          { id: 'retainers' as const, label: '⚔️ 가신 목록' },
          { id: 'troops'    as const, label: '🛡️ 수비 병력' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === t.id
                ? 'text-forge-gold border-b-2 border-forge-gold'
                : 'text-forge-text-dim hover:text-forge-text'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ===== 가신 목록 탭 ===== */}
        {activeTab === 'retainers' && (
          <div className="space-y-3">
            {/* 왕국 파견 요청 버튼 */}
            <button
              onClick={() => setShowKingdomModal(true)}
              className={`w-full py-3 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${
                kingdomCandidates.length > 0
                  ? 'bg-green-900/30 border-green-600 text-green-300 hover:bg-green-900/50'
                  : canRequest
                    ? 'bg-forge-gold/10 border-forge-gold/40 text-forge-gold hover:bg-forge-gold/20'
                    : 'bg-forge-card border-forge-border text-forge-text-dim opacity-60'
              }`}>
              🏰 왕국 파견 요청
              {kingdomCandidates.length > 0 && (
                <span className="bg-green-500 text-black text-xs rounded-full px-1.5">{kingdomCandidates.length}</span>
              )}
              {!canRequest && kingdomCandidates.length === 0 && (
                <span className="text-xs opacity-70">(다음 달 가능)</span>
              )}
            </button>

            {/* 가신 목록 */}
            {retainers.length === 0 ? (
              <div className="text-center text-forge-text-dim py-12">
                <p className="text-4xl mb-2">🏰</p>
                <p className="text-sm">가신이 없습니다</p>
                <p className="text-xs mt-1 opacity-60">왕국 파견 요청으로 인재를 영입하세요</p>
              </div>
            ) : (
              retainers.map(retainer => (
                <RetainerCard
                  key={retainer.id}
                  retainer={retainer}
                  onDetail={() => setDetailRetainerId(retainer.id)}
                />
              ))
            )}
          </div>
        )}

        {/* ===== 수비 병력 탭 ===== */}
        {activeTab === 'troops' && (
          <div className="space-y-4">
            <p className="text-forge-text-dim text-xs text-center">
              각 병력 슬롯을 눌러 지휘관을 임명하세요
            </p>
            {troopSlots.map(slot => {
              const commander = slot.commanderId
                ? retainers.find(r => r.id === slot.commanderId)
                : null
              return (
                <div key={slot.id}
                  className="bg-forge-card border border-forge-border rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{TROOP_ICONS[slot.troopType]}</span>
                    <div>
                      <span className="font-bold text-forge-text">{TROOP_TYPE_NAMES[slot.troopType]}</span>
                      <div className={`text-xs mt-0.5 ${commander ? 'text-green-400' : 'text-red-400'}`}>
                        {commander ? `지휘관: ${commander.name}` : '지휘관 없음 (전력 약화)'}
                      </div>
                    </div>
                  </div>

                  {commander && (
                    <div className="flex items-center gap-3 bg-forge-bg rounded-lg p-3 mb-3">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-forge-gold">{commander.name}</div>
                        <div className="text-xs text-forge-text-dim">
                          {CHARACTER_CLASS_NAMES[commander.characterClass]}
                        </div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-xs text-forge-text-dim">
                            전문성 <span style={{ color: STAT_GRADE_COLORS[commander.stats.proficiency] }}>{commander.stats.proficiency}</span>
                          </span>
                          <span className="text-xs text-forge-text-dim">
                            담력 <span style={{ color: STAT_GRADE_COLORS[commander.stats.courage] }}>{commander.stats.courage}</span>
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => assignCommander(slot.id, null)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 border border-red-800 rounded">
                        해제
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setAssigningTroopId(slot.id)}
                    className="w-full py-2 text-sm border rounded-lg transition-colors border-forge-gold/40 text-forge-gold hover:bg-forge-gold/10">
                    {commander ? '지휘관 변경' : '지휘관 임명'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===== 지휘관 임명 모달 ===== */}
      {assigningTroop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setAssigningTroopId(null)}>
          <div
            className="bg-forge-bg border-2 border-forge-border rounded-xl w-full max-w-sm mx-4 max-h-[75vh] flex flex-col overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-forge-border">
              <h3 className="font-bold text-forge-gold">
                {TROOP_ICONS[assigningTroop.troopType]} {TROOP_TYPE_NAMES[assigningTroop.troopType]} — 지휘관 임명
              </h3>
              <button onClick={() => setAssigningTroopId(null)}
                className="text-forge-text-dim hover:text-forge-gold text-xl leading-none">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <button
                onClick={() => { assignCommander(assigningTroop.id, null); setAssigningTroopId(null) }}
                className="w-full text-left p-3 rounded-lg border border-dashed border-red-700/50 text-red-400 hover:bg-red-900/20 transition-colors text-sm">
                지휘관 없음 (해제)
              </button>

              {retainers.length === 0 ? (
                <p className="text-forge-text-dim text-xs text-center py-4">
                  영입된 가신이 없습니다
                </p>
              ) : (
                retainers.map(ret => {
                  const isCurrentCommander = assigningTroop.commanderId === ret.id
                  const isCommandingOther = troopSlots.some(
                    t => t.id !== assigningTroop.id && t.commanderId === ret.id
                  )
                  return (
                    <button
                      key={ret.id}
                      disabled={isCommandingOther}
                      onClick={() => {
                        if (!isCommandingOther) {
                          assignCommander(assigningTroop.id, ret.id)
                          setAssigningTroopId(null)
                        }
                      }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isCurrentCommander
                          ? 'border-forge-gold bg-forge-gold/10'
                          : isCommandingOther
                            ? 'border-forge-border opacity-40 cursor-not-allowed'
                            : 'border-forge-border hover:border-forge-gold/50 hover:bg-forge-card'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-forge-gold">{ret.name}</div>
                          <div className="text-xs text-forge-text-dim">
                            {CHARACTER_CLASS_NAMES[ret.characterClass]}
                            {isCommandingOther && (
                              <span className="text-orange-400 ml-2">
                                ({troopSlots.find(t => t.commanderId === ret.id) ? TROOP_TYPE_NAMES[troopSlots.find(t => t.commanderId === ret.id)!.troopType] : '?'} 지휘 중)
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 mt-1">
                            <span className="text-xs text-forge-text-dim">
                              전문성 <span style={{ color: STAT_GRADE_COLORS[ret.stats.proficiency] }}>{ret.stats.proficiency}</span>
                            </span>
                            <span className="text-xs text-forge-text-dim">
                              담력 <span style={{ color: STAT_GRADE_COLORS[ret.stats.courage] }}>{ret.stats.courage}</span>
                            </span>
                          </div>
                        </div>
                        {isCurrentCommander && (
                          <span className="text-xs text-forge-gold">현재</span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== 왕국 파견 요청 모달 ===== */}
      {showKingdomModal && (
        <KingdomDispatchModal onClose={() => setShowKingdomModal(false)} />
      )}

      {/* ===== 상세보기 팝업 ===== */}
      {detailRetainerId && (
        <CharacterDetailPopup
          type="retainer"
          characterId={detailRetainerId}
          onClose={() => setDetailRetainerId(null)}
        />
      )}
    </div>
  )
}
