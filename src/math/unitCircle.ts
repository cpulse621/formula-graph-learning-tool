// 単位円: 角度 θ(度)から sin・cos・tan を求める。特別な角(30°と45°の倍数)は正確な値で出す。
import { clean, valueText } from './format'

const TINY = 1e-9 // これより小さい誤差は 0 にそろえる

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

/** 角度を 0° 以上 360° 未満にそろえる(−30° → 330°、390° → 30°、720° → 0°) */
export function normalizeDeg(deg: number): number {
  let r = deg % 360
  if (r < 0) r += 360
  r = clean(r, 9)
  return r >= 360 ? 0 : r
}

const tidy = (v: number): number => (Math.abs(v) < TINY ? 0 : v)

export type Exact = { text: string; latex: string }

export type TrigValues = {
  deg: number // 0°以上360°未満にそろえた角度
  sin: number
  cos: number
  tan: number | null // 90° + 180° の倍数のときは null(定義されない)
  exact: { sin: Exact; cos: Exact; tan: Exact | null } | null // 特別な角のときだけ
}

// ---- 特別な角の正確な値 ----
// 基準角(0°〜90°)の値。tan の null は定義されない。
type Mag = 'zero' | 'half' | 'r2' | 'r3' | 'one' | 'r3third' | 'r3full'
const MAGS: Record<Mag, Exact> = {
  zero: { text: '0', latex: '0' },
  half: { text: '1/2', latex: '\\frac{1}{2}' },
  r2: { text: '√2/2', latex: '\\frac{\\sqrt{2}}{2}' },
  r3: { text: '√3/2', latex: '\\frac{\\sqrt{3}}{2}' },
  one: { text: '1', latex: '1' },
  r3third: { text: '√3/3', latex: '\\frac{\\sqrt{3}}{3}' },
  r3full: { text: '√3', latex: '\\sqrt{3}' },
}
const REF: Record<number, { s: Mag; c: Mag; t: Mag | null }> = {
  0: { s: 'zero', c: 'one', t: 'zero' },
  30: { s: 'half', c: 'r3', t: 'r3third' },
  45: { s: 'r2', c: 'r2', t: 'one' },
  60: { s: 'r3', c: 'half', t: 'r3full' },
  90: { s: 'one', c: 'zero', t: null },
}

const signed = (mag: Mag, negative: boolean): Exact => {
  const m = MAGS[mag]
  if (!negative || mag === 'zero') return m
  return { text: `−${m.text}`, latex: `-${m.latex}` }
}

/** 0°以上360°未満の特別な角(30°か45°の倍数)の正確な値。特別な角でなければ null */
function exactOf(deg: number): TrigValues['exact'] {
  // 象限と基準角(90°の倍数は、ちょうど軸の上)
  let ref: number
  let sNeg = false
  let cNeg = false
  if (deg === 0 || deg === 90 || deg === 180 || deg === 270) {
    ref = deg % 180 === 0 ? 0 : 90
    if (deg === 180) cNeg = true
    if (deg === 270) sNeg = true
    if (deg === 90 || deg === 270) ref = 90
  } else if (deg < 90) {
    ref = deg
  } else if (deg < 180) {
    ref = 180 - deg
    cNeg = true
  } else if (deg < 270) {
    ref = deg - 180
    sNeg = true
    cNeg = true
  } else {
    ref = 360 - deg
    sNeg = true
  }
  const r = REF[ref]
  if (!r) return null
  // 90° と 270° は、基準角 90° で sin = ±1、cos = 0。0° と 180° は、基準角 0° で sin = 0、cos = ±1
  const tNeg = sNeg !== cNeg
  return {
    sin: signed(r.s, sNeg),
    cos: signed(r.c, cNeg),
    tan: r.t === null ? null : signed(r.t, tNeg),
  }
}

/** 角度(度)から、sin・cos・tan を求める */
export function trigValues(degInput: number): TrigValues {
  const deg = normalizeDeg(degInput)
  const rad = degToRad(deg)
  const sin = tidy(Math.sin(rad))
  const cos = tidy(Math.cos(rad))
  const undefinedTan = cos === 0
  const tan = undefinedTan ? null : tidy(sin / cos)
  return { deg, sin, cos, tan, exact: exactOf(deg) }
}

// ---- 表示 ----

export type ValueText = { text: string; latex: string }

const decimalText = (v: number): ValueText => {
  const c = clean(v, 4)
  return { text: String(c).replace(/^-/, '−'), latex: String(c) }
}

export const TAN_UNDEFINED = 'なし(定義されない)'

/** 画面に出す値。特別な角は正確な値、それ以外は小数第4位まで(末尾の 0 は省く) */
export function trigDisplay(degInput: number): {
  exactAngle: boolean
  sin: ValueText
  cos: ValueText
  tan: ValueText | null // null は定義されない
} {
  const v = trigValues(degInput)
  if (v.exact) {
    return { exactAngle: true, sin: v.exact.sin, cos: v.exact.cos, tan: v.exact.tan }
  }
  return {
    exactAngle: false,
    sin: decimalText(v.sin),
    cos: decimalText(v.cos),
    tan: v.tan === null ? null : decimalText(v.tan),
  }
}

/** θ(度)の表示。例: 30° = π/6 */
export function angleBoth(deg: number): { deg: string; rad: string } {
  return { deg: `${valueText(deg)}°`, rad: valueText(degToRad(deg)) }
}

// ---- ラジアンの入力(数、π、π/6、2π/3 の形) ----

/**
 * ラジアンの入力文字を、ラジアンの数にする。
 * 受け付ける形: 0.5236、−1.5、π、2π、π/6、−3π/4、0.5π、pi/6、3/4 など。読めない文字は null。
 */
export function parseRadians(text: string): number | null {
  const t = text.trim().replace(/−/g, '-').replace(/\s+/g, '')
  const m = /^([+-]?)(\d+(?:\.\d+)?|\.\d+)?\*?(π|pi)?(?:\/(\d+(?:\.\d+)?))?$/i.exec(t)
  if (!m) return null
  const [, sign, num, pi, den] = m
  if (num === undefined && !pi) return null
  let v = num === undefined ? 1 : Number(num)
  if (pi) v *= Math.PI
  if (den !== undefined) {
    const d = Number(den)
    if (d === 0) return null
    v /= d
  }
  if (sign === '-') v = -v
  return Number.isFinite(v) ? v : null
}
