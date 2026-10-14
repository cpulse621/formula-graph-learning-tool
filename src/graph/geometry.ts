// 描画の幾何(画面のコードから分離)。

/**
 * 直線 y = mx + n を、長方形 [xMin, xMax] × [yMin, yMax] の中に切り取る。
 * 傾きが ±100 でも、画面の外へ巨大な座標を出さないために使う。当たらないときは null。
 */
export function clipLine(
  m: number, n: number, xMin: number, xMax: number, yMin: number, yMax: number,
): { x1: number; y1: number; x2: number; y2: number } | null {
  let lo = xMin
  let hi = xMax
  if (m === 0) {
    if (n < yMin || n > yMax) return null
  } else {
    const a = (yMin - n) / m
    const b = (yMax - n) / m
    lo = Math.max(lo, Math.min(a, b))
    hi = Math.min(hi, Math.max(a, b))
  }
  if (lo > hi) return null
  return { x1: lo, y1: m * lo + n, x2: hi, y2: m * hi + n }
}
