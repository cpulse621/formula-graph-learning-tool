import type { ReactNode } from 'react'
import { curveStyleOf } from './curveStyle'
import { clipLine } from './geometry'
import type { PlaneCtx } from './Plane'
import { roleStyles } from './roles'
import { Arrow, EMPHASIS, Label } from './TrigLayer'
import { circleAxes, lineAxes, relateCircleLine, type Circle, type Line, type Point } from '../math/circleLine'
import { verticalAxes, type GraphLine } from '../math/lineForms'

export type CircleCurve = { uid: number; number: number; c: Circle }
export type LineCurve = { uid: number; number: number; l: GraphLine; points?: Point[] }

const PAD = 40 // 画面の外に少しはみ出して描く(px)
const MAX_STEPS = 200000

// ---- 円: 見えている範囲だけを折れ線で描く(半径が大きくても壊れない) ----
// SVG の circle は、半径が数万pxになると描画が重く、点線も壊れやすい。
function circleShape(ctx: PlaneCtx, c: Circle): { d: string; badge: { x: number; y: number } | null } {
  const R = c.r * ctx.scale // 半径(px)
  const cx = ctx.sx(c.p)
  const cy = ctx.sy(c.q)
  const inside = (x: number, y: number, pad: number) =>
    x > -pad && x < ctx.w + pad && y > -pad && y < ctx.h + pad
  // 1歩が約2px以下になる刻み(半径が小さいときは 0.1 ラジアン以下)
  const step = Math.min(0.1, 2 / R)
  const n = Math.min(MAX_STEPS, Math.ceil((2 * Math.PI) / step))
  const parts: string[] = []
  let pen = false
  let badge: { x: number; y: number } | null = null
  let badgeGap = Infinity
  for (let i = 0; i <= n; i++) {
    const th = (2 * Math.PI * i) / n
    const x = cx + R * Math.cos(th)
    const y = cy - R * Math.sin(th)
    if (inside(x, y, PAD)) {
      parts.push(`${pen ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`)
      pen = true
      // 番号の丸は、円周の右上(45°)に近い、見えている点に置く
      if (inside(x, y, 16) && Math.abs(th - Math.PI / 4) < badgeGap) {
        badgeGap = Math.abs(th - Math.PI / 4)
        badge = { x, y }
      }
    } else {
      pen = false
    }
  }
  return { d: parts.join(''), badge }
}

// ---- 直線: 見えている範囲に切り取って描く ----
function lineShape(ctx: PlaneCtx, l: GraphLine, points: Point[] = []) {
  const padU = PAD / ctx.scale
  const seg = 'x' in l
    ? l.x < ctx.xMin - padU || l.x > ctx.xMax + padU ? null : { x1: l.x, y1: ctx.yMin - padU, x2: l.x, y2: ctx.yMax + padU }
    : clipLine(l.m, l.n, ctx.xMin - padU, ctx.xMax + padU, ctx.yMin - padU, ctx.yMax + padU)
  if (!seg) return null
  const p1 = { x: ctx.sx(seg.x1), y: ctx.sy(seg.y1) }
  const p2 = { x: ctx.sx(seg.x2), y: ctx.sy(seg.y2) }
  // 番号の丸は、右(同じ高さなら上)の端から、画面の中へ 40px 入った位置に置く。短ければ真ん中
  const right = p1.x > p2.x || (p1.x === p2.x && p1.y < p2.y) ? p1 : p2
  const left = right === p1 ? p2 : p1
  const len = Math.hypot(right.x - left.x, right.y - left.y)
  let t = len > 2 * (PAD + 40) ? (PAD + 40) / len : 0.5 // 切り取りは画面の外 PAD まで描いているので、その分も内側へ
  let badge = { x: right.x + (left.x - right.x) * t, y: right.y + (left.y - right.y) * t }
  // 入力したP・Qの印を番号の丸で覆わないよう、直線上で少し内側へずらす。
  for (let i = 0; i < 4 && points.some((p) => Math.hypot(ctx.sx(p.x) - badge.x, ctx.sy(p.y) - badge.y) < 28); i++) {
    t = Math.min(0.85, t + 40 / len)
    badge = { x: right.x + (left.x - right.x) * t, y: right.y + (left.y - right.y) * t }
  }
  return { p1, p2, badge }
}

function Badge({ x, y, number, color }: { x: number; y: number; number: number; color: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r="11" fill="var(--panel)" stroke={color} strokeWidth="2.5" />
      <text x={x} y={y + 4.5} textAnchor="middle" className="plane-badge">{number}</text>
    </g>
  )
}

// ---- 軸・原点との共有点の印(いつでも出す) ----
// ◇ = x軸・y軸との共有点(式の番号の色)。輪っか = 原点を通る(式の番号の色)。
// 見えている範囲の外の点は描かない。交点の ● は、これより後に描く(上に見える)。
const DIAMOND = 6 // ◇ の半分の対角線(px)。見た目は 9px 前後

function AxisMarks({ ctx, circles, lines }: { ctx: PlaneCtx; circles: CircleCurve[]; lines: LineCurve[] }) {
  const inView = (x: number, y: number) => x > -8 && x < ctx.w + 8 && y > -8 && y < ctx.h + 8
  type Mark = { key: string; number: number; marks: { x: number; y: number }[]; ring: boolean }
  const all: Mark[] = [
    ...circles.map((it): Mark => {
      const a = circleAxes(it.c)
      return { key: `c${it.uid}`, number: it.number, marks: a.marks, ring: a.throughOrigin }
    }),
    ...lines.map((it): Mark => {
      const a = 'x' in it.l ? verticalAxes(it.l.x) : lineAxes(it.l)
      return { key: `l${it.uid}`, number: it.number, marks: a.marks, ring: a.ring }
    }),
  ].sort((a, b) => a.number - b.number)

  // 原点を通る式が複数あるとき、輪っかが重ならないよう半径を変える
  const ringOf = all.filter((m) => m.ring).map((m) => m.key)
  const ox = ctx.sx(0)
  const oy = ctx.sy(0)

  return (
    <g>
      {all.map((m) => {
        const color = curveStyleOf(m.number).color
        return (
          <g key={m.key}>
            {m.marks.map((pt, i) => {
              const x = ctx.sx(pt.x)
              const y = ctx.sy(pt.y)
              if (!inView(x, y)) return null
              return (
                <polygon key={i} fill={color} stroke="var(--panel)" strokeWidth="2.5" strokeLinejoin="round"
                  points={`${x},${y - DIAMOND} ${x + DIAMOND},${y} ${x},${y + DIAMOND} ${x - DIAMOND},${y}`} />
              )
            })}
            {m.ring && inView(ox, oy) && (
              <g fill="none">
                <circle cx={ox} cy={oy} r={9 + 4 * ringOf.indexOf(m.key)} stroke="var(--panel)" strokeWidth="6.5" />
                <circle cx={ox} cy={oy} r={9 + 4 * ringOf.indexOf(m.key)} stroke={color} strokeWidth="3" />
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
}

// ---- 曲線と点(上の層): 円・直線・印・交点 ----
export function CircleLineCurves({ ctx, circles, lines }: {
  ctx: PlaneCtx
  circles: CircleCurve[]
  lines: LineCurve[]
}) {
  return (
    <g>
      {circles.map((it) => {
        const st = curveStyleOf(it.number)
        const { d, badge } = circleShape(ctx, it.c)
        return (
          <g key={`c${it.uid}`}>
            <path d={d} fill="none" stroke={st.color} strokeWidth={st.width}
              strokeDasharray={st.dash} strokeLinecap="round" strokeLinejoin="round" />
            {badge && <Badge x={badge.x} y={badge.y} number={it.number} color={st.color} />}
          </g>
        )
      })}
      {lines.map((it) => {
        const st = curveStyleOf(it.number)
        const shape = lineShape(ctx, it.l, it.points)
        if (!shape) return null
        return (
          <g key={`l${it.uid}`} data-line={it.uid}>
            <line x1={shape.p1.x} y1={shape.p1.y} x2={shape.p2.x} y2={shape.p2.y}
              stroke={st.color} strokeWidth={st.width} strokeDasharray={st.dash} strokeLinecap="round" />
            <Badge x={shape.badge.x} y={shape.badge.y} number={it.number} color={st.color} />
          </g>
        )
      })}
      <AxisMarks ctx={ctx} circles={circles} lines={lines} />
      {/* 交点: 表示中のすべての「円 × 直線」の組で、いつでも出す。濃い●に白い縁(式の色にはしない) */}
      {circles.flatMap((cc) =>
        lines.flatMap((ll) =>
          relateCircleLine(cc.c, ll.l).points.map((pt, i) => (
            <circle key={`x${cc.uid}-${ll.uid}-${i}`} cx={ctx.sx(pt.x)} cy={ctx.sy(pt.y)} r="7"
              fill="var(--text)" stroke="var(--panel)" strokeWidth="3" />
          )),
        ),
      )}
    </g>
  )
}

// ---- 補助(下の層): 選んでいる円・直線の、穴の印 ----
export type CircleLineActive =
  | { kind: 'circle'; c: Circle }
  | { kind: 'line'; l: Line }

export function CircleLineAux({ ctx, active, holeKey }: {
  ctx: PlaneCtx
  active: CircleLineActive | null
  holeKey: string | null // 調整バーに出している穴(その印を強調する)
}) {
  if (!active) return null
  const { sx, sy } = ctx
  const em = (key: string) => (holeKey === key ? EMPHASIS : 1)
  const size = roleStyles.size
  const shiftX = roleStyles['shift-x']
  const shiftY = roleStyles['shift-y']
  const parts: ReactNode[] = []

  if (active.kind === 'circle') {
    const { p, q, r } = active.c
    // p: 原点から (p, 0) まで横の矢印。q: そこから (p, q) まで縦の矢印(階段の形で中心に着く)
    if (Math.abs(p) * ctx.scale >= 6) {
      parts.push(
        <g key="p">
          <Arrow x1={sx(0)} y1={sy(0)} x2={sx(p)} y2={sy(0)} color={shiftX.color}
            width={shiftX.width * em('p')} dash={shiftX.dash} />
          <Label x={(sx(0) + sx(p)) / 2} y={sy(0) - 10} text="p" color={shiftX.color} strong={em('p') > 1} />
        </g>,
      )
    }
    if (Math.abs(q) * ctx.scale >= 6) {
      parts.push(
        <g key="q">
          <Arrow x1={sx(p)} y1={sy(0)} x2={sx(p)} y2={sy(q)} color={shiftY.color}
            width={shiftY.width * em('q')} dash={shiftY.dash} />
          <Label x={sx(p) + 9} y={(sy(0) + sy(q)) / 2 + 5} text="q" color={shiftY.color} anchor="start"
            strong={em('q') > 1} />
        </g>,
      )
    }
    // r: 中心から円周(右側)までの線
    parts.push(
      <g key="r">
        <line x1={sx(p)} y1={sy(q)} x2={sx(p + r)} y2={sy(q)} stroke={size.color}
          strokeWidth={size.width * em('r')} strokeLinecap="round" />
        <Label x={(sx(p) + sx(p + r)) / 2} y={sy(q) - 10} text="r" color={size.color} strong={em('r') > 1} />
      </g>,
    )
    // 中心の点
    parts.push(<circle key="center" cx={sx(p)} cy={sy(q)} r="4" fill="var(--text)" />)
  } else {
    const { m, n } = active.l
    // n: 原点から (0, n) まで縦の矢印
    if (Math.abs(n) * ctx.scale >= 6) {
      parts.push(
        <g key="n">
          <Arrow x1={sx(0)} y1={sy(0)} x2={sx(0)} y2={sy(n)} color={shiftY.color}
            width={shiftY.width * em('n')} dash={shiftY.dash} />
          <Label x={sx(0) - 9} y={(sy(0) + sy(n)) / 2 + 5} text="n" color={shiftY.color} anchor="end"
            strong={em('n') > 1} />
        </g>,
      )
    }
    // m: (0, n) から右へ 1 進む細い灰色の線(役割の色は使わない)と、(1, n) から (1, n+m) までの縦の矢印
    parts.push(
      <g key="run">
        <line x1={sx(0)} y1={sy(n)} x2={sx(1)} y2={sy(n)} stroke="var(--text-sub)" strokeWidth="1.5" />
        <Label x={(sx(0) + sx(1)) / 2} y={sy(n) + (m >= 0 ? 20 : -8)} text="1" color="var(--text-sub)" />
      </g>,
    )
    if (Math.abs(m) * ctx.scale >= 6) {
      parts.push(
        <g key="m">
          <Arrow x1={sx(1)} y1={sy(n)} x2={sx(1)} y2={sy(n + m)} color={size.color}
            width={size.width * em('m')} dash={size.dash} />
          <Label x={sx(1) + 9} y={(sy(n) + sy(n + m)) / 2 + 5} text="m" color={size.color} anchor="start"
            strong={em('m') > 1} />
        </g>,
      )
    }
  }
  return <g>{parts}</g>
}
