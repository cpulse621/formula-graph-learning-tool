import { useState } from 'react'
import { graphLineAxisRows, lineEquation, lineFromFormula, type LineForm } from '../math/lineForms'
import { Formula } from './Formula'

export function LineReadout({ formulaId, values }: { formulaId: string; values: Record<string, number> }) {
  const [form, setForm] = useState<LineForm>('slope')
  const line = lineFromFormula(formulaId, values)
  const equation = lineEquation(formulaId, values, form)
  if (!line || !equation) return null
  return <>
    <section className="pair" aria-label="確かめる: 同じ直線の式">
      <h3 className="pair-title">同じ直線の式</h3>
      {!('x' in line) && <div className="line-form-buttons" role="group" aria-label="式の形">
        <button type="button" className="btn" aria-pressed={form === 'slope'} onClick={() => setForm('slope')}>y=ax+b</button>
        <button type="button" className="btn" aria-pressed={form === 'point'} onClick={() => setForm('point')}>1点と傾き</button>
      </div>}
      <div className="line-equation"><Formula latex={equation.text} /></div>
      <p className="line-note">式の形を変えても、グラフは同じです。{equation.approximate && '係数は有効数字6桁の近似値です。'}</p>
    </section>
    <section className="pair axis" aria-label="確かめる: 軸・原点との共有点">
      <h3 className="pair-title">軸との交点（◇）</h3>
      <p className="line-note axis-point-note">直線と軸が交わる位置です。入力した点と同じ位置になることもあります。</p>
      <dl className="pair-list">{graphLineAxisRows(line).map((row) => <div key={row.label} className={row.text ? 'pair-row' : 'pair-row pair-row-solo'}>
        <dt>{row.label}</dt>{row.text && <dd>{row.text}</dd>}
      </div>)}</dl>
    </section>
  </>
}
