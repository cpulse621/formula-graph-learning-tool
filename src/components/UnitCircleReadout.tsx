import { valueText } from '../math/format'
import { TAN_UNDEFINED, angleBoth, degToRad, normalizeDeg, trigDisplay } from '../math/unitCircle'
import { Formula } from './Formula'

// 「確かめる」オンのとき、単位円のカードの下に出す。確かめるための材料だけで、式の変形は出さない。
// 特別な角は正確な値、それ以外は小数第4位まで。
export function UnitCircleReadout({ theta }: { theta: number }) {
  const both = angleBoth(theta)
  const norm = normalizeDeg(theta)
  const v = trigDisplay(theta)
  const same = norm !== theta ? `(0°〜360° では ${valueText(norm)}° = ${valueText(degToRad(norm))})` : ''
  return (
    <dl className="readout" aria-label="確かめる: 単位円の値">
      <div className="readout-row">
        <dt>角度</dt>
        <dd>
          {both.deg} = {both.rad} {same}
        </dd>
      </div>
      <div className="readout-row">
        <dt>点 P の座標</dt>
        <dd>
          <Formula latex={`\\left(${v.cos.latex},\\ ${v.sin.latex}\\right)`} />
        </dd>
      </div>
      <div className="readout-row">
        <dt>sin θ</dt>
        <dd><Formula latex={v.sin.latex} /></dd>
      </div>
      <div className="readout-row">
        <dt>cos θ</dt>
        <dd><Formula latex={v.cos.latex} /></dd>
      </div>
      <div className="readout-row">
        <dt>tan θ</dt>
        <dd>{v.tan === null ? TAN_UNDEFINED : <Formula latex={v.tan.latex} />}</dd>
      </div>
    </dl>
  )
}
