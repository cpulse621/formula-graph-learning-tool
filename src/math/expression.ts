// 式を、今の数値を入れた1行の文字にする(畳んだカードの表示と、読み上げ用)。
// 例: y = 2 sin(x − π/4) + 1
import { clean, valueText } from './format'
import { degToRad } from './unitCircle'
import type { FunctionKind } from './functions'
import { lineFromFormula } from './lineForms'

const MINUS = '−'

// 先頭の項に付ける係数。1 は省き、−1 は「−」だけにする
function coef(v: number): string {
  if (v === 1) return ''
  if (v === -1) return MINUS
  return valueText(v)
}

// 「 + 3」「 − 3」のような、あとに続く項(0 のときは空)
function tail(v: number): string {
  if (v === 0) return ''
  return ` ${v > 0 ? '+' : MINUS} ${valueText(Math.abs(v))}`
}

// x の項(b x)。係数 1 は「x」、0 は項なし
function xTerm(b: number): string | null {
  if (b === 0) return null
  if (b === 1) return 'x'
  if (b === -1) return `${MINUS}x`
  return `${valueText(b)}x`
}

function trigSummary(fn: 'sin' | 'cos' | 'tan', v: Record<string, number>): string {
  const { a, b, c, d } = v
  if (a === 0 && fn !== 'tan') return `y = ${valueText(d)}`
  const bx = xTerm(b)
  const inside = bx === null ? valueText(c) : bx + tail(c)
  const sep = a === 1 || a === -1 ? '' : ' '
  return `y = ${coef(a)}${sep}${fn}(${inside})${tail(d)}`
}

// (x − p)² の形。p = 0 のときは x²
function squareTerm(name: 'x' | 'y', shift: number): string {
  if (shift === 0) return `${name}²`
  return `(${name} ${shift > 0 ? MINUS : '+'} ${valueText(Math.abs(shift))})²`
}

function circleSummary(v: Record<string, number>): string {
  const { p, q, r } = v
  return `${squareTerm('x', p)} + ${squareTerm('y', q)} = ${valueText(clean(r * r))}`
}

function lineSummary(v: Record<string, number>): string {
  const { m, n } = v
  const mx = xTerm(m)
  return `y = ${mx === null ? valueText(n) : mx + tail(n)}`
}

function functionSummary(kind: FunctionKind, v: Record<string, number>): string {
  if (kind === 'tan') return trigSummary('tan', v)
  if (kind === 'quadratic-standard') {
    if (v.a === 0) return lineSummary({ m: v.b, n: v.c })
    return `y = ${coef(v.a)}x²${v.b === 0 ? '' : ` ${v.b > 0 ? '+' : MINUS} ${coef(Math.abs(v.b))}x`}${tail(v.c)}`
  }
  const x = v.p === 0 ? 'x' : `(x${tail(-v.p)})`
  const term = kind === 'quadratic' ? `${x}²` : kind === 'cubic' ? `${x}³`
    : kind === 'absolute' ? `|x${tail(-v.p)}|` : kind === 'sqrt' ? `√${x}`
    : kind === 'exponential' ? `${valueText(v.b)}^${x}` : kind === 'logarithm' ? `log_${valueText(v.b)}(${v.p === 0 ? 'x' : `x${tail(-v.p)}`})` : ''
  // 定義域のある式は 0 倍でも消去せず、元の定義域を読み取れる形を保つ。
  return kind === 'reciprocal' ? `y = ${valueText(v.a)}/${x}${tail(v.q)}` : `y = ${coef(v.a)}${kind === 'exponential' && v.a !== 1 && v.a !== -1 ? ' · ' : ''}${term}${tail(v.q)}`
}

/** 式のIDと穴の値から、1行の式の文字を作る */
export function formulaSummary(formulaId: string, values: Record<string, number>): string {
  switch (formulaId) {
    case 'sin':
    case 'cos':
      return trigSummary(formulaId, values)
    case 'circle':
      return circleSummary(values)
    case 'line':
      return lineSummary(values)
    case 'line-point':
      return `y${tail(-values.y1)} = ${valueText(values.a)}(x${tail(-values.x1)})`
    case 'line-two-points': {
      const line = lineFromFormula(formulaId, values)
      if (!line) return '2点が重なっています（直線は決まりません）'
      if ('x' in line) return `x = ${valueText(line.x)}`
      return `y${tail(-values.y1)} = (${valueText(values.y2)} − ${valueText(values.y1)})/(${valueText(values.x2)} − ${valueText(values.x1)})(x${tail(-values.x1)})`
    }
    case 'unit-circle':
      return `θ = ${valueText(values.theta)}° (${valueText(degToRad(values.theta))})`
    case 'quadratic': case 'quadratic-standard': case 'cubic': case 'absolute': case 'sqrt':
    case 'exponential': case 'logarithm': case 'reciprocal': case 'tan':
      return functionSummary(formulaId, values)
    default:
      return ''
  }
}
