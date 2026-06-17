import { Adventurer, CharacterStats } from '../types'

// 스탯 헬퍼
const stats = (
  proficiency: CharacterStats['proficiency'],
  judgment: CharacterStats['judgment'],
  vitality: CharacterStats['vitality'],
  courage: CharacterStats['courage']
): CharacterStats => ({ proficiency, judgment, vitality, courage })

export const STARTING_ADVENTURERS: Adventurer[] = [
  {
    id: 'adv_001',
    name: '강철근',
    role: 'tank',
    class: 'sword_knight',
    characterClass: 'swordsman',
    grade: 'rookie',
    stats: stats('C', 'D', 'B', 'B'),  // 방어력 좋고 판단은 평범
    status: 'available',
    lentEquipmentId: null,
    injuredUntilTurn: null,
    quirk: '방패로 뭐든 막을 수 있다고 굳게 믿는다. 단, 본인 밥값은 예외.',
    dispatchedRegionId: null,
  },
  {
    id: 'adv_002',
    name: '재빠른 박',
    role: 'melee_dps',
    class: 'rogue',
    characterClass: 'rogue',
    grade: 'rookie',
    stats: stats('C', 'C', 'C', 'D'),  // 균형잡힌 신입, 담력이 좀 낮음
    status: 'available',
    lentEquipmentId: null,
    injuredUntilTurn: null,
    quirk: '손재주가 남다르다. 어디서 구했는지 모를 물건들로 가방이 가득하다.',
    dispatchedRegionId: null,
  },
  {
    id: 'adv_003',
    name: '명사수 최',
    role: 'ranged_dps',
    class: 'archer',
    characterClass: 'archer',
    grade: 'rookie',
    stats: stats('B', 'C', 'C', 'C'),  // 전문성은 높지만 나머지 평범
    status: 'available',
    lentEquipmentId: null,
    injuredUntilTurn: null,
    quirk: '화살 10발 중 9발은 정확히 박힌다. 나머지 1발의 행방은 본인도 모른다.',
    dispatchedRegionId: null,
  },
  {
    id: 'adv_004',
    name: '치료사 임',
    role: 'healer',
    class: 'priest',
    characterClass: 'priest',
    grade: 'rookie',
    stats: stats('C', 'B', 'D', 'C'),  // 판단력이 높아 성공률 기여, 체력은 약함
    status: 'available',
    lentEquipmentId: null,
    injuredUntilTurn: null,
    quirk: '신의 가호로 치료한다. 신이 주무실 땐 소독약으로 대신한다.',
    dispatchedRegionId: null,
  },
]

// 신규 모집 가능한 용병 풀
export const ADVENTURER_POOL: Omit<Adventurer, 'id' | 'status' | 'lentEquipmentId' | 'injuredUntilTurn' | 'dispatchedRegionId'>[] = [
  {
    name: '돌격대장 김',
    role: 'tank',
    class: 'shield_warrior',
    characterClass: 'swordsman',
    grade: 'rookie',
    stats: stats('C', 'E', 'B', 'S'),  // 체력/담력 최강, 판단력 최악
    quirk: '돌격을 외치고 제일 먼저 달려간다. 방향이 맞는 경우는 절반 정도.',
  },
  {
    name: '폭발마 이',
    role: 'magic_dps',
    class: 'fire_mage',
    characterClass: 'mage',
    grade: 'rookie',
    stats: stats('B', 'D', 'D', 'C'),
    quirk: '화염 마법 전문가. 아군 피해는 실수라고 주장한다.',
  },
  {
    name: '투창 오',
    role: 'ranged_dps',
    class: 'spearman',
    characterClass: 'spearman',
    grade: 'rookie',
    stats: stats('C', 'C', 'C', 'C'),
    quirk: '창을 던지면 반드시 돌아온다고 믿는다. 사실은 줍는 게 귀찮아서 그냥 달려가는 거다.',
  },
  {
    name: '콧노래 한',
    role: 'buffer',
    class: 'bard',
    characterClass: 'rogue',
    grade: 'rookie',
    stats: stats('D', 'B', 'C', 'D'),  // 판단력 좋아 성공률 기여
    quirk: '노래로 아군을 고무시킨다. 음정이 맞을 때만 효과가 있다는 게 문제.',
  },
  {
    name: '냉정한 서',
    role: 'magic_dps',
    class: 'ice_mage',
    characterClass: 'mage',
    grade: 'veteran',
    stats: stats('B', 'A', 'C', 'B'),  // 판단력 A급 베테랑
    quirk: '항상 냉정하다. 밥을 먹을 때도 냉정하고, 잘 때도 냉정하고, 아마 태어날 때도 냉정했을 것이다.',
  },
  {
    name: '약초꾼 정',
    role: 'healer',
    class: 'herbalist',
    characterClass: 'priest',
    grade: 'rookie',
    stats: stats('D', 'C', 'B', 'C'),
    quirk: '풀만 있으면 뭐든 고친다. 단, 효과가 나타나기까지 3턴이 걸린다는 게 아쉽다.',
  },
  {
    name: '독침 류',
    role: 'debuffer',
    class: 'poisoner',
    characterClass: 'rogue',
    grade: 'veteran',
    stats: stats('B', 'B', 'C', 'B'),
    quirk: '독을 다루는 전문가. 본인도 가끔 중독된다.',
  },
  {
    name: '저주왕 문',
    role: 'debuffer',
    class: 'cursemancer',
    characterClass: 'mage',
    grade: 'rookie',
    stats: stats('C', 'C', 'D', 'C'),
    quirk: '저주를 걸면 반드시 효과가 나타난다. 가끔 본인한테 걸리기도 한다.',
  },
  {
    name: '전술의 신 윤',
    role: 'buffer',
    class: 'tactician',
    characterClass: 'swordsman',
    grade: 'veteran',
    stats: stats('C', 'S', 'C', 'A'),  // 판단력 S급 전략가
    quirk: '전술을 짜는 데 2시간이 걸린다. 적이 기다려줄 때만 유용하다.',
  },
  {
    name: '팔색조 용병 조',
    role: 'melee_dps',
    class: 'mercenary',
    characterClass: 'swordsman',
    grade: 'veteran',
    stats: stats('A', 'B', 'B', 'A'),  // 전체적으로 우수한 베테랑
    quirk: '돈 되는 일이라면 뭐든 한다. 돈이 안 되는 일도 충분히 주면 한다.',
  },
]
