import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import {
  CharacterStats, StatGrade,
  STAT_GRADE_VALUE, STAT_GRADE_COLORS, STAT_NAMES,
  CHARACTER_CLASS_NAMES, CLASS_WEAPON_ALLOW, CLASS_ARMOR_ALLOW,
  ADVENTURER_GRADE_NAMES, TROOP_TYPE_NAMES,
  EQUIPMENT_TYPE_NAMES, GRADE_NAMES, GRADE_COLORS,
  EquipmentType, CharacterClass,
} from '../types'
import { CLASS_NAMES } from '../types'

// ===== 스탯 행 =====
function StatRow({ label, grade }: { label: string; grade: StatGrade }) {
  const val = STAT_GRADE_VALUE[grade]
  const color = STAT_GRADE_COLORS[grade]
  return (
    <div className="flex items-center gap-2">
      <span className="text-forge-text-dim text-xs w-14">{label}</span>
      <div className="flex gap-0.5 flex-1">
        {(['E','D','C','B','A','S'] as StatGrade[]).map((_, i) => (
          <div key={i} className="flex-1 h-2 rounded-sm"
            style={{ background: i < val ? color : '#374151', opacity: i < val ? 1 : 0.3 }} />
        ))}
      </div>
      <span className="text-xs font-bold w-4 text-center" style={{ color }}>{grade}</span>
    </div>
  )
}

// ===== 장비 슬롯 =====
function EquipmentSlot({
  label,
  currentEqId,
  allowedTypes,
  retainerId,
  slotType,
  allRetainerEquippedIds,
}: {
  label: string
  currentEqId: string | null
  allowedTypes: EquipmentType[]
  retainerId: string
  slotType: 'weapon' | 'armor'
  allRetainerEquippedIds: string[]
}) {
  const { equipment, equipWeapon, equipArmor } = useGameStore()
  const [open, setOpen] = useState(false)

  const currentEq = currentEqId ? equipment.find(e => e.id === currentEqId) : null

  const available = equipment.filter(eq => {
    if (!eq.isOwned) return false
    if (allRetainerEquippedIds.includes(eq.id) && eq.id !== currentEqId) return false
    return allowedTypes.includes(eq.type)
  })

  const handleSelect = (id: string) => {
    if (slotType === 'weapon') equipWeapon(retainerId, currentEqId === id ? null : id)
    else equipArmor(retainerId, currentEqId === id ? null : id)
    setOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-forge-text-dim text-xs">{label}</span>
        {currentEq && (
          <button
            onClick={() => slotType === 'weapon' ? equipWeapon(retainerId, null) : equipArmor(retainerId, null)}
            className="text-xs text-red-400 hover:text-red-300 transition-colors">
            해제
          </button>
        )}
      </div>

      {/* 현재 장착 */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-full text-left p-2.5 rounded-lg border transition-all text-sm ${
          currentEq
            ? 'border-forge-gold bg-forge-gold/10'
            : 'border-dashed border-forge-border bg-forge-card hover:border-forge-gold/50'
        }`}
      >
        {currentEq ? (
          <div>
            <span className="text-forge-gold font-bold">{currentEq.name}</span>
            {currentEq.currentLevel > 0 && <span className="text-blue-400 ml-1">+{currentEq.currentLevel}</span>}
            <span className="text-forge-text-dim text-xs ml-2">
              <span style={{ color: GRADE_COLORS[currentEq.grade] }}>{GRADE_NAMES[currentEq.grade]}</span>
              {' '}{EQUIPMENT_TYPE_NAMES[currentEq.type]}
            </span>
          </div>
        ) : (
          <span className="text-forge-text-dim">없음 — 클릭해서 장착</span>
        )}
      </button>

      {/* 선택 드롭다운 */}
      {open && (
        <div className="mt-1 border border-forge-border rounded-lg overflow-hidden bg-forge-bg shadow-lg">
          {available.length === 0 ? (
            <div className="p-2 text-xs text-forge-text-dim text-center">
              착용 가능한 장비가 없습니다
            </div>
          ) : (
            available.map(eq => (
              <button
                key={eq.id}
                onClick={() => handleSelect(eq.id)}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-forge-card transition-colors flex items-center justify-between ${
                  eq.id === currentEqId ? 'bg-forge-gold/10 text-forge-gold' : 'text-forge-text'
                }`}
              >
                <span>
                  {eq.name}
                  {eq.currentLevel > 0 && <span className="text-blue-400 ml-1">+{eq.currentLevel}</span>}
                </span>
                <span className="text-forge-text-dim ml-2">
                  <span style={{ color: GRADE_COLORS[eq.grade] }}>{GRADE_NAMES[eq.grade]}</span>
                  {' '}{EQUIPMENT_TYPE_NAMES[eq.type]}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ===== 메인 팝업 =====
interface Props {
  type: 'retainer' | 'adventurer'
  characterId: string
  onClose: () => void
}

export default function CharacterDetailPopup({ type, characterId, onClose }: Props) {
  const { retainers, adventurers, troopSlots } = useGameStore()
  const [tab, setTab] = useState<'stats' | 'equip'>('stats')

  const retainer = type === 'retainer' ? retainers.find(r => r.id === characterId) : undefined
  const adventurer = type === 'adventurer' ? adventurers.find(a => a.id === characterId) : undefined

  if (!retainer && !adventurer) return null

  const name = retainer?.name ?? adventurer!.name
  const stats: CharacterStats | null = type === 'retainer'
    ? (retainer?.stats ?? null)
    : (adventurer?.stats ?? null)
  const characterClass: CharacterClass | null = type === 'retainer'
    ? (retainer?.characterClass ?? null)
    : (adventurer?.characterClass ?? null)

  // 이 가신이 배치된 병력
  const assignedTroop = type === 'retainer'
    ? troopSlots.find(t => t.commanderId === characterId)
    : undefined

  // 다른 가신들이 착용 중인 장비 ID 목록
  const otherRetainerEqIds = retainers
    .filter(r => r.id !== characterId)
    .flatMap(r => [r.equippedWeaponId, r.equippedArmorId].filter(Boolean) as string[])

  const weaponTypes: EquipmentType[] = characterClass ? CLASS_WEAPON_ALLOW[characterClass] : []
  const armorTypes: EquipmentType[] = characterClass ? CLASS_ARMOR_ALLOW[characterClass] : []

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
            <h3 className="text-forge-gold font-bold">{name}</h3>
            <p className="text-forge-text-dim text-xs">
              {type === 'retainer'
                ? `${characterClass ? CHARACTER_CLASS_NAMES[characterClass] : '?'} · ${assignedTroop ? TROOP_TYPE_NAMES[assignedTroop.troopType] + ' 지휘' : '미배치'}`
                : `${CLASS_NAMES[adventurer!.class]} · ${ADVENTURER_GRADE_NAMES[adventurer!.grade]}`
              }
            </p>
          </div>
          <button onClick={onClose} className="text-forge-text-dim hover:text-forge-gold text-xl leading-none">✕</button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-forge-border">
          {[{ id: 'stats' as const, label: '스탯' }, { id: 'equip' as const, label: '장비' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-sm font-bold transition-colors ${
                tab === t.id ? 'text-forge-gold border-b-2 border-forge-gold' : 'text-forge-text-dim hover:text-forge-text'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">

          {/* ===== 스탯 탭 ===== */}
          {tab === 'stats' && stats && (
            <div className="space-y-4">
              <div>
                <h4 className="text-forge-text-dim text-xs mb-2 tracking-wider">능력치</h4>
                <div className="space-y-2.5">
                  <StatRow label={STAT_NAMES.proficiency} grade={stats.proficiency} />
                  <StatRow label={STAT_NAMES.judgment}    grade={stats.judgment} />
                  <StatRow label={STAT_NAMES.vitality}    grade={stats.vitality} />
                  <StatRow label={STAT_NAMES.courage}     grade={stats.courage} />
                </div>
              </div>

              {characterClass && (
                <div>
                  <h4 className="text-forge-text-dim text-xs mb-2 tracking-wider">착용 가능 장비</h4>
                  <div className="flex flex-wrap gap-1">
                    {[...weaponTypes, ...armorTypes].map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded bg-forge-card border border-forge-border text-forge-text-dim">
                        {EQUIPMENT_TYPE_NAMES[t]}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {type === 'retainer' && retainer && (
                <div>
                  <h4 className="text-forge-text-dim text-xs mb-1 tracking-wider">충성도</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-forge-border rounded-full overflow-hidden">
                      <div className="h-full rounded-full"
                        style={{
                          width: `${retainer.loyalty}%`,
                          background: retainer.loyalty >= 60 ? '#4ade80' : retainer.loyalty >= 30 ? '#facc15' : '#f87171',
                        }} />
                    </div>
                    <span className="text-xs font-bold text-forge-text">{retainer.loyalty}%</span>
                  </div>
                  <p className="text-forge-text-dim text-xs mt-1">봉급: {retainer.salary}G / 월</p>
                  {retainer.quirk && (
                    <p className="text-forge-text-dim text-xs italic mt-2">"{retainer.quirk}"</p>
                  )}
                </div>
              )}

              {type === 'adventurer' && adventurer?.status === 'injured' && (
                <div className="bg-red-900/30 border border-red-700 rounded p-2 text-xs text-red-400">
                  ⚠️ 부상 중 — {adventurer.injuredUntilTurn}턴까지 회복 필요
                </div>
              )}
            </div>
          )}

          {/* ===== 장비 탭 ===== */}
          {tab === 'equip' && (
            <div className="space-y-4">
              {type === 'retainer' && retainer && characterClass ? (
                <>
                  <EquipmentSlot
                    label="⚔️ 무기 슬롯"
                    currentEqId={retainer.equippedWeaponId}
                    allowedTypes={weaponTypes}
                    retainerId={characterId}
                    slotType="weapon"
                    allRetainerEquippedIds={otherRetainerEqIds}
                  />
                  <EquipmentSlot
                    label="🛡️ 방어구 슬롯"
                    currentEqId={retainer.equippedArmorId}
                    allowedTypes={armorTypes}
                    retainerId={characterId}
                    slotType="armor"
                    allRetainerEquippedIds={otherRetainerEqIds}
                  />
                </>
              ) : type === 'adventurer' ? (
                <div className="space-y-3">
                  {/* 대여 장비 현황 */}
                  <div>
                    <h4 className="text-forge-text-dim text-xs mb-2">원정 대여 장비</h4>
                    {adventurer?.lentEquipmentId ? (
                      <div className="bg-forge-card border border-forge-gold rounded-lg p-2 text-xs text-forge-gold">
                        대여 중 (원정 귀환 후 반납됨)
                      </div>
                    ) : (
                      <div className="bg-forge-card border border-dashed border-forge-border rounded-lg p-3 text-center text-forge-text-dim text-xs">
                        대여 중인 장비 없음
                      </div>
                    )}
                  </div>
                  <div className="bg-forge-card border border-forge-border rounded-lg p-3 text-xs text-forge-text-dim text-center">
                    용병 장비는 파티 구성 화면에서<br />
                    <span className="text-forge-gold">원정 대여</span>로 지급됩니다.<br />
                    실패 시 장비를 잃을 수 있습니다.
                  </div>
                </div>
              ) : (
                <p className="text-forge-text-dim text-xs text-center py-4">장비 정보 없음</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
