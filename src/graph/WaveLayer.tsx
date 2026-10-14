import { curveStyles } from './curveStyle'
import type { PlaneCtx } from './Plane'
import { Label, curvePath } from './TrigLayer'
import { degToRad, normalizeDeg } from '../math/unitCircle'
import { evaluate, type Sinusoid } from '../math/trig'

// 単位円の右側に出す波形 y = sin θ(青・実線)と y = cos θ(灰・破線)。
// 色と線種は、単位円の sin・cos の線と同じ。
const SIN = curveStyles[0]
const COS = curveStyles[1]
const SIN_WAVE: Sinusoid = { kind: 'sin', a: 1, b: 1, c: 0, d: 0 }
const COS_WAVE: Sinusoid = { kind: 'cos', a: 1, b: 1, c: 0, d: 0 }

// 補助(下の層): 今の θ の縦の目印線
export function WaveAux({ ctx, theta }: { ctx: PlaneCtx; theta: number }) {
  const x = ctx.sx(degToRad(normalizeDeg(theta)))
  return (
    <g>
      <line x1={x} y1="0" x2={x} y2={ctx.h} stroke="var(--text-sub)" strokeWidth="1.5" strokeDasharray="5 4" />
      <Label x={x + 6} y={16} text="θ" anchor="start" />
    </g>
  )
}

// 曲線と点(上の層): 2本の波形と、今の θ のところの点(sin は丸、cos は四角)
export function WaveCurves({ ctx, theta }: { ctx: PlaneCtx; theta: number }) {
  const t = degToRad(normalizeDeg(theta))
  const x = ctx.sx(t)
  const ys = ctx.sy(evaluate(SIN_WAVE, t))
  const yc = ctx.sy(evaluate(COS_WAVE, t))
  return (
    <g>
      <path d={curvePath(ctx, COS_WAVE)} fill="none" stroke={COS.color} strokeWidth={COS.width}
        strokeDasharray={COS.dash} strokeLinecap="round" strokeLinejoin="round" />
      <path d={curvePath(ctx, SIN_WAVE)} fill="none" stroke={SIN.color} strokeWidth={SIN.width}
        strokeLinecap="round" strokeLinejoin="round" />
      <rect x={x - 6} y={yc - 6} width="12" height="12" fill={COS.color} stroke="var(--panel)" strokeWidth="2.5" />
      <circle cx={x} cy={ys} r="7" fill={SIN.color} stroke="var(--panel)" strokeWidth="2.5" />
      {/* 上にある点の文字は上に、下にある点の文字は下に置く(点が近くても重ならない) */}
      <Label x={x + 12} y={ys <= yc ? ys - 10 : ys + 24} text="sin" color={SIN.color} anchor="start" />
      <Label x={x + 12} y={yc <= ys ? yc - 10 : yc + 24} text="cos" color={COS.color} anchor="start" />
    </g>
  )
}
