import { valueText } from './format'

export type FunctionKind = 'quadratic' | 'quadratic-standard' | 'cubic' | 'reciprocal' | 'absolute' | 'sqrt' | 'exponential' | 'logarithm' | 'tan'
export type FunctionSpec = { kind: FunctionKind; values: Record<string, number> }
export type Point = { x: number; y: number }

/** 実数として定義できない場所では null。0倍でも元の式の定義域を保つ。 */
export function evaluateFunction({ kind, values: v }: FunctionSpec, x: number): number | null {
  const t = x - v.p
  let y: number
  switch (kind) {
    case 'quadratic': y = v.a * t * t + v.q; break
    case 'quadratic-standard': y = (v.a * x + v.b) * x + v.c; break
    case 'cubic': y = v.a * t ** 3 + v.q; break
    case 'absolute': y = v.a * Math.abs(t) + v.q; break
    case 'reciprocal': if (t === 0) return null; y = v.a / t + v.q; break
    case 'sqrt': if (t < 0) return null; y = v.a * Math.sqrt(t) + v.q; break
    case 'exponential': if (v.b <= 0) return null; y = v.a === 0 ? v.q : v.a * v.b ** t + v.q; break
    case 'logarithm':
      if (v.b <= 0 || v.b === 1 || t <= 0) return null
      y = v.a * Math.log(t) / Math.log(v.b) + v.q; break
    case 'tan': {
      const angle = v.b * x + v.c
      if (Math.abs(Math.cos(angle)) < 1e-12) return null
      y = v.a * Math.tan(angle) + v.d; break
    }
  }
  return Number.isFinite(y) ? y : null
}

/** 解析的に求めた途切れ。サンプル点の偶然の位置に依存せず、枝を分ける。 */
export function discontinuities({ kind, values: v }: FunctionSpec, min: number, max: number): number[] {
  if (kind === 'reciprocal' || kind === 'logarithm') return v.p > min && v.p < max ? [v.p] : []
  if (kind !== 'tan' || v.b === 0) return []
  const lo = Math.min(v.b * min + v.c, v.b * max + v.c)
  const hi = Math.max(v.b * min + v.c, v.b * max + v.c)
  const result: number[] = []
  for (let k = Math.ceil((lo - Math.PI / 2) / Math.PI); k <= Math.floor((hi - Math.PI / 2) / Math.PI); k++) {
    result.push((Math.PI / 2 + k * Math.PI - v.c) / v.b)
  }
  return result.sort((a, b) => a - b)
}

export function featurePoint({ kind, values: v }: FunctionSpec): (Point & { label: string }) | null {
  switch (kind) {
    case 'quadratic': return v.a === 0 ? null : { x: v.p, y: v.q, label: '頂点' }
    case 'quadratic-standard': {
      if (v.a === 0) return null
      const x = -v.b / (2 * v.a)
      return { x, y: evaluateFunction({ kind, values: v }, x)!, label: '頂点' }
    }
    case 'cubic': return v.a === 0 ? null : { x: v.p, y: v.q, label: '変曲点' }
    case 'sqrt': return { x: v.p, y: v.q, label: '端点' }
    case 'absolute': return v.a === 0 ? null : { x: v.p, y: v.q, label: '折れ曲がる点' }
    default: return null
  }
}

// x軸との共有点。null は連続した範囲で x 軸と重なる場合。
export function xIntercepts(spec: FunctionSpec, min = -7, max = 7): number[] | null {
  const { kind, values: v } = spec
  if (kind === 'quadratic-standard') {
    if (v.a === 0) return v.b === 0 ? (v.c === 0 ? null : []) : [-v.c / v.b]
    const d = v.b * v.b - 4 * v.a * v.c
    if (d < 0) return []
    if (d === 0) return [-v.b / (2 * v.a)]
    // 桁落ちを避ける二次方程式の根。
    const r = -0.5 * (v.b + (v.b < 0 ? -1 : 1) * Math.sqrt(d))
    return [r / v.a, v.c / r].sort((a, b) => a - b)
  }
  if (kind === 'tan') {
    if (v.a === 0 || v.b === 0) return evaluateFunction(spec, min) === 0 ? null : []
    const angle = Math.atan(-v.d / v.a)
    const lo = Math.min(v.b * min + v.c, v.b * max + v.c)
    const hi = Math.max(v.b * min + v.c, v.b * max + v.c)
    const xs: number[] = []
    for (let k = Math.ceil((lo - angle) / Math.PI); k <= Math.floor((hi - angle) / Math.PI); k++) xs.push((angle + k * Math.PI - v.c) / v.b)
    return xs.sort((a, b) => a - b)
  }
  if (v.a === 0) return v.q === 0 ? null : []
  const r = -v.q / v.a
  switch (kind) {
    case 'quadratic': return r < 0 ? [] : r === 0 ? [v.p] : [v.p - Math.sqrt(r), v.p + Math.sqrt(r)]
    case 'absolute': return r < 0 ? [] : r === 0 ? [v.p] : [v.p - r, v.p + r]
    case 'cubic': return [v.p + Math.cbrt(r)]
    case 'sqrt': return r < 0 ? [] : [v.p + r * r]
    case 'reciprocal': return r === 0 ? [] : [v.p + 1 / r]
    case 'exponential': return v.b === 1 ? (v.a + v.q === 0 ? null : []) : r <= 0 ? [] : [v.p + Math.log(r) / Math.log(v.b)]
    case 'logarithm': return [v.p + v.b ** r].filter((x) => Number.isFinite(x) && x > v.p)
  }
}

export function functionRows(spec: FunctionSpec): { label: string; text: string }[] {
  const { kind, values: v } = spec
  const rows: { label: string; text: string }[] = []
  const point = featurePoint(spec)
  if (point) rows.push({ label: point.label, text: `(${valueText(point.x)}, ${valueText(point.y)})` })
  const all = 'すべての実数'
  const tanNumerator = `π/2${v.c ? ` ${v.c > 0 ? '−' : '+'} ${valueText(Math.abs(v.c))}` : ''} + kπ`
  const tanDenominator = kind === 'tan' ? (v.b < 0 ? `(${valueText(v.b)})` : valueText(v.b)) : ''
  const domain = kind === 'sqrt' ? `x ≥ ${valueText(v.p)}` : kind === 'logarithm' ? `x > ${valueText(v.p)}`
    : kind === 'reciprocal' ? `x ≠ ${valueText(v.p)}` : kind === 'tan'
      ? v.b === 0 ? evaluateFunction(spec, 0) === null ? '定義できる x はありません' : all : `x ≠ (${tanNumerator})/${tanDenominator}（k は整数）` : all
  rows.push({ label: '定義域', text: domain })
  if (kind === 'reciprocal' || kind === 'logarithm' || kind === 'exponential') {
    const lines: string[] = []
    if (v.a !== 0 && kind !== 'exponential') lines.push(`x = ${valueText(v.p)}`)
    if (v.a !== 0 && (kind === 'reciprocal' || (kind === 'exponential' && v.b !== 1))) lines.push(`y = ${valueText(v.q)}`)
    rows.push({ label: '漸近線', text: lines.join('、') || 'なし（定数のグラフ）' })
  }
  if (kind === 'tan') rows.push({ label: '周期', text: v.a === 0 || v.b === 0 ? 'なし' : valueText(Math.PI / Math.abs(v.b)) })
  if (kind === 'quadratic-standard') rows.push({ label: '判別式 D', text: v.a === 0 ? '二次の項なし' : valueText(v.b * v.b - 4 * v.a * v.c) })
  const y = evaluateFunction(spec, 0)
  rows.push({ label: 'y軸との共有点', text: y === null ? 'なし' : `(0, ${valueText(y)})` })
  const xs = xIntercepts(spec)
  rows.push({ label: kind === 'tan' ? 'x軸との共有点（−7 ≤ x ≤ 7）' : 'x軸との共有点',
    text: xs === null ? '定義域の範囲で x軸と重なる' : xs.length === 0 ? 'なし' : xs.map((x) => `(${valueText(x)}, 0)`).join('、') })
  return rows
}
