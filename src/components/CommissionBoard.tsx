import { useGameStore } from '../store/gameStore'
import { GRADE_NAMES, GRADE_COLORS, Commission, CommissionGrade, EquipmentInstance } from '../types'

const GRADE_BADGE: Record<CommissionGrade, { label: string; color: string }> = {
  normal:  { label: '일반', color: '#a0a0a0' },
  urgent:  { label: '긴급', color: '#e67e22' },
  premium: { label: '명품', color: '#f1c40f' },
}

function CommissionCard({
  comm,
  currentEquipment,
  onAccept,
  onWork,
  onComplete,
}: {
  comm: Commission
  currentEquipment: EquipmentInstance | undefined
  onAccept: () => void
  onWork: () => void
  onComplete: () => void
}) {
  const badge = GRADE_BADGE[comm.grade]
  const gradeColor = GRADE_COLORS[comm.equipment.grade]

  // 의뢰 조건 달성 여부 (스토어 내 현재 장비 상태 기준)
  const eq = currentEquipment ?? comm.equipment
  const durPct = eq.maxDurability > 0
    ? (eq.currentDurability / eq.maxDurability) * 100
    : 0
  const isComplete = comm.accepted && !comm.processed && (
    comm.type === 'enhance'
      ? eq.currentLevel >= (comm.targetLevel ?? 0)
      : eq.currentDurability >= eq.maxDurability
  )

  return (
    <div
      className={`bg-forge-card rounded-xl border-2 p-4 flex flex-col gap-3 transition-all ${
        comm.processed ? 'opacity-40' :
        isComplete ? 'border-yellow-400 shadow-lg shadow-yellow-900/30' :
        ''
      }`}
      style={{ borderColor: isComplete ? '#facc15' : comm.accepted ? gradeColor : '#3a3028' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full border"
            style={{ color: badge.color, borderColor: badge.color }}>
            {badge.label}
          </span>
          <span className="text-forge-text-dim text-xs">
            {comm.type === 'enhance' ? '강화 의뢰' : '수리 의뢰'}
          </span>
          {comm.expiresThisTurn && (
            <span className="text-red-400 text-xs font-bold">이번 턴 한정</span>
          )}
        </div>
        {comm.processed && <span className="text-green-400 text-xs font-bold">완료</span>}
        {isComplete && (
          <span className="text-yellow-400 text-xs font-bold animate-pulse">✓ 조건 달성!</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="font-bold text-sm" style={{ color: gradeColor }}>
            {comm.equipment.name}
          </div>
          <div className="text-forge-text-dim text-xs">[{GRADE_NAMES[comm.equipment.grade]}]</div>
          {comm.type === 'enhance' && comm.targetLevel !== undefined && (
            <div className="text-xs mt-1">
              목표: <span className="text-forge-gold font-bold">+{comm.targetLevel}</span>
              <span className="text-forge-text-dim"> / 현재 </span>
              <span className={isComplete ? 'text-yellow-400 font-bold' : 'text-forge-text'}>
                +{eq.currentLevel}
              </span>
            </div>
          )}
          {comm.type === 'repair' && (
            <div className="text-xs mt-1">
              내구도:{' '}
              <span className={isComplete ? 'text-yellow-400 font-bold' : durPct < 40 ? 'text-red-400' : 'text-forge-text'}>
                {eq.currentDurability}/{eq.maxDurability}
              </span>
            </div>
          )}
        </div>
        <div className="w-2 h-16 bg-gray-800 rounded-full overflow-hidden">
          <div className="w-full rounded-full"
            style={{
              height: `${durPct}%`,
              background: durPct < 30 ? '#7c1a1a' : durPct < 60 ? '#c9a227' : '#4a7c59',
              marginTop: `${100 - durPct}%`,
            }}
          />
        </div>
      </div>

      <div className="flex gap-4 text-sm border-t border-forge-border pt-2">
        <span className="text-forge-text-dim">
          보상: <span className="text-forge-gold font-bold">{comm.rewardGold}G</span>
        </span>
        <span className="text-forge-text-dim">
          신성력: <span className="text-blue-400 font-bold">+{comm.rewardDivinePower}</span>
        </span>
      </div>

      {!comm.processed && (
        <div className="flex gap-2 mt-1">
          {!comm.accepted ? (
            <button onClick={onAccept}
              className="flex-1 py-2 rounded-lg text-sm font-bold bg-forge-gold text-forge-bg hover:bg-forge-gold-light transition-colors">
              수락
            </button>
          ) : isComplete ? (
            <>
              <button onClick={onComplete}
                className="flex-1 py-2 rounded-lg text-sm font-bold bg-yellow-600 hover:bg-yellow-500 text-black transition-all hover:scale-105">
                완료 보고 →
              </button>
              <button onClick={onWork}
                className="px-3 py-2 rounded-lg text-xs border border-forge-border text-forge-text-dim hover:border-forge-gold/50 transition-colors">
                작업하기
              </button>
            </>
          ) : (
            <button onClick={onWork}
              className="flex-1 py-2 rounded-lg text-sm font-bold border border-forge-gold text-forge-gold hover:bg-forge-gold/20 transition-colors">
              작업하기 →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function CommissionBoard() {
  const {
    commissions,
    equipment,
    setScreen,
    acceptCommission,
    selectEquipment,
    setCommissionEquipment,
    addEquipment,
    completeCommission,
  } = useGameStore()

  const handleWork = (comm: Commission) => {
    const alreadyInStore = equipment.some((eq) => eq.id === comm.equipment.id)
    if (!alreadyInStore) {
      addEquipment(comm.equipment)
    }
    setCommissionEquipment(comm.id)
    selectEquipment(comm.equipment.id)
    if (comm.type === 'enhance') {
      setScreen('enhancement')
    } else {
      setScreen('repair')
    }
  }

  const handleComplete = (comm: Commission) => {
    completeCommission(comm.id, true)
  }

  const activeComms = commissions.filter((c) => !c.processed)
  const doneComms = commissions.filter((c) => c.processed)

  return (
    <div className="flex-1 flex flex-col p-4 gap-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => setScreen('hub')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors">
          &larr; 영지로
        </button>
        <h2 className="text-forge-gold text-xl font-bold">대장간 의뢰</h2>
      </div>

      <div className="text-forge-text-dim text-xs bg-forge-card/50 rounded-lg p-3 border border-forge-border">
        의뢰를 수락 후 장비를 강화하거나 수리하세요. 거절해도 페널티 없음.
        의뢰 성공 시 신격 상승, 실패 시 신격 하락.
      </div>

      {commissions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-forge-text-dim">
          <div className="text-4xl">📋</div>
          <p>현재 의뢰가 없습니다</p>
          <p className="text-xs">턴을 넘기면 새로운 의뢰가 등장합니다</p>
        </div>
      ) : (
        <>
          {activeComms.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-forge-text text-sm font-bold border-b border-forge-border pb-1">
                진행 가능한 의뢰 ({activeComms.length})
              </h3>
              {activeComms.map((comm) => {
                // 스토어 내 현재 장비 상태 (없으면 원본 사용)
                const currentEq = equipment.find((eq) => eq.id === comm.equipment.id)
                return (
                  <CommissionCard
                    key={comm.id}
                    comm={comm}
                    currentEquipment={currentEq}
                    onAccept={() => acceptCommission(comm.id)}
                    onWork={() => handleWork(comm)}
                    onComplete={() => handleComplete(comm)}
                  />
                )
              })}
            </div>
          )}
          {doneComms.length > 0 && (
            <div className="flex flex-col gap-3 mt-2">
              <h3 className="text-forge-text-dim text-sm border-b border-forge-border pb-1">
                완료된 의뢰 ({doneComms.length})
              </h3>
              {doneComms.map((comm) => (
                <CommissionCard
                  key={comm.id}
                  comm={comm}
                  currentEquipment={undefined}
                  onAccept={() => {}}
                  onWork={() => {}}
                  onComplete={() => {}}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
