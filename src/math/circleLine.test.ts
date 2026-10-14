import { describe, expect, it } from 'vitest'
import {
  circleAxes, lineAxes, formatDiscriminant, formatPoints, relateCircleLine, roundText, tangentTolerance,
  type Circle, type Line,
} from './circleLine'

const circle = (p: number, q: number, r: number): Circle => ({ p, q, r })
const line = (m: number, n: number): Line => ({ m, n })

describe('円と直線: 手計算との照合', () => {
  it('円 (0,0) r=2 と y = x + 0.5 → A=2, B=1, C=−3.75, D=31 → 2点', () => {
    const rel = relateCircleLine(circle(0, 0, 2), line(1, 0.5))
    expect(rel.A).toBe(2)
    expect(rel.B).toBe(1)
    expect(rel.C).toBe(-3.75)
    expect(rel.D).toBe(31)
    expect(rel.count).toBe(2)
    expect(rel.tangent).toBe(false)
    // x = (−1 ± √31)/4
    expect(rel.points[0].x).toBeCloseTo((-1 - Math.sqrt(31)) / 4, 12)
    expect(rel.points[1].x).toBeCloseTo((-1 + Math.sqrt(31)) / 4, 12)
  })

  it('円 (0,0) r=1 と y = 0.75x + 1.25 → A=1.5625, B=1.875, C=0.5625, D=0 → 接する。接点 (−0.6, 0.8)', () => {
    const rel = relateCircleLine(circle(0, 0, 1), line(0.75, 1.25))
    expect(rel.A).toBe(1.5625)
    expect(rel.B).toBe(1.875)
    expect(rel.C).toBe(0.5625)
    expect(rel.D).toBeCloseTo(0, 12)
    expect(rel.tangent).toBe(true)
    expect(rel.count).toBe(1)
    expect(rel.points).toHaveLength(1)
    expect(rel.points[0].x).toBeCloseTo(-0.6, 12)
    expect(rel.points[0].y).toBeCloseTo(0.8, 12)
  })

  it('円 (0,0) r=1 と y = x + 2 → A=2, B=4, C=3, D=−8 → なし', () => {
    const rel = relateCircleLine(circle(0, 0, 1), line(1, 2))
    expect([rel.A, rel.B, rel.C, rel.D]).toEqual([2, 4, 3, -8])
    expect(rel.count).toBe(0)
    expect(rel.points).toEqual([])
  })

  it('スライダーで作れる値: 円 (0,0) r=1 と y = 1(m=0, n=1)は接する。接点 (0, 1)', () => {
    const rel = relateCircleLine(circle(0, 0, 1), line(0, 1))
    expect(rel.tangent).toBe(true)
    expect(rel.count).toBe(1)
    expect(rel.points[0].x).toBeCloseTo(0, 12)
    expect(rel.points[0].y).toBeCloseTo(1, 12)
  })

  it('直線が中心を通る: 円 (1,2) r=2 と y = 2x → A=5, B=−10, C=1, D=80、距離 0', () => {
    const rel = relateCircleLine(circle(1, 2, 2), line(2, 0))
    expect([rel.A, rel.B, rel.C, rel.D]).toEqual([5, -10, 1, 80])
    expect(rel.count).toBe(2)
    expect(rel.distance).toBeCloseTo(0, 12)
    // 2点は中心について対称(中心 (1,2) が中点)
    expect((rel.points[0].x + rel.points[1].x) / 2).toBeCloseTo(1, 12)
    expect((rel.points[0].y + rel.points[1].y) / 2).toBeCloseTo(2, 12)
  })

  it('水平線 m=0: 円 (0,0) r=2 と y = 1 → x = ±√3', () => {
    const rel = relateCircleLine(circle(0, 0, 2), line(0, 1))
    expect(rel.D).toBe(12)
    expect(rel.points[0].x).toBeCloseTo(-Math.sqrt(3), 12)
    expect(rel.points[1].x).toBeCloseTo(Math.sqrt(3), 12)
    expect(rel.points[0].y).toBe(1)
  })
})

describe('性質の確認', () => {
  const cases: [Circle, Line][] = [
    [circle(0.5, -0.2, 1.5), line(0.3, 0.7)], // スライダーの刻みで出る値
    [circle(-3.3, 2.1, 4.7), line(-2.9, 4.4)],
    [circle(4.9, -4.9, 0.5), line(3, -5)],
    [circle(0, 0, 5), line(-0.1, 0.1)],
  ]
  it('交点は、円の上にも直線の上にもある', () => {
    for (const [c, l] of cases) {
      const rel = relateCircleLine(c, l)
      for (const pt of rel.points) {
        expect((pt.x - c.p) ** 2 + (pt.y - c.q) ** 2).toBeCloseTo(c.r * c.r, 9)
        expect(pt.y).toBeCloseTo(l.m * pt.x + l.n, 12)
      }
    }
  })

  it('D/4 = (1 + m²)(r² − d²)(判別式と距離は同じことを言っている)', () => {
    for (const [c, l] of cases) {
      const rel = relateCircleLine(c, l)
      expect(rel.D / 4).toBeCloseTo((1 + l.m * l.m) * (c.r * c.r - rel.distance ** 2), 9)
    }
  })

  it('距離 d = |mp − q + n| / √(1 + m²)', () => {
    expect(relateCircleLine(circle(0, 0, 1), line(0.75, 1.25)).distance).toBeCloseTo(1, 12)
    expect(relateCircleLine(circle(2, 3, 1), line(0, 0)).distance).toBe(3)
  })
})

describe('接する判定の境界(許容誤差は相対: 1e-9 × max(1, r²(1+m²)))', () => {
  it('ごく小さい D は接する、少し離れれば2点・0点', () => {
    // 円 (0,0) r=1 と y = n(m=0)。D = 4(1 − n²)
    expect(relateCircleLine(circle(0, 0, 1), line(0, 1 + 1e-12)).tangent).toBe(true)
    expect(relateCircleLine(circle(0, 0, 1), line(0, 1 - 1e-12)).tangent).toBe(true)
    const out = relateCircleLine(circle(0, 0, 1), line(0, 1 + 1e-7))
    expect(out.tangent).toBe(false)
    expect(out.count).toBe(0)
    const inn = relateCircleLine(circle(0, 0, 1), line(0, 1 - 1e-7))
    expect(inn.tangent).toBe(false)
    expect(inn.count).toBe(2)
  })

  it('許容誤差は、値が大きいほど大きくなる', () => {
    expect(tangentTolerance(circle(0, 0, 1), line(0, 0))).toBe(1e-9)
    expect(tangentTolerance(circle(0, 0, 100), line(100, 0))).toBeCloseTo(1e-9 * 1e4 * 10001, 6)
  })
})

describe('範囲の端でも NaN・Infinity が出ない', () => {
  const ext = [-100, -5, -3, 0, 3, 5, 100]
  it('p, q, n, m が ±100、r が 0.01〜100', () => {
    for (const p of ext) for (const q of ext) for (const r of [0.01, 0.5, 5, 100])
      for (const m of ext) for (const n of ext) {
        const rel = relateCircleLine(circle(p, q, r), line(m, n))
        for (const v of [rel.A, rel.B, rel.C, rel.D, rel.distance]) expect(Number.isFinite(v)).toBe(true)
        for (const pt of rel.points) {
          expect(Number.isFinite(pt.x)).toBe(true)
          expect(Number.isFinite(pt.y)).toBe(true)
        }
      }
  })
})

describe('表示用の文字', () => {
  it('D: 接すると判定したときだけ 0。小数は第4位まで、末尾の 0 は省く', () => {
    expect(formatDiscriminant({ D: 31, tangent: false })).toBe('31')
    expect(formatDiscriminant({ D: -8, tangent: false })).toBe('−8')
    expect(formatDiscriminant({ D: 1.23456789, tangent: false })).toBe('1.2346')
    expect(formatDiscriminant({ D: 2.5, tangent: false })).toBe('2.5')
    expect(formatDiscriminant({ D: 1e-14, tangent: true })).toBe('0')
  })
  it('D が小さくても、接しないなら 0 と出さない', () => {
    expect(formatDiscriminant({ D: 3e-6, tangent: false })).toBe('3.00e-6')
    expect(formatDiscriminant({ D: -8e-7, tangent: false })).toBe('−8.00e-7')
  })
  it('座標は小数第2位まで', () => {
    expect(roundText(-0.001, 2)).toBe('0')
    expect(formatPoints([{ x: -1.2, y: 1.6 }, { x: 1.8, y: -0.4 }])).toBe('(−1.2, 1.6)  (1.8, −0.4)')
    expect(formatPoints([{ x: -0.6, y: 0.8 }])).toBe('(−0.6, 0.8)')
    expect(formatPoints([{ x: 0.123456, y: 2 }])).toBe('(0.12, 2)')
    expect(formatPoints([])).toBe('')
  })
})

// ---- 軸・原点との共有点 ----
describe('円と軸・原点', () => {
  it('円 (0,0) r=2 → x軸 (−2,0) (2,0)、y軸 (0,−2) (0,2)。原点は通らない。◇ は4つ', () => {
    const a = circleAxes(circle(0, 0, 2))
    expect(a.x.kind).toBe('two')
    expect(a.x.points).toEqual([{ x: -2, y: 0 }, { x: 2, y: 0 }])
    expect(a.y.kind).toBe('two')
    expect(a.y.points).toEqual([{ x: 0, y: -2 }, { x: 0, y: 2 }])
    expect(a.throughOrigin).toBe(false)
    expect(a.marks).toHaveLength(4)
  })

  it('円 (1,1) r=1 → x軸に接する (1,0)、y軸に接する (0,1)', () => {
    const a = circleAxes(circle(1, 1, 1))
    expect(a.x.kind).toBe('tangent')
    expect(a.x.points).toEqual([{ x: 1, y: 0 }])
    expect(a.y.kind).toBe('tangent')
    expect(a.y.points).toEqual([{ x: 0, y: 1 }])
    expect(a.throughOrigin).toBe(false)
    expect(a.marks).toEqual([{ x: 1, y: 0 }, { x: 0, y: 1 }])
  })

  it('円 (3,4) r=5 → 原点を通る。x軸 (0,0) (6,0)、y軸 (0,0) (0,8)。◇ は (6,0) と (0,8)', () => {
    const a = circleAxes(circle(3, 4, 5))
    expect(a.throughOrigin).toBe(true)
    expect(a.x.points).toEqual([{ x: 0, y: 0 }, { x: 6, y: 0 }])
    expect(a.y.points).toEqual([{ x: 0, y: 0 }, { x: 0, y: 8 }])
    expect(a.marks).toEqual([{ x: 6, y: 0 }, { x: 0, y: 8 }])
  })

  it('円 (3,3) r=1 → どちらの軸とも共有点なし', () => {
    const a = circleAxes(circle(3, 3, 1))
    expect(a.x.kind).toBe('none')
    expect(a.y.kind).toBe('none')
    expect(a.marks).toEqual([])
  })

  it('原点で x軸に接する円 (0,2) r=2 → x軸の接点は原点(輪っか)。◇ は y軸との (0,4) だけ', () => {
    const a = circleAxes(circle(0, 2, 2))
    expect(a.throughOrigin).toBe(true)
    expect(a.x.kind).toBe('tangent')
    expect(a.x.points).toEqual([{ x: 0, y: 0 }])
    expect(a.y.points).toEqual([{ x: 0, y: 0 }, { x: 0, y: 4 }])
    expect(a.marks).toEqual([{ x: 0, y: 4 }])
  })

  it('スライダーの刻みで出る値: 円 (1, 2.3) r=2.3 は x軸に接する (1, 0)', () => {
    const a = circleAxes(circle(1, 2.3, 2.3))
    expect(a.x.kind).toBe('tangent')
    expect(a.x.points).toEqual([{ x: 1, y: 0 }])
  })

  it('小数の刻みで原点を通る円 (0.3, 0.4) r=0.5(誤差が出ても原点を通ると判定)', () => {
    const a = circleAxes(circle(0.3, 0.4, 0.5))
    expect(a.throughOrigin).toBe(true)
    expect(a.marks).toHaveLength(2)
    expect(a.marks[0].x).toBeCloseTo(0.6, 9)
    expect(a.marks[1].y).toBeCloseTo(0.8, 9)
  })

  it('接する判定の境界(許容誤差 1e-9 × max(1, r²))', () => {
    // 円 (0, 1) r: r² − q² = r² − 1
    expect(circleAxes(circle(0, 1, Math.sqrt(1 + 1e-12))).x.kind).toBe('tangent')
    expect(circleAxes(circle(0, 1, Math.sqrt(1 - 1e-12))).x.kind).toBe('tangent')
    expect(circleAxes(circle(0, 1, Math.sqrt(1 + 1e-7))).x.kind).toBe('two')
    expect(circleAxes(circle(0, 1, Math.sqrt(1 - 1e-7))).x.kind).toBe('none')
    // y軸も同じ
    expect(circleAxes(circle(1, 0, Math.sqrt(1 + 1e-7))).y.kind).toBe('two')
    expect(circleAxes(circle(1, 0, Math.sqrt(1 - 1e-7))).y.kind).toBe('none')
  })
})

describe('直線と軸・原点', () => {
  it('y = 2x − 4 → x切片 (2,0)、y切片 (0,−4)。◇ は2つ', () => {
    const a = lineAxes(line(2, -4))
    expect(a.xAxis).toBe('cross')
    expect(a.xIntercept).toEqual({ x: 2, y: 0 })
    expect(a.yIntercept).toEqual({ x: 0, y: -4 })
    expect(a.throughOrigin).toBe(false)
    expect(a.marks).toEqual([{ x: 0, y: -4 }, { x: 2, y: 0 }])
  })

  it('y = 0.5x → 原点を通る(輪っか)、◇ なし', () => {
    const a = lineAxes(line(0.5, 0))
    expect(a.throughOrigin).toBe(true)
    expect(a.ring).toBe(true)
    expect(a.marks).toEqual([])
    expect(a.xIntercept).toEqual({ x: 0, y: 0 })
  })

  it('y = 3(m=0, n=3) → y切片 (0,3)、x軸と交わらない', () => {
    const a = lineAxes(line(0, 3))
    expect(a.xAxis).toBe('parallel')
    expect(a.xIntercept).toBeNull()
    expect(a.marks).toEqual([{ x: 0, y: 3 }])
    expect(a.ring).toBe(false)
  })

  it('y = 0(m=0, n=0) → x軸と重なっている(印なし、輪っかもなし)', () => {
    const a = lineAxes(line(0, 0))
    expect(a.xAxis).toBe('coincide')
    expect(a.marks).toEqual([])
    expect(a.ring).toBe(false)
  })

  it('x切片に -0 を出さない', () => {
    expect(Object.is(lineAxes(line(2, 0)).xIntercept!.x, 0)).toBe(true)
    expect(Object.is(lineAxes(line(-2, 0)).xIntercept!.x, 0)).toBe(true)
  })

  it('原点を通る判定の境界(|n| ≤ 1e-9)', () => {
    expect(lineAxes(line(1, 1e-10)).ring).toBe(true)
    expect(lineAxes(line(1, 1e-7)).ring).toBe(false)
  })
})

describe('範囲の端でも NaN・Infinity が出ない(軸・原点)', () => {
  const ext = [-100, -5, -0.1, 0, 0.1, 5, 100]
  it('円: p, q が ±100、r が 0.01〜100', () => {
    for (const p of ext) for (const q of ext) for (const r of [0.01, 0.5, 5, 100]) {
      const a = circleAxes(circle(p, q, r))
      for (const pt of [...a.x.points, ...a.y.points, ...a.marks]) {
        expect(Number.isFinite(pt.x)).toBe(true)
        expect(Number.isFinite(pt.y)).toBe(true)
      }
    }
  })
  it('直線: m, n が ±100(m がごく小さくても有限)', () => {
    for (const m of [...ext, 1e-10, -1e-10]) for (const n of ext) {
      const a = lineAxes(line(m, n))
      for (const pt of [a.yIntercept, ...(a.xIntercept ? [a.xIntercept] : []), ...a.marks]) {
        expect(Number.isFinite(pt.x)).toBe(true)
        expect(Number.isFinite(pt.y)).toBe(true)
      }
    }
  })
})
