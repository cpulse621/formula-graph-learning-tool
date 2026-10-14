import { lineCoordinateSelection, lineInputPoints } from '../math/lineForms'
import { valueText } from '../math/format'

// 入力した座標なので「確かめる」オフでも表示。切片などの計算結果とは分ける。
export function LineInputPoints({ formulaId, values, holeKey }: {
  formulaId: string; values: Record<string, number>; holeKey: string
}) {
  const points = lineInputPoints(formulaId, values)
  const selected = lineCoordinateSelection(formulaId, values, holeKey)
  if (!points.length) return null
  return <div className="line-input-points" role="group" aria-label="入力した点の座標">
    <span className="line-input-caption">入力した点</span>
    <div className="line-input-list">{points.map((point, i) => <span key={i} className="line-input-point" data-point={i === 0 ? 'P' : 'Q'} data-selected={selected?.index === i}>
      <span aria-hidden="true">{i === 0 ? '●' : '■'}</span>
      <span>{i === 0 ? 'P' : 'Q'} = (</span>
      <span data-role="shift-x" data-selected={selected?.index === i && selected.axis === 'x'}>{valueText(point.x)}</span>
      <span>,</span>
      <span data-role="shift-y" data-selected={selected?.index === i && selected.axis === 'y'}>{valueText(point.y)}</span>
      <span>)</span>
    </span>)}</div>
  </div>
}
