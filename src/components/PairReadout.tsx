import {
  formatDiscriminant, formatPoints, relateCircleLine, roundText, type Circle,
} from '../math/circleLine'
import type { GraphLine } from '../math/lineForms'

export type Pair = {
  circleNumber: number
  lineNumber: number
  circle: Circle
  line: GraphLine
}

// 番号を ① ② … で出す(21 以上は (21) の形)
function circled(n: number): string {
  return n >= 1 && n <= 20 ? String.fromCodePoint(0x2460 + n - 1) : `(${n})`
}

// 「確かめる」オンのとき、円と直線の1組ごとに出す、確かめるための材料。
// (式の変形や解き方の途中は出さない)
export function PairReadout({ pair }: { pair: Pair }) {
  const rel = relateCircleLine(pair.circle, pair.line)
  const judge = rel.count === 2 ? '交点 2 個' : rel.count === 1 ? '接する(1 個)' : '交点なし'
  return (
    <section className="pair" aria-label={`確かめる: ${pair.circleNumber}番の円と${pair.lineNumber}番の直線`}>
      <h3 className="pair-title">
        {circled(pair.circleNumber)} 円 と {circled(pair.lineNumber)} 直線
      </h3>
      <p className="pair-judge">{judge}</p>
      <dl className="pair-list">
        <div className="pair-row">
          <dt>判別式</dt>
          <dd>D = {formatDiscriminant(rel)}</dd>
        </div>
        {rel.count > 0 && (
          <div className="pair-row">
            <dt>交点</dt>
            <dd>{formatPoints(rel.points)}</dd>
          </div>
        )}
        <div className="pair-row">
          <dt>中心から直線までの距離</dt>
          <dd>
            d = {roundText(rel.distance, 4)}(半径 r = {roundText(pair.circle.r, 4)})
          </dd>
        </div>
      </dl>
    </section>
  )
}
