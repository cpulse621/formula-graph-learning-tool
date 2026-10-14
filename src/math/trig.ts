// y = a sin(bx + c) + d と y = a cos(bx + c) + d の性質を計算する。

export type SinusoidKind = 'sin' | 'cos'

export type Sinusoid = {
  kind: SinusoidKind
  a: number
  b: number
  c: number
  d: number
}

const TWO_PI = 2 * Math.PI

export function evaluate(s: Sinusoid, x: number): number {
  const t = s.b * x + s.c
  return s.a * (s.kind === 'sin' ? Math.sin(t) : Math.cos(t)) + s.d
}

/** 振幅 |a| */
export function amplitude(s: Sinusoid): number {
  return Math.abs(s.a)
}

/** 周期 2π/|b|。b = 0 のときは周期がないので null */
export function period(s: Sinusoid): number | null {
  return s.b === 0 ? null : TWO_PI / Math.abs(s.b)
}

/** 横の移動 −c/b(y = a sin bx、y = a cos bx からの移動量)。b = 0 のときは null */
export function horizontalShift(s: Sinusoid): number | null {
  return s.b === 0 ? null : -s.c / s.b
}

/** 最大値 |a| + d */
export function maxValue(s: Sinusoid): number {
  return Math.abs(s.a) + s.d
}

/** 最小値 −|a| + d */
export function minValue(s: Sinusoid): number {
  return -Math.abs(s.a) + s.d
}

/**
 * 最大値になる x(山の位置)を、from 以上 to 以下の範囲で小さい順に返す。
 * a = 0 や b = 0 のときは山がないので空。
 */
export function peakXs(s: Sinusoid, from: number, to: number): number[] {
  if (s.a === 0 || s.b === 0 || from > to) return []
  // a·f(t) が最大になる t の1つ。sin: t = ±π/2、cos: t = 0 か π
  let t0: number
  if (s.kind === 'sin') t0 = s.a > 0 ? Math.PI / 2 : -Math.PI / 2
  else t0 = s.a > 0 ? 0 : Math.PI
  // t = b x + c = t0 + 2πk  →  x = (t0 + 2πk − c) / b
  const x0 = (t0 - s.c) / s.b
  const T = TWO_PI / Math.abs(s.b)
  const kStart = Math.ceil((from - x0) / T - 1e-9)
  const xs: number[] = []
  for (let k = kStart; ; k++) {
    const x = x0 + k * T
    if (x > to + 1e-9) break
    xs.push(x)
  }
  return xs
}
