import { discontinuities, evaluateFunction, featurePoint, type FunctionSpec, type Point } from '../math/functions'
import type { PlaneCtx } from './Plane'

/** 定義域・不連続点で分割し、画面外の線分は切り取る。 */
export function functionSegments(ctx: PlaneCtx, spec: FunctionSpec): Point[][] {
  const { kind, values: v } = spec
  if ((kind === 'exponential' || kind === 'logarithm') && (v.b <= 0 || (kind === 'logarithm' && v.b === 1))) return []
  let min = ctx.xMin
  if (kind === 'sqrt' || kind === 'logarithm') min = Math.max(min, v.p)
  if (min >= ctx.xMax) return []
  const cuts = [min, ...discontinuities(spec, min, ctx.xMax), ctx.xMax]
  const feature = featurePoint(spec)
  const segments: Point[][] = []
  let step = 1.5 / ctx.scale
  if (kind === 'tan' && v.b !== 0) step = Math.min(step, Math.PI / Math.abs(v.b) / 48)
  step = Math.max(step, (ctx.xMax - min) / 40000)
  for (let i = 1; i < cuts.length; i++) {
    const lo = cuts[i - 1], hi = cuts[i]
    const inset = Math.max(1e-10, (hi - lo) * 1e-9)
    const start = i > 1 || evaluateFunction(spec, lo) === null ? lo + inset : lo
    const end = i < cuts.length - 1 || evaluateFunction(spec, hi) === null ? hi - inset : hi
    const xs = [start, end]
    for (let x = start + step; x < end; x += step) xs.push(x)
    if (feature && feature.x > start && feature.x < end) xs.push(feature.x)
    xs.sort((a, b) => a - b)
    const branch: Point[] = []
    for (const x of xs) {
      const y = evaluateFunction(spec, x)
      if (y === null) { if (branch.length) segments.push(branch.splice(0)); continue }
      branch.push({ x, y })
    }
    if (branch.length) segments.push(branch)
  }
  return segments
}

export function functionPath(ctx: PlaneCtx, spec: FunctionSpec, segments = functionSegments(ctx, spec)): string {
  const parts: string[] = []
  for (const branch of segments) {
    let previousEnd = ''
    for (let i = 1; i < branch.length; i++) {
      const p = branch[i - 1], q = branch[i]
      const dy = q.y - p.y
      let lo = 0, hi = 1
      if (dy === 0) { if (p.y < ctx.yMin || p.y > ctx.yMax) { previousEnd = ''; continue } }
      else {
        const t1 = (ctx.yMin - p.y) / dy, t2 = (ctx.yMax - p.y) / dy
        lo = Math.max(0, Math.min(t1, t2)); hi = Math.min(1, Math.max(t1, t2))
        if (lo > hi) { previousEnd = ''; continue }
      }
      const xy = (t: number) => `${ctx.sx(p.x + t * (q.x - p.x)).toFixed(2)},${ctx.sy(p.y + t * dy).toFixed(2)}`
      const start = xy(lo), end = xy(hi)
      if (start !== previousEnd) parts.push(`M${start}`)
      parts.push(`L${end}`)
      previousEnd = end
    }
  }
  return parts.join('')
}
