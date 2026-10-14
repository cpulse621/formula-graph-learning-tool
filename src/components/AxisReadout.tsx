import { circleAxisRows, lineAxisRows } from '../math/axisText'
import { circleAxes, lineAxes } from '../math/circleLine'

type Props = {
  kind: 'circle' | 'line'
  values: Record<string, number>
}

// 「確かめる」オンのとき、そのカード自身の、軸・原点との共有点を出す。
// 確かめるための材料だけで、式の変形や解き方の途中は出さない。
export function AxisReadout({ kind, values }: Props) {
  const rows =
    kind === 'circle'
      ? circleAxisRows(circleAxes({ p: values.p, q: values.q, r: values.r }))
      : lineAxisRows(lineAxes({ m: values.m, n: values.n }))
  return (
    <section className="pair axis" aria-label="確かめる: 軸・原点との共有点">
      <dl className="pair-list">
        {rows.map((r) => (
          <div key={r.label} className={r.text === '' ? 'pair-row pair-row-solo' : 'pair-row'}>
            <dt>{r.label}</dt>
            {r.text !== '' && <dd>{r.text}</dd>}
          </div>
        ))}
      </dl>
    </section>
  )
}
