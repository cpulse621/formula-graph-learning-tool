import { describe, expect, it } from 'vitest'
import { circleAxisRows, lineAxisRows } from './axisText'
import { circleAxes, lineAxes } from './circleLine'

describe('円の軸との共有点の文字', () => {
  it('2 個', () => {
    expect(circleAxisRows(circleAxes({ p: 0, q: 0, r: 1.5 }))).toEqual([
      { label: 'x軸との共有点', text: '2 個  (−1.5, 0)  (1.5, 0)' },
      { label: 'y軸との共有点', text: '2 個  (0, −1.5)  (0, 1.5)' },
    ])
  })
  it('接する(1 個)', () => {
    expect(circleAxisRows(circleAxes({ p: 1, q: 1, r: 1 }))).toEqual([
      { label: 'x軸に接する(1 個)', text: '(1, 0)' },
      { label: 'y軸に接する(1 個)', text: '(0, 1)' },
    ])
  })
  it('なし', () => {
    expect(circleAxisRows(circleAxes({ p: 3, q: 3, r: 1 }))).toEqual([
      { label: 'x軸との共有点', text: 'なし' },
      { label: 'y軸との共有点', text: 'なし' },
    ])
  })
  it('原点を通るときは、共有点の数に原点を含め、「原点を通る」の行を足す', () => {
    expect(circleAxisRows(circleAxes({ p: 3, q: 4, r: 5 }))).toEqual([
      { label: 'x軸との共有点', text: '2 個  (0, 0)  (6, 0)' },
      { label: 'y軸との共有点', text: '2 個  (0, 0)  (0, 8)' },
      { label: '原点を通る', text: '' },
    ])
  })
  it('-0 を出さない', () => {
    const rows = circleAxisRows(circleAxes({ p: 0.3, q: 0.4, r: 0.5 }))
    for (const r of rows) expect(r.text).not.toMatch(/-0\b|−0\b(?!\.)/)
  })
})

describe('直線の軸との共有点の文字', () => {
  it('y = 2x − 4', () => {
    expect(lineAxisRows(lineAxes({ m: 2, n: -4 }))).toEqual([
      { label: 'x切片', text: '(2, 0)' },
      { label: 'y切片', text: '(0, −4)' },
    ])
  })
  it('m=0, n≠0: x軸と交わらない(y切片は出す)', () => {
    expect(lineAxisRows(lineAxes({ m: 0, n: 3 }))).toEqual([
      { label: 'x軸と交わらない', text: '' },
      { label: 'y切片', text: '(0, 3)' },
    ])
  })
  it('m=0, n=0: x軸と重なっている(y切片は出す)', () => {
    expect(lineAxisRows(lineAxes({ m: 0, n: 0 }))).toEqual([
      { label: 'x軸と重なっている', text: '' },
      { label: 'y切片', text: '(0, 0)' },
    ])
  })
  it('原点を通るときは、「原点を通る」の行を足す', () => {
    expect(lineAxisRows(lineAxes({ m: 0.5, n: 0 }))).toEqual([
      { label: 'x切片', text: '(0, 0)' },
      { label: 'y切片', text: '(0, 0)' },
      { label: '原点を通る', text: '' },
    ])
  })
})
