import { discontinuities, evaluateFunction, featurePoint, xIntercepts, type FunctionSpec, type Point } from '../math/functions'
import { curveStyleOf } from './curveStyle'
import { functionPath, functionSegments } from './functionPath'
import type { PlaneCtx } from './Plane'
import { Arrow, Label } from './TrigLayer'
import { roleStyles } from './roles'

export type FunctionCurve = { uid: number; number: number; spec: FunctionSpec }
const visible = (ctx: PlaneCtx, p: Point) => p.x >= ctx.xMin && p.x <= ctx.xMax && p.y >= ctx.yMin && p.y <= ctx.yMax

export function FunctionCurves({ ctx, curves }: { ctx: PlaneCtx; curves: FunctionCurve[] }) {
  return <g>{curves.map((c) => {
    const st = curveStyleOf(c.number)
    const segments = functionSegments(ctx, c.spec)
    const y0 = evaluateFunction(c.spec, 0)
    const points = [...(xIntercepts(c.spec, ctx.xMin, ctx.xMax) ?? []).map((x) => ({ x, y: 0 })),
      ...(y0 === null ? [] : [{ x: 0, y: y0 }])]
      .filter((p, i, all) => visible(ctx, p) && all.findIndex((q) => Math.abs(p.x - q.x) < 1e-9 && Math.abs(p.y - q.y) < 1e-9) === i)
    let badge: Point | undefined
    // 上の操作ボタン・下のズームを避け、曲線上の実際の点に番号を置く。
    for (const branch of segments) for (const p of branch) {
      if (visible(ctx, p) && ctx.sy(p.y) > 72 && ctx.sy(p.y) < ctx.h - 60
        && (!badge || Math.abs(ctx.sx(p.x) - (ctx.w - 56)) < Math.abs(ctx.sx(badge.x) - (ctx.w - 56)))) badge = p
    }
    return <g key={c.uid} data-function={c.spec.kind}>
      <path className="function-curve" d={functionPath(ctx, c.spec, segments)} fill="none" stroke={st.color} strokeWidth={st.width}
        strokeDasharray={st.dash} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => <g key={i} transform={`translate(${ctx.sx(p.x)},${ctx.sy(p.y)})`}>
        {p.x === 0 && p.y === 0 ? <circle r="7" fill="var(--panel)" stroke={st.color} strokeWidth="2.5" />
          : <path d="M0,-6 L6,0 L0,6 L-6,0 Z" fill={st.color} stroke="var(--panel)" strokeWidth="2" />}
      </g>)}
      {c.spec.kind === 'reciprocal' && c.spec.values.a === 0 && visible(ctx, { x: c.spec.values.p, y: c.spec.values.q }) &&
        <circle cx={ctx.sx(c.spec.values.p)} cy={ctx.sy(c.spec.values.q)} r="5" fill="var(--panel)" stroke={st.color} strokeWidth="2" />}
      {badge && <g transform={`translate(${ctx.sx(badge.x)},${ctx.sy(badge.y)})`}>
        <circle r="11" fill="var(--panel)" stroke={st.color} strokeWidth="2.5" />
        <text y="4.5" textAnchor="middle" className="plane-badge">{c.number}</text>
      </g>}
    </g>
  })}</g>
}

export function FunctionAux({ ctx, curves, activeUid, holeKey }: { ctx: PlaneCtx; curves: FunctionCurve[]; activeUid: number | null; holeKey: string | null }) {
  const curve = curves.find((c) => c.uid === activeUid)
  if (!curve) return null
  const { spec } = curve, { kind, values: v } = spec
  const point = featurePoint(spec)
  const poles = (kind === 'reciprocal' || kind === 'logarithm') && v.a !== 0
    ? [v.p] : kind === 'tan' && v.a !== 0 ? discontinuities(spec, ctx.xMin, ctx.xMax) : []
  const horizontal = v.a !== 0 && (kind === 'reciprocal' || kind === 'exponential' && v.b !== 1) ? v.q : null
  const labelledPole = poles.reduce<number | null>((nearest, x) => nearest === null || Math.abs(x) < Math.abs(nearest) ? x : nearest, null)
  return <g>
    {poles.map((x) => <g key={x}>
      <line x1={ctx.sx(x)} y1="0" x2={ctx.sx(x)} y2={ctx.h} stroke="var(--text-sub)" strokeDasharray="5 5" strokeWidth="1.5" />
      {x === labelledPole && <Label x={ctx.sx(x) + 8} y={ctx.h - 70} text="漸近線" anchor="start" />}
    </g>)}
    {horizontal !== null && <g>
      <line x1="0" y1={ctx.sy(horizontal)} x2={ctx.w} y2={ctx.sy(horizontal)} stroke="var(--text-sub)" strokeDasharray="5 5" strokeWidth="1.5" />
      <Label x={8} y={ctx.sy(horizontal) - 10} text="漸近線" anchor="start" />
    </g>}
    {point && visible(ctx, point) && <g>
      <circle cx={ctx.sx(point.x)} cy={ctx.sy(point.y)} r="5" fill={curveStyleOf(curve.number).color} stroke="var(--panel)" strokeWidth="2" />
      <Label x={ctx.sx(point.x) + 12} y={ctx.sy(point.y) - 12} text={point.label} anchor="start" />
    </g>}
    {kind !== 'tan' && kind !== 'quadratic-standard' && ['p', 'q'].includes(holeKey ?? '') && <g>
      <Arrow x1={ctx.sx(0)} y1={ctx.sy(0)} x2={ctx.sx(v.p)} y2={ctx.sy(0)}
        color={roleStyles['shift-x'].color} dash={roleStyles['shift-x'].dash} width={holeKey === 'p' ? 4 : 2} />
      <Arrow x1={ctx.sx(v.p)} y1={ctx.sy(0)} x2={ctx.sx(v.p)} y2={ctx.sy(v.q)}
        color={roleStyles['shift-y'].color} dash={roleStyles['shift-y'].dash} width={holeKey === 'q' ? 4 : 2} />
      {v.p !== 0 && <Label x={(ctx.sx(0) + ctx.sx(v.p)) / 2} y={ctx.sy(0) + 24} text="p" color={roleStyles['shift-x'].color} />}
      {v.q !== 0 && <Label x={ctx.sx(v.p) - 12} y={(ctx.sy(0) + ctx.sy(v.q)) / 2} text="q" color={roleStyles['shift-y'].color} />}
    </g>}
  </g>
}
