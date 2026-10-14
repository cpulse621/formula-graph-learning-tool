// 追加メニューに付ける、小さなアイコン(読み上げでは無視する。名前の文字を必ず添える)
export function FormulaIcon({ id }: { id: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const }
  return (
    <svg className="formula-icon" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      {id === 'sin' && <path d="M2,14 C6,2 10,2 14,14 S22,26 26,14" {...common} />}
      {id === 'cos' && <path d="M2,6 C8,6 10,22 14,22 C18,22 20,6 26,6" {...common} />}
      {id === 'circle' && <circle cx="14" cy="14" r="10" {...common} />}
      {id.startsWith('line') && <path d="M4,23 L24,5" {...common} />}
      {id === 'line-point' && <circle cx="14" cy="14" r="3" fill="currentColor" />}
      {id === 'line-two-points' && <g fill="currentColor"><circle cx="9" cy="18.5" r="3" /><circle cx="19" cy="9.5" r="3" /></g>}
      {(id === 'quadratic' || id === 'quadratic-standard' || id === 'absolute') && <path d={id === 'absolute' ? 'M3,4 L14,24 L25,4' : 'M3,3 Q14,44 25,3'} {...common} />}
      {id === 'cubic' && <path d="M4,24 C15,24 13,4 24,4" {...common} />}
      {id === 'tan' && <path d="M3,25 C10,25 18,3 25,3" {...common} />}
      {id === 'exponential' && <path d="M3,24 C19,24 22,18 25,3" {...common} />}
      {(id === 'sqrt' || id === 'logarithm') && <path d="M3,25 C4,7 16,5 25,3" {...common} />}
      {id === 'reciprocal' && <path d="M3,25 Q10,25 11,17 M17,11 Q18,3 25,3" {...common} />}
      {id === 'unit-circle' && (
        <g {...common}>
          <circle cx="14" cy="14" r="10" />
          <path d="M14,14 L21,7" />
        </g>
      )}
    </svg>
  )
}
