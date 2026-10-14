// 画面の下に短く出す知らせ。「元に戻す」を付けられる(role="status" で読み上げる)。
export function Snackbar({ text, onUndo }: { text: string; onUndo?: () => void }) {
  return (
    <div className="snackbar-slot" role="status" aria-live="polite">
      {text && (
        <div className="snackbar">
          <span>{text}</span>
          {onUndo && (
            <button type="button" className="btn snackbar-btn" onClick={onUndo}>
              元に戻す
            </button>
          )}
        </div>
      )}
    </div>
  )
}
