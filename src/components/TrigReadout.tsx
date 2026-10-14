import type { SinusoidKind } from '../math/trig'
import { amplitude, horizontalShift, maxValue, minValue, period } from '../math/trig'
import { valueLatex } from '../math/format'
import { Formula } from './Formula'

type Props = {
  kind: SinusoidKind
  values: Record<string, number>
}

// 「確かめる」がオンのとき、振幅・周期・横の移動・最大値・最小値を出す
export function TrigReadout({ kind, values }: Props) {
  const s = { kind, a: values.a, b: values.b, c: values.c, d: values.d }
  const T = period(s)
  const shift = horizontalShift(s)
  const rows: { role: string; label: string; expr: string; value: string }[] = [
    { role: 'size', label: '振幅', expr: '|a|', value: valueLatex(amplitude(s)) },
    { role: 'stretch', label: '周期', expr: 'T = \\dfrac{2\\pi}{|b|}', value: T === null ? '\\text{なし}' : valueLatex(T) },
    { role: 'shift-x', label: '横の移動', expr: '-\\dfrac{c}{b}', value: shift === null ? '\\text{なし}' : valueLatex(shift) },
    { role: 'shift-y', label: '最大値', expr: '|a| + d', value: valueLatex(maxValue(s)) },
    { role: 'shift-y', label: '最小値', expr: '-|a| + d', value: valueLatex(minValue(s)) },
  ]
  return (
    <dl className="readout" aria-label="確かめる: 求めた値">
      {rows.map((r) => (
        <div key={r.label} className={`readout-row role-${r.role}`}>
          <dt>{r.label}</dt>
          <dd>
            <Formula latex={`${r.expr} = ${r.value}`} />
          </dd>
        </div>
      ))}
    </dl>
  )
}
