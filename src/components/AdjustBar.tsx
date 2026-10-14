import { useEffect, useId, useState, type KeyboardEvent } from 'react'
import type { HoleDef } from '../data/catalog'
import { clean, valueLatex } from '../math/format'
import { inputText, parseInput, snapSlider } from '../math/input'
import { degToRad, parseRadians, radToDeg } from '../math/unitCircle'
import { Formula } from './Formula'

type Props = {
  hole: HoleDef
  value: number
  onChange: (value: number) => void
  angleUnit?: 'deg' | 'rad' // 角度の穴のときの、度/ラジアンの切り替え
  onChangeUnit?: (unit: 'deg' | 'rad') => void
}

// 選ばれた穴の調整バー(1枚のカードに1本)。スライダー、−/+、数値入力、短い説明。
// バーの色は、選ばれた穴の役割の色。
export function AdjustBar({ hole, value, onChange, angleUnit = 'deg', onChangeUnit }: Props) {
  const id = useId()
  // 数値入力の入力途中の文字(「-」「1.」など)。確定するまで、値を戻さずに保持する
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { setError(''); setDraft(null) }, [value])
  const isPi = hole.display === 'pi'
  const isAngle = hole.display === 'angle'
  const angleRad = isAngle && angleUnit === 'rad' // 値は度で持ち、入力・表示だけラジアンにする

  function apply(v: number) {
    if (hole.excludedValues?.some((excluded) => Math.abs(v - excluded) < 1e-10)) {
      setError(`${hole.name}に ${v} は使えません。別の値にしてください。`)
      return
    }
    setError('')
    onChange(v)
  }

  function commit(text: string) {
    let v: number | null
    if (angleRad) {
      // ラジアン: 小数も、π/6 の形も受け付ける
      const rad = parseRadians(text)
      v = rad === null ? null : parseInput(String(radToDeg(rad)), hole.inputMin, hole.inputMax)
    } else {
      v = parseInput(text, hole.inputMin, hole.inputMax)
    }
    if (v !== null) apply(v) // 数として使えない文字は、確定せず元の値に戻す
    setDraft(null)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') commit(e.currentTarget.value)
    else if (e.key === 'Escape') setDraft(null)
  }

  // −/+ ボタン: 刻み1つぶん動かす(受け付ける範囲の端で止める)
  function stepBy(dir: 1 | -1) {
    const bs = hole.buttonStep ?? hole.step
    let next = isPi || hole.buttonStep
      ? Math.round(value / bs + dir) * bs // 刻みの倍数にそろえて動かす
      : snapSlider(value + dir * hole.step, hole.step, false)
    if (hole.excludedValues?.some((v) => Math.abs(v - next) < 1e-10)) next += dir * bs
    apply(clean(Math.min(hole.inputMax, Math.max(hole.inputMin, next)), 10))
  }

  return (
    <div className="adjust" data-role={hole.role}>
      <div className="adjust-top">
        <label className="adjust-title" htmlFor={id}>
          <span className="adjust-symbol"><Formula latex={hole.symbol} /></span>
          <span>{hole.hint}</span>
          {(isPi || angleRad) && (
            <span className="adjust-pi">
              = <Formula latex={valueLatex(isPi ? value : degToRad(value))} />
            </span>
          )}
        </label>
        <span className="adjust-number">
          <input
            type={angleRad ? 'text' : 'number'}
            inputMode={angleRad ? 'text' : undefined}
            aria-label={`${hole.name}の値${isPi || angleRad ? '(ラジアン)' : isAngle ? '(度)' : ''}`}
            aria-describedby={error ? `${id}-error` : undefined}
            min={angleRad ? undefined : hole.inputMin}
            max={angleRad ? undefined : hole.inputMax}
            step={angleRad ? undefined : (hole.inputStep ?? hole.step)}
            value={draft ?? (angleRad ? inputText(degToRad(value)) : inputText(value))}
            onChange={(e) => {
              // 矢印ボタン(入力の種類がない)はすぐ反映。文字を打っている間は、確定まで保持する
              const typing = (e.nativeEvent as InputEvent).inputType !== undefined
              if (typing) setDraft(e.target.value)
              else commit(e.target.value)
            }}
            onKeyDown={onKeyDown}
            onBlur={(e) => draft !== null && commit(e.currentTarget.value)}
          />
          {hole.unit && !angleRad && <span aria-hidden="true">{hole.unit}</span>}
        </span>
      </div>
      <div className="adjust-slider">
        <button type="button" className="btn step-btn" aria-label={`${hole.name}を小さくする`}
          disabled={value <= hole.inputMin} onClick={() => stepBy(-1)}>−</button>
        {/* 値がスライダーの範囲の外のとき、つまみは端に止まる */}
        <input
          id={id}
          className="param-slider"
          type="range"
          aria-label={`${hole.name}をスライダーで調整`}
          min={hole.min}
          max={hole.max}
          step={hole.step}
          value={value}
          onChange={(e) => apply(snapSlider(Number(e.target.value), hole.step, isPi))}
        />
        <button type="button" className="btn step-btn" aria-label={`${hole.name}を大きくする`}
          disabled={value >= hole.inputMax} onClick={() => stepBy(1)}>＋</button>
      </div>
      {error && <p id={`${id}-error`} className="input-error" role="alert">{error}</p>}
      {isAngle && onChangeUnit && (
        <div className="unit-toggle" role="group" aria-label="角度の単位">
          <button type="button" className="btn" aria-pressed={angleUnit === 'deg'} onClick={() => onChangeUnit('deg')}>度</button>
          <button type="button" className="btn" aria-pressed={angleUnit === 'rad'} onClick={() => onChangeUnit('rad')}>ラジアン</button>
        </div>
      )}
    </div>
  )
}
