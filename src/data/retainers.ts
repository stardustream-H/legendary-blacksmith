import { Retainer, TroopSlot, CharacterStats } from '../types'

const stats = (
  proficiency: CharacterStats['proficiency'],
  judgment: CharacterStats['judgment'],
  vitality: CharacterStats['vitality'],
  courage: CharacterStats['courage']
): CharacterStats => ({ proficiency, judgment, vitality, courage })

// ===== 초기 지휘관 목록 =====
export const STARTING_RETAINERS: Retainer[] = [
  {
    id: 'ret_001',
    name: '철벽 하인리히',
    characterClass: 'knight',
    stats: stats('B', 'C', 'B', 'B'),
    loyalty: 80,
    salary: 60,
    equippedWeaponId: null,
    equippedArmorId: null,
    isActive: true,
    quirk: '전쟁터에서 태어나 전쟁터에서 자랐다. 평화로운 날엔 멍하니 먼 곳을 바라본다.',
  },
]

// ===== 초기 병력 슬롯 =====
// 기사단: 하인리히가 지휘
// 보병대, 궁병대: 지휘관 미배치(무지휘)
export const STARTING_TROOP_SLOTS: TroopSlot[] = [
  { id: 'troop_001', troopType: 'knight',   commanderId: 'ret_001' },
  { id: 'troop_002', troopType: 'infantry', commanderId: null },
  { id: 'troop_003', troopType: 'archer',   commanderId: null },
]
