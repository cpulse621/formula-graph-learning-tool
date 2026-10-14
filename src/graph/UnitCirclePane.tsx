import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { curveStyles } from './curveStyle'
import { Label } from './TrigLayer'
import { valueText } from '../math/format'
import { degToRad, normalizeDeg } from '../math/unitCircle'

// 単位円の絵。半径1の円と軸を中央に固定する(ズーム・移動なし)。縦横は同じ縮尺。
// 外側に目盛りと文字が入るよう、一辺は半径の 2.7 倍にする。
export const UNIT_EXTENT = 2.7

const SIN = curveStyles[0] // sin: 青の実線(波形の曲線と同じ)
const COS = curveStyles[1] // cos: 灰の破線(波形の曲線と同じ)
const HIT_R = 22 // 点の当たり判定の半径(直径 44px)

type Props = {
  size: number // 一辺(px)
  theta: number // 角度(度)。0〜360 の外の値も受け取る
  min: number // 動かせる角度の範囲(度)
  max: number
  unit: 'deg' | 'rad'
  onChange: (deg: number) => void
}

export function UnitCirclePane({ size, theta, min, max, unit, onChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  const u = size / UNIT_EXTENT // 1単位の画面の長さ(px)
  const c = size / 2 // 原点(中央)
  const norm = normalizeDeg(theta)
  const rad = degToRad(norm)
  const cosv = Math.cos(rad)
  const sinv = Math.sin(rad)
  const px = c + u * cosv
  const py = c - u * sinv

  // ポインタの位置から角度(度、整数、0〜359)を求める
  function angleOf(e: PointerEvent<SVGElement>): number {
    const r = svgRef.current!.getBoundingClientRect()
    const k = size / r.width // 画面の大きさと描画の大きさの比
    const x = (e.clientX - r.left) * k - c
    const y = (e.clientY - r.top) * k - c
    const deg = Math.round((Math.atan2(-y, x) * 180) / Math.PI)
    return normalizeDeg(deg)
  }
  const down = (e: PointerEvent<SVGElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId) // 点の外へ出ても、ドラッグを続けられる
    } catch {
      // 取得できなくても、点の上のドラッグは動く
    }
    dragging.current = true
    onChange(angleOf(e))
  }
  const move = (e: PointerEvent<SVGElement>) => {
    if (dragging.current) onChange(angleOf(e))
  }
  const up = () => {
    dragging.current = false
  }
  // キーボード: 矢印キーで 1°、Shift+矢印キーで 15°
  function onKeyDown(e: KeyboardEvent<SVGElement>) {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0
    if (dir === 0) return
    e.preventDefault()
    const step = e.shiftKey ? 15 : 1
    onChange(Math.min(max, Math.max(min, theta + dir * step)))
  }

  // θ を示す弧(原点から 0° の向きへ、θ だけ反時計まわり)
  const ra = 0.3 * u
  const arc =
    norm > 0
      ? `M${c + ra},${c} A${ra},${ra} 0 ${norm > 180 ? 1 : 0} 0 ${c + ra * cosv},${c - ra * sinv}`
      : ''
  const mid = degToRad(norm / 2)

  const sinLen = Math.abs(py - c)
  const cosLen = Math.abs(px - c)
  const valueTextOfTheta =
    unit === 'deg' ? `${valueText(theta)}度` : `${valueText(degToRad(theta))}ラジアン(${valueText(theta)}度)`

  return (
    <svg ref={svgRef} className="unit-svg" width={size} height={size} role="group" aria-label="単位円"
      style={{ touchAction: 'none' }}>
      {/* 方眼(±1 の位置)と軸 */}
      <g className="plane-grid">
        <line x1={c - u} y1="0" x2={c - u} y2={size} />
        <line x1={c + u} y1="0" x2={c + u} y2={size} />
        <line x1="0" y1={c - u} x2={size} y2={c - u} />
        <line x1="0" y1={c + u} x2={size} y2={c + u} />
      </g>
      <g className="plane-axes">
        <line x1="0" y1={c} x2={size} y2={c} />
        <line x1={c} y1="0" x2={c} y2={size} />
      </g>
      <circle cx={c} cy={c} r={u} fill="none" stroke="var(--text-sub)" strokeWidth="2" />

      {/* sin と cos の長さ: 軸の上の線(sin は y 軸、cos は x 軸)と、P から軸への補助線 */}
      <line x1={px} y1={py} x2={px} y2={c} stroke="var(--text-sub)" strokeWidth="1.2" strokeDasharray="1 4" strokeLinecap="round" />
      <line x1={px} y1={py} x2={c} y2={py} stroke="var(--text-sub)" strokeWidth="1.2" strokeDasharray="1 4" strokeLinecap="round" />
      <line x1={c} y1={c} x2={px} y2={c} stroke={COS.color} strokeWidth="3.5" strokeDasharray={COS.dash} strokeLinecap="round" />
      <line x1={c} y1={c} x2={c} y2={py} stroke={SIN.color} strokeWidth="3.5" strokeLinecap="round" />

      {/* 原点からの線 OP と、θ の弧 */}
      <line x1={c} y1={c} x2={px} y2={py} stroke="var(--text)" strokeWidth="2.5" strokeLinecap="round" />
      {arc && <path d={arc} fill="none" stroke="var(--text)" strokeWidth="2.5" />}
      {norm > 12 && <Label x={c + 0.46 * u * Math.cos(mid)} y={c - 0.46 * u * Math.sin(mid) + 5} text="θ" />}

      {/* 文字ラベル(色だけに頼らない) */}
      {cosLen > 26 && <Label x={(c + px) / 2} y={c + (sinv >= 0 ? 22 : -10)} text="cos" color={COS.color} />}
      {sinLen > 20 && (
        <Label x={c + (cosv >= 0 ? -10 : 10)} y={(c + py) / 2 + 5} text="sin" color={SIN.color}
          anchor={cosv >= 0 ? 'end' : 'start'} />
      )}

      {/* 目盛りと軸の名前 */}
      <g className="plane-ticks">
        <text x={c + u} y={c + 16} textAnchor="middle">1</text>
        <text x={c - u} y={c + 16} textAnchor="middle">−1</text>
        <text x={c - 6} y={c - u + 4} textAnchor="end">1</text>
        <text x={c - 6} y={c + u + 4} textAnchor="end">−1</text>
        <text className="plane-axis-name" x={size - 6} y={c - 8} textAnchor="end">x</text>
        <text className="plane-axis-name" x={c + 10} y="14">y</text>
      </g>

      {/* 点 P と、ドラッグ・キーボード用の当たり判定(直径 44px) */}
      <circle cx={px} cy={py} r="7" fill="var(--text)" stroke="var(--panel)" strokeWidth="3" pointerEvents="none" />
      <Label x={px + (cosv >= 0 ? 12 : -12)} y={py + (sinv >= 0 ? -10 : 18)} text="P"
        anchor={cosv >= 0 ? 'start' : 'end'} />
      <circle
        className="unit-hit" cx={px} cy={py} r={HIT_R} fill="transparent" tabIndex={0}
        role="slider" aria-label="単位円の点 P。角度" aria-orientation="horizontal"
        aria-valuemin={min} aria-valuemax={max} aria-valuenow={theta} aria-valuetext={valueTextOfTheta}
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        onKeyDown={onKeyDown}
      />
    </svg>
  )
}
