import { useState } from 'react'
import CharacterDetailPopup from './CharacterDetailPopup'
import { useGameStore } from '../store/gameStore'
import {
  ROLE_NAMES, CLASS_NAMES, ADVENTURER_GRADE_NAMES, EXPEDITION_OUTCOME_NAMES,
  AdventurerRole, Adventurer, Region, ExpeditionResult, EquipmentInstance,
} from '../types'
import { calculateSuccessRate, getRoleCategory } from '../systems/guildSystem'

// ===== 역할 색상 =====
const ROLE_COLORS: Record<AdventurerRole, string> = {
  tank:       '#6b7280',
  melee_dps:  '#ef4444',
  ranged_dps:  '#f97316',
  magic_dps:  '#8b5cf6',
  healer:     '#22c55e',
  buffer:     '#3b82f6',
  debuffer:   '#ec4899',
}

const OUTCOME_COLORS = {
  great_success: { border: '#facc15', bg: 'bg-yellow-900/30', text: 'text-yellow-400' },
  success:       { border: '#22c55e', bg: 'bg-green-900/30',  text: 'text-green-400' },
  partial:       { border: '#f97316', bg: 'bg-orange-900/30', text: 'text-orange-400' },
  failure:       { border: '#ef4444', bg: 'bg-red-900/30',    text: 'text-red-400' },
}

// ===== 원정 결과 팝업 =====
function ExpeditionResultPopup({
  result, onClose,
}: { result: ExpeditionResult; onClose: () => void }) {
  const col = OUTCOME_COLORS[result.outcome]
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className={`${col.bg} border-2 rounded-2xl p-6 max-w-md w-full mx-4 flex flex-col gap-4`}
        style={{ borderColor: col.border }}>
        <div className="text-center">
          <div className="text-4xl mb-2">
            {result.outcome === 'great_success' ? '★' :
             result.outcome === 'success' ? '○' :
             result.outcome === 'partial' ? '△' : '✕'}
          </div>
          <div className={`text-2xl font-black ${col.text}`}>
            {EXPEDITION_OUTCOME_NAMES[result.outcome]}
          </div>
        </div>

        <div className="bg-black/30 rounded-lg p-3 text-sm text-forge-text-dim italic">
          "{result.report}"
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-forge-text-dim text-xs mb-1">해방율</div>
            <div className={`font-bold text-lg ${col.text}`}>
              +{result.liberationGain}%
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-forge-text-dim text-xs mb-1">골드</div>
            <div className="font-bold text-lg text-forge-gold">+{result.goldEarned}G</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-forge-text-dim text-xs mb-1">신성력</div>
            <div className="font-bold text-lg text-blue-400">+{result.divinePowerEarned}</div>
          </div>
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-forge-text-dim text-xs mb-1">획득 장비</div>
            <div className={`font-bold text-sm ${result.equipmentEarned ? 'text-forge-gold' : 'text-forge-text-dim'}`}>
              {result.equipmentEarned ? result.equipmentEarned.name : '없음'}
            </div>
          </div>
        </div>

        {result.injuredAdventurerIds.length > 0 && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-2 text-xs text-red-400">
            부상자 발생 — 회복까지 수 턴 소요
          </div>
        )}
        {result.lostEquipmentId && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-2 text-xs text-red-400">
            대여 장비를 잃었습니다
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold bg-forge-gold text-forge-bg hover:bg-forge-gold-light transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  )
}

// ===== 지역 카드 =====
function RegionCard({
  region, selected, onClick, currentTurn,
}: { region: Region; selected: boolean; onClick: () => void; currentTurn: number }) {
  const hasActiveExp = region.currentExpedition !== null
  const canReceive = hasActiveExp && region.currentExpedition!.returnsOnTurn <= currentTurn

  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-lg border transition-all ${
        selected ? 'border-forge-gold bg-forge-card' : 'border-forge-border bg-forge-card hover:border-forge-gold/50'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-bold text-sm text-forge-text">{region.name}</span>
        {region.status === 'liberated' && (
          <span className="text-xs text-green-400 font-bold">해방</span>
        )}
        {canReceive && (
          <span className="text-xs text-yellow-400 font-bold animate-pulse">귀환!</span>
        )}
        {hasActiveExp && !canReceive && (
          <span className="text-xs text-blue-400">
            {region.currentExpedition!.returnsOnTurn - currentTurn}턴 후
          </span>
        )}
      </div>
      <div className="text-forge-text-dim text-xs mb-2">난이도 {'★'.repeat(Math.ceil(region.difficulty / 2))}</div>
      <div className="w-full bg-gray-800 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{
            width: `${region.liberationProgress}%`,
            background: region.status === 'liberated' ? '#22c55e' : '#c9a227',
          }}
        />
      </div>
      <div className="text-xs text-forge-text-dim mt-1">{region.liberationProgress}% 해방</div>
    </button>
  )
}

// ===== 파티 구성 패널 =====
function PartyBuilder({
  region, adventurers, equipment, onDispatch,
}: {
  region: Region
  adventurers: Adventurer[]
  equipment: EquipmentInstance[]
  onDispatch: (partyIds: string[], lentEquipmentId: string | null) => void
}) {
  const [selectedParty, setSelectedParty] = useState<string[]>([])
  const [lentEqId, setLentEqId] = useState<string | null>(null)

  const available = adventurers.filter(a => a.status === 'available')
  const partyMembers = adventurers.filter(a => selectedParty.includes(a.id))
  const lentEquipment = equipment.find(eq => eq.id === lentEqId) ?? null
  const ownedEquipment = equipment.filter(eq => eq.isOwned)

  const toggleMember = (id: string) => {
    if (selectedParty.includes(id)) {
      setSelectedParty(prev => prev.filter(x => x !== id))
    } else if (selectedParty.length < 5) {
      setSelectedParty(prev => [...prev, id])
    }
  }

  const successRate = calculateSuccessRate(region, partyMembers, lentEquipment)

  const roleCategories = new Set(partyMembers.map(a => getRoleCategory(a.role)))
  const hasBalance = roleCategories.size >= 3

  return (
    <div className="flex flex-col gap-3">
      {/* 성공률 */}
      <div className="bg-forge-card border border-forge-border rounded-lg p-4">
        <div className="flex items-end justify-between mb-2">
          <span className="text-forge-text-dim text-sm">예상 성공률</span>
          <span className={`text-3xl font-black ${
            successRate >= 70 ? 'text-green-400' : successRate >= 40 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {partyMembers.length > 0 ? `${Math.round(successRate)}%` : '—'}
          </span>
        </div>
        {partyMembers.length > 0 && (
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${successRate}%`,
                background: successRate >= 70 ? '#22c55e' : successRate >= 40 ? '#c9a227' : '#7c1a1a',
              }}
            />
          </div>
        )}
        <div className="flex gap-2 mt-2 flex-wrap">
          {['tank','dps','support'].map(cat => (
            <span key={cat} className={`text-xs px-2 py-0.5 rounded-full border ${
              roleCategories.has(cat as 'tank'|'dps'|'support')
                ? 'border-green-600 text-green-400 bg-green-900/20'
                : 'border-forge-border text-forge-text-dim'
            }`}>
              {cat === 'tank' ? '탱커' : cat === 'dps' ? '딜러' : '서포터'}
            </span>
          ))}
          {hasBalance && (
            <span className="text-xs text-forge-gold">+균형 보너스</span>
          )}
        </div>
      </div>

      {/* 현재 파티 슬롯 */}
      <div>
        <div className="text-forge-text-dim text-xs mb-1">
          파티 ({selectedParty.length}/5)
        </div>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: 5 }).map((_, i) => {
            const member = partyMembers[i]
            return (
              <div key={i}
                className={`flex-1 min-w-16 h-12 rounded-lg border text-xs flex flex-col items-center justify-center text-center ${
                  member
                    ? 'bg-forge-card border-forge-gold text-forge-text cursor-pointer hover:opacity-75'
                    : 'border-dashed border-forge-border text-forge-text-dim'
                }`}
                onClick={() => member && toggleMember(member.id)}
              >
                {member ? (
                  <>
                    <div style={{ color: ROLE_COLORS[member.role] }} className="text-xs font-bold leading-none">
                      {CLASS_NAMES[member.class].slice(0,3)}
                    </div>
                    <div className="text-forge-text-dim text-xs leading-none">{member.name.slice(0,4)}</div>
                  </>
                ) : (
                  <span className="text-forge-border">비어있음</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 대여 장비 */}
      <div>
        <div className="text-forge-text-dim text-xs mb-1">
          대여 장비 <span className="text-red-400">(실패 시 소실)</span>
        </div>
        <select
          value={lentEqId ?? ''}
          onChange={e => setLentEqId(e.target.value || null)}
          className="w-full bg-forge-card border border-forge-border rounded-lg px-3 py-2 text-sm text-forge-text"
        >
          <option value="">없음</option>
          {ownedEquipment.map(eq => (
            <option key={eq.id} value={eq.id}>
              {eq.name} +{eq.currentLevel} ({eq.currentDurability}/{eq.maxDurability}내구)
            </option>
          ))}
        </select>
      </div>

      {/* 가용 용병 목록 */}
      <div>
        <div className="text-forge-text-dim text-xs mb-1">용병 선택 (클릭으로 추가/제거)</div>
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
          {available.length === 0 ? (
            <div className="text-forge-text-dim text-xs text-center py-3">대기 중인 용병이 없습니다</div>
          ) : available.map(adv => (
            <button
              key={adv.id}
              onClick={() => toggleMember(adv.id)}
              className={`text-left p-2 rounded-lg border text-xs transition-all ${
                selectedParty.includes(adv.id)
                  ? 'border-forge-gold bg-forge-gold/10'
                  : 'border-forge-border bg-forge-card hover:border-forge-gold/50'
              } ${selectedParty.length >= 5 && !selectedParty.includes(adv.id) ? 'opacity-40 cursor-not-allowed' : ''}`}
              disabled={selectedParty.length >= 5 && !selectedParty.includes(adv.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: ROLE_COLORS[adv.role] }}>
                  {adv.name}
                </span>
                <span className="text-forge-text-dim">
                  {ADVENTURER_GRADE_NAMES[adv.grade]} · 전{adv.stats.proficiency}/판{adv.stats.judgment}
                </span>
              </div>
              <div className="text-forge-text-dim">{CLASS_NAMES[adv.class]} · {ROLE_NAMES[adv.role]}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          if (selectedParty.length > 0) {
            onDispatch(selectedParty, lentEqId)
            setSelectedParty([])
            setLentEqId(null)
          }
        }}
        disabled={selectedParty.length === 0}
        className="w-full py-3 rounded-xl font-black text-lg bg-forge-gold text-forge-bg
          hover:bg-forge-gold-light transition-all hover:scale-105
          disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        파견 →
      </button>
    </div>
  )
}

// ===== 메인 화면 =====
type GuildTab = 'regions' | 'adventurers'

export default function GuildScreen() {
  const {
    setScreen, turn,
    adventurers, regions, equipment,
    pendingExpeditionResult,
    dispatchExpedition, receiveExpeditionResult, clearExpeditionResult,
  } = useGameStore()

  const [activeTab, setActiveTab] = useState<GuildTab>('regions')
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(regions[0]?.id ?? null)
  const [detailAdventurerId, setDetailAdventurerId] = useState<string | null>(null)

  const selectedRegion = regions.find(r => r.id === selectedRegionId)
  const hasActiveExp = selectedRegion?.currentExpedition !== null
  const canReceive = hasActiveExp &&
    selectedRegion!.currentExpedition!.returnsOnTurn <= turn

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
      {detailAdventurerId && (
        <CharacterDetailPopup
          type="adventurer"
          characterId={detailAdventurerId}
          onClose={() => setDetailAdventurerId(null)}
        />
      )}
      <div className="flex items-center gap-3">
        <button onClick={() => setScreen('hub')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors">
          &larr; 영지로
        </button>
        <h2 className="text-forge-gold text-xl font-bold">모험가 길드</h2>
        <span className="text-forge-text-dim text-sm">— 지역을 해방하라</span>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b border-forge-border">
        {(['regions', 'adventurers'] as GuildTab[]).map(tab => (
          <button key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-bold transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-forge-gold text-forge-gold'
                : 'border-transparent text-forge-text-dim hover:text-forge-text'
            }`}
          >
            {tab === 'regions' ? '지역 탐험' : `용병 목록 (${adventurers.filter(a => a.status === 'available').length}명 대기)`}
          </button>
        ))}
      </div>

      {activeTab === 'regions' && (
        <div className="flex gap-4 flex-1 overflow-hidden">
          {/* 좌: 지역 목록 */}
          <div className="w-52 flex flex-col gap-2 overflow-y-auto">
            {regions.map(r => (
              <RegionCard
                key={r.id}
                region={r}
                selected={selectedRegionId === r.id}
                onClick={() => setSelectedRegionId(r.id)}
                currentTurn={turn}
              />
            ))}
          </div>

          {/* 우: 상세 패널 */}
          <div className="flex-1 overflow-y-auto">
            {selectedRegion ? (
              <div className="flex flex-col gap-3">
                {/* 지역 정보 */}
                <div className="bg-forge-card border border-forge-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-forge-gold font-bold text-lg">{selectedRegion.name}</h3>
                      <p className="text-forge-text-dim text-xs mt-1">{selectedRegion.description}</p>
                    </div>
                    {selectedRegion.status === 'liberated' && (
                      <span className="shrink-0 text-green-400 text-sm font-bold border border-green-600 rounded-full px-2 py-0.5">
                        완전 해방
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs text-forge-text-dim mt-3">
                    <span>난이도: {'★'.repeat(Math.ceil(selectedRegion.difficulty / 2))}</span>
                    <span>소요: {selectedRegion.minTurns}~{selectedRegion.maxTurns}턴</span>
                    <span>장비 드랍: {selectedRegion.rewardEquipmentChance}%</span>
                  </div>
                  {/* 해방율 바 */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-forge-text-dim">해방율</span>
                      <span className={selectedRegion.liberationProgress >= 100 ? 'text-green-400 font-bold' : 'text-forge-gold'}>
                        {selectedRegion.liberationProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                      <div className="h-3 rounded-full transition-all duration-700"
                        style={{
                          width: `${selectedRegion.liberationProgress}%`,
                          background: selectedRegion.status === 'liberated' ? '#22c55e' : '#c9a227',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* 파견 중 상태 */}
                {hasActiveExp && !canReceive && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                    <div className="text-blue-400 font-bold mb-2">파견 중...</div>
                    <div className="text-forge-text-dim text-sm">
                      귀환 예정: <span className="text-blue-400 font-bold">
                        {selectedRegion!.currentExpedition!.returnsOnTurn}턴
                      </span>
                      <span className="text-forge-text-dim ml-2">
                        (현재 {turn}턴, {selectedRegion!.currentExpedition!.returnsOnTurn - turn}턴 남음)
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {selectedRegion!.currentExpedition!.partyIds.map(id => {
                        const adv = adventurers.find(a => a.id === id)
                        return adv ? (
                          <span key={id} className="text-xs px-2 py-0.5 rounded-full border border-blue-700 text-blue-300">
                            {adv.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>
                )}

                {/* 결과 수령 가능 */}
                {canReceive && (
                  <div className="bg-yellow-900/20 border-2 border-yellow-500 rounded-lg p-4">
                    <div className="text-yellow-400 font-bold mb-2 animate-pulse">파티가 귀환했습니다!</div>
                    <button
                      onClick={() => receiveExpeditionResult(selectedRegion!.id)}
                      className="w-full py-3 rounded-xl font-black bg-yellow-600 hover:bg-yellow-500 text-black transition-all hover:scale-105"
                    >
                      결과 수령
                    </button>
                  </div>
                )}

                {/* 파티 구성 (파견 없을 때) */}
                {!hasActiveExp && (
                  <PartyBuilder
                    region={selectedRegion}
                    adventurers={adventurers}
                    equipment={equipment}
                    onDispatch={(partyIds, lentEqId) =>
                      dispatchExpedition(selectedRegion.id, partyIds, lentEqId)
                    }
                  />
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-forge-text-dim">
                <div className="text-center">
                  <div className="text-4xl mb-2">지도</div>
                  <p>왼쪽에서 지역을 선택하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'adventurers' && (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            {adventurers.map(adv => (
              <div key={adv.id}
                className={`bg-forge-card border rounded-xl p-4 ${
                  adv.status === 'injured' ? 'border-red-800 opacity-60' :
                  adv.status === 'dispatched' ? 'border-blue-700' :
                  'border-forge-border'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-forge-text">{adv.name}</div>
                    <div className="text-xs" style={{ color: ROLE_COLORS[adv.role] }}>
                      {CLASS_NAMES[adv.class]} · {ROLE_NAMES[adv.role]}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                    <div className={`text-xs font-bold ${
                      adv.status === 'available' ? 'text-green-400' :
                      adv.status === 'dispatched' ? 'text-blue-400' :
                      'text-red-400'
                    }`}>
                      {adv.status === 'available' ? '대기' :
                       adv.status === 'dispatched' ? '파견 중' : '부상'}
                    </div>
                    <div className="text-forge-text-dim text-xs">{ADVENTURER_GRADE_NAMES[adv.grade]}</div>
                    <button
                      onClick={() => setDetailAdventurerId(adv.id)}
                      className="text-xs border border-forge-border text-forge-text-dim hover:border-forge-gold hover:text-forge-gold rounded px-1.5 py-0.5 transition-colors"
                    >
                      상세
                    </button>
                  </div>
                </div>
                <div className="text-forge-text-dim text-xs leading-relaxed italic">
                  "{adv.quirk}"
                </div>
                <div className="mt-2 flex justify-between text-xs text-forge-text-dim">
                  <span>전{adv.stats.proficiency} 판{adv.stats.judgment} 체{adv.stats.vitality} 담{adv.stats.courage}</span>
                  {adv.status === 'injured' && adv.injuredUntilTurn && (
                    <span className="text-red-400">{adv.injuredUntilTurn}턴까지 부상</span>
                  )}
                  {adv.status === 'dispatched' && adv.dispatchedRegionId && (
                    <span className="text-blue-400">
                      {regions.find(r => r.id === adv.dispatchedRegionId)?.name ?? ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {adventurers.length < 8 && (
              <div className="bg-forge-card/30 border border-dashed border-forge-border rounded-xl p-4 flex items-center justify-center text-forge-text-dim text-sm">
                <div className="text-center">
                  <div className="text-2xl mb-1">?</div>
                  <div className="text-xs">턴이 지나면<br/>새 용병이 찾아옵니다</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 원정 결과 팝업 */}
      {pendingExpeditionResult && (
        <ExpeditionResultPopup
          result={pendingExpeditionResult}
          onClose={clearExpeditionResult}
        />
      )}
    </div>
  )
}
