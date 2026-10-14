// 数の表示用の整形。π の分数(π/3 など)と、小数の整形をまとめる。

const MINUS = '−' // 画面に出す文字では、ハイフンでなくマイナス記号を使う

// 小数の誤差(0.30000000000000004 など)を丸めて、-0 を 0 にする
export function clean(x: number, digits = 6): number {
  const v = Number(x.toFixed(digits))
  return Object.is(v, -0) ? 0 : v
}

/**
 * x が (p/q)π と見なせるとき、既約分数 {num, den}(num は符号つき)を返す。
 * 0 や、見なせない数は null。許容誤差は 1e-9。
 */
export function asPiFraction(x: number, maxDen = 120): { num: number; den: number } | null {
  if (Math.abs(x) < 1e-12) return null
  const r = x / Math.PI
  for (let den = 1; den <= maxDen; den++) {
    const num = Math.round(r * den)
    if (num !== 0 && Math.abs(x - (num / den) * Math.PI) < 1e-9) return { num, den }
  }
  return null
}

function piCoef(n: number): string {
  return n === 1 ? 'π' : `${n}π`
}

/** 画面の文字用。例: 0 → "0"、π/3 → "π/3"、-2π/3 → "−2π/3"、1.5 → "1.5" */
export function valueText(x: number): string {
  if (Math.abs(x) < 1e-12) return '0'
  const f = asPiFraction(x)
  if (!f) return String(clean(x)).replace('-', MINUS)
  const sign = f.num < 0 ? MINUS : ''
  const top = piCoef(Math.abs(f.num))
  return f.den === 1 ? `${sign}${top}` : `${sign}${top}/${f.den}`
}

/** KaTeX 用。例: π/3 → "\frac{\pi}{3}" */
export function valueLatex(x: number): string {
  if (Math.abs(x) < 1e-12) return '0'
  const f = asPiFraction(x)
  if (!f) return String(clean(x))
  const sign = f.num < 0 ? '-' : ''
  const n = Math.abs(f.num)
  const top = n === 1 ? '\\pi' : `${n}\\pi`
  return f.den === 1 ? `${sign}${top}` : `${sign}\\frac{${top}}{${f.den}}`
}
