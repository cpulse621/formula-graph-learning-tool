import { useEffect, useId, useRef, useState, type TouchEvent } from 'react'
import { menuCategories } from '../data/catalog'
import { FormulaIcon } from './FormulaIcon'
import { useMediaQuery } from './useMediaQuery'

type Props = {
  onAdd: (formulaId: string) => void
  addedIds: string[] // 1つだけ追加できる式で、追加済みのもの(押せなくする)
}

// 「式を追加」ボタンと、その中身。
// スマホ: 画面の下から出るシート(高さ 45% まで。グラフは暗くせず、そのまま触れる)。
// PC: ボタンの真下に開くメニュー。
// 閉じる: 項目を選ぶ / ✕ / 外をタップ / 下にスワイプ(スマホ) / Esc。
// 選んで閉じる・✕・Esc のときは、フォーカスを「式を追加」ボタンに戻す。
export function AddFormulaMenu({ onAdd, addedIds }: Props) {
  const wide = useMediaQuery('(min-width: 768px)')
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const cats = menuCategories()
  const [catId, setCatId] = useState(cats[0]?.id)
  const current = cats.find((c) => c.id === catId) ?? cats[0]
  const touchY = useRef<number | null>(null)

  function close(refocus: boolean) {
    setOpen(false)
    if (refocus) openerRef.current?.focus()
  }

  // 開いたら、最初の項目にフォーカスを移す
  useEffect(() => {
    if (open) panelRef.current?.querySelector<HTMLElement>('.add-option')?.focus()
  }, [open])

  // Esc と、外(グラフ側など)をタップしたときに閉じる
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close(true)
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  // 下にスワイプで閉じる(シートの先頭までスクロールしているときだけ)
  function onTouchStart(e: TouchEvent) {
    touchY.current = e.touches[0].clientY
  }
  function onTouchEnd(e: TouchEvent) {
    const start = touchY.current
    touchY.current = null
    if (start === null || wide) return
    const dy = e.changedTouches[0].clientY - start
    if (dy > 70 && (panelRef.current?.scrollTop ?? 0) === 0) close(true)
  }

  return (
    <div className="add-menu" ref={rootRef}>
      <button
        ref={openerRef}
        type="button"
        className="btn btn-primary add-btn"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => (open ? close(false) : setOpen(true))}
      >
        ＋ 式を追加
      </button>

      {open && (
        <div
          id={panelId}
          ref={panelRef}
          className={wide ? 'add-popover' : 'add-sheet'}
          role="dialog"
          aria-label="式を追加"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="add-navigation">
          <span className="sheet-handle" aria-hidden="true" />
          <div className="add-head">
            <h2>式を追加</h2>
            <button type="button" className="btn icon-btn" aria-label="閉じる" onClick={() => close(true)}>
              ✕
            </button>
          </div>

          {/* カテゴリが2つ以上あるときだけ、チップを出す */}
          {cats.length >= 2 && (
            <div className="chips" role="group" aria-label="カテゴリ">
              {cats.map((c) => (
                <button key={c.id} type="button" className="btn chip"
                  aria-pressed={c.id === current.id} onClick={() => setCatId(c.id)}>
                  {c.chip}
                </button>
              ))}
            </div>
          )}
          </div>
          <p className="add-category-title">{current.title}</p>

          <ul className="add-list">
            {(cats.length >= 2 ? current.formulas : cats.flatMap((c) => c.formulas)).map((f) => {
              // 追加済みの式は、文字で伝え、押せなくする(フォーカスは残す)
              const added = !!f.unique && addedIds.includes(f.id)
              return (
                <li key={f.id}>
                  <button type="button" className={added ? 'btn add-option is-disabled' : 'btn add-option'}
                    aria-disabled={added}
                    onClick={() => {
                      if (added) return
                      onAdd(f.id)
                      close(true)
                    }}>
                    <FormulaIcon id={f.id} />
                    <span className="add-option-text"><span className="add-option-name">{f.menuName}</span>
                    <span className="add-option-tag">{added ? '追加済み' : f.tag}</span></span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
