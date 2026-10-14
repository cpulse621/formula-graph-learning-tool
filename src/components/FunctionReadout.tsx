import { functionRows, type FunctionSpec } from '../math/functions'

export function FunctionReadout({ spec }: { spec: FunctionSpec }) {
  return <section className="pair function-readout" aria-label="確かめる: 関数の特徴">
    <dl className="pair-list">{functionRows(spec).map((row) => <div className={`pair-row${row.text.length > 28 || row.label.length > 12 ? ' is-long' : ''}`} key={row.label}>
      <dt>{row.label}</dt><dd>{row.text}</dd>
    </div>)}</dl>
  </section>
}
