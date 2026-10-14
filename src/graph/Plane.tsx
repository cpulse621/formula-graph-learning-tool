import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { valueText } from '../math/format'
import {
  BASE_HALF_HEIGHT, BASE_HALF_WIDTH, ZOOM_FACTOR, clampZoom, niceStep, piStep, ticksBetween, ZOOM_MAX, ZOOM_MIN,
} from './viewport'
import { radToDeg } from '../math/unitCircle'

// 描画の部品(曲線など)に渡す、座標変換と表示範囲
export type PlaneCtx = {
  w: number
  h: number
  scale: number // 1単位あたりの画面の長さ(px)。縦横で同じ
  sx: (x: number) => number
  sy: (y: number) => number
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

// 描画の層。下から「方眼 → 軸 → 補助 → 曲線 → 目盛りの文字」の順に重ねる
export type PlaneLayers = {
  aux?: ReactNode // 補助(矢印・かっこ・a, b などの文字・確かめるの線)
  curves?: ReactNode // 曲線・点
}

// 表示範囲の決め方。省略すると、原点が中央で、横 ±7・縦 ±3.2 が入る大きさ。
export type PlaneLayout = {
  unitsWide: number // 横に入れたい長さ(単位)
  unitsHigh: number // 縦に入れたい長さ(単位)
  originUnitsX?: number // 左端から原点までの長さ(単位)。省略すると中央
  scale?: number // 1単位の画面の長さ(px)。決めると、unitsWide・unitsHigh は使わない(別の図と縮尺をそろえるため)
}

const DEFAULT_LAYOUT: PlaneLayout = { unitsWide: 2 * BASE_HALF_WIDTH, unitsHigh: 2 * BASE_HALF_HEIGHT }

type Props = {
  xAxis: 'pi' | 'decimal' | 'deg' // x軸の目盛り: π の倍数 / 普通の数 / 度(値はラジアンのまま、文字を度にする)
  description: string // 読み上げ用の説明
  layout?: PlaneLayout
  tickBase?: number // x軸の目盛りの基準の幅(単位)。ズーム 1 倍でこの幅になり、拡大・縮小で細かく・粗くなる(例: π/2)
  children: (ctx: PlaneCtx) => PlaneLayers
}

const MINUS = '−'
const numText = (v: number) => String(v).replace('-', MINUS)

// 共通のグラフ平面(方眼・軸・目盛り・ズームのボタン)。表示範囲は原点が中心で固定。
export function Plane({ xAxis, description, layout = DEFAULT_LAYOUT, tickBase, children }: Props) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const clipId = useId()

  useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = size
  let body: ReactNode = null
  if (w > 0 && h > 0) {
    const scale = (layout.scale ?? Math.min(w / layout.unitsWide, h / layout.unitsHigh)) * zoom
    const ox = layout.originUnitsX === undefined ? w / 2 : layout.originUnitsX * scale / zoom
    const oy = h / 2
    const ctx: PlaneCtx = {
      w, h, scale,
      sx: (x) => ox + x * scale,
      sy: (y) => oy - y * scale,
      xMin: -ox / scale, xMax: (w - ox) / scale, yMin: -oy / scale, yMax: oy / scale,
    }
    const radianAxis = xAxis === 'pi' || xAxis === 'deg'
    // 目盛りの幅: tickBase があれば、ズーム 1 倍でその幅(拡大すると細かく、縮小すると粗く)
    const xStep = radianAxis
      ? piStep(tickBase !== undefined ? (tickBase * 0.95) / zoom : 70 / scale)
      : niceStep(56 / scale)
    const xLabel = (x: number) =>
      xAxis === 'pi' ? valueText(x) : xAxis === 'deg' ? numText(Math.round(radToDeg(x) * 1e6) / 1e6) : numText(x)
    const yStep = niceStep(44 / scale)
    const xs = ticksBetween(ctx.xMin, ctx.xMax, xStep)
    const ys = ticksBetween(ctx.yMin, ctx.yMax, yStep)
    const axisY = Math.min(h - 18, Math.max(4, ctx.sy(0))) // x軸の目盛り文字の位置
    const axisX = Math.min(w - 4, Math.max(30, ctx.sx(0)))

    const layers = children(ctx)
    body = (
      <svg className="plane-svg" width={w} height={h} role="img" aria-label={description}>
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={w} height={h} />
          </clipPath>
        </defs>
        <g className="plane-grid">
          {xs.map((x) => (
            <line key={`gx${x}`} x1={ctx.sx(x)} y1="0" x2={ctx.sx(x)} y2={h} />
          ))}
          {ys.map((y) => (
            <line key={`gy${y}`} x1="0" y1={ctx.sy(y)} x2={w} y2={ctx.sy(y)} />
          ))}
        </g>
        <g className="plane-axes">
          <line x1="0" y1={ctx.sy(0)} x2={w} y2={ctx.sy(0)} />
          <line x1={ctx.sx(0)} y1="0" x2={ctx.sx(0)} y2={h} />
        </g>
        <g clipPath={`url(#${clipId})`}>{layers.aux}</g>
        <g clipPath={`url(#${clipId})`}>{layers.curves}</g>
        <g className="plane-ticks">
          {xs.filter((x) => Math.abs(x) > 1e-9).map((x) => (
            <text key={`tx${x}`} x={ctx.sx(x)} y={axisY + 14} textAnchor="middle">
              {xLabel(x)}
            </text>
          ))}
          {ys.filter((y) => Math.abs(y) > 1e-9).map((y) => (
            <text key={`ty${y}`} x={axisX - 6} y={ctx.sy(y) + 4} textAnchor="end">
              {numText(y)}
            </text>
          ))}
          <text x={ctx.sx(0) - 6} y={ctx.sy(0) + 14} textAnchor="end">O</text>
          <text className="plane-axis-name" x={w - 6} y={Math.min(h - 6, Math.max(14, ctx.sy(0) - 8))} textAnchor="end">x</text>
          <text className="plane-axis-name" x={Math.min(w - 12, Math.max(12, ctx.sx(0) + 10))} y="14">y</text>
        </g>
      </svg>
    )
  }

  return (
    <div className="plane" ref={boxRef}>
      {body}
      <div className="zoom-buttons" role="group" aria-label="ズーム">
        <button type="button" className="btn" disabled={zoom >= ZOOM_MAX}
          onClick={() => setZoom((z) => clampZoom(z * ZOOM_FACTOR))}>＋ 拡大</button>
        <button type="button" className="btn" disabled={zoom <= ZOOM_MIN}
          onClick={() => setZoom((z) => clampZoom(z / ZOOM_FACTOR))}>－ 縮小</button>
        <button type="button" className="btn" disabled={zoom === 1}
          onClick={() => setZoom(1)}>戻す</button>
      </div>
    </div>
  )
}
