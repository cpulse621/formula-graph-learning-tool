import { describe, expect, it } from 'vitest'
import { categories } from './catalog'

describe('学びのポイントと例', () => {
  it('すべての式・穴に短い説明がある', () => {
    for (const category of categories) {
      for (const formula of category.formulas) {
        expect(Object.keys(formula.learning.holeNotes).sort()).toEqual(formula.holes.map((hole) => hole.key).sort())
        expect(formula.learning.examples.length).toBeGreaterThan(0)
        for (const note of Object.values(formula.learning.holeNotes)) expect(note.length).toBeGreaterThan(0)
      }
    }
  })

  it('例は定義済みの穴だけを使い、入力できる範囲に収まる', () => {
    for (const category of categories) {
      for (const formula of category.formulas) {
        const holes = Object.fromEntries(formula.holes.map((hole) => [hole.key, hole]))
        for (const example of formula.learning.examples) {
          expect(Object.keys(example.values).sort()).toEqual(Object.keys(holes).sort())
          for (const [key, value] of Object.entries(example.values)) {
            const hole = holes[key]
            expect(hole, `${formula.id}:${example.id} の ${key}`).toBeDefined()
            expect(value).toBeGreaterThanOrEqual(hole.inputMin)
            expect(value).toBeLessThanOrEqual(hole.inputMax)
            expect(hole.excludedValues ?? []).not.toContain(value)
          }
        }
      }
    }
  })
})
