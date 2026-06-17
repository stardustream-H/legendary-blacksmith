import { Region } from '../types'

export const STARTING_REGIONS: Region[] = [
  {
    id: 'region_001',
    name: '폐허가 된 숲',
    description: '한때 아름다운 숲이었으나 마왕의 부하들이 쓰레기를 마구 버려 황폐해졌다. 환경부 고발이 시급하다.',
    difficulty: 2,
    minTurns: 2,
    maxTurns: 4,
    liberationProgress: 0,
    status: 'available',
    currentExpedition: null,
    rewardGoldRange: [80, 180],
    rewardDivinePowerRange: [5, 15],
    rewardEquipmentChance: 40,
    rewardEquipmentGrades: ['common', 'fine'],
    liberationMonthlyIncome: 50,      // 해방 시 월 50골드 수입
    liberationEquipmentCount: 3,      // 해방 보상: 장비 3개
  },
  {
    id: 'region_002',
    name: '잊혀진 광산',
    description: '오래전 버려진 광산. 어둠 속 깊은 곳에서 이상한 소리가 들린다. 아마도 광부가 두고 간 라디오일 것이다.',
    difficulty: 4,
    minTurns: 3,
    maxTurns: 5,
    liberationProgress: 0,
    status: 'available',
    currentExpedition: null,
    rewardGoldRange: [150, 300],
    rewardDivinePowerRange: [10, 25],
    rewardEquipmentChance: 55,
    rewardEquipmentGrades: ['fine', 'rare'],
    liberationMonthlyIncome: 80,      // 해방 시 월 80골드 수입
    liberationEquipmentCount: 4,      // 해방 보상: 장비 4개
  },
  {
    id: 'region_003',
    name: '마왕 전초기지',
    description: '마왕의 부하들이 주둔하는 요새. 최근 근처에 라면 가게가 생겨 적들의 사기가 올랐다는 정보가 있다.',
    difficulty: 7,
    minTurns: 5,
    maxTurns: 8,
    liberationProgress: 0,
    status: 'available',
    currentExpedition: null,
    rewardGoldRange: [300, 600],
    rewardDivinePowerRange: [20, 45],
    rewardEquipmentChance: 70,
    rewardEquipmentGrades: ['rare', 'hero'],
    liberationMonthlyIncome: 150,     // 해방 시 월 150골드 수입
    liberationEquipmentCount: 5,      // 해방 보상: 장비 5개
  },
]
