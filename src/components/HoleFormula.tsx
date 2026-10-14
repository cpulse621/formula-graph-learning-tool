import type { FormulaDef, TemplatePart } from '../data/catalog'
import { valueText } from '../math/format'
import { degToRad } from '../math/unitCircle'
import { Formula } from './Formula'

type Props = {
  def: FormulaDef
  values: Record<string, number>
  selectedKey: string
  angleUnit: 'deg' | 'rad' // 角度の穴を、度で見せるか、ラジアンで見せるか
  onSelect: (key: string) => void
}

// 穴の入った式。固定の部分は KaTeX、穴は役割の色の枠つきの箱(中に今の数値)。
// 箱を押すと、その穴が選ばれる。
export function HoleFormula({ def, values, selectedKey, angleUnit, onSelect }: Props) {
  function renderParts(parts: TemplatePart[]): React.ReactNode {
    return parts.map((part, i) => {
        const previous = parts[i - 1]
        const next = parts[i + 1]
        // 演算子と次の数の箱を一緒に折り返す。箱だけが次の行へ取り残されるのを防ぐ。
        if ('hole' in part && previous && 'tex' in previous && /[+-]\s*$/.test(previous.tex)) return null
        if ('tex' in part) {
          // 度の「°」など、角度の単位が合うときだけ出す部分
          if (part.unit && part.unit !== angleUnit) return null
          if (/[+-]\s*$/.test(part.tex) && next && 'hole' in next) {
            return <span key={i} className="math-term">{renderParts([part])}{renderParts([next])}</span>
          }
          return <Formula key={i} latex={part.tex} />
        }
        if ('group' in part) return <span key={i} className="math-term">{renderParts(part.group)}</span>
        if ('fraction' in part) return <span key={i} className="math-fraction" role="group" aria-label="分数">
          <span role="group" aria-label="分子">{renderParts(part.fraction.numerator)}</span><span role="group" aria-label="分母">{renderParts(part.fraction.denominator)}</span>
        </span>
        if ('radicand' in part) return <span key={i} className="math-root" role="group" aria-label="平方根"><span aria-hidden="true">√</span><span>{renderParts(part.radicand)}</span></span>
        if ('exponent' in part) return <sup key={i} className="math-exponent" role="group" aria-label="指数">{renderParts(part.exponent)}</sup>
        if ('subscript' in part) return <sub key={i} className="math-subscript" role="group" aria-label="対数の底">{renderParts(part.subscript)}</sub>
        const hole = def.holes.find((h) => h.key === part.hole)!
        const selected = hole.key === selectedKey
        const shown = hole.display === 'angle' && angleUnit === 'rad'
          ? valueText(degToRad(values[hole.key]))
          : valueText(values[hole.key])
        return (
          <button
            key={i}
            type="button"
            className="hole"
            data-labelled={hole.showSymbol || undefined}
            data-hole-key={hole.key}
            data-role={hole.role}
            aria-pressed={selected}
            aria-label={`${hole.name}、今の値 ${shown}${hole.display === 'angle' ? (angleUnit === 'deg' ? '度' : 'ラジアン') : ''}`}
            onClick={() => onSelect(hole.key)}
          >
            {hole.showSymbol && <span className="hole-symbol" aria-hidden="true"><Formula latex={hole.symbol} /></span>}
            <span className="hole-value">{shown}</span>
          </button>
        )
      })
  }
  return (
    <div className="hole-formula" role="group" aria-label="式。数値の箱を押すと、その数を調整できます">
      {renderParts(def.template)}
      {/* 度のときは、ラジアンの値も小さく並べる(例: 30° = π/6) */}
      {angleUnit === 'deg' &&
        def.holes.filter((h) => h.display === 'angle').map((h) => (
          <span key={h.key} className="angle-alt">
            ({valueText(values[h.key])}° = {valueText(degToRad(values[h.key]))})
          </span>
        ))}
    </div>
  )
}
