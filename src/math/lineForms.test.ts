import { describe, expect, it } from 'vitest'
import { additionalLines } from '../data/lineCatalog'
import { graphLineAxisRows, lineCoordinateSelection, lineEquation, lineFromFormula, lineInputPoints, verticalAxes } from './lineForms'
import { relateCircleLine } from './circleLine'

describe('同じ直線の入力形式', () => {
  it('4つの座標を入力点と軸に対応づける', () => {
    const v = { x1: -1, y1: 2, x2: 3, y2: -4 }
    for (const [key, name, axis, point] of [
      ['x1', 'P', 'x', { x: -1, y: 2 }], ['y1', 'P', 'y', { x: -1, y: 2 }],
      ['x2', 'Q', 'x', { x: 3, y: -4 }], ['y2', 'Q', 'y', { x: 3, y: -4 }],
    ] as const) {
      expect(lineCoordinateSelection('line-two-points', v, key)).toMatchObject({ key, name, axis, point })
    }
    expect(lineCoordinateSelection('line-point', v, 'x2')).toBeNull()
    expect(lineCoordinateSelection('line-point', v, 'a')).toBeNull()
    expect(lineCoordinateSelection('line', v, 'x1')).toBeNull()
  })
  it('原点・重なった点でも選んだP/Qを区別する', () => {
    expect(lineCoordinateSelection('line-two-points', { x1: 0, y1: 0, x2: 0, y2: 0 }, 'y2')).toMatchObject({ name: 'Q', axis: 'y', point: { x: 0, y: 0 } })
  })
  it('1点と傾きを y=ax+b へ変換する', () => {
    expect(lineFromFormula('line-point', { a: 0.5, x1: 1, y1: 2 })).toEqual({ m: 0.5, n: 1.5 })
    expect(lineEquation('line-point', { a: 0.5, x1: 1, y1: 2 }, 'slope')).toEqual({ text: 'y=\\frac{1}{2}x+\\frac{3}{2}', approximate: false })
  })
  it('2点から正確な分数を表示し、順序を逆にしても同じ直線になる', () => {
    const v = { x1: 0, y1: 1, x2: 3, y2: 2 }
    const reverse = { x1: 3, y1: 2, x2: 0, y2: 1 }
    expect(lineEquation('line-two-points', v, 'slope')).toEqual({ text: 'y=\\frac{1}{3}x+1', approximate: false })
    expect(lineEquation('line-two-points', reverse, 'slope')).toEqual(lineEquation('line-two-points', v, 'slope'))
    expect(lineEquation('line-two-points', v, 'point')?.text).toBe('y-1=\\frac{1}{3}(x)')
  })
  it('小数の座標でも傾きを正確に約分する', () => {
    expect(lineEquation('line-two-points', { x1: 0.1, y1: 0.2, x2: 0.4, y2: 0.3 }, 'slope')).toEqual({ text: 'y=\\frac{1}{3}x+\\frac{1}{6}', approximate: false })
  })
  it('水平・右下がり・負の座標の符号を整理する', () => {
    expect(lineEquation('line-point', { a: 0, x1: 1, y1: 2 }, 'slope')?.text).toBe('y=2')
    expect(lineEquation('line-point', { a: -1, x1: -2, y1: -3 }, 'point')?.text).toBe('y+3=-(x+2)')
    expect(lineEquation('line', { m: 1, n: -2 }, 'slope')?.text).toBe('y=x-2')
  })
  it('縦の直線を傾きの無限大として扱わない', () => {
    const v = { x1: 2, y1: -1, x2: 2, y2: 3 }
    expect(lineFromFormula('line-two-points', v)).toEqual({ x: 2 })
    expect(lineEquation('line-two-points', v, 'slope')?.text).toBe('x=2')
    expect(graphLineAxisRows({ x: 2 })).toEqual([{ label: 'x切片', text: '(2, 0)' }, { label: 'y軸と交わらない', text: '' }])
    expect(verticalAxes(0)).toEqual({ marks: [], ring: false })
    expect(graphLineAxisRows({ x: 0 })[1].label).toBe('y軸と重なっている')
  })
  it('重なった2点では直線を返さず、点だけ残す', () => {
    const v = { x1: 2, y1: 3, x2: 2, y2: 3 }
    expect(lineFromFormula('line-two-points', v)).toBeNull()
    expect(lineEquation('line-two-points', v, 'point')).toBeNull()
    expect(lineInputPoints('line-two-points', v)).toHaveLength(2)
  })
  it('ほぼ縦の直線を縦と誤判定せず、長い分数は近似と明示する', () => {
    const v = { x1: 0, y1: 1, x2: 0.0000000001, y2: 2 }
    expect(lineFromFormula('line-two-points', v)).toEqual({ m: 1e10, n: 1 })
    const equation = lineEquation('line-two-points', v, 'slope')!
    expect(equation.approximate).toBe(true)
    expect(equation.text).toContain('\\approx')
    expect(equation.text).not.toMatch(/NaN|Infinity/)
  })
  for (const def of additionalLines) for (const example of def.learning.examples) {
    it(`${def.title}「${example.label}」は入力した点を通る`, () => {
      const l = lineFromFormula(def.id, example.values)!
      for (const p of lineInputPoints(def.id, example.values)) {
        if ('x' in l) expect(p.x).toBe(l.x)
        else expect(l.m * p.x + l.n).toBeCloseTo(p.y, 10)
      }
    })
  }
})

describe('縦の直線と円の交点', () => {
  it('2点で交わる場合の座標と判別式', () => {
    const rel = relateCircleLine({ p: 0, q: 0, r: 2 }, { x: 1 })
    expect(rel.D).toBe(12)
    expect(rel.count).toBe(2)
    expect(rel.points[0].y).toBeCloseTo(-Math.sqrt(3))
    expect(rel.points[1].y).toBeCloseTo(Math.sqrt(3))
  })
  it('接する場合と交わらない場合', () => {
    const c = { p: 1, q: 2, r: 3 }
    expect(relateCircleLine(c, { x: 4 }).points).toEqual([{ x: 4, y: 2 }])
    expect(relateCircleLine(c, { x: 5 }).count).toBe(0)
    expect(relateCircleLine(c, { x: 1 }).points).toEqual([{ x: 1, y: -1 }, { x: 1, y: 5 }])
  })
  it('ほぼ縦の直線でも交点計算で桁落ちしない', () => {
    const rel = relateCircleLine({ p: 0, q: 0, r: 2 }, { m: 1e10, n: 1 })
    expect(rel.count).toBe(2)
    for (const pt of rel.points) expect(pt.x ** 2 + pt.y ** 2).toBeCloseTo(4, 10)
    expect(rel.distance).toBeCloseTo(1e-10, 15)
  })
})
