// 円 (x − p)² + (y − q)² = r² と、直線 y = mx + n の位置関係。
// 直線を円に代入して、2次方程式 A x² + B x + C = 0 にする。
//   A = 1 + m²、B = 2(m(n − q) − p)、C = p² + (n − q)² − r²、判別式 D = B² − 4AC
import { clean } from './format'
import type { GraphLine } from './lineForms'

export type Circle = { p: number; q: number; r: number }
export type Line = { m: number; n: number }
export type Point = { x: number; y: number }

export type Relation = {
  A: number
  B: number
  C: number
  D: number // 判別式(そのままの値)
  tangent: boolean // 接すると判定したか
  count: 0 | 1 | 2 // 交点の数
  points: Point[] // 交点(x の小さい順)。接するときは接点1つ
  distance: number // 中心から直線までの距離(表示用。判定は D で行う)
}

/** 接する判定の許容誤差(相対): 1e-9 × max(1, r²(1 + m²)) */
export function tangentTolerance(c: Circle, l: GraphLine): number {
  return 1e-9 * Math.max(1, c.r * c.r * ('x' in l ? 1 : 1 + l.m * l.m))
}

export function relateCircleLine(c: Circle, l: GraphLine): Relation {
  if ('x' in l) {
    // x=k を代入して y の二次方程式にする。2点は y の小さい順。
    const A = 1
    const B = -2 * c.q
    const C = (l.x - c.p) ** 2 + c.q ** 2 - c.r ** 2
    const D = 4 * (c.r ** 2 - (l.x - c.p) ** 2)
    const tangent = Math.abs(D) <= tangentTolerance(c, l)
    const s = Math.sqrt(Math.max(0, D)) / 2
    const points = tangent ? [{ x: l.x, y: c.q }] : D > 0 ? [{ x: l.x, y: c.q - s }, { x: l.x, y: c.q + s }] : []
    return { A, B, C, D, tangent, count: points.length as 0 | 1 | 2, points, distance: Math.abs(l.x - c.p) }
  }
  const A = 1 + l.m * l.m
  const B = 2 * (l.m * (l.n - c.q) - c.p)
  const C = c.p * c.p + (l.n - c.q) * (l.n - c.q) - c.r * c.r
  // ほぼ縦の場合、B²−4AC の大きい項どうしの差では精度が失われる。
  // 単位法線への射影で距離と交点を計算する。
  const length = Math.hypot(l.m, 1)
  const normalX = l.m / length
  const normalY = -1 / length
  const signedDistance = normalX * c.p + normalY * c.q + l.n / length
  const distance = Math.abs(signedDistance)
  const steep = Math.abs(l.m) > 1000
  const D = steep ? 4 * A * (c.r * c.r - distance * distance) : B * B - 4 * A * C

  const tangent = Math.abs(D) <= tangentTolerance(c, l)
  const at = (x: number): Point => ({ x, y: l.m * x + l.n })

  let points: Point[]
  if (steep) {
    const foot = { x: c.p - signedDistance * normalX, y: c.q - signedDistance * normalY }
    const offset = Math.sqrt(Math.max(0, c.r * c.r - distance * distance))
    points = tangent ? [foot] : D > 0 ? [
      { x: foot.x - offset / length, y: foot.y - offset * l.m / length },
      { x: foot.x + offset / length, y: foot.y + offset * l.m / length },
    ] : []
  } else if (tangent) {
    points = [at(-B / (2 * A))] // D = 0 として、接点だけ出す
  } else if (D > 0) {
    const s = Math.sqrt(D)
    points = [at((-B - s) / (2 * A)), at((-B + s) / (2 * A))]
  } else {
    points = []
  }
  return { A, B, C, D, tangent, count: points.length as 0 | 1 | 2, points, distance }
}

const MINUS = '−'

/** 小数第 places 位までに丸めた文字(末尾の 0 は省く、マイナスは「−」) */
export function roundText(x: number, places: number): string {
  return String(clean(x, places)).replace(/^-/, MINUS)
}

/**
 * 判別式の表示。接すると判定したときだけ「0」と出す。
 * それ以外は、小数第4位まで(末尾の 0 は省く)。小さすぎて第4位までで 0 になる値は、指数の形で出す。
 */
export function formatDiscriminant(rel: Pick<Relation, 'D' | 'tangent'>): string {
  if (rel.tangent) return '0'
  if (Math.abs(rel.D) >= 1e-4) return roundText(rel.D, 4)
  return rel.D.toExponential(2).replace(/^-/, MINUS) // 先頭のマイナスだけ(指数の「e-6」は変えない)
}

/** 交点の座標の表示。例: (−1.2, 1.6)  (1.8, −0.4)(小数第2位まで) */
export function formatPoints(points: Point[]): string {
  return points.map((p) => `(${roundText(p.x, 2)}, ${roundText(p.y, 2)})`).join('  ')
}

// ---- 軸・原点との共有点 ----

/** 軸に接する・原点を通る、の判定の許容誤差(相対): 1e-9 × max(1, r²) */
function axisTolerance(c: Circle): number {
  return 1e-9 * Math.max(1, c.r * c.r)
}

/** 軸と円の共有点。kind: 'two'(2点)、'tangent'(接する・1点)、'none'(なし) */
export type AxisHit = { kind: 'two' | 'tangent' | 'none'; points: Point[] }

export type CircleAxes = {
  x: AxisHit // x軸との共有点(原点を含む)
  y: AxisHit // y軸との共有点(原点を含む)
  throughOrigin: boolean // 原点を通るか(輪っかで出す)
  marks: Point[] // ◇ で出す点(原点は除く)
}

// 軸と円が (中心からの座標) ± √s で交わるとして、共有点を作る
function hitOf(s: number, tol: number, make: (t: number) => Point): AxisHit {
  if (Math.abs(s) <= tol) return { kind: 'tangent', points: [make(0)] } // 接する(1点)
  if (s > 0) {
    const t = Math.sqrt(s)
    return { kind: 'two', points: [make(-t), make(t)] }
  }
  return { kind: 'none', points: [] }
}

/** 円 (x − p)² + (y − q)² = r² と、x軸・y軸・原点との関係 */
export function circleAxes(c: Circle): CircleAxes {
  const tol = axisTolerance(c)
  // x軸: y = 0 を代入して (x − p)² = r² − q²
  const x = hitOf(c.r * c.r - c.q * c.q, tol, (t) => ({ x: c.p + t, y: 0 }))
  // y軸: x = 0 を代入して (y − q)² = r² − p²
  const y = hitOf(c.r * c.r - c.p * c.p, tol, (t) => ({ x: 0, y: c.q + t }))
  const throughOrigin = Math.abs(c.p * c.p + c.q * c.q - c.r * c.r) <= tol

  // 原点を通るときは、各軸の共有点のうち原点に最も近い1点が原点。それを ◇ の一覧から除く
  const withoutOrigin = (pts: Point[]): Point[] => {
    if (!throughOrigin || pts.length === 0) return pts
    let k = 0
    pts.forEach((pt, i) => {
      if (Math.hypot(pt.x, pt.y) < Math.hypot(pts[k].x, pts[k].y)) k = i
    })
    return pts.filter((_, i) => i !== k)
  }
  return { x, y, throughOrigin, marks: [...withoutOrigin(x.points), ...withoutOrigin(y.points)] }
}

export type LineAxes = {
  yIntercept: Point // (0, n)
  xIntercept: Point | null // m ≠ 0 のとき (−n/m, 0)
  xAxis: 'cross' | 'parallel' | 'coincide' // x軸と、交わる / 平行(交わらない) / 重なっている
  throughOrigin: boolean // 原点を通るか(x軸と重なるときは輪っかを出さないので、ring を見る)
  ring: boolean // 原点に輪っかを出すか(x軸と重なる y = 0 は出さない)
  marks: Point[] // ◇ で出す点
}

/** 直線 y = mx + n と、x軸・y軸・原点との関係 */
export function lineAxes(l: Line): LineAxes {
  const yIntercept: Point = { x: 0, y: l.n }
  const xIntercept: Point | null = l.m === 0 ? null : { x: clean(-l.n / l.m, 12) + 0, y: 0 }
  const throughOrigin = Math.abs(l.n) <= 1e-9
  const xAxis = l.m !== 0 ? 'cross' : throughOrigin ? 'coincide' : 'parallel'
  const ring = throughOrigin && xAxis !== 'coincide'

  let marks: Point[] = []
  if (xAxis !== 'coincide' && !throughOrigin) {
    marks = xIntercept ? [yIntercept, xIntercept] : [yIntercept]
  }
  return { yIntercept, xIntercept, xAxis, throughOrigin, ring, marks }
}
