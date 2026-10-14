// 「確かめる」スイッチ。オン/オフは文字でも示す(色だけに頼らない)
export function CheckSwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className="check-switch"
      onClick={() => onChange(!on)}
    >
      <span>確かめる</span>
      <span className="check-state">{on ? 'オン' : 'オフ'}</span>
    </button>
  )
}
