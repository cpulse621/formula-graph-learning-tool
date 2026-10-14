import { describe, expect, it } from 'vitest'
import { clipLine } from './geometry'

describe('直線の切り取り', () => {
  it('ゆるい傾きは、左右の端まで', () => {
    const s = clipLine(1, 0, -7, 7, -6, 6)!
    expect([s.x1, s.y1, s.x2, s.y2]).toEqual([-6, -6, 6, 6])
  })
  it('水平線は、左右の端まで', () => {
    const s = clipLine(0, 2, -7, 7, -6, 6)!
    expect([s.x1, s.y1, s.x2, s.y2]).toEqual([-7, 2, 7, 2])
  })
  it('傾き ±100 でも、座標は範囲の中', () => {
    for (const m of [100, -100]) {
      const s = clipLine(m, 100, -7, 7, -6, 6)
      if (s) for (const v of [s.y1, s.y2]) expect(Math.abs(v)).toBeLessThanOrEqual(6 + 1e-9)
    }
    const s = clipLine(100, 0, -7, 7, -6, 6)!
    expect(s.x1).toBeCloseTo(-0.06, 12)
    expect(s.x2).toBeCloseTo(0.06, 12)
  })
  it('範囲の外を通る直線は null', () => {
    expect(clipLine(0, 10, -7, 7, -6, 6)).toBeNull()
    expect(clipLine(1, 100, -7, 7, -6, 6)).toBeNull()
  })
})
