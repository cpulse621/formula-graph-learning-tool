// 「確かめる」の欄に出す、軸・原点との共有点の文字。座標は小数第2位まで。
import { formatPoints, type CircleAxes, type LineAxes } from './circleLine'

export type AxisRow = { label: string; text: string }

function circleAxisRow(axis: 'x' | 'y', hit: CircleAxes['x']): AxisRow {
  const name = `${axis}軸`
  if (hit.kind === 'tangent') return { label: `${name}に接する(1 個)`, text: formatPoints(hit.points) }
  if (hit.kind === 'two') return { label: `${name}との共有点`, text: `2 個  ${formatPoints(hit.points)}` }
  return { label: `${name}との共有点`, text: 'なし' }
}

/** 円のカードに出す行。原点を通るときは、「原点を通る」の行を足す(共有点の数には含めて表示する) */
export function circleAxisRows(ax: CircleAxes): AxisRow[] {
  const rows = [circleAxisRow('x', ax.x), circleAxisRow('y', ax.y)]
  if (ax.throughOrigin) rows.push({ label: '原点を通る', text: '' })
  return rows
}

/** 直線のカードに出す行 */
export function lineAxisRows(ax: LineAxes): AxisRow[] {
  const rows: AxisRow[] = []
  if (ax.xAxis === 'cross' && ax.xIntercept) {
    rows.push({ label: 'x切片', text: formatPoints([ax.xIntercept]) })
  } else if (ax.xAxis === 'parallel') {
    rows.push({ label: 'x軸と交わらない', text: '' })
  } else {
    rows.push({ label: 'x軸と重なっている', text: '' })
  }
  rows.push({ label: 'y切片', text: formatPoints([ax.yIntercept]) })
  if (ax.ring) rows.push({ label: '原点を通る', text: '' })
  return rows
}
