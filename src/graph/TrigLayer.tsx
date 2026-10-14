import type { ReactNode } from 'react'
import { curveStyleOf } from './curveStyle'
import type { PlaneCtx } from './Plane'
import { roleStyles } from './roles'
import { valueText } from '../math/format'
import {
  evaluate, horizontalShift, maxValue, minValue, peakXs, period, type Sinusoid,
} from '../math/trig'

export type TrigCurve = {
  uid: number
  number: number // 式の番号(曲線の端に表示)
  s: Sinusoid
}

// ---- 描画の小部品(画面の座標で描く) ----

// 選ばれた穴の印は、線を太く・文字を大きくして強調する
export const EMPHASIS = 1.8

export function Label({ x, y, text, color, anchor = 'middle', strong = false }: {
  x: number; y: number; text: string; color?: string; anchor?: 'start' | 'middle' | 'end'; strong?: boolean
}) {
  return (
    <text className={strong ? 'plane-label plane-label-strong' : 'plane-label'} x={x} y={y}
      textAnchor={anchor} fill={color ?? 'var(--text)'}>
      {text}
    </text>
  )
}

export function Arrow({ x1, y1, x2, y2, color, width = 2.5, dash }: {
  x1: number; y1: number; x2: number; y2: number; color: string; width?: number; dash?: string
}) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  if (len < 6) return null
  const ux = dx / len
  const uy = dy / len
  const head = 10
  const half = 5.5
  const bx = x2 - ux * head
  const by = y2 - uy * head
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width}
        strokeDasharray={dash} strokeLinecap="round" />
      <polygon fill={color}
        points={`${x2},${y2} ${bx - uy * half},${by + ux * half} ${bx + uy * half},${by - ux * half}`} />
    </g>
  )
}

const MAX_POINTS = 40000 // 計算が重くなりすぎないための上限

/**
 * 曲線の折れ線。2px ごと、かつ周期あたり24点以上(1周期を20点以上で描き、
 * b が大きいときも波が間違った形にならないようにする)。
 */
export function curvePath(ctx: PlaneCtx, s: Sinusoid): string {
  const T = period(s)
  let step = 2 / ctx.scale
  if (T !== null) step = Math.min(step, T / 24)
  step = Math.max(step, (ctx.xMax - ctx.xMin) / MAX_POINTS)
  const parts: string[] = []
  for (let x = ctx.xMin; x <= ctx.xMax + step; x += step) {
    parts.push(`${parts.length ? 'L' : 'M'}${ctx.sx(x).toFixed(1)},${ctx.sy(evaluate(s, x)).toFixed(1)}`)
  }
  return parts.join('')
}

// ---- 曲線(上の層) ----

export function TrigCurves({ ctx, curves }: { ctx: PlaneCtx; curves: TrigCurve[] }) {
  return (
    <g>
      {curves.map((c) => {
        const st = curveStyleOf(c.number)
        const bx = ctx.w - 56 // 番号の丸の位置(右端の軸の文字と重ならないよう内側に)
        const ly = Math.min(ctx.h - 16, Math.max(16, ctx.sy(evaluate(c.s, ctx.xMax - 56 / ctx.scale))))
        return (
          <g key={c.uid}>
            <path d={curvePath(ctx, c.s)} fill="none" stroke={st.color} strokeWidth={st.width}
              strokeDasharray={st.dash} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={bx} cy={ly} r="11" fill="var(--panel)" stroke={st.color} strokeWidth="2.5" />
            <text x={bx} y={ly + 4.5} textAnchor="middle" className="plane-badge">{c.number}</text>
          </g>
        )
      })}
    </g>
  )
}

// ---- 補助(下の層): 選んでいる式の矢印・かっこ・文字、確かめるの線 ----

export function TrigAux({ ctx, curves, activeUid, holeKey, check }: {
  ctx: PlaneCtx
  curves: TrigCurve[]
  activeUid: number | null // 矢印を出す式
  holeKey: string | null // 調整バーに出している穴(その印を強調する)
  check: boolean // 最大値・最小値の線を出すか
}) {
  const active = curves.find((c) => c.uid === activeUid)
  if (!active) return null
  return <Annotations ctx={ctx} s={active.s} holeKey={holeKey} check={check} />
}

function Annotations({ ctx, s, holeKey, check }: {
  ctx: PlaneCtx; s: Sinusoid; holeKey: string | null; check: boolean
}) {
  const em = (key: string) => (holeKey === key ? EMPHASIS : 1)
  const { sx, sy } = ctx
  const T = period(s)
  const shift = horizontalShift(s)
  const top = maxValue(s)
  const size = roleStyles.size
  const stretch = roleStyles.stretch
  const shiftX = roleStyles['shift-x']
  const shiftY = roleStyles['shift-y']
  const parts: ReactNode[] = []

  // 中心線 y = d(d が 0 のときは x 軸と重なるので描かない)
  if (Math.abs(s.d) > 1e-9) {
    parts.push(
      <line key="mid" x1="0" y1={sy(s.d)} x2={ctx.w} y2={sy(s.d)} stroke={shiftY.color} strokeWidth="1.5" />,
    )
    // d: 原点から中心線までの縦の移動
    parts.push(
      <g key="d">
        <Arrow x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(s.d)} color={shiftY.color} width={shiftY.width * em('d')} dash={shiftY.dash} />
        <Label x={sx(0) - 9} y={(sy(0) + sy(s.d)) / 2 + 5} text="d" color={shiftY.color} anchor="end" strong={em('d') > 1} />
      </g>,
    )
  }

  // 山の位置のうち、1周期ぶんの印が画面に収まるもので、原点にいちばん近いものを選ぶ
  const peaks = peakXs(s, ctx.xMin, ctx.xMax)
  const fits = peaks.filter((x) => x >= ctx.xMin + 0.5 / ctx.scale && (T === null || x + T <= ctx.xMax))
  const pool = fits.length > 0 ? fits : peaks
  const pick: number | undefined = [...pool].sort((p, q) => Math.abs(p) - Math.abs(q))[0]

  if (pick !== undefined && s.a !== 0) {
    // a: 中心線から山までの縦の矢印
    parts.push(
      <g key="a">
        <Arrow x1={sx(pick)} y1={sy(s.d)} x2={sx(pick)} y2={sy(top)} color={size.color} width={size.width * em('a')} dash={size.dash} />
        <Label x={sx(pick) + 9} y={(sy(s.d) + sy(top)) / 2 + 5} text="a" color={size.color} anchor="start" strong={em('a') > 1} />
      </g>,
    )
    // b: 山から次の山までの横のかっこ。周期の長さを表す
    if (T !== null) {
      const y = sy(top) - 12
      const x1 = sx(pick)
      const x2 = sx(pick + T)
      parts.push(
        <g key="b" stroke={stretch.color} strokeWidth={stretch.width * em('b')} fill="none" strokeLinecap="round">
          <line x1={x1} y1={y} x2={x2} y2={y} strokeDasharray={stretch.dash} />
          <line x1={x1} y1={y - 6} x2={x1} y2={y + 6} />
          <line x1={x2} y1={y - 6} x2={x2} y2={y + 6} />
          <Label x={(x1 + x2) / 2} y={y - 8} text="b" color={stretch.color} strong={em('b') > 1} />
        </g>,
      )
    }
  }

  // c: 中心線に沿った横の移動。原点の真上から −c/b の位置まで
  if (shift !== null && Math.abs(shift) > 1e-9) {
    parts.push(
      <g key="c">
        <Arrow x1={sx(0)} y1={sy(s.d)} x2={sx(shift)} y2={sy(s.d)} color={shiftX.color} width={shiftX.width * em('c')} dash={shiftX.dash} />
        <Label x={(sx(0) + sx(shift)) / 2} y={sy(s.d) - 10} text="c" color={shiftX.color} strong={em('c') > 1} />
      </g>,
    )
  }

  // 「確かめる」オン: 最大値・最小値の線(点線)と、その値
  if (check) {
    for (const [v, name] of [[top, '最大'], [minValue(s), '最小']] as const) {
      parts.push(
        <g key={name}>
          <line x1="0" y1={sy(v)} x2={ctx.w} y2={sy(v)} stroke="var(--text-sub)" strokeWidth="1.5" strokeDasharray="1 5" strokeLinecap="round" />
          <Label x={8} y={sy(v) + (name === '最大' ? -6 : 20)} text={`${name} ${valueText(v)}`} anchor="start" />
        </g>,
      )
    }
  }

  return <g>{parts}</g>
}
