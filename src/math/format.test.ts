import { describe, expect, it } from 'vitest'
import { asPiFraction, clean, valueLatex, valueText } from './format'

describe('π の分数', () => {
  it('π/3 などを見つける', () => {
    expect(asPiFraction(Math.PI / 3)).toEqual({ num: 1, den: 3 })
    expect(asPiFraction((-2 * Math.PI) / 3)).toEqual({ num: -2, den: 3 })
    expect(asPiFraction(Math.PI)).toEqual({ num: 1, den: 1 })
    expect(asPiFraction(10 * (Math.PI / 12))).toEqual({ num: 5, den: 6 })
  })

  it('0 や、普通の小数は見つけない', () => {
    expect(asPiFraction(0)).toBeNull()
    expect(asPiFraction(1)).toBeNull()
    expect(asPiFraction(1.5)).toBeNull()
    expect(asPiFraction(0.5236)).toBeNull() // π/6 に近いが、ぴったりではない
  })

  it('周期 2π/|b|(b が小数でも分数になる)', () => {
    expect(asPiFraction((2 * Math.PI) / 1.5)).toEqual({ num: 4, den: 3 })
    expect(asPiFraction((2 * Math.PI) / 0.4)).toEqual({ num: 5, den: 1 })
  })
})

describe('表示用の文字', () => {
  it('valueText', () => {
    expect(valueText(0)).toBe('0')
    expect(valueText(Math.PI / 3)).toBe('π/3')
    expect(valueText(-Math.PI / 6)).toBe('−π/6')
    expect(valueText(2 * Math.PI)).toBe('2π')
    expect(valueText((3 * Math.PI) / 2)).toBe('3π/2')
    expect(valueText(-1.5)).toBe('−1.5')
    expect(valueText(0.1 + 0.2)).toBe('0.3')
  })

  it('valueLatex', () => {
    expect(valueLatex(Math.PI / 3)).toBe('\\frac{\\pi}{3}')
    expect(valueLatex(-Math.PI)).toBe('-\\pi')
    expect(valueLatex((5 * Math.PI) / 6)).toBe('\\frac{5\\pi}{6}')
    expect(valueLatex(3)).toBe('3')
  })

  it('clean は -0 を 0 にする', () => {
    expect(Object.is(clean(-0.0000001), 0)).toBe(true)
  })
})
