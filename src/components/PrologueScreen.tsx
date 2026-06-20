import { useState } from 'react'

// ===== 프롤로그 패널 데이터 =====
type PanelType = 'narration' | 'dialogue'

interface Panel {
  id: number
  type: PanelType
  icon: string
  title: string
  lines: string[]
  subtext?: string
  bg: string
  accent: string
  isFinal?: boolean
  speaker?: string
  speakerSub?: string
}

const PANELS: Panel[] = [
  {
    id: 0,
    type: 'narration',
    icon: '⚔️',
    title: '과거의 전쟁',
    lines: [
      '마왕이 일어섰던 그 시절,',
      '인류는 절체절명의 위기에 처했다.',
      '',
      '마왕군은 전선을 누비며 대장장이들을 표적으로 삼았다.',
      '이유는 알 수 없었다. 그저, 체계적으로.',
      '',
      '전쟁이 끝났을 때—인류는 승리를 거뒀지만,',
      '세상의 모든 대장장이는 이미 이 세상에 없었다.',
    ],
    bg: 'from-stone-950 to-red-950/40',
    accent: '#b91c1c',
  },
  {
    id: 1,
    type: 'narration',
    icon: '🪦',
    title: '잊혀진 기술',
    lines: [
      '이후 수백 년의 평화가 찾아왔다.',
      '',
      '대장장이의 기술은 구전으로만 남았고,',
      '사람들은 옛 전쟁터를 뒤져 유물 장비를 발굴해 쓰는 법을 택했다.',
      '',
      '단련이 아닌, 발굴.',
      '제작이 아닌, 소모.',
      '',
      '인류는 장비를 "만드는" 법을 완전히 잊었다.',
    ],
    bg: 'from-stone-950 to-zinc-900/60',
    accent: '#78716c',
  },
  {
    id: 2,
    type: 'narration',
    icon: '📜',
    title: '발령',
    lines: [
      '그리고 지금, 당신은 몰락한 귀족이다.',
      '',
      '선조가 마왕과 싸우던 변방의 영지.',
      '지금은 아무도 신경 쓰지 않는 잊혀진 전선.',
      '',
      '재정도, 병력도, 기대도 없는 그곳에',
      '어쩌다 영주 발령을 받게 된 당신은—',
      '',
      '먼지 쌓인 성문을 처음 열던 날,',
      '누군가를 마주쳤다.',
    ],
    bg: 'from-stone-950 to-amber-950/30',
    accent: '#92400e',
  },
  {
    id: 3,
    type: 'dialogue',
    icon: '🎭',
    title: '장난의 신',
    speaker: '???',
    speakerSub: '정체를 알 수 없는 존재',
    lines: [
      '…오, 드디어 왔군. 기다렸어.',
      '',
      '곧 마왕의 군세가 다시 일어날 거야.',
      '이번엔 아무도 막지 못해—장비를 만들 자가 없으니까.',
      '',
      '그래서 말인데, 내 힘을 빌려주겠어.',
      '기술? 그런 거 없어도 돼.',
      '내 신력으로 네 손을 빌리는 거니까.',
      '',
      '될지 안 될지는… 글쎄, 해봐야 알지.',
      '원래 신의 힘이란 게 그런 거야.',
      '',
      '자, 나의 사도가 되어줘.',
      '그리고 이 망치를 잡아.',
    ],
    subtext: '그 손에 쥐어진 낡은 망치가 무겁게 느껴졌다.',
    bg: 'from-stone-950 to-blue-950/40',
    accent: '#1d4ed8',
    isFinal: true,
  },
]

interface PrologueScreenProps {
  onComplete: () => void
}

export default function PrologueScreen({ onComplete }: PrologueScreenProps) {
  const [panelIndex, setPanelIndex] = useState(0)
  const [fading, setFading] = useState(false)

  const panel = PANELS[panelIndex]
  const isLast = panelIndex === PANELS.length - 1

  const goNext = () => {
    if (fading) return
    if (isLast) {
      onComplete()
      return
    }
    setFading(true)
    setTimeout(() => {
      setPanelIndex(i => i + 1)
      setFading(false)
    }, 250)
  }

  return (
    <div
      className={`flex-1 flex flex-col bg-gradient-to-b ${panel.bg}`}
      style={{ minHeight: 0 }}
    >
      {/* 스킵 */}
      <div className="flex justify-end p-4">
        <button
          onClick={onComplete}
          className="text-xs text-stone-500 hover:text-stone-300 transition-colors px-3 py-1 rounded border border-stone-700/40 hover:border-stone-500"
        >
          건너뛰기 →
        </button>
      </div>

      {/* 내용 */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-8 gap-5 overflow-y-auto"
        style={{ opacity: fading ? 0 : 1, transition: 'opacity 0.25s' }}
      >
        {panel.type === 'narration' ? (
          /* 나레이션 패널 */
          <>
            <div className="text-4xl">{panel.icon}</div>
            <h2 className="text-base font-black tracking-widest" style={{ color: panel.accent }}>
              — {panel.title} —
            </h2>
            <div className="w-12 h-px" style={{ background: panel.accent + '50' }} />
            <div className="max-w-xs text-center">
              {panel.lines.map((line, i) =>
                line === '' ? (
                  <div key={i} className="h-3" />
                ) : (
                  <p key={i} className="text-stone-300 text-sm leading-relaxed">{line}</p>
                )
              )}
            </div>
          </>
        ) : (
          /* 대화 패널 */
          <>
            <div className="text-4xl">{panel.icon}</div>
            <div className="text-center">
              <div className="font-black text-lg" style={{ color: panel.accent }}>
                {panel.speaker}
              </div>
              {panel.speakerSub && (
                <div className="text-xs text-stone-500 mt-0.5">{panel.speakerSub}</div>
              )}
            </div>
            <div className="w-12 h-px" style={{ background: panel.accent + '50' }} />
            {/* 말풍선 스타일 */}
            <div
              className="max-w-xs w-full rounded-2xl rounded-tl-sm p-4 border"
              style={{ background: panel.accent + '15', borderColor: panel.accent + '40' }}
            >
              {panel.lines.map((line, i) =>
                line === '' ? (
                  <div key={i} className="h-2.5" />
                ) : (
                  <p key={i} className="text-stone-200 text-sm leading-relaxed">
                    {line}
                  </p>
                )
              )}
            </div>
            {panel.subtext && (
              <p className="text-xs italic text-stone-500 text-center max-w-xs">
                {panel.subtext}
              </p>
            )}
          </>
        )}
      </div>

      {/* 하단 */}
      <div className="flex flex-col items-center gap-4 pb-8 px-8">
        {/* 진행 도트 */}
        <div className="flex gap-2 items-center">
          {PANELS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === panelIndex ? 20 : 6,
                height: 6,
                background: i === panelIndex ? panel.accent : '#292524',
              }}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className="w-full max-w-xs py-3 rounded-xl font-black text-base transition-all hover:scale-105 active:scale-95"
          style={{ background: panel.accent, color: '#f5f5f4' }}
        >
          {isLast ? '⚒️  망치를 잡는다' : '다음 →'}
        </button>
      </div>
    </div>
  )
}
