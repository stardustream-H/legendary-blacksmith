import { useGameStore } from '../store/gameStore'
import { GRADE_NAMES, GRADE_COLORS, EQUIPMENT_TYPE_NAMES } from '../types'

export default function ForgeScreen() {
  const { equipment, selectedEquipmentId, selectEquipment, setScreen } = useGameStore()

  const selected = equipment.find((eq) => eq.id === selectedEquipmentId)

  return (
    <div className="flex-1 flex flex-col p-4 gap-4">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setScreen('hub')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors"
        >
          ← 영지로
        </button>
        <h2 className="text-forge-gold text-xl font-bold">🔥 대장간</h2>
        <span className="text-forge-text-dim text-sm">— 장난의 신을 모시는 신전</span>
      </div>

      <div className="flex gap-4 flex-1">
        {/* 장비 목록 */}
        <div className="w-64 flex flex-col gap-2">
          <h3 className="text-forge-text font-bold text-sm border-b border-forge-border pb-1">
            보유 장비
          </h3>
          <div className="flex flex-col gap-2 overflow-y-auto">
            {equipment.filter((eq) => eq.isOwned).map((eq) => (
              <button
                key={eq.id}
                onClick={() => selectEquipment(eq.id)}
                className={`
                  text-left p-3 rounded-lg border transition-all
                  ${
                    selectedEquipmentId === eq.id
                      ? 'border-forge-gold bg-forge-card'
                      : 'border-forge-border bg-forge-card hover:border-forge-gold/50'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="font-bold text-sm"
                    style={{ color: GRADE_COLORS[eq.grade] }}
                  >
                    {eq.name}
                  </span>
                  <span className="text-forge-text-dim text-xs">
                    +{eq.currentLevel}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span
                    className="text-xs"
                    style={{ color: GRADE_COLORS[eq.grade] }}
                  >
                    [{GRADE_NAMES[eq.grade]}]
                  </span>
                  <span className="text-forge-text-dim text-xs">
                    내구도 {eq.currentDurability}/{eq.maxDurability}
                  </span>
                </div>
                {eq.enhancementLockTurns > 0 && (
                  <div className="text-red-400 text-xs mt-1">
                    🔒 {eq.enhancementLockTurns}턴 강화 불가
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 작업 패널 */}
        <div className="flex-1 flex flex-col gap-3">
          {selected ? (
            <>
              {/* 선택된 장비 정보 */}
              <div className="bg-forge-card border border-forge-border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <h3
                      className="text-lg font-bold"
                      style={{ color: GRADE_COLORS[selected.grade] }}
                    >
                      {selected.name}
                    </h3>
                    <p className="text-forge-text-dim text-sm">
                      {GRADE_NAMES[selected.grade]} · {EQUIPMENT_TYPE_NAMES[selected.type]}
                    </p>
                  </div>
                  <div
                    className="ml-auto text-3xl font-bold"
                    style={{ color: GRADE_COLORS[selected.grade] }}
                  >
                    +{selected.currentLevel}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-forge-text-dim">
                    최대 강화:{' '}
                    <span className="text-forge-text">+{selected.maxLevel}</span>
                  </div>
                  <div className="text-forge-text-dim">
                    내구도:{' '}
                    <span
                      className={
                        selected.currentDurability < selected.maxDurability * 0.3
                          ? 'text-red-400'
                          : 'text-forge-text'
                      }
                    >
                      {selected.currentDurability}/{selected.maxDurability}
                    </span>
                  </div>
                </div>
              </div>

              {/* 작업 버튼들 */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setScreen('enhancement')}
                  disabled={
                    selected.currentLevel >= selected.maxLevel ||
                    selected.enhancementLockTurns > 0
                  }
                  className="
                    bg-forge-card border border-forge-border rounded-lg p-4
                    text-center hover:border-forge-gold transition-all
                    disabled:opacity-40 disabled:cursor-not-allowed
                    hover:bg-forge-gold/10 group
                  "
                >
                  <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">⚡</div>
                  <div className="text-forge-text font-bold">강화</div>
                  <div className="text-forge-text-dim text-xs">
                    {selected.currentLevel >= selected.maxLevel
                      ? '최대 강화 달성'
                      : selected.enhancementLockTurns > 0
                      ? `${selected.enhancementLockTurns}턴 후 가능`
                      : `+${selected.currentLevel} → +${selected.currentLevel + 1} 시도`}
                  </div>
                </button>

                <button
                  disabled
                  className="
                    bg-forge-card border border-forge-border rounded-lg p-4
                    text-center opacity-40 cursor-not-allowed
                  "
                >
                  <div className="text-2xl mb-1">🔧</div>
                  <div className="text-forge-text font-bold">수리</div>
                  <div className="text-forge-text-dim text-xs">Phase 2에서 해금</div>
                </button>

                <button
                  disabled
                  className="
                    bg-forge-card border border-forge-border rounded-lg p-4
                    text-center opacity-40 cursor-not-allowed
                  "
                >
                  <div className="text-2xl mb-1">⚒️</div>
                  <div className="text-forge-text font-bold">제작</div>
                  <div className="text-forge-text-dim text-xs">중반 해금</div>
                </button>

                <button
                  disabled
                  className="
                    bg-forge-card border border-forge-border rounded-lg p-4
                    text-center opacity-40 cursor-not-allowed
                  "
                >
                  <div className="text-2xl mb-1">✨</div>
                  <div className="text-forge-text font-bold">인챈트</div>
                  <div className="text-forge-text-dim text-xs">후반 해금</div>
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-forge-text-dim">
                <div className="text-4xl mb-3">⚒️</div>
                <p>왼쪽에서 장비를 선택하세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
