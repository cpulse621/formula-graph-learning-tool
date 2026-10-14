import { describe, expect, it } from 'vitest'
import { formulaSummary } from './expression'

const sin = (a: number, b: number, c: number, d: number) => formulaSummary('sin', { a, b, c, d })

describe('追加した関数の1行表示', () => {
  it('指数の底と倍率を混同させない', () => {
    expect(formulaSummary('exponential', { a: 2, b: 2, p: 0, q: 1 })).toBe('y = 2 · 2^x + 1')
    expect(formulaSummary('exponential', { a: 1, b: 2, p: 2, q: 0 })).toBe('y = 2^(x − 2)')
  })
  it('分数・平方根・対数の移動の符号を表示する', () => {
    expect(formulaSummary('reciprocal', { a: 1, p: -2, q: -1 })).toBe('y = 1/(x + 2) − 1')
    expect(formulaSummary('sqrt', { a: -1, p: 2, q: 1 })).toBe('y = −√(x − 2) + 1')
    expect(formulaSummary('logarithm', { a: 1, b: 2, p: 0, q: 0 })).toBe('y = log_2(x)')
  })
  it('二次の項が0の一般の形を直線として表示する', () => {
    expect(formulaSummary('quadratic-standard', { a: 0, b: -2, c: 1 })).toBe('y = −2x + 1')
    expect(formulaSummary('quadratic-standard', { a: 1, b: -2, c: -3 })).toBe('y = x² − 2x − 3')
  })
})

describe('三角関数の1行表示', () => {
  it('初期値は y = sin(x)', () => {
    expect(sin(1, 1, 0, 0)).toBe('y = sin(x)')
  })
  it('例: y = 2 sin(x − π/4) + 1', () => {
    expect(sin(2, 1, -Math.PI / 4, 1)).toBe('y = 2 sin(x − π/4) + 1')
  })
  it('符号と係数をまとめる', () => {
    expect(sin(-1, 2, Math.PI / 3, -2)).toBe('y = −sin(2x + π/3) − 2')
    expect(sin(0.5, -1, 0, 0)).toBe('y = 0.5 sin(−x)')
  })
  it('b = 0 や a = 0 の特別な場合', () => {
    expect(sin(1, 0, 1.5, 0)).toBe('y = sin(1.5)')
    expect(sin(0, 1, 0, 3)).toBe('y = 3')
  })
  it('コサイン', () => {
    expect(formulaSummary('cos', { a: 3, b: 0.5, c: 0, d: 0 })).toBe('y = 3 cos(0.5x)')
  })
})

describe('円・直線・単位円の1行表示', () => {
  it('円', () => {
    expect(formulaSummary('circle', { p: 0, q: 0, r: 2 })).toBe('x² + y² = 4')
    expect(formulaSummary('circle', { p: 1, q: -2, r: 1.5 })).toBe('(x − 1)² + (y + 2)² = 2.25')
  })
  it('直線', () => {
    expect(formulaSummary('line', { m: 1, n: 0 })).toBe('y = x')
    expect(formulaSummary('line', { m: -2, n: 3 })).toBe('y = −2x + 3')
    expect(formulaSummary('line', { m: 0, n: -1 })).toBe('y = −1')
    expect(formulaSummary('line', { m: 0.5, n: -1.5 })).toBe('y = 0.5x − 1.5')
  })
  it('円: p=0 のとき x²、符号、整理した形(4-2 の例)', () => {
    expect(formulaSummary('circle', { p: 0, q: 0, r: 2 })).toBe('x² + y² = 4')
    expect(formulaSummary('circle', { p: 1, q: -2, r: 2 })).toBe('(x − 1)² + (y + 2)² = 4')
    expect(formulaSummary('circle', { p: -1.5, q: 0, r: 0.5 })).toBe('(x + 1.5)² + y² = 0.25')
    expect(formulaSummary('circle', { p: 0, q: 3, r: 1 })).toBe('x² + (y − 3)² = 1')
  })
  it('直線: m=1, −1, 0 と n=0 の境界(4-2 の例)', () => {
    expect(formulaSummary('line', { m: 1, n: 0.5 })).toBe('y = x + 0.5')
    expect(formulaSummary('line', { m: -1, n: 0 })).toBe('y = −x')
    expect(formulaSummary('line', { m: 0, n: 3 })).toBe('y = 3')
    expect(formulaSummary('line', { m: 2, n: -1 })).toBe('y = 2x − 1')
    expect(formulaSummary('line', { m: 0, n: 0 })).toBe('y = 0')
    expect(formulaSummary('line', { m: -1, n: -0.5 })).toBe('y = −x − 0.5')
    expect(formulaSummary('line', { m: 2.5, n: 0 })).toBe('y = 2.5x')
  })
  it('単位円', () => {
    expect(formulaSummary('unit-circle', { theta: 30 })).toBe('θ = 30° (π/6)')
    expect(formulaSummary('unit-circle', { theta: 0 })).toBe('θ = 0° (0)')
    expect(formulaSummary('unit-circle', { theta: -45 })).toBe('θ = −45° (−π/4)')
  })
})
