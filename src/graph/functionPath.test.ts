import { describe, expect, it } from 'vitest'
import { categories } from '../data/catalog'
import { functionPath, functionSegments } from './functionPath'
import type { PlaneCtx } from './Plane'
const ctx: PlaneCtx = { w: 390, h: 300, scale: 30, xMin: -6.5, xMax: 6.5, yMin: -5, yMax: 5, sx: (x) => 195 + 30 * x, sy: (y) => 150 - 30 * y }

describe('共通の関数の描画', () => {
  it('分数関数の枝を、サンプル間にある不連続点でも分ける', () => {
    const segments = functionSegments(ctx, { kind: 'reciprocal', values: { a: 1, p: 0.1234, q: 0 } })
    expect(segments).toHaveLength(2)
    expect(segments[0].every((p) => p.x < 0.1234)).toBe(true)
    expect(segments[1].every((p) => p.x > 0.1234)).toBe(true)
  })
  it('平方根の端点を正確に含め、負の範囲を描かない', () => {
    const segments = functionSegments(ctx, { kind: 'sqrt', values: { a: 1, p: 0.1234, q: 2 } })
    expect(segments[0][0]).toEqual({ x: 0.1234, y: 2 })
    expect(segments.flat().every((p) => p.x >= 0.1234)).toBe(true)
  })
  it('対数の範囲を守り、底1は描かない', () => {
    const spec = { kind: 'logarithm' as const, values: { a: 1, b: 2, p: 1, q: 0 } }
    expect(functionSegments(ctx, spec).flat().every((p) => p.x > 1)).toBe(true)
    expect(functionPath(ctx, { ...spec, values: { ...spec.values, b: 1 } })).toBe('')
  })
  it('tan は全ての枝を分け、負の係数でも漸近線をまたがない', () => {
    for (const b of [2, -2, 100]) {
      const spec = { kind: 'tan' as const, values: { a: 1, b, c: 0.1234, d: 0 } }
      const branches = functionSegments(ctx, spec)
      expect(branches.length).toBeGreaterThan(2)
      for (const branch of branches) {
        const poleIndex = (x: number) => Math.floor((b * x + 0.1234 - Math.PI / 2) / Math.PI)
        expect(poleIndex(branch[0].x)).toBe(poleIndex(branch.at(-1)!.x))
      }
    }
  })
  it('定数に退化した場合も有限に描き、全域が未定義の tan は描かない', () => {
    expect(functionPath(ctx, { kind: 'tan', values: { a: 1, b: 0, c: Math.PI / 2, d: 0 } })).toBe('')
    expect(functionPath(ctx, { kind: 'reciprocal', values: { a: 0, p: 1, q: 0 } })).not.toMatch(/NaN|Infinity/)
    expect(functionPath(ctx, { kind: 'exponential', values: { a: 1, b: 1, p: 1, q: 0 } })).toMatch(/^M/)
  })
  it('全ての例の線は有限な座標で、画面外へ暴走しない', () => {
    for (const def of categories.flatMap((c) => c.formulas).filter((f) => f.functionKind)) {
      for (const example of def.learning.examples) {
        const path = functionPath(ctx, { kind: def.functionKind!, values: example.values })
        expect(path).not.toMatch(/NaN|Infinity/)
        for (const match of path.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)) {
          expect(Number(match[1])).toBeGreaterThanOrEqual(-0.01)
          expect(Number(match[1])).toBeLessThanOrEqual(ctx.w + 0.01)
          expect(Number(match[2])).toBeGreaterThanOrEqual(-0.01)
          expect(Number(match[2])).toBeLessThanOrEqual(ctx.h + 0.01)
        }
      }
    }
  })
})
