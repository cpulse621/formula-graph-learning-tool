import { describe, expect, it } from 'vitest'
import { categories } from '../data/catalog'
import { discontinuities, evaluateFunction, featurePoint, functionRows, xIntercepts, type FunctionSpec } from './functions'
const values = { a: 2, b: 2, c: -3, d: 1, p: 2, q: 1 }

describe('高校で使う関数', () => {
  it.each([
    ['quadratic', 3, 3], ['quadratic-standard', 2, 9], ['cubic', 0, -15],
    ['reciprocal', 3, 3], ['absolute', 1, 3], ['sqrt', 6, 5], ['exponential', 5, 17], ['logarithm', 6, 5],
  ] as const)('%s の値を計算する', (kind, x, expected) => expect(evaluateFunction({ kind, values }, x)).toBeCloseTo(expected))

  it('タンジェントの周期と定義できない場所を扱う', () => {
    const spec: FunctionSpec = { kind: 'tan', values: { a: 1, b: 2, c: 0, d: 0 } }
    expect(evaluateFunction(spec, Math.PI / 8)).toBeCloseTo(1)
    expect(evaluateFunction(spec, Math.PI / 4)).toBeNull()
    expect(discontinuities(spec, -Math.PI, Math.PI)).toEqual([-3 * Math.PI / 4, -Math.PI / 4, Math.PI / 4, 3 * Math.PI / 4])
    expect(functionRows(spec).find((r) => r.label === '周期')?.text).toBe('π/2')
    const reversed: FunctionSpec = { kind: 'tan', values: { ...spec.values, b: -2 } }
    expect(discontinuities(reversed, -Math.PI, Math.PI)).toEqual(discontinuities(spec, -Math.PI, Math.PI))
  })

  it('定義域と底の制約を守り、0倍でも穴を埋めない', () => {
    expect(evaluateFunction({ kind: 'reciprocal', values: { ...values, a: 0 } }, 2)).toBeNull()
    expect(evaluateFunction({ kind: 'sqrt', values }, 1)).toBeNull()
    expect(evaluateFunction({ kind: 'sqrt', values }, 2)).toBe(1)
    expect(evaluateFunction({ kind: 'logarithm', values }, 2)).toBeNull()
    for (const b of [0, -1, 1]) expect(evaluateFunction({ kind: 'logarithm', values: { ...values, b } }, 3)).toBeNull()
    expect(evaluateFunction({ kind: 'exponential', values: { ...values, b: 0 } }, 3)).toBeNull()
    expect(evaluateFunction({ kind: 'exponential', values: { ...values, b: 1 } }, 3)).toBe(3)
  })

  it('二次関数の共有点と頂点、一次関数への退化を確認する', () => {
    const spec: FunctionSpec = { kind: 'quadratic-standard', values: { a: 1, b: -2, c: -3 } }
    expect(xIntercepts(spec)).toEqual([-1, 3])
    expect(featurePoint(spec)).toEqual({ x: 1, y: -4, label: '頂点' })
    expect(xIntercepts({ ...spec, values: { a: 1, b: -2, c: 1 } })).toEqual([1])
    expect(xIntercepts({ ...spec, values: { a: 1, b: 0, c: 1 } })).toEqual([])
    expect(xIntercepts({ ...spec, values: { a: 0, b: 2, c: -4 } })).toEqual([2])
    expect(featurePoint({ ...spec, values: { a: 0, b: 2, c: -4 } })).toBeNull()
  })

  it('全ての典型例の共有点と特徴点は、式の計算と一致する', () => {
    for (const def of categories.flatMap((c) => c.formulas).filter((f) => f.functionKind)) {
      for (const example of def.learning.examples) {
        const spec = { kind: def.functionKind!, values: example.values }
        for (const x of xIntercepts(spec) ?? []) expect(evaluateFunction(spec, x), `${def.id}:${example.id}`).toBeCloseTo(0, 8)
        const p = featurePoint(spec)
        if (p) expect(evaluateFunction(spec, p.x)).toBeCloseTo(p.y, 8)
        expect(functionRows(spec).every((r) => !/NaN|Infinity/.test(r.text))).toBe(true)
      }
    }
  })
})
