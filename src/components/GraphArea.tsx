import { useEffect, useState } from 'react'
import { findFormula } from '../data/catalog'
import { FunctionAux, FunctionCurves, type FunctionCurve } from '../graph/FunctionLayer'
import { Plane, type PlaneLayout } from '../graph/Plane'
import { CircleLineAux, CircleLineCurves, type CircleCurve, type CircleLineActive, type LineCurve } from '../graph/CircleLineLayer'
import { TrigAux, TrigCurves, type TrigCurve } from '../graph/TrigLayer'
import { UNIT_EXTENT, UnitCirclePane } from '../graph/UnitCirclePane'
import { WaveAux, WaveCurves } from '../graph/WaveLayer'
import { relateCircleLine } from '../math/circleLine'
import { valueText } from '../math/format'
import { lineCoordinateSelection, lineFromFormula, lineInputPoints } from '../math/lineForms'
import { PointLineAux, PointLineMarks } from '../graph/PointLineLayer'
import type { Item } from './FormulaCard'
import { useMediaQuery } from './useMediaQuery'

type Props = {
  items: Item[]
  numbers: Record<number, number>
  activeUid: number | null
  check: boolean
  angleUnit: 'deg' | 'rad'
  onChangeTheta: (uid: number, deg: number) => void
}

// 単位円と波形を並べるときの寸法
const WAVE_UNITS = 7.6 // 波形の平面に、横にこれだけ(単位)入れる(0〜2π が余裕をもって入る)
const WAVE_ORIGIN = 0.8 // 波形の平面で、左端から原点までの長さ(単位)

type Box = { w: number; h: number }

// 要素の大きさを測る
function useBoxSize(el: HTMLElement | null): Box {
  const [box, setBox] = useState<Box>({ w: 0, h: 0 })
  useEffect(() => {
    if (!el) return
    const update = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return box
}

export function GraphArea({ items, numbers, activeUid, check, angleUnit, onChangeTheta }: Props) {
  const wide = useMediaQuery('(min-width: 768px)')
  const [layoutEl, setLayoutEl] = useState<HTMLDivElement | null>(null)
  const box = useBoxSize(layoutEl)

  const shown = items.filter((it) => it.visible)
  const curves: TrigCurve[] = shown
    .filter((it) => findFormula(it.formulaId).family === 'trig')
    .map((it) => ({
      uid: it.uid,
      number: numbers[it.uid],
      s: { kind: it.formulaId as 'sin' | 'cos', a: it.values.a, b: it.values.b, c: it.values.c, d: it.values.d },
    }))
  const circles: CircleCurve[] = shown
    .filter((it) => it.formulaId === 'circle')
    .map((it) => ({ uid: it.uid, number: numbers[it.uid], c: { p: it.values.p, q: it.values.q, r: it.values.r } }))
  const lines: LineCurve[] = shown
    .filter((it) => findFormula(it.formulaId).family === 'line')
    .flatMap((it) => {
      const l = lineFromFormula(it.formulaId, it.values)
      return l ? [{ uid: it.uid, number: numbers[it.uid], l, points: lineInputPoints(it.formulaId, it.values) }] : []
    })
  const unitItem = shown.find((it) => it.formulaId === 'unit-circle')
  const functions: FunctionCurve[] = shown.filter((it) => !!findFormula(it.formulaId).functionKind)
    .map((it) => ({ uid: it.uid, number: numbers[it.uid], spec: { kind: findFormula(it.formulaId).functionKind!, values: it.values } }))

  // 選んでいる式(補助の印を出す式)と、調整バーに出している穴
  const activeItem = shown.find((it) => it.uid === activeUid)
  const holeKey = activeItem?.holeKey ?? null
  const activeShape: CircleLineActive | null = !activeItem
    ? null
    : activeItem.formulaId === 'circle'
      ? { kind: 'circle', c: { p: activeItem.values.p, q: activeItem.values.q, r: activeItem.values.r } }
      : activeItem.formulaId === 'line'
        ? { kind: 'line', l: { m: activeItem.values.m, n: activeItem.values.n } }
        : null

  // x軸の目盛り: 三角関数と単位円だけのときは、π の倍数(度のときは度)。円・直線があるときは普通の数
  const trigLike = curves.length + functions.filter((c) => c.spec.kind === 'tan').length + (unitItem ? 1 : 0)
  const onlyTrig = trigLike > 0 && trigLike === shown.length
  const xAxis = !onlyTrig ? 'decimal' : unitItem && angleUnit === 'deg' ? 'deg' : 'pi'

  // 読み上げ用の説明(交点の数は、グラフを見ればわかることなので、いつでも出してよい)
  const pairText = circles.flatMap((c) =>
    lines.map((l) => {
      const n = relateCircleLine(c.c, l.l).count
      return `${c.number}番の円と${l.number}番の直線は${n === 0 ? '交わらない' : n === 1 ? '接する' : '2点で交わる'}`
    }),
  )
  const description = [
    unitItem ? `波形の平面。単位円の角度は${valueText(unitItem.values.theta)}度。` : 'グラフの平面。',
    curves.length > 0 ? `三角関数の曲線を${curves.length}本、` : '',
    circles.length > 0 ? `円を${circles.length}個、` : '',
    lines.length > 0 ? `直線を${lines.length}本、` : '',
    functions.length > 0 ? `関数の曲線を${functions.length}本、` : '',
    shown.length > 0 ? '表示中。' : '式はまだありません。',
    ...pairText.map((t) => `${t}。`),
    activeItem && lineCoordinateSelection(activeItem.formulaId, activeItem.values, activeItem.holeKey)
      ? `${findFormula(activeItem.formulaId).holes.find((hole) => hole.key === activeItem.holeKey)?.name}を選択中。囲んだ入力点から${activeItem.holeKey.startsWith('x') ? 'x' : 'y'}軸へ補助線を表示。` : '',
  ].join('')

  // 右の平面(波形、またはふつうのグラフ)の中身
  const renderLayers = (theta: number | null) => (ctx: Parameters<Parameters<typeof Plane>[0]['children']>[0]) => ({
    aux: (
      <>
        {theta !== null && <WaveAux ctx={ctx} theta={theta} />}
        <TrigAux ctx={ctx} curves={curves} activeUid={activeUid} holeKey={holeKey} check={check} />
        <CircleLineAux ctx={ctx} active={activeShape} holeKey={holeKey} />
        <FunctionAux ctx={ctx} curves={functions} activeUid={activeUid} holeKey={holeKey} />
        <PointLineAux ctx={ctx} item={activeItem} />
      </>
    ),
    curves: (
      <>
        {theta !== null && <WaveCurves ctx={ctx} theta={theta} />}
        <TrigCurves ctx={ctx} curves={curves} />
        <CircleLineCurves ctx={ctx} circles={circles} lines={lines} />
        <FunctionCurves ctx={ctx} curves={functions} />
        <PointLineMarks ctx={ctx} items={shown} numbers={numbers} activeUid={activeUid} />
      </>
    ),
  })

  if (!unitItem) {
    return (
      <div className="graph-area" role="region" aria-label="グラフ">
        <Plane xAxis={xAxis} description={description}>{renderLayers(null)}</Plane>
      </div>
    )
  }

  // ---- 単位円と波形の2枚 ----
  const theta = unitItem.values.theta
  const hole = findFormula('unit-circle').holes[0]
  let size = 0
  let layout: PlaneLayout = { unitsWide: WAVE_UNITS, unitsHigh: UNIT_EXTENT, originUnitsX: WAVE_ORIGIN }
  if (box.w > 0 && box.h > 0) {
    if (wide) {
      // 横に並べる。単位円(正方形)と波形の縮尺をそろえ、中心の高さをそろえる(sin の高さが同じ高さに見える)
      const gap = 12
      const s = Math.max(10, Math.min((box.w - gap) / (UNIT_EXTENT + WAVE_UNITS), box.h / UNIT_EXTENT))
      size = UNIT_EXTENT * s
      layout = { scale: s, unitsWide: WAVE_UNITS, unitsHigh: UNIT_EXTENT, originUnitsX: WAVE_ORIGIN }
    } else {
      // 縦に積む。上に単位円、下に波形
      size = Math.max(60, Math.min(box.w, (box.h - 8) / 2))
    }
  }

  return (
    <div className="graph-area" data-unit="true" role="region" aria-label="グラフ">
      <div ref={setLayoutEl} className={`unit-layout ${wide ? 'row' : 'col'}`}>
        {size > 0 && (
          <div className="unit-pane" style={{ width: size, height: size }}>
            <UnitCirclePane
              size={size}
              theta={theta}
              min={hole.inputMin}
              max={hole.inputMax}
              unit={angleUnit}
              onChange={(deg) => onChangeTheta(unitItem.uid, deg)}
            />
          </div>
        )}
        <Plane xAxis={xAxis} description={description} layout={layout} tickBase={Math.PI / 2}>
          {renderLayers(theta)}
        </Plane>
      </div>
    </div>
  )
}
