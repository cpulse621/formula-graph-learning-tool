import { describe, expect, it } from 'vitest'
import {
  amplitude, evaluate, horizontalShift, maxValue, minValue, peakXs, period, type Sinusoid,
} from './trig'

const sin = (a: number, b: number, c: number, d: number): Sinusoid => ({ kind: 'sin', a, b, c, d })
const cos = (a: number, b: number, c: number, d: number): Sinusoid => ({ kind: 'cos', a, b, c, d })

describe('三角関数の性質', () => {
  it('a=2, b=2, c=0, d=1: 振幅2、周期π、最大3、最小−1', () => {
    const s = sin(2, 2, 0, 1)
    expect(amplitude(s)).toBe(2)
    expect(period(s)).toBeCloseTo(Math.PI, 12)
    expect(maxValue(s)).toBe(3)
    expect(minValue(s)).toBe(-1)
  })

  it('a が負のときも振幅は正', () => {
    expect(amplitude(sin(-3, 1, 0, 0))).toBe(3)
    expect(maxValue(sin(-3, 1, 0, 0))).toBe(3)
    expect(minValue(sin(-3, 1, 0, 0))).toBe(-3)
  })

  it('b が負のとき、周期は 2π/|b|', () => {
    expect(period(sin(1, -2, 0, 0))).toBeCloseTo(Math.PI, 12)
  })

  it('b = 0 のとき、周期と横の移動はなし', () => {
    expect(period(sin(1, 0, 1, 0))).toBeNull()
    expect(horizontalShift(sin(1, 0, 1, 0))).toBeNull()
  })

  it('横の移動 −c/b', () => {
    // y = sin(x − π/3) は右に π/3 動いたもの
    expect(horizontalShift(sin(1, 1, -Math.PI / 3, 0))).toBeCloseTo(Math.PI / 3, 12)
    // y = sin(2x + 1): −1/2
    expect(horizontalShift(sin(1, 2, 1, 0))).toBeCloseTo(-0.5, 12)
    // b が負: y = sin(−2x + 1): −1/(−2) = 1/2
    expect(horizontalShift(sin(1, -2, 1, 0))).toBeCloseTo(0.5, 12)
  })

  it('特別な角の値', () => {
    expect(evaluate(sin(1, 1, 0, 0), Math.PI / 6)).toBeCloseTo(0.5, 12)
    expect(evaluate(sin(1, 1, 0, 0), Math.PI / 2)).toBeCloseTo(1, 12)
    expect(evaluate(cos(1, 1, 0, 0), Math.PI / 3)).toBeCloseTo(0.5, 12)
    expect(evaluate(cos(1, 1, 0, 0), Math.PI)).toBeCloseTo(-1, 12)
    expect(evaluate(sin(1, 1, 0, 0), Math.PI / 4)).toBeCloseTo(Math.SQRT1_2, 12)
  })

  it('d と a が値に効く', () => {
    expect(evaluate(sin(2, 1, 0, 1), Math.PI / 2)).toBeCloseTo(3, 12)
    expect(evaluate(sin(2, 1, 0, 1), -Math.PI / 2)).toBeCloseTo(-1, 12)
  })
})

describe('山の位置', () => {
  it('y = sin x の山は π/2, 5π/2, ...', () => {
    const xs = peakXs(sin(1, 1, 0, 0), 0, 8)
    expect(xs).toHaveLength(2)
    expect(xs[0]).toBeCloseTo(Math.PI / 2, 12)
    expect(xs[1]).toBeCloseTo((5 * Math.PI) / 2, 12)
  })

  it('y = cos x の山は 0, 2π, ...', () => {
    const xs = peakXs(cos(1, 1, 0, 0), -1, 7)
    expect(xs[0]).toBeCloseTo(0, 12)
    expect(xs[1]).toBeCloseTo(2 * Math.PI, 12)
  })

  it('a が負なら、山と谷が入れ替わる(y = −sin x の山は −π/2 など)', () => {
    const xs = peakXs(sin(-1, 1, 0, 0), -4, 0)
    expect(xs).toHaveLength(1)
    expect(xs[0]).toBeCloseTo(-Math.PI / 2, 12)
  })

  it('山の位置では、実際に最大値になっている', () => {
    const s = sin(2, 3, 0.7, -1)
    for (const x of peakXs(s, -5, 5)) expect(evaluate(s, x)).toBeCloseTo(maxValue(s), 12)
    const t = cos(-1.5, -2, 1, 0.5)
    for (const x of peakXs(t, -5, 5)) expect(evaluate(t, x)).toBeCloseTo(maxValue(t), 12)
  })

  it('b = 0 や a = 0 では山がない', () => {
    expect(peakXs(sin(1, 0, 0, 0), -5, 5)).toEqual([])
    expect(peakXs(sin(0, 1, 0, 0), -5, 5)).toEqual([])
  })
})
