import { TroopConfig, BarracksTroop } from '../types'

export const TROOP_CONFIGS: TroopConfig[] = [
  {
    type: 'infantry',
    name: '보병대',
    icon: '⚔️',
    description: '든든한 방패막이. 전선을 지키는 기본 병종.',
    basePower: 30,
    tierMultiplier: [1.0, 1.8, 3.0],
    upgradeCosts: [0, 300, 800],
    initialTier: 1,
  },
  {
    type: 'archer',
    name: '궁병대',
    icon: '🏹',
    description: '원거리에서 적을 견제하는 지원 병종.',
    basePower: 25,
    tierMultiplier: [1.0, 1.8, 3.0],
    upgradeCosts: [0, 350, 900],
    initialTier: 1,
  },
  {
    type: 'cavalry',
    name: '기병대',
    icon: '🐴',
    description: '빠르고 강력한 돌격 병종. 전투력이 높다.',
    basePower: 40,
    tierMultiplier: [1.0, 1.8, 3.0],
    upgradeCosts: [500, 800, 1800],
    initialTier: 0,
  },
  {
    type: 'mage',
    name: '마법사단',
    icon: '🔮',
    description: '광역 마법으로 적 다수를 상대하는 병종.',
    basePower: 35,
    tierMultiplier: [1.0, 1.8, 3.0],
    upgradeCosts: [700, 1100, 2500],
    initialTier: 0,
  },
  {
    type: 'cleric',
    name: '성직자단',
    icon: '✝️',
    description: '아군을 지원하고 사기를 높이는 후방 병종.',
    basePower: 20,
    tierMultiplier: [1.0, 1.8, 3.0],
    upgradeCosts: [600, 900, 2000],
    initialTier: 0,
  },
  {
    type: 'knights',
    name: '기사단',
    icon: '🛡️',
    description: '영주 직속 정예 기사단. 처음부터 영지를 지킨다.',
    basePower: 50,
    tierMultiplier: [1.0, 1.0, 1.0],
    upgradeCosts: [0, 0, 0],
    initialTier: 1,
  },
]

export const STARTING_BARRACKS: BarracksTroop[] = TROOP_CONFIGS.map(cfg => ({
  type: cfg.type,
  tier: cfg.initialTier,
}))

export function calcTroopPower(troop: BarracksTroop): number {
  if (troop.tier === 0) return 0
  const cfg = TROOP_CONFIGS.find(c => c.type === troop.type)
  if (!cfg) return 0
  const mult = cfg.tierMultiplier[troop.tier - 1]
  return Math.floor(cfg.basePower * mult)
}

export function calcTotalBarracksPower(troops: BarracksTroop[]): number {
  return troops.reduce((sum, t) => sum + calcTroopPower(t), 0)
}
