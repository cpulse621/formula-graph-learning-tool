import type { FormulaDef, LearningExample } from '../data/catalog'

type Props = {
  def: FormulaDef
  holeKey: string
  values: Record<string, number>
  onApply: (values: Record<string, number>, label: string) => void
}

function sameValues(values: Record<string, number>, target: Record<string, number>) {
  return Object.entries(target).every(([key, value]) => Math.abs((values[key] ?? 0) - value) < 1e-9)
}

// 調整中の値がグラフへ与える意味と、すぐ観察できる代表例。
export function LearningGuide({ def, holeKey, values, onApply }: Props) {
  const initial: LearningExample = {
    id: 'initial',
    label: '初期値に戻す',
    values: Object.fromEntries(def.holes.map((hole) => [hole.key, hole.default])),
  }
  // 初期値と同じ「基本」の例は、同じボタンを2つ出さない。
  const examples = [initial, ...def.learning.examples.filter((example) => !sameValues(initial.values, example.values))]
  const note = def.learning.holeNotes[holeKey]

  return (
    <section className="learning-guide" aria-label={`${def.title}の学びのポイント`}>
      <p className="learning-note"><strong>学びのポイント</strong><span>{note}</span></p>
      <div className="learning-examples" role="group" aria-label={`${def.title}の例を選ぶ`}>
        <span className="learning-examples-title">例で比べる</span>
        <div className="learning-example-list">
          {examples.map((example) => {
            const selected = sameValues(values, example.values)
            return (
              <button
                key={example.id}
                type="button"
                className="btn learning-example"
                aria-pressed={selected}
                onClick={() => onApply(example.values, example.label)}
              >
                <span>{example.label}</span>
                {selected && <span className="example-selected" aria-hidden="true">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
