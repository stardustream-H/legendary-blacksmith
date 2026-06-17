import { EnhancementResult } from '../types'

interface Props {
  result: EnhancementResult
  equipmentName: string
  gradeColor: string
  onClose: () => void
}

const PENALTY_LABELS: Record<string, string> = {
  NONE: '',
  LEVEL_DOWN: '강화 수치 하락',
  LEVEL_RESET: '강화 수치 초기화',
  DURABILITY_DAMAGE: '내구도 손상',
  MAX_LEVEL_REDUCE: '최대 강화 감소',
  EQUIPMENT_DESTROY: '장비 파괴!',
  ENHANCEMENT_LOCK: '강화 잠금',
}

export default function ResultPopup({ result, equipmentName, gradeColor, onClose }: Props) {
  const isSuccess = result.outcome === 'success'
  const isDestroy = result.outcome === 'destroy'

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div
        className={`
          bg-forge-card rounded-2xl border-2 p-6 max-w-sm w-full text-center
          animate-bounce-once
          ${isDestroy ? 'border-red-500' : isSuccess ? 'border-green-500' : 'border-red-800'}
        `}
        style={{ borderColor: isSuccess ? '#4a7c59' : isDestroy ? '#ff0000' : '#7c1a1a' }}
      >
        {/* 아이콘 */}
        <div className="text-6xl mb-3">
          {isSuccess ? '✨' : isDestroy ? '💥' : '❌'}
        </div>

        {/* 결과 타이틀 */}
        <h3
          className="text-2xl font-black mb-1"
          style={{
            color: isSuccess ? '#4a7c59' : isDestroy ? '#ff4444' : '#c0392b',
          }}
        >
          {isSuccess ? '강화 성공!' : isDestroy ? '장비 파괴!' : '강화 실패'}
        </h3>

        {/* 장비명 */}
        <p className="font-bold mb-3" style={{ color: gradeColor }}>
          {equipmentName}
        </p>

        {/* 강화 수치 변화 */}
        {!isDestroy && (
          <div className="flex items-center justify-center gap-3 mb-3 text-lg">
            <span className="text-forge-text-dim">+{result.previousLevel}</span>
            <span className="text-forge-text-dim">→</span>
            <span
              className="font-black text-2xl"
              style={{
                color: isSuccess ? '#4a7c59' : result.newLevel < result.previousLevel ? '#c0392b' : '#e8dcc8',
              }}
            >
              +{result.newLevel}
            </span>
          </div>
        )}

        {/* 성공 확률 */}
        <div className="text-forge-text-dim text-sm mb-3">
          시도 확률: {result.probabilityUsed.toFixed(2)}%
        </div>

        {/* 페널티 표시 */}
        {!isSuccess && result.penaltyApplied !== 'NONE' && (
          <div
            className="bg-red-900/30 border border-red-800 rounded-lg p-2 mb-3 text-sm"
          >
            <span className="text-red-400 font-bold">
              {PENALTY_LABELS[result.penaltyApplied]}
            </span>
            {result.penaltyApplied === 'LEVEL_DOWN' && (
              <span className="text-forge-text-dim"> (-{result.penaltyMagnitude})</span>
            )}
            {result.penaltyApplied === 'DURABILITY_DAMAGE' && (
              <span className="text-forge-text-dim"> (-{result.penaltyMagnitude})</span>
            )}
          </div>
        )}

        {/* 신 코멘트 */}
        <div className="bg-purple-900/30 border border-purple-800 rounded-lg p-3 mb-4 text-sm italic">
          <span className="text-purple-300 text-xs block mb-1">🎭 장난의 신:</span>
          <span className="text-forge-text">"{result.godComment}"</span>
        </div>

        {/* 확인 버튼 */}
        <button
          onClick={onClose}
          className={`
            w-full py-3 rounded-lg font-bold text-sm
            transition-colors duration-200
            ${
              isSuccess
                ? 'bg-green-800 hover:bg-green-700 text-white'
                : isDestroy
                ? 'bg-red-900 hover:bg-red-800 text-white'
                : 'bg-forge-card border border-forge-border hover:border-forge-gold text-forge-text'
            }
          `}
        >
          {isSuccess ? '✨ 계속 강화하기' : isDestroy ? '😢 장비 목록으로' : '🔄 다시 시도'}
        </button>
      </div>
    </div>
  )
}
