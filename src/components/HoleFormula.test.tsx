// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { categories, type TemplatePart } from '../data/catalog'
import { HoleFormula } from './HoleFormula'

afterEach(cleanup)
function occurrences(parts: TemplatePart[]): string[] {
  return parts.flatMap((part) => 'hole' in part ? [part.hole] : 'tex' in part ? []
    : 'fraction' in part ? [...occurrences(part.fraction.numerator), ...occurrences(part.fraction.denominator)]
    : occurrences('group' in part ? part.group : 'exponent' in part ? part.exponent : 'subscript' in part ? part.subscript : part.radicand))
}
describe('折り返しを考慮した数式', () => {
  for (const def of categories.flatMap((category) => category.formulas)) {
    it(`${def.title}の穴が、式の指定どおりに表示される`, () => {
      render(<HoleFormula def={def} values={Object.fromEntries(def.holes.map((hole) => [hole.key, hole.default]))}
        selectedKey={def.holes[0].key} angleUnit="deg" onSelect={() => {}} />)
      const buttons = screen.getAllByRole('button')
      const keys = occurrences(def.template)
      expect(buttons).toHaveLength(keys.length)
      expect(buttons.filter((button) => button.getAttribute('aria-pressed') === 'true')).toHaveLength(keys.filter((key) => key === def.holes[0].key).length)
      for (const hole of def.holes) expect(screen.getAllByRole('button', { name: new RegExp(`^${hole.name}、今の値`) })).toHaveLength(keys.filter((key) => key === hole.key).length)
    })
  }
})
