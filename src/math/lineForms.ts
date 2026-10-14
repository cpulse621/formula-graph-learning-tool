// 直線の入力形式を共通の図形へ変換する。重なった2点からは直線を決めない。
import type { Line, Point } from './circleLine'
import { lineAxisRows } from './axisText'
import { formatPoints, lineAxes } from './circleLine'

export type GraphLine = Line | { x: number }
export type LineForm = 'slope' | 'point'
type Values = Record<string, number>

export function lineFromFormula(id: string, v: Values): GraphLine | null {
  if (id === 'line') return { m: v.m, n: v.n }
  if (id === 'line-point') return { m: v.a, n: v.y1 - v.a * v.x1 }
  if (id !== 'line-two-points') return null
  const dx = v.x2 - v.x1
  const dy = v.y2 - v.y1
  if (dx === 0 && dy === 0) return null
  if (dx === 0) return { x: v.x1 }
  const m = dy / dx
  return { m, n: v.y1 - m * v.x1 }
}

export function lineInputPoints(id: string, v: Values): Point[] {
  if (id === 'line-point') return [{ x: v.x1, y: v.y1 }]
  if (id === 'line-two-points') return [{ x: v.x1, y: v.y1 }, { x: v.x2, y: v.y2 }]
  return []
}

/** 選んだ座標がどの入力点・どの軸を指すか。Δx・Δyとは分けて扱う。 */
export function lineCoordinateSelection(id: string, v: Values, key: string) {
  const match = /^([xy])([12])$/.exec(key)
  if (!match) return null
  const index = Number(match[2]) - 1
  const point = lineInputPoints(id, v)[index]
  return point ? { key, point, index, name: index === 0 ? 'P' : 'Q', axis: match[1] as 'x' | 'y' } : null
}

export function verticalAxes(x: number) {
  const coincide = x === 0
  return { marks: coincide ? [] : [{ x, y: 0 }], ring: false }
}

export function graphLineAxisRows(l: GraphLine) {
  if (!('x' in l)) return lineAxisRows(lineAxes(l))
  return [
    { label: 'x切片', text: formatPoints([{ x: l.x, y: 0 }]) },
    { label: l.x === 0 ? 'y軸と重なっている' : 'y軸と交わらない', text: '' },
  ]
}

// 入力の小数は10桁まで。整数化してから計算し、1/3などを近似小数にせず表示する。
const SCALE = 10_000_000_000n
const integer = (n: number) => BigInt(Math.round(n * Number(SCALE)))
type Fraction = { num: bigint; den: bigint }
function fraction(num: bigint, den: bigint = SCALE): Fraction {
  if (den < 0n) { num = -num; den = -den }
  let a = num < 0n ? -num : num
  let b = den
  while (b) { const r = a % b; a = b; b = r }
  return { num: num / a, den: den / a }
}
function latex(f: Fraction): { text: string; approximate: boolean } {
  if (f.num.toString().replace('-', '').length > 7 || f.den.toString().length > 7) {
    const s = Number((Number(f.num) / Number(f.den)).toPrecision(6)).toString()
    const [mantissa, power] = s.split('e')
    return { text: power ? `${mantissa}\\times 10^{${Number(power)}}` : s, approximate: true }
  }
  const sign = f.num < 0n ? '-' : ''
  const num = f.num < 0n ? -f.num : f.num
  return { text: f.den === 1n ? `${sign}${num}` : `${sign}\\frac{${num}}{${f.den}}`, approximate: false }
}
const scalar = (v: number) => latex(fraction(integer(v)))
const difference = (name: string, v: number) => v === 0 ? name : `${name}${v > 0 ? '-' : '+'}${scalar(Math.abs(v)).text}`

/** 解法の手順ではなく、同じ直線の別表現。長すぎる係数のみ6桁の近似と明示する。 */
export function lineEquation(id: string, v: Values, form: LineForm): { text: string; approximate: boolean } | null {
  const l = lineFromFormula(id, v)
  if (!l) return null
  if ('x' in l) {
    const x = scalar(l.x)
    return { text: `x${x.approximate ? '\\approx' : '='}${x.text}`, approximate: x.approximate }
  }
  let a: Fraction
  let b: Fraction
  if (id === 'line-two-points') {
    const dx = integer(v.x2) - integer(v.x1)
    const dy = integer(v.y2) - integer(v.y1)
    a = fraction(dy, dx)
    b = fraction(integer(v.y1) * dx - dy * integer(v.x1), dx * SCALE)
  } else if (id === 'line-point') {
    a = fraction(integer(v.a))
    b = fraction(integer(v.y1) * SCALE - integer(v.a) * integer(v.x1), SCALE * SCALE)
  } else {
    a = fraction(integer(v.m))
    b = fraction(integer(v.n))
  }
  const slope = latex(a)
  const intercept = latex({ ...b, num: b.num < 0n ? -b.num : b.num })
  const approximate = slope.approximate || intercept.approximate
  const equals = approximate ? '\\approx' : '='
  const coeff = a.num === a.den ? '' : a.num === -a.den ? '-' : slope.text
  if (form === 'point') {
    const x = id === 'line' ? 0 : v.x1
    const y = id === 'line' ? v.n : v.y1
    const pointApproximate = slope.approximate || scalar(x).approximate || scalar(y).approximate
    return { text: `${difference('y', y)}${pointApproximate ? '\\approx' : '='}${coeff}(${difference('x', x)})`, approximate: pointApproximate }
  }
  const tail = b.num === 0n ? '' : `${b.num > 0n ? '+' : '-'}${intercept.text}`
  return { text: `y${equals}${a.num === 0n ? latex(b).text : `${coeff}x${tail}`}`, approximate }
}
