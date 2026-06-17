import { useGameStore } from '../store/gameStore'
import { GRADE_NAMES, GRADE_COLORS, EQUIPMENT_TYPE_NAMES, MAX_FAILURES_BY_GRADE } from '../types'
import { canEnhance } from '../systems/enhancementSystem'

export default function ForgeScreen() {
  const {
    equipment, selectedEquipmentId, selectEquipment, setScreen,
    commissions, commissionEquipmentId,
    completeCommission,
  } = useGameStore()

  const selected = equipment.find((eq) => eq.id === selectedEquipmentId)

  // 의뢰 장비 ID 목록 (스토어에 임시 추가된 것들)
  const commissionEqIds = new Set(
    commissions.filter((c) => c.accepted && !c.processed).map((c) => c.equipment.id)
  )

  const ownedEquipment = equipment.filter((eq) => eq.isOwned)
  const commissionEquipment = equipment.filter((eq) => !eq.isOwned && commissionEqIds.has(eq.id))

  // 현재 의뢰 정보 (선택된 장비가 의뢰 장비인 경우)
  const activeCommission = commissionEquipmentId
    ? commissions.find((c) => c.id === commissionEquipmentId && !c.processed)
    : null

  // 의뢰 완료 조건 체크
  const isCommissionComplete = activeCommission && selected && (
    activeCommission.type === 'enhance'
      ? selected.currentLevel >= (activeCommission.targetLevel ?? 0)
      : selected.currentDurability >= selected.maxDurability
  )

  const enhanceCheck = selected ? canEnhance(selected) : null

  const handleCompleteCommission = () => {
    if (!activeCommission || !selected) return
    completeCommission(activeCommission.id, true)
    setScreen('commission')
  }

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setScreen('hub')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors">
          &larr; 영지로
        </button>
        <h2 className="text-forge-gold text-xl font-bold">대장간</h2>
        <span className="text-forge-text-dim text-sm">— 장난의 신을 모시는 신전</span>
      </div>

      <div className="flex gap-4 flex-1">
        {/* 장비 목록 */}
        <div className="w-64 flex flex-col gap-2">
          <h3 className="text-forge-text font-bold text-sm border-b border-forge-border pb-1">
            보유 장비
          </h3>
          <div className="flex flex-col gap-2 overflow-y-auto">
            {ownedEquipment.map((eq) => (
              <button key={eq.id} onClick={() => selectEquipment(eq.id)}
                className={`text-left p-3 rounded-lg border transition-all ${selectedEquipmentId === eq.id ? 'border-forge-gold bg-forge-card' : 'border-forge-border bg-forge-card hover:border-forge-gold/50'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm" style={{ color: GRADE_COLORS[eq.grade] }}>
                    {eq.name}
                  </span>
                  <span className="text-forge-text-dim text-xs">+{eq.currentLevel}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs" style={{ color: GRADE_COLORS[eq.grade] }}>
                    [{GRADE_NAMES[eq.grade]}]
                  </span>
                  <span className="text-forge-text-dim text-xs">
                    내구도 {eq.currentDurability}/{eq.maxDurability}
                  </span>
                </div>
                {eq.enhancementLockTurns > 0 && (
                  <div className="text-red-400 text-xs mt-1">잠금 {eq.enhancementLockTurns}턴</div>
                )}
              </button>
            ))}
          </div>

          {commissionEquipment.length > 0 && (
            <>
              <h3 className="text-forge-text font-bold text-sm border-b border-forge-border pb-1 mt-2">
                의뢰 장비
              </h3>
              {commissionEquipment.map((eq) => {
                const comm = commissions.find((c) => c.equipment.id === eq.id)
                return (
                  <button key={eq.id} onClick={() => selectEquipment(eq.id)}
                    className={`text-left p-3 rounded-lg border transition-all ${selectedEquipmentId === eq.id ? 'border-forge-gold bg-forge-card' : 'border-forge-border bg-forge-card hover:border-forge-gold/50'}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm" style={{ color: GRADE_COLORS[eq.grade] }}>
                        {eq.name}
                      </span>
                      <span className="text-forge-text-dim text-xs">+{eq.currentLevel}</span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: GRADE_COLORS[eq.grade] }}>
                      [{GRADE_NAMES[eq.grade]}]
                    </div>
                    {comm && (
                      <div className="text-forge-gold text-xs mt-1">
                        {comm.type === 'enhance' ? `목표 +${comm.targetLevel}` : '수리 의뢰'}
                      </div>
                    )}
                  </button>
                )
              })}
            </>
          )}
        </div>

        {/* 작업 패널 */}
        <div className="flex-1 flex flex-col gap-3">
          {selected ? (
            <>
              {/* 선택 장비 정보 */}
              <div className="bg-forge-card border border-forge-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: GRADE_COLORS[selected.grade] }}>
                      {selected.name}
                    </h3>
                    <p className="text-forge-text-dim text-sm">
                      {GRADE_NAMES[selected.grade]} · {EQUIPMENT_TYPE_NAMES[selected.type]}
                      {!selected.isOwned && <span className="text-forge-gold ml-2">[의뢰]</span>}
                    </p>
                  </div>
                  <div className="ml-auto text-3xl font-bold" style={{ color: GRADE_COLORS[selected.grade] }}>
                    +{selected.currentLevel}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-forge-text-dim">
                    최대 강화: <span className="text-forge-text">+{selected.maxLevel === 9999 ? '무한' : selected.maxLevel}</span>
                  </div>
                  <div className="text-forge-text-dim">
                    내구도: <span className={selected.currentDurability < selected.maxDurability * 0.3 ? 'text-red-400' : 'text-forge-text'}>
                      {selected.currentDurability}/{selected.maxDurability}
                    </span>
                  </div>
                  {selected.failureCount > 0 && (
                    <div className="text-forge-text-dim col-span-2">
                      총 실패: <span className="text-orange-400 font-bold">{selected.failureCount}</span>
                      <span className="text-forge-text-dim text-xs ml-1">
                        / {MAX_FAILURES_BY_GRADE[selected.grade] ?? '?'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 의뢰 진행 상황 패널 */}
              {activeCommission && (
                <div className={`rounded-lg p-4 border-2 ${isCommissionComplete ? 'border-yellow-400 bg-yellow-900/20' : 'border-forge-gold/40 bg-forge-gold/5'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-forge-gold font-bold text-sm mb-1">
                        {activeCommission.type === 'enhance' ? '⬆ 강화 의뢰' : '🔧 수리 의뢰'}
                      </div>
                      {activeCommission.type === 'enhance' ? (
                        <div className="text-sm">
                          목표:{' '}
                          <span className="text-forge-gold font-bold">+{activeCommission.targetLevel}</span>
                          <span className="text-forge-text-dim ml-2">
                            (현재 +{selected.currentLevel})
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm">
                          수리 목표:{' '}
                          <span className="text-forge-gold font-bold">
                            {selected.currentDurability}/{selected.maxDurability}
                          </span>
                          <span className="text-forge-text-dim ml-2">
                            {selected.currentDurability >= selected.maxDurability ? '완료!' : '수리 필요'}
                          </span>
                        </div>
                      )}
                      <div className="text-xs text-forge-text-dim mt-2">
                        보상: <span className="text-yellow-400">{activeCommission.rewardGold}G</span>
                        {' · '}신성력 <span className="text-blue-400">+{activeCommission.rewardDivinePower}</span>
                      </div>
                    </div>
                    {isCommissionComplete && (
                      <button
                        onClick={handleCompleteCommission}
                        className="shrink-0 bg-yellow-600 hover:bg-yellow-500 text-black font-black px-4 py-2 rounded-lg transition-all hover:scale-105 text-sm"
                      >
                        완료 보고 →
                      </button>
                    )}
                  </div>
                  {isCommissionComplete && (
                    <div className="mt-2 text-yellow-400 text-xs font-bold text-center animate-pulse">
                      ✓ 의뢰 조건 달성! 완료 보고를 하면 보상을 받습니다.
                    </div>
                  )}
                </div>
              )}

              {/* 작업 버튼들 */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setScreen('enhancement')}
                  disabled={!enhanceCheck?.ok}
                  className="bg-forge-card border border-forge-border rounded-lg p-4 text-center hover:border-forge-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-forge-gold/10 group"
                >
                  <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">강화</div>
                  <div className="text-forge-text font-bold">강화</div>
                  <div className="text-forge-text-dim text-xs">
                    {enhanceCheck?.ok
                      ? `+${selected.currentLevel} → +${selected.currentLevel + 1}`
                      : enhanceCheck?.reason}
                  </div>
                </button>

                <button
                  onClick={() => setScreen('repair')}
                  disabled={selected.currentDurability >= selected.maxDurability || selected.maxDurability <= 0}
                  className="bg-forge-card border border-forge-border rounded-lg p-4 text-center hover:border-forge-gold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-forge-gold/10 group"
                >
                  <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">수리</div>
                  <div className="text-forge-text font-bold">수리</div>
                  <div className="text-forge-text-dim text-xs">
                    {selected.maxDurability <= 0 ? '파괴됨'
                      : selected.currentDurability >= selected.maxDurability ? '내구도 최대'
                      : `${selected.currentDurability}/${selected.maxDurability}`}
                  </div>
                </button>

                <button disabled className="bg-forge-card border border-forge-border rounded-lg p-4 text-center opacity-40 cursor-not-allowed">
                  <div className="text-2xl mb-1">제작</div>
                  <div className="text-forge-text font-bold">제작</div>
                  <div className="text-forge-text-dim text-xs">중반 해금</div>
                </button>

                <button disabled className="bg-forge-card border border-forge-border rounded-lg p-4 text-center opacity-40 cursor-not-allowed">
                  <div className="text-2xl mb-1">인챈트</div>
                  <div className="text-forge-text font-bold">인챈트</div>
                  <div className="text-forge-text-dim text-xs">후반 해금</div>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-forge-text-dim">
                <div className="text-4xl mb-3">망치</div>
                <p>왼쪽에서 장비를 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
