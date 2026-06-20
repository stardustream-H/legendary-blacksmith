import { useState } from 'react'
import { useGameStore } from '../store/gameStore'

const STEPS = [
  {
    icon: '⚒️',
    title: '영지에 오신 것을 환영합니다',
    desc: [
      '당신은 이제 이 영지의 영주이자, 장난의 신의 사도입니다.',
      '마왕군의 웨이브를 버텨내면서 영지를 키워나가세요.',
      '각 시설의 역할을 간단히 소개합니다.',
    ],
    accent: '#c9a227',
  },
  {
    icon: '🏰',
    title: '영주성',
    desc: [
      '가신단을 관리하고 수비 병력을 배치하는 곳입니다.',
      '가신 목록 탭에서 "왕국 파견 요청" 버튼으로 왕국의 인재를 월 1회 영입할 수 있습니다.',
      '영지의 월 수입과 경제 현황도 여기서 확인할 수 있습니다.',
    ],
    accent: '#a16207',
  },
  {
    icon: '📋',
    title: '의뢰 게시판',
    desc: [
      '주민들의 장비 강화·수리 의뢰를 수락하는 곳입니다.',
      '의뢰를 완료하면 골드를 얻습니다. 주요 수입원입니다.',
    ],
    accent: '#0369a1',
  },
  {
    icon: '⚒️',
    title: '대장간',
    desc: [
      '겉보기엔 평범한 대장간이지만, 사실 장난의 신을 모시는 신전입니다.',
      '신의 힘을 빌려 장비를 강화하고 수리할 수 있으며, 성소에서 신격을 높일수록 더 강한 가호를 받을 수 있습니다.',
      '단, 결과는 신의 뜻에 달려 있어 매번 보장되지 않습니다.',
    ],
    accent: '#b45309',
  },
  {
    icon: '⚔️',
    title: '모험가 길드',
    desc: [
      '용병을 고용하고 지역 탐험에 파견하는 곳입니다.',
      '지역을 해방하면 월 수입이 늘고 장비 보상을 얻습니다.',
      '파견은 한 달에 한 번만 가능합니다.',
    ],
    accent: '#7c3aed',
  },
  {
    icon: '🏦',
    title: '상점',
    desc: [
      '골드로 장비와 재료를 구매할 수 있습니다.',
      '좋은 장비를 미리 확보해두면 든든합니다.',
    ],
    accent: '#065f46',
  },
  {
    icon: '🛡️',
    title: '방어 시설',
    desc: [
      '영지의 수비력을 확인하고 성벽을 강화하는 곳입니다.',
      '웨이브가 밀려올 때 성벽의 방어력이 전투력에 합산됩니다.',
      '성벽 업그레이드에는 골드가 필요합니다.',
    ],
    accent: '#1d4ed8',
  },
  {
    icon: '🏰',
    title: '병영',
    desc: [
      '수비 병력을 해금하고 강화하는 시설입니다.',
      '보병·궁수·기사단 등 다양한 병종을 골드로 해금할 수 있습니다.',
      '해금된 병력은 웨이브 방어에 자동으로 참여하여 수비력을 높입니다.',
    ],
    accent: '#92400e',
  },
  {
    icon: '⏳',
    title: '턴 진행',
    desc: [
      '허브 하단의 "턴 진행" 버튼으로 시간을 흘립니다.',
      '4턴(1개월)이 지나면 월 결산이 이루어지고 수입이 들어옵니다.',
      '일정 턴마다 마왕군의 웨이브가 밀려옵니다. 허브 상단에서 남은 턴을 확인하세요.',
    ],
    accent: '#be123c',
  },
  {
    icon: '⚒️',
    title: '이제 시작합니다',
    desc: [
      '웨이브를 버텨내고, 영지를 키우고, 잃어버린 땅을 되찾으세요.',
      '장난의 신의 힘은 변덕스럽지만... 당신에게는 선택지가 없습니다.',
    ],
    accent: '#c9a227',
    isFinal: true,
  },
]

export default function TutorialOverlay() {
  const completeTutorial = useGameStore((s) => s.completeTutorial)
  const [step, setStep] = useState(0)
  const [fading, setFading] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const goNext = () => {
    if (fading) return
    if (isLast) { completeTutorial(); return }
    setFading(true)
    setTimeout(() => { setStep(s => s + 1); setFading(false) }, 200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75">
      <div
        className="relative w-full max-w-sm mx-4 rounded-2xl border p-6 flex flex-col"
        style={{
          background: '#0d0b08',
          borderColor: current.accent + '60',
          boxShadow: `0 0 40px ${current.accent}20`,
          opacity: fading ? 0 : 1,
          transition: 'opacity 0.2s',
          height: '320px',
        }}
      >
        {/* 스킵 */}
        <button
          onClick={completeTutorial}
          className="absolute top-4 right-4 text-xs text-stone-600 hover:text-stone-400 transition-colors"
        >
          건너뛰기
        </button>

        {/* 아이콘 + 제목 */}
        <div className="flex items-center gap-3">
          <div className="text-3xl">{current.icon}</div>
          <h3 className="font-black text-lg" style={{ color: current.accent }}>
            {current.title}
          </h3>
        </div>

        {/* 구분선 */}
        <div className="h-px mt-1 mb-1" style={{ background: current.accent + '30' }} />

        {/* 설명 */}
        <div className="flex-1 flex flex-col gap-2 justify-start">
          {current.desc.map((line, i) => (
            <p key={i} className="text-sm text-stone-300 leading-relaxed">
              {line}
            </p>
          ))}
        </div>

        {/* 진행 도트 + 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 16 : 5,
                  height: 5,
                  background: i === step ? current.accent : '#292524',
                }}
              />
            ))}
          </div>
          <button
            onClick={goNext}
            className="px-5 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{ background: current.accent, color: '#0d0b08' }}
          >
            {isLast ? '시작하기 →' : '다음 →'}
          </button>
        </div>
      </div>
    </div>
  )
}
