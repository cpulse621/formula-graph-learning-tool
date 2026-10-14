import { describe, expect, it } from 'vitest'
import { inputText, parseInput, snapSlider } from './input'

describe('スライダーの値の丸め', () => {
  it('刻みの桁で丸める(誤差を出さない)', () => {
    expect(snapSlider(0.1 + 0.2, 0.1, false)).toBe(0.3)
    expect(snapSlider(2.9000000000000004, 0.1, false)).toBe(2.9)
    expect(snapSlider(1.5, 0.5, false)).toBe(1.5)
    expect(snapSlider(-0.30000000000000004, 0.1, false)).toBe(-0.3)
  })

  it('π刻みは、刻みの整数倍にそろえる', () => {
    const step = Math.PI / 12
    expect(snapSlider(4 * step + 1e-12, step, true)).toBe(4 * step)
  })
})

describe('数値入力の確定', () => {
  it('入力途中・数でない文字は確定しない(null)', () => {
    expect(parseInput('', -100, 100)).toBeNull()
    expect(parseInput('-', -100, 100)).toBeNull()
    expect(parseInput('.', -100, 100)).toBeNull()
    expect(parseInput('abc', -100, 100)).toBeNull()
    expect(parseInput('1e999', -100, 100)).toBeNull() // Infinity
    expect(parseInput('NaN', -100, 100)).toBeNull()
  })

  it('1. など、数として読める途中の文字は確定できる', () => {
    expect(parseInput('1.', -100, 100)).toBe(1)
    expect(parseInput(' 2.5 ', -100, 100)).toBe(2.5)
    expect(parseInput('-0.5', -100, 100)).toBe(-0.5)
  })

  it('範囲の外は、端に止める(±100)', () => {
    expect(parseInput('150', -100, 100)).toBe(100)
    expect(parseInput('-150', -100, 100)).toBe(-100)
    expect(parseInput('100', -100, 100)).toBe(100)
    expect(parseInput('0', 0.01, 100)).toBe(0.01) // 半径は 0 より大きい
  })

  it('π/3 の値を桁をそろえて打つと、π/3 として扱える', () => {
    expect(Math.abs(parseInput('1.0471975511965976', -100, 100)! - Math.PI / 3)).toBeLessThan(1e-9)
  })

  it('小数は刻みに合わせず、そのまま使う(0.25 は 0.25)', () => {
    expect(parseInput('0.25', -3, 3)).toBe(0.25)
    expect(inputText(0.30000000000000004)).toBe('0.3')
    expect(Object.is(parseInput('-0', -3, 3), 0)).toBe(true)
  })
})
