import { useEffect, useState } from 'react'
import { findFormula } from './data/catalog'
import { AddFormulaMenu } from './components/AddFormulaMenu'
import { CheckSwitch } from './components/CheckSwitch'
import { FormulaCard, type Item } from './components/FormulaCard'
import { GraphArea } from './components/GraphArea'
import type { Pair } from './components/PairReadout'
import { Snackbar } from './components/Snackbar'
import { lineFromFormula } from './math/lineForms'
import { ReleaseNotice } from './components/ReleaseNotice'

const UNDO_MS = 6000 // 「元に戻す」を出している時間

export function App() {
  const [items, setItems] = useState<Item[]>([])
  const [openUid, setOpenUid] = useState<number | null>(null) // 開いているカード(常に1枚まで)
  const [activeUid, setActiveUid] = useState<number | null>(null) // 最後に操作した式(矢印を出す)
  const [newestUid, setNewestUid] = useState<number | null>(null)
  const [check, setCheck] = useState(false) // 「確かめる」: オンのとき数値を出す
  const [angleUnit, setAngleUnit] = useState<'deg' | 'rad'>('deg') // 単位円の角度の単位
  const [removed, setRemoved] = useState<{ item: Item; index: number } | null>(null)
  const [message, setMessage] = useState('')

  // 削除の「元に戻す」は、一定時間でしまう
  useEffect(() => {
    if (!removed) return
    const t = setTimeout(() => setRemoved(null), UNDO_MS)
    return () => clearTimeout(t)
  }, [removed])

  // 新しいカードだけ開き、最初の穴を選んだ状態にする。ほかは畳む
  function addItem(formulaId: string) {
    const def = findFormula(formulaId)
    if (def.unique && items.some((it) => it.formulaId === formulaId)) return // 1つだけ追加できる
    const values = Object.fromEntries(def.holes.map((h) => [h.key, h.default]))
    // 開発中の画面更新でも番号が重ならないよう、残っている式・削除の復帰待ちから採番する。
    const uid = items.reduce((max, it) => Math.max(max, it.uid), removed?.item.uid ?? 0) + 1
    setItems((prev) => [...prev, { uid, formulaId, values, visible: true, holeKey: def.holes[0].key }])
    setOpenUid(uid)
    setActiveUid(uid)
    setNewestUid(uid)
    setMessage(`${def.title}を追加しました`)
  }

  function openCard(uid: number) {
    setOpenUid(uid) // 今開いているカードは、自動で畳まれる
    setActiveUid(uid)
  }

  function patchItem(uid: number, patch: (it: Item) => Item) {
    setItems((prev) => prev.map((it) => (it.uid === uid ? patch(it) : it)))
    setActiveUid(uid)
  }

  function removeItem(uid: number) {
    const index = items.findIndex((it) => it.uid === uid)
    if (index < 0) return
    setRemoved({ item: items[index], index })
    setItems((prev) => prev.filter((it) => it.uid !== uid))
    if (openUid === uid) setOpenUid(null)
    setMessage('')
    // 消えたボタンにフォーカスが残らないよう、「式を追加」に戻す
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.add-btn')?.focus())
  }

  function undoRemove() {
    if (!removed) return
    const { item, index } = removed
    setItems((prev) => {
      const next = [...prev]
      next.splice(Math.min(index, next.length), 0, item) // 元の位置・元の値で戻す
      return next
    })
    setOpenUid(item.uid)
    setActiveUid(item.uid)
    setRemoved(null)
  }

  // 式の番号は追加した順。矢印を出す式は、最後に操作した式(印のある種類に限る)
  const numbers = Object.fromEntries(items.map((it, i) => [it.uid, i + 1]))
  const annotated = items.filter((it) => {
    const f = findFormula(it.formulaId).family
    return f === 'trig' || f === 'circle' || f === 'line' || f === 'function'
  })
  const effectiveActive =
    annotated.find((it) => it.uid === activeUid)?.uid ?? annotated[annotated.length - 1]?.uid ?? null

  // 円と直線の組(表示中のものだけ)。「確かめる」の欄を、そのカードを含む組ごとに出す
  const circles = items.filter((it) => it.formulaId === 'circle' && it.visible)
  const lines = items.filter((it) => findFormula(it.formulaId).family === 'line' && it.visible && lineFromFormula(it.formulaId, it.values))
  const pairsOf = (it: Item): Pair[] => {
    const mk = (c: Item, l: Item): Pair => ({
      circleNumber: numbers[c.uid],
      lineNumber: numbers[l.uid],
      circle: { p: c.values.p, q: c.values.q, r: c.values.r },
      line: lineFromFormula(l.formulaId, l.values)!,
    })
    if (it.formulaId === 'circle') return lines.map((l) => mk(it, l))
    if (lines.some((l) => l.uid === it.uid)) return circles.map((c) => mk(c, it))
    return []
  }

  // 単位円のカードがあるあいだは、スマホでグラフの領域を広げる(単位円と波形の2枚が入るように)
  const hasUnit = items.some((it) => it.formulaId === 'unit-circle')
  const addedIds = items.map((it) => it.formulaId)

  return (
    <div className="app" data-unit={hasUnit}>
      {/* アプリ名はブラウザのタブのタイトルに入れる。画面内には見せず、読み上げ用の見出しだけ置く */}
      <h1 className="sr-only">数式グラフ化学習ツール</h1>

      {/* 画面の上下・左右の位置は CSS で決める。キーボードの順番は、式の一覧が先 */}
      <div className="list-wrap">
        <AddFormulaMenu onAdd={addItem} addedIds={addedIds} />

        {items.length === 0 ? (
          <div className="empty">
            <p className="empty-title">まずは「式を追加」から</p>
            <p>式を追加したら、数字の箱を選んでください。スライダーを動かすと、グラフのどこが変わるか見られます。</p>
          </div>
        ) : (
          <ul className="card-list" aria-label="式の一覧">
            {items.map((it) => (
              <FormulaCard
                key={it.uid}
                item={it}
                number={numbers[it.uid]}
                open={it.uid === openUid}
                active={it.uid === effectiveActive}
                check={check}
                angleUnit={angleUnit}
                onChangeUnit={setAngleUnit}
                isNewest={it.uid === newestUid}
                pairs={pairsOf(it)}
                onOpen={() => openCard(it.uid)}
                onClose={() => setOpenUid(null)}
                onRemove={() => removeItem(it.uid)}
                onSelectHole={(key) => patchItem(it.uid, (x) => ({ ...x, holeKey: key }))}
                onChangeValue={(key, v) =>
                  patchItem(it.uid, (x) => ({ ...x, values: { ...x.values, [key]: v } }))
                }
                onApplyExample={(values, label) => {
                  patchItem(it.uid, (x) => ({ ...x, values: { ...x.values, ...values } }))
                  setMessage(`${findFormula(it.formulaId).title}を「${label}」に切り替えました`)
                }}
              />
            ))}
          </ul>
        )}
        <ReleaseNotice />
      </div>

      <div className="graph-wrap">
        <GraphArea
          items={items}
          numbers={numbers}
          activeUid={effectiveActive}
          check={check}
          angleUnit={angleUnit}
          onChangeTheta={(uid, deg) =>
            patchItem(uid, (x) => ({ ...x, values: { ...x.values, theta: deg } }))
          }
        />
        <div className="check-overlay">
          <CheckSwitch on={check} onChange={setCheck} />
        </div>
      </div>

      <Snackbar text={removed ? '削除しました' : ''} onUndo={removed ? undoRemove : undefined} />
      {/* 追加を読み上げソフトに伝える */}
      <div className="sr-only" role="status" aria-live="polite">
        {message}
      </div>
    </div>
  )
}
