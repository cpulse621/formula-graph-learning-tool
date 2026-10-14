import { useEffect, useRef } from 'react'
import { findFormula } from '../data/catalog'
import { FunctionReadout } from './FunctionReadout'
import { formulaSummary } from '../math/expression'
import { AdjustBar } from './AdjustBar'
import { AxisReadout } from './AxisReadout'
import { HoleFormula } from './HoleFormula'
import { ItemMarker } from './ItemMarker'
import { LearningGuide } from './LearningGuide'
import { PairReadout, type Pair } from './PairReadout'
import { TrigReadout } from './TrigReadout'
import { UnitCircleReadout } from './UnitCircleReadout'
import { LineReadout } from './LineReadout'
import { LineInputPoints } from './LineInputPoints'
import { lineFromFormula } from '../math/lineForms'
import { valueText } from '../math/format'

export type Item = {
  uid: number
  formulaId: string
  values: Record<string, number>
  visible: boolean // 画面には出さない(表示/非表示の操作は今は無い)
  holeKey: string // 調整バーに出している穴
}

type Props = {
  item: Item
  number: number // 式の番号(追加した順)
  open: boolean
  active: boolean // グラフに矢印などの印を出している式
  check: boolean
  angleUnit: 'deg' | 'rad'
  onChangeUnit: (unit: 'deg' | 'rad') => void
  isNewest: boolean
  pairs: Pair[] // このカードを含む「円 × 直線」の組(相手の式があるときだけ)
  onOpen: () => void
  onClose: () => void
  onRemove: () => void
  onSelectHole: (key: string) => void
  onChangeValue: (key: string, value: number) => void
  onApplyExample: (values: Record<string, number>, label: string) => void
}

// 式カード。開いているときは「穴の入った式 + 調整バー」、畳んだときは1行。
export function FormulaCard(p: Props) {
  const { item, number, open, active } = p
  const def = findFormula(item.formulaId)
  const ref = useRef<HTMLLIElement>(null)
  const summary = formulaSummary(item.formulaId, item.values)
  const hole = def.holes.find((h) => h.key === item.holeKey) ?? def.holes[0]
  const line = def.family === 'line' ? lineFromFormula(def.id, item.values) : null
  const specialPoints = def.id === 'line-two-points' && (!line || 'x' in line)
  // 分母0の式は表示しない。点の入力を保ち、縦の直線または重なった点として説明する。
  const inputDef = specialPoints ? { ...def, template: [
    { group: [{ tex: 'P(' }, { hole: 'x1' }, { tex: ',' }, { hole: 'y1' }, { tex: ')' }] },
    { group: [{ tex: 'Q(' }, { hole: 'x2' }, { tex: ',' }, { hole: 'y2' }, { tex: ')' }] },
  ] } : def

  // 追加された式が画面の外にあれば、見える位置までスクロールする
  useEffect(() => {
    if (p.isNewest) ref.current?.scrollIntoView({ block: 'start' })
  }, [p.isNewest])

  if (!open) {
    return (
      <li ref={ref} className="card" data-active={active}>
        <button
          type="button"
          className="card-row"
          aria-expanded={false}
          aria-label={`${number}番 ${def.title}、${summary}。開く`}
          onClick={p.onOpen}
        >
          <ItemMarker number={number} compact />
          <span className="card-row-name">{def.title}</span>
          <span className="card-row-summary">{summary}</span>
          {active && <span className="active-tag">選択中</span>}
          <span className="card-chevron" aria-hidden="true">▾</span>
        </button>
      </li>
    )
  }

  return (
    <li ref={ref} className="card card-open" data-active={active}>
      <div className="card-head">
        <ItemMarker number={number} />
        <div className="card-identity">
          <span className="card-name">{def.title}</span>
          {active && <span className="active-tag">選択中</span>}
        </div>
      </div>
      <LineInputPoints formulaId={def.id} values={item.values} holeKey={hole.key} />
      <p className="card-section-label">数式<span>数の箱を選んで調整</span></p>
      {specialPoints && <p className="line-note line-condition" role="status">{line && 'x' in line
        ? `2点のx座標が同じなので、縦の直線 x = ${valueText(line.x)} です。傾きの分数は使えません。`
        : '2点が重なっています。通る直線は1本に決まりません。どちらかの点を動かしてください。'}</p>}
      <HoleFormula def={inputDef} values={item.values} selectedKey={hole.key} angleUnit={p.angleUnit} onSelect={p.onSelectHole} />
      <AdjustBar
        key={hole.key}
        hole={hole}
        value={item.values[hole.key]}
        onChange={(v) => p.onChangeValue(hole.key, v)}
        angleUnit={p.angleUnit}
        onChangeUnit={p.onChangeUnit}
      />
      <LearningGuide
        def={def}
        holeKey={hole.key}
        values={item.values}
        onApply={p.onApplyExample}
      />
      {p.check && def.family === 'trig' && (
        <TrigReadout kind={def.id as 'sin' | 'cos'} values={item.values} />
      )}
      {p.check && def.family === 'unit-circle' && <UnitCircleReadout theta={item.values.theta} />}
      {p.check && def.functionKind && <FunctionReadout spec={{ kind: def.functionKind, values: item.values }} />}
      {p.check && def.family === 'line' && <LineReadout formulaId={def.id} values={item.values} />}
      {p.check && def.family === 'circle' && (
        <AxisReadout kind="circle" values={item.values} />
      )}
      {p.check && (def.family === 'circle' || def.family === 'line') &&
        p.pairs.map((pair) => <PairReadout key={`${pair.circleNumber}-${pair.lineNumber}`} pair={pair} />)}
      {/* 見た目は見出しの右上。キーボードの順番は、穴 → 調整 → 畳む → 削除(うっかり削除を防ぐ) */}
      <span className="card-head-actions">
        <button type="button" className="btn icon-btn" aria-expanded={true}
          aria-label={`${number}番の${def.title}を畳む`} onClick={p.onClose}>▴</button>
        <button type="button" className="btn icon-btn" aria-label={`${number}番の${def.title}を削除`}
          onClick={p.onRemove}>✕</button>
      </span>
    </li>
  )
}
