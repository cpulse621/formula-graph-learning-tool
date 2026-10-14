import { curveStyleOf } from '../graph/curveStyle'

// 式の番号と、線の見本。グラフ上の曲線の番号・線と同じもの。
// compact のときは番号の丸だけ(畳んだ行用)。
export function ItemMarker({ number, compact = false }: { number: number; compact?: boolean }) {
  const st = curveStyleOf(number)
  return (
    <span className="marker" title={`${number}番(${st.name})`}>
      <span className="marker-no" style={{ borderColor: st.color }}>
        {number}
      </span>
      {!compact && (
        <svg width="40" height="12" viewBox="0 0 40 12" aria-hidden="true">
          <line
            x1="2" y1="6" x2="38" y2="6"
            stroke={st.color} strokeWidth={st.width} strokeDasharray={st.dash} strokeLinecap="round"
          />
        </svg>
      )}
    </span>
  )
}
