import { useState } from 'react'
import { useGameStore } from '../store/gameStore'
import { GRADE_NAMES, GRADE_COLORS, EQUIPMENT_TYPE_NAMES, GRADE_SELL_PRICE, LEVEL_PRICE_MULTIPLIER, GradeType } from '../types'

type ShopTab = 'buy' | 'sell'

export default function ShopScreen() {
  const {
    setScreen, gold, turn,
    merchantGuilds, equipment,
    sellEquipment, buyShopItem,
  } = useGameStore()

  const [activeTab, setActiveTab] = useState<ShopTab>('buy')
  const [confirmSellId, setConfirmSellId] = useState<string | null>(null)

  const guild = merchantGuilds[0] // 현재는 상회 1개
  const turnsUntilNext = Math.max(0, guild.nextVisitTurn - turn)
  const hasStock = guild.inventory.some(i => !i.soldOut)

  const sellableItems = equipment.filter(eq => eq.isOwned)

  const getSellPrice = (grade: GradeType, level: number) => {
    const base = GRADE_SELL_PRICE[grade] ?? 30
    const levelIdx = Math.min(level, LEVEL_PRICE_MULTIPLIER.length - 1)
    return Math.floor(base * LEVEL_PRICE_MULTIPLIER[levelIdx])
  }

  return (
    <div className="flex-1 flex flex-col bg-forge-bg text-forge-text overflow-hidden">
      {/* 상단 바 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-forge-border bg-forge-card">
        <button onClick={() => setScreen('hub')}
          className="text-forge-text-dim hover:text-forge-gold transition-colors text-sm">
          ← 영주성
        </button>
        <h1 className="text-lg font-bold text-forge-gold">🏪 상점</h1>
        <span className="ml-auto text-forge-gold font-bold">💰 {gold}G</span>
      </div>

      {/* 상회 정보 */}
      <div className="px-4 py-3 bg-forge-card border-b border-forge-border">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-forge-text">{guild.name}</span>
            <p className="text-forge-text-dim text-xs mt-0.5">{guild.description}</p>
          </div>
          <div className="text-right text-xs text-forge-text-dim">
            {turnsUntilNext > 0
              ? <span>다음 상단 도착: <span className="text-forge-gold font-bold">{turnsUntilNext}턴 후</span></span>
              : <span className="text-green-400">상단이 영지에 있습니다</span>
            }
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-forge-border bg-forge-card">
        {([
          { id: 'buy'  as const, label: '🛒 구매' },
          { id: 'sell' as const, label: '💸 판매' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-3 text-sm font-bold transition-colors ${
              activeTab === t.id
                ? 'text-forge-gold border-b-2 border-forge-gold'
                : 'text-forge-text-dim hover:text-forge-text'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">

        {/* ===== 구매 탭 ===== */}
        {activeTab === 'buy' && (
          <div className="space-y-3">
            {!hasStock ? (
              <div className="text-center py-12 text-forge-text-dim">
                <p className="text-4xl mb-2">📦</p>
                <p className="text-sm">재고가 없습니다</p>
                <p className="text-xs mt-1 opacity-60">
                  {turnsUntilNext > 0
                    ? `${turnsUntilNext}턴 후 상단이 새 물건을 가져옵니다`
                    : '상단이 곧 도착합니다'}
                </p>
              </div>
            ) : (
              guild.inventory.map(item => {
                const canAfford = gold >= item.buyPrice
                return (
                  <div key={item.id}
                    className={`bg-forge-card border rounded-xl p-4 flex items-center justify-between gap-3 ${
                      item.soldOut ? 'border-forge-border opacity-50' : 'border-forge-border'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-forge-text">{item.equipment.name}</span>
                        {item.equipment.currentLevel > 0 && (
                          <span className="text-blue-400 text-xs">+{item.equipment.currentLevel}</span>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span style={{ color: GRADE_COLORS[item.equipment.grade] }}>
                          {GRADE_NAMES[item.equipment.grade]}
                        </span>
                        <span className="text-forge-text-dim">
                          {EQUIPMENT_TYPE_NAMES[item.equipment.type]}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`font-bold text-sm ${canAfford ? 'text-forge-gold' : 'text-red-400'}`}>
                        {item.buyPrice}G
                      </span>
                      {item.soldOut ? (
                        <span className="text-xs text-forge-text-dim px-2 py-1 border border-forge-border rounded">
                          매진
                        </span>
                      ) : (
                        <button
                          onClick={() => buyShopItem(guild.id, item.id)}
                          disabled={!canAfford}
                          className="px-3 py-1 text-xs bg-forge-gold text-forge-bg font-bold rounded-lg hover:bg-forge-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          구매
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}

        {/* ===== 판매 탭 ===== */}
        {activeTab === 'sell' && (
          <div className="space-y-3">
            {sellableItems.length === 0 ? (
              <div className="text-center py-12 text-forge-text-dim">
                <p className="text-4xl mb-2">🗡️</p>
                <p className="text-sm">판매할 장비가 없습니다</p>
              </div>
            ) : (
              sellableItems.map(eq => {
                const sellPrice = getSellPrice(eq.grade as GradeType, eq.currentLevel)
                const isConfirming = confirmSellId === eq.id
                return (
                  <div key={eq.id}
                    className={`bg-forge-card border rounded-xl p-4 flex items-center justify-between gap-3 transition-colors ${
                      isConfirming ? 'border-red-600 bg-red-950/20' : 'border-forge-border'
                    }`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-forge-text">{eq.name}</span>
                        {eq.currentLevel > 0 && (
                          <span className="text-blue-400 text-xs">+{eq.currentLevel}</span>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs">
                        <span style={{ color: GRADE_COLORS[eq.grade] }}>{GRADE_NAMES[eq.grade]}</span>
                        <span className="text-forge-text-dim">{EQUIPMENT_TYPE_NAMES[eq.type]}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-sm text-green-400">+{sellPrice}G</span>
                      {isConfirming ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => { sellEquipment(eq.id); setConfirmSellId(null) }}
                            className="px-2 py-1 text-xs bg-red-700 text-white rounded hover:bg-red-600 transition-colors">
                            확인
                          </button>
                          <button
                            onClick={() => setConfirmSellId(null)}
                            className="px-2 py-1 text-xs border border-forge-border text-forge-text-dim rounded hover:text-forge-text transition-colors">
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmSellId(eq.id)}
                          className="px-3 py-1 text-xs border border-forge-border text-forge-text-dim rounded-lg hover:border-red-600 hover:text-red-400 transition-colors">
                          판매
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
