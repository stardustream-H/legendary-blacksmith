import { GradeConfig } from '../types'

// ※ 확률 수치는 플레이테스트 후 조정 예정
// probabilities[i] = +i 강화 상태에서 시도할 때 성공 확률(%)
// 마지막 값이 이후 모든 레벨에 반복 적용

export const GRADE_CONFIGS: Record<string, GradeConfig> = {
  common: {
    grade: 'common',
    maxLevel: 9,
    probabilities: [80, 75, 70, 60, 50, 40, 30, 20, 10],
    penalties: [],
    godComments: {
      success: [
        '오호라~ 됐구만. 뭐, 일반 장비 하나 강화한 거잖아.',
        '성공이야. 축하해. ...별로 감흥은 없지만.',
        '그래 그래, 잘했어. 다음엔 더 좋은 거 들고 와봐.',
      ],
      failure: [
        '크크크... 실패했군. 재밌어~',
        '아이고~ 안됐네. 한 번 더 해봐.',
        '뭐, 실패도 경험이지. 다시 해봐.',
      ],
      destroy: [
        '와... 터졌어. 일반 장비가 터지다니 좀 창피하지 않아?',
      ],
    },
  },

  fine: {
    grade: 'fine',
    maxLevel: 12,
    probabilities: [75, 70, 60, 50, 40, 30, 20, 15, 10, 7, 4, 2],
    penalties: [
      { fromLevel: 8, toLevel: -1, penaltyType: 'LEVEL_DOWN', magnitude: 1, triggerChance: 100 },
    ],
    godComments: {
      success: [
        '오~ 고급 장비 강화에 성공했군. 좀 하는데?',
        '성공이야! 운이 좋았어. 계속 이럴 순 없지만~',
        '잘했어. 근데 앞으로가 더 어려워. 크크.',
      ],
      failure: [
        '실패했고, 레벨도 내려갔지. 아프지? 크크.',
        '아이고~ 레벨이 떨어졌네. 괜찮아, 다시 올리면 되지.',
        '실패에 레벨다운까지. 오늘 운이 없군.',
      ],
      destroy: [
        '고급 장비가 터졌어. 좀 안타깝긴 한데... 재밌다.',
      ],
    },
  },

  rare: {
    grade: 'rare',
    maxLevel: 15,
    probabilities: [70, 60, 50, 40, 30, 20, 12, 8, 5, 3, 2, 1, 0.8, 0.5, 0.3],
    penalties: [
      { fromLevel: 8, toLevel: 11, penaltyType: 'LEVEL_DOWN', magnitude: 1, triggerChance: 100 },
      { fromLevel: 8, toLevel: -1, penaltyType: 'DURABILITY_DAMAGE', magnitude: 5, triggerChance: 50 },
      { fromLevel: 12, toLevel: -1, penaltyType: 'LEVEL_DOWN', magnitude: 2, triggerChance: 100 },
    ],
    godComments: {
      success: [
        '희귀 장비 강화 성공! 오늘 운이 좋군. 내가 도운 건 아니야.',
        '성공이야~ 이 정도 단계에서 성공하다니, 대단한데?',
        '잘됐네. 근데 내구도도 신경 써. 삐걱거리는 거 들리지 않아?',
      ],
      failure: [
        '실패에 내구도까지 깎였어. 수리도 해야 할 것 같은데? 크크크.',
        '아이고~ 레벨도 내려가고 내구도도 줄었네. 속상하지?',
        '실패야. 이 구간은 원래 어려워. 신성력 좀 써봐.',
      ],
      destroy: [
        '희귀 장비가 박살났어. 아깝다... 진짜로. 조금.',
      ],
    },
  },

  hero: {
    grade: 'hero',
    maxLevel: 20,
    probabilities: [65, 55, 45, 35, 25, 15, 10, 7, 5, 3, 2, 1.5, 1, 0.8, 0.5, 0.3, 0.2, 0.15, 0.1, 0.05],
    penalties: [
      { fromLevel: 10, toLevel: 14, penaltyType: 'LEVEL_DOWN', magnitude: 1, triggerChance: 100 },
      { fromLevel: 10, toLevel: -1, penaltyType: 'DURABILITY_DAMAGE', magnitude: 10, triggerChance: 70 },
      { fromLevel: 15, toLevel: -1, penaltyType: 'LEVEL_DOWN', magnitude: 2, triggerChance: 100 },
      { fromLevel: 15, toLevel: -1, penaltyType: 'EQUIPMENT_DESTROY', magnitude: 1, triggerChance: 10 },
    ],
    godComments: {
      success: [
        '영웅급 강화 성공! ...솔직히 나도 좀 놀랐어.',
        '오오오~ 됐어! 이 정도면 진짜 실력자인데?',
        '성공이야. 이 기쁨, 오래 간직해. 다음엔 장담 못 하니까.',
      ],
      failure: [
        '실패했어. 이 구간은 신성력 없이 무리야, 솔직히.',
        '아이고~ 레벨 떨어지고 내구도까지. 장비 아직 살아있나?',
        '크크크... 이 정도 장비가 이렇게 되다니. 수리부터 해.',
      ],
      destroy: [
        '영웅 장비가... 터졌어. 이건 진짜 아깝다. 정말로.',
        '아. 영웅급이 산화했군. 묵념.',
      ],
    },
  },

  legendary: {
    grade: 'legendary',
    maxLevel: 9999,
    probabilities: [
      50, 40, 30, 20, 12, 8, 5, 3, 2, 1.5,
      1, 0.8, 0.6, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.1,
      0.05, // +20 이후 이 값 반복
    ],
    penalties: [
      { fromLevel: 10, toLevel: 14, penaltyType: 'LEVEL_DOWN', magnitude: 2, triggerChance: 100 },
      { fromLevel: 10, toLevel: -1, penaltyType: 'DURABILITY_DAMAGE', magnitude: 15, triggerChance: 80 },
      { fromLevel: 15, toLevel: 19, penaltyType: 'LEVEL_DOWN', magnitude: 3, triggerChance: 100 },
      { fromLevel: 15, toLevel: -1, penaltyType: 'EQUIPMENT_DESTROY', magnitude: 1, triggerChance: 20 },
      { fromLevel: 20, toLevel: -1, penaltyType: 'LEVEL_DOWN', magnitude: 5, triggerChance: 100 },
      { fromLevel: 20, toLevel: -1, penaltyType: 'EQUIPMENT_DESTROY', magnitude: 1, triggerChance: 30 },
    ],
    godComments: {
      success: [
        '전설 장비 강화 성공... 이건 나도 진심으로 박수 쳐줄게.',
        '됐어!! 이 순간을 기억해. 다시 이럴 확률이 얼마나 될까~?',
        '신이 허락했군. 뭐, 나니까.',
      ],
      failure: [
        '실패야. 전설 장비도 내 앞에선 별 수 없지.',
        '크크크크크... 전설이 고꾸라졌어. 오늘 밤 잠 잘 자겠어?',
        '아이고~ 아깝다. 정말로. 진심으로.',
      ],
      destroy: [
        '전설 장비가... 사라졌어. 나도 이건 좀 미안하다. 조금.',
        '...묵념. 전설의 귀환은 없었다.',
      ],
    },
  },

  legendary_relic: {
    grade: 'legendary_relic',
    maxLevel: 9999,
    probabilities: [
      40, 30, 20, 12, 8, 5, 3, 2, 1.5, 1,
      0.8, 0.6, 0.4, 0.3, 0.2, 0.15, 0.1, 0.08, 0.06, 0.04,
      0.02,
    ],
    penalties: [
      { fromLevel: 10, toLevel: -1, penaltyType: 'LEVEL_DOWN', magnitude: 3, triggerChance: 100 },
      { fromLevel: 10, toLevel: -1, penaltyType: 'DURABILITY_DAMAGE', magnitude: 20, triggerChance: 90 },
      { fromLevel: 15, toLevel: -1, penaltyType: 'EQUIPMENT_DESTROY', magnitude: 1, triggerChance: 25 },
      { fromLevel: 20, toLevel: -1, penaltyType: 'EQUIPMENT_DESTROY', magnitude: 1, triggerChance: 40 },
    ],
    godComments: {
      success: [
        '유물 강화 성공... 역사에 기록될 일이야, 진심으로.',
        '됐어!! 신들도 이건 박수 치겠는걸.',
        '경이롭군. 내가 인정한다.',
      ],
      failure: [
        '유물도 실패하는군. 그래도 아직 살아있으니 다행이야.',
        '크크... 유물 강화는 신도 어렵거든. 나도 포함해서.',
      ],
      destroy: [
        '유물이... 사라졌어. 이건 진짜 역사의 비극이야.',
      ],
    },
  },

  ancient: {
    grade: 'ancient',
    maxLevel: 9999,
    probabilities: [
      30, 20, 12, 8, 5, 3, 2, 1.5, 1, 0.8,
      0.5, 0.3, 0.2, 0.15, 0.1, 0.08, 0.06, 0.04, 0.03, 0.02,
      0.01,
    ],
    penalties: [
      { fromLevel: 10, toLevel: -1, penaltyType: 'LEVEL_DOWN', magnitude: 4, triggerChance: 100 },
      { fromLevel: 10, toLevel: -1, penaltyType: 'DURABILITY_DAMAGE', magnitude: 25, triggerChance: 100 },
      { fromLevel: 20, toLevel: -1, penaltyType: 'EQUIPMENT_DESTROY', magnitude: 1, triggerChance: 40 },
    ],
    godComments: {
      success: [
        '고대 장비 강화 성공. 태초의 신들도 놀랄 일이야.',
        '...됐어. 말이 안 나온다.',
      ],
      failure: [
        '고대 장비도 실패하는군. 세상엔 불가능이 없고, 실패도 없지 않지.',
        '크크... 이 정도면 거의 도박이잖아. 재밌어.',
      ],
      destroy: [
        '고대가 소멸했어. 이건... 나도 말을 잃겠어.',
      ],
    },
  },

  mythic: {
    grade: 'mythic',
    maxLevel: 9999,
    probabilities: [
      20, 12, 8, 5, 3, 2, 1.5, 1, 0.8, 0.5,
      0.3, 0.2, 0.15, 0.1, 0.08, 0.06, 0.04, 0.03, 0.02, 0.01,
      0.005,
    ],
    penalties: [
      { fromLevel: 5, toLevel: -1, penaltyType: 'LEVEL_DOWN', magnitude: 5, triggerChance: 100 },
      { fromLevel: 5, toLevel: -1, penaltyType: 'DURABILITY_DAMAGE', magnitude: 30, triggerChance: 100 },
      { fromLevel: 20, toLevel: -1, penaltyType: 'EQUIPMENT_DESTROY', magnitude: 1, triggerChance: 50 },
    ],
    godComments: {
      success: [
        '...신화 강화 성공. 나도 처음 봤어. 진짜로.',
        '이건 전설을 넘어 신화야. 네가 쓴 거잖아.',
      ],
      failure: [
        '신화도 실패해. 그게 세상이야. 크크.',
        '...묵묵히 다시 해봐. 내가 응원할게. 살짝.',
      ],
      destroy: [
        '신화가 사라졌어. 이 세계가 조금 빛을 잃었군.',
      ],
    },
  },
}
