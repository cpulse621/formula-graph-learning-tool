import { describe, expect, it } from 'vitest'
import { baseScale, clampZoom, niceStep, piStep, ticksBetween } from './viewport'

describe('目盛りの幅', () => {
  it('niceStep は 1・2・5 刻み', () => {
    expect(niceStep(0.3)).toBeCloseTo(0.5, 12)
    expect(niceStep(1)).toBe(1)
    expect(niceStep(1.2)).toBe(2)
    expect(niceStep(3)).toBe(5)
    expect(niceStep(7)).toBe(10)
    expect(niceStep(0.07)).toBeCloseTo(0.1, 12)
  })

  it('piStep', () => {
    expect(piStep(0.1)).toBeCloseTo(Math.PI / 12, 12)
    expect(piStep(1.0)).toBeCloseTo(Math.PI / 3, 12) // π/3 ≈ 1.047 は 1.0 以上
    expect(piStep(1.1)).toBeCloseTo(Math.PI / 2, 12)
    expect(piStep(Math.PI)).toBeCloseTo(Math.PI, 12)
    expect(piStep(4)).toBeCloseTo(2 * Math.PI, 12)
  })

  it('ticksBetween は両端を含み、誤差が出ない', () => {
    expect(ticksBetween(-7, 7, 2)).toEqual([-6, -4, -2, 0, 2, 4, 6])
    expect(ticksBetween(0, 1, 0.1)).toEqual([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
    expect(ticksBetween(-Math.PI, Math.PI, Math.PI / 2)).toHaveLength(5)
  })
})

describe('表示の大きさ', () => {
  it('縦長でも横長でも、横 ±7・縦 ±3.2 が入る', () => {
    const s1 = baseScale(360, 340)
    expect(s1 * 14).toBeLessThanOrEqual(360 + 1e-9)
    expect(s1 * 6.4).toBeLessThanOrEqual(340 + 1e-9)
    const s2 = baseScale(500, 100)
    expect(s2 * 6.4).toBeLessThanOrEqual(100 + 1e-9)
  })

  it('ズームには上限と下限がある', () => {
    expect(clampZoom(100)).toBe(8)
    expect(clampZoom(0.001)).toBe(0.25)
    expect(clampZoom(1)).toBe(1)
  })
})
