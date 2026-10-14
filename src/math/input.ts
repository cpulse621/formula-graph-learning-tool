// 数値入力・スライダーの値の扱い(画面のコードから分離)。
import { clean } from './format'

/** 刻み(0.1 や 0.5)の小数の桁数 */
function decimalsOf(step: number): number {
  return (String(step).split('.')[1] ?? '').length
}

/**
 * スライダーの値を刻みの桁で丸める(0.1 + 0.2 = 0.30000000000000004 を出さない)。
 * π刻み(step が π/12 など)は、刻みの整数倍をそのまま使う。
 */
export function snapSlider(v: number, step: number, pi: boolean): number {
  if (pi) return Math.round(v / step) * step
  return Number(v.toFixed(decimalsOf(step)))
}

/**
 * 数値入力の文字を、確定する値にする。
 * 空・「-」・「1e999」など数として使えない文字は null(確定せず、元の値に戻す)。
 * 範囲の外は、範囲の端に止める。
 */
export function parseInput(text: string, lo: number, hi: number): number | null {
  const t = text.trim()
  if (t === '') return null
  const v = Number(t)
  if (!Number.isFinite(v)) return null
  return clean(Math.min(hi, Math.max(lo, v)), 10)
}

/** 数値入力に表示する文字 */
export function inputText(v: number): string {
  return String(clean(v, 6))
}
