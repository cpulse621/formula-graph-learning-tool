// グラフ平面の座標・目盛りの計算(画面のコードから分離)。

// 初期の表示範囲の目安: 横 ±7(約 ±2π)、縦 ±3.2 は必ず入る
export const BASE_HALF_WIDTH = 7
export const BASE_HALF_HEIGHT = 3.2

export const ZOOM_MIN = 0.25
export const ZOOM_MAX = 8
export const ZOOM_FACTOR = 1.5

/** 1単位あたりの画面の長さ(px)の基準。縦横は同じ比率にする */
export function baseScale(width: number, height: number): number {
  return Math.min(width / (2 * BASE_HALF_WIDTH), height / (2 * BASE_HALF_HEIGHT))
}

export function clampZoom(z: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z))
}

/** min 以上で最小の 1・2・5 × 10^k */
export function niceStep(min: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(min)))
  for (const m of [1, 2, 5, 10]) {
    if (m * p >= min * (1 - 1e-12)) return m * p
  }
  return 10 * p
}

const PI_STEPS = [1 / 12, 1 / 6, 1 / 4, 1 / 3, 1 / 2, 1, 2, 4, 8, 16].map((k) => k * Math.PI)

/** min 以上で最小の、π の目盛り幅(π/12, π/6, π/4, π/3, π/2, π, 2π, ...) */
export function piStep(min: number): number {
  return PI_STEPS.find((s) => s >= min * (1 - 1e-12)) ?? PI_STEPS[PI_STEPS.length - 1]
}

/** min〜max の間にある、step の整数倍の値(誤差がたまらないよう整数 k から作る) */
export function ticksBetween(min: number, max: number, step: number): number[] {
  const out: number[] = []
  const k0 = Math.ceil(min / step - 1e-9)
  const k1 = Math.floor(max / step + 1e-9)
  for (let k = k0; k <= k1; k++) out.push(Number((k * step).toPrecision(12)))
  return out
}
