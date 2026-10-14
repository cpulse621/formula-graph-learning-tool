// 曲線の見分け方。色(a〜d の色とは重ならない)・線の種類・番号の3つを組み合わせる。
export type CurveStyle = {
  color: string
  width: number
  dash: string | undefined
  name: string
}

export const curveStyles: CurveStyle[] = [
  { color: 'var(--curve-1)', width: 3, dash: undefined, name: '実線' },
  { color: 'var(--curve-2)', width: 3, dash: '10 6', name: '破線' },
  { color: 'var(--curve-3)', width: 3.5, dash: '1 6', name: '点線' },
  { color: 'var(--curve-4)', width: 3, dash: '14 5 3 5', name: '一点鎖線' },
]

export function curveStyleOf(number: number): CurveStyle {
  return curveStyles[(number - 1) % curveStyles.length]
}
