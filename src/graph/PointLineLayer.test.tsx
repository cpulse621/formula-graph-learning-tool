// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { PointLineAux, PointLineMarks } from './PointLineLayer'
import type { PlaneCtx } from './Plane'
import type { Item } from '../components/FormulaCard'

afterEach(cleanup)
const ctx: PlaneCtx = { w: 400, h: 300, scale: 20, sx: (x) => 200 + 20 * x, sy: (y) => 150 - 20 * y, xMin: -10, xMax: 10, yMin: -7.5, yMax: 7.5 }
const item: Item = { uid: 1, formulaId: 'line-two-points', holeKey: 'x1', visible: true, values: { x1: 1, y1: 2, x2: 3, y2: 3 } }

describe('座標とグラフの対応', () => {
  for (const [key, point, coordinates] of [
    ['x1', 'P', [220, 110, 220, 150]], ['y1', 'P', [220, 110, 200, 110]],
    ['x2', 'Q', [260, 90, 260, 150]], ['y2', 'Q', [260, 90, 200, 90]],
  ] as const) {
    it(`${key}は${point}から対応する軸へつながる（Δx・Δyではない）`, () => {
      const selected = { ...item, holeKey: key }
      const { container } = render(<svg><PointLineAux ctx={ctx} item={selected} /><PointLineMarks ctx={ctx} items={[selected]} numbers={{ 1: 1 }} activeUid={1} /></svg>)
      const guide = container.querySelector(`[data-coordinate-projection="${key}"]`)!
      for (const [i, attr] of ['x1', 'y1', 'x2', 'y2'].entries()) expect(Number(guide.getAttribute(attr))).toBe(coordinates[i])
      expect(container.querySelector('[data-selected-point]')!.getAttribute('data-selected-point')).toBe(point)
      expect(container.textContent).not.toMatch(/Δx|Δy/)
    })
  }
  it('点が重なっていても選択中の点の強調を最後に描く', () => {
    const selected = { ...item, holeKey: 'y1', values: { x1: 0, y1: 0, x2: 0, y2: 0 } }
    const { container } = render(<svg><PointLineMarks ctx={ctx} items={[selected]} numbers={{ 1: 1 }} activeUid={1} /></svg>)
    const points = container.querySelectorAll('[data-input-point]')
    expect(points[points.length - 1].getAttribute('data-input-point')).toBe('P')
    expect(container.querySelectorAll('[data-selected-point]')).toHaveLength(1)
  })
  it('選択中の点の名前は画面の上端から切れない', () => {
    const selected = { ...item, values: { ...item.values, y2: 7.4 }, holeKey: 'y2' }
    const { container } = render(<svg><PointLineMarks ctx={ctx} items={[selected]} numbers={{ 1: 1 }} activeUid={1} /></svg>)
    for (const text of container.querySelectorAll('text')) expect(Number(text.getAttribute('y'))).toBeGreaterThanOrEqual(20)
  })
  it('表示範囲の外の座標の記号を、画面端の別の位置に置かない', () => {
    const selected = { ...item, values: { ...item.values, x1: 100 } }
    const { container } = render(<svg><PointLineAux ctx={ctx} item={selected} /></svg>)
    expect(container.querySelector('text')).toBeNull()
  })
})
