import type { Item } from '../components/FormulaCard'
import { lineCoordinateSelection, lineFromFormula, lineInputPoints } from '../math/lineForms'
import type { PlaneCtx } from './Plane'
import { curveStyleOf } from './curveStyle'
import { Arrow, EMPHASIS, Label } from './TrigLayer'
import { roleStyles } from './roles'

// 入力した点は常時表示。Pは丸、Qは四角でも区別する。座標の計算結果はカードへ。
export function PointLineMarks({ ctx, items, numbers, activeUid }: {
  ctx: PlaneCtx; items: Item[]; numbers: Record<number, number>; activeUid: number | null
}) {
  // 選択中の点を最後に描き、同じ場所に点を重ねても強調が隠れないようにする。
  const ordered = [...items.filter((item) => item.uid !== activeUid), ...items.filter((item) => item.uid === activeUid)]
  return <g>{ordered.flatMap((item) => {
    const selection = item.uid === activeUid ? lineCoordinateSelection(item.formulaId, item.values, item.holeKey) : null
    const points = lineInputPoints(item.formulaId, item.values).map((point, i) => ({ point, i }))
      .sort((a, b) => Number(a.i === selection?.index) - Number(b.i === selection?.index))
    return points.map(({ point, i }) => {
    const x = ctx.sx(point.x)
    const y = ctx.sy(point.y)
    if (x < -8 || x > ctx.w + 8 || y < -8 || y > ctx.h + 8) return null
    const color = curveStyleOf(numbers[item.uid]).color
    const selected = selection?.index === i
    const selectedColor = selection?.axis === 'x' ? roleStyles['shift-x'].color : roleStyles['shift-y'].color
    return <g key={`${item.uid}-${i}`} data-input-point={i === 0 ? 'P' : 'Q'}>
      {selected && <g data-selected-point={selection.name} data-selected-coordinate={selection.key}>
        {i === 0
          ? <circle cx={x} cy={y} r="11" fill="none" stroke={selectedColor} strokeWidth="3" />
          : <rect x={x - 10} y={y - 10} width="20" height="20" rx="3" fill="none" stroke={selectedColor} strokeWidth="3" />}
      </g>}
      {i === 0
        ? <circle cx={x} cy={y} r="5" fill={color} stroke="var(--panel)" strokeWidth="2" />
        : <rect x={x - 5} y={y - 5} width="10" height="10" fill={color} stroke="var(--panel)" strokeWidth="2" />}
      {/* 同じ点を使う式を重ねても文字が混ざらないよう、名前は選択中の式だけ。 */}
      {item.uid === activeUid && <Label x={Math.min(ctx.w - 45, Math.max(45, x + (i === 0 ? -15 : 15)))} y={Math.min(ctx.h - 60, Math.max(20, y + (i === 0 ? 25 : -15)))} text={`${numbers[item.uid]} ${i === 0 ? 'P' : 'Q'}`} color={color} anchor={i === 0 ? 'end' : 'start'} />}
    </g>
  })})}</g>
}

export function PointLineAux({ ctx, item }: { ctx: PlaneCtx; item?: Item }) {
  if (!item || (item.formulaId !== 'line-point' && item.formulaId !== 'line-two-points')) return null
  const { x1, y1, x2, y2, a } = item.values
  const selection = lineCoordinateSelection(item.formulaId, item.values, item.holeKey)
  if (selection) {
    const { point, axis, key } = selection
    const role = roleStyles[axis === 'x' ? 'shift-x' : 'shift-y']
    const x = ctx.sx(point.x)
    const y = ctx.sy(point.y)
    const fx = axis === 'x' ? x : ctx.sx(0)
    const fy = axis === 'x' ? ctx.sy(0) : y
    const symbol = `${axis}${selection.index === 0 ? '₁' : '₂'}`
    const footInView = fx >= 0 && fx <= ctx.w && fy >= 0 && fy <= ctx.h
    // 投影は細い破線。軸に沿った矢印は、その座標の原点からの位置を表す。
    return <g data-coordinate-guide={key}>
      <line data-coordinate-projection={key} x1={x} y1={y} x2={fx} y2={fy} stroke={role.color} strokeWidth="1.8" strokeDasharray="4 4" />
      <Arrow x1={ctx.sx(0)} y1={ctx.sy(0)} x2={fx} y2={fy} color={role.color} width={role.width} dash={role.dash} />
      <circle cx={fx} cy={fy} r="4" fill={role.color} stroke="var(--panel)" strokeWidth="2" />
      {footInView && <Label x={axis === 'x' ? Math.max(20, Math.min(ctx.w - 20, fx)) : Math.max(24, Math.min(ctx.w - 28, fx + 18))}
        y={axis === 'x' ? Math.max(20, Math.min(ctx.h - 60, fy + 32)) : Math.max(20, Math.min(ctx.h - 60, fy - 10))}
        text={symbol} color={role.color} />}
    </g>
  }
  if (item.formulaId === 'line-two-points' && !lineFromFormula(item.formulaId, item.values)) return null
  const pointSlope = item.formulaId === 'line-point'
  const toX = pointSlope ? x1 + 1 : x2
  const toY = pointSlope ? y1 + a : y2
  const xRole = pointSlope ? { color: 'var(--text-sub)', width: 1.5, dash: undefined } : roleStyles['shift-x']
  const yRole = pointSlope ? roleStyles.size : roleStyles['shift-y']
  // 座標を選んでいる間は上の投影を優先し、Δx・Δyを座標そのものに見せない。
  const emX = 1
  const emY = pointSlope && item.holeKey === 'a' ? EMPHASIS : 1
  return <g>
    {Math.abs(toX - x1) * ctx.scale >= 6 && <g>
      <Arrow x1={ctx.sx(x1)} y1={ctx.sy(y1)} x2={ctx.sx(toX)} y2={ctx.sy(y1)} color={xRole.color} width={xRole.width * emX} dash={xRole.dash} />
      <Label x={(ctx.sx(x1) + ctx.sx(toX)) / 2} y={ctx.sy(y1) + 20} text={pointSlope ? '1' : 'Δx'} color={xRole.color} strong={emX > 1} />
    </g>}
    {Math.abs(toY - y1) * ctx.scale >= 6 && <g>
      <Arrow x1={ctx.sx(toX)} y1={ctx.sy(y1)} x2={ctx.sx(toX)} y2={ctx.sy(toY)} color={yRole.color} width={yRole.width * emY} dash={yRole.dash} />
      <Label x={ctx.sx(toX) + 12} y={(ctx.sy(y1) + ctx.sy(toY)) / 2 + 5} text={pointSlope ? 'a' : 'Δy'} color={yRole.color} strong={emY > 1} anchor="start" />
    </g>}
  </g>
}
