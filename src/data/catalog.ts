// カテゴリと式の定義。後から式を足すときは、ここに書き足す。
import type { Role } from '../graph/roles'
import type { FunctionKind } from '../math/functions'
import { functionCategories, tangentFormula } from './functionCatalog'
import { additionalLines } from './lineCatalog'

// 式は、形(テンプレート)の「穴」を埋めて作る。今は数の穴だけ。
// v0.2 で、xの式を入れる穴('expr')と、用意した式から選ぶ穴('template')を足す。
export type NumberHole = {
  kind: 'number'
  key: string
  symbol: string // KaTeX で表示する記号
  showSymbol?: boolean // 数の箱に記号を添える（同色の複数の座標など）
  name: string // 読み上げに使う名前
  hint: string // 調整バーに出す短い説明(例:「大きさ」)
  role?: Role // 意味による色(なければ色を付けず、文字で示す)
  min: number // スライダーの範囲
  max: number
  step: number
  default: number
  inputMin: number // 数値入力で受け付ける範囲(スライダーより広い。つまみは端に止まる)
  inputMax: number
  unit?: string
  display?: 'pi' | 'angle' // 'pi': 値を π の分数でも見せる。'angle': 度で持ち、度/ラジアンの切り替えで見せる
  inputStep?: number // 数値入力の矢印ボタンの刻み(省略時は step)
  buttonStep?: number // −/＋ ボタンの刻み(省略時は step)。刻みの倍数にそろえて動かす
  excludedValues?: number[] // 定義できない値(例: 対数の底 1)
}

export type HoleDef = NumberHole

// 式の見た目の並び。固定の部分は KaTeX の文字、穴は押せる箱になる
// unit: 角度の単位が合うときだけ出す固定部分(例: 度の「°」)
export type TemplatePart = { tex: string; unit?: 'deg' | 'rad' } | { hole: string }
  | { exponent: TemplatePart[] } | { subscript: TemplatePart[] } | { radicand: TemplatePart[] }
  | { group: TemplatePart[] } // 括弧など、まとめて折り返す表示上のまとまり
  | { fraction: { numerator: TemplatePart[]; denominator: TemplatePart[] } }

export type LearningExample = {
  id: string
  label: string
  values: Record<string, number>
}

// 式を動かして理解するための、短い気づきと典型例。
// 新しい式を足すときも、ここへ同じ形で学び方を足せる。
export type LearningDef = {
  holeNotes: Record<string, string>
  examples: LearningExample[]
}

export type FormulaDef = {
  id: string
  title: string // カードの名前(例:「サイン」)
  menuName: string // 追加メニューの名前(例:「サイン波」)
  tag: string // 追加メニューの小さな添え字(例:「sin」)
  template: TemplatePart[]
  holes: HoleDef[]
  graphCount: 1 | 2 // 追加したときに必要なグラフの枚数
  family?: 'trig' | 'circle' | 'line' | 'unit-circle' | 'function' // 同じ描き方・同じ印を持つ式のまとまり
  functionKind?: FunctionKind
  inMenu: boolean // 追加メニューに出すか(描画ができた式だけ出す)
  unique?: boolean // 1つだけ追加できる(追加済みのときは、メニューで押せなくする)
  learning: LearningDef
}

export type Category = {
  id: string
  title: string
  chip: string // カテゴリのチップに出す短い名前
  formulas: FormulaDef[]
}

// 数値入力で受け付ける上限(±)
const INPUT_LIMIT = 100

const trigTemplate = (fn: 'sin' | 'cos'): TemplatePart[] => [
  { tex: 'y =' }, { hole: 'a' }, { tex: `\\${fn}(` }, { hole: 'b' },
  { group: [{ tex: 'x +' }, { hole: 'c' }, { tex: ')' }] },
  { tex: '+' }, { hole: 'd' },
]

const trigHoles = (): HoleDef[] => [
  {
    kind: 'number', key: 'a', symbol: 'a', name: '振幅', hint: '大きさ', role: 'size',
    min: -3, max: 3, step: 0.1, default: 1, inputMin: -INPUT_LIMIT, inputMax: INPUT_LIMIT,
  },
  {
    kind: 'number', key: 'b', symbol: 'b', name: '周期の係数', hint: '横の伸び(周期)', role: 'stretch',
    min: 0.5, max: 4, step: 0.5, default: 1, inputMin: -INPUT_LIMIT, inputMax: INPUT_LIMIT,
  },
  {
    // スライダーは π/12(15°)刻み。数値入力では小数も入れられる
    kind: 'number', key: 'c', symbol: 'c', name: '横の移動', hint: '左右の動き', role: 'shift-x',
    display: 'pi', min: -2 * Math.PI, max: 2 * Math.PI, step: Math.PI / 12, inputStep: 0.1, default: 0,
    inputMin: -INPUT_LIMIT, inputMax: INPUT_LIMIT,
  },
  {
    kind: 'number', key: 'd', symbol: 'd', name: '縦の移動', hint: '上下の動き', role: 'shift-y',
    min: -3, max: 3, step: 0.1, default: 0, inputMin: -INPUT_LIMIT, inputMax: INPUT_LIMIT,
  },
]

const trigLearning = (): LearningDef => ({
  holeNotes: {
    a: '波の中心線から山・谷までの大きさが変わります。負の値では、波が上下に反転します。',
    b: '|b| が大きいほど、同じ横幅に入る波の数が増え、周期は短くなります。',
    c: '波の左右の位置を変えます。b が正のとき、c を大きくすると波は左へ動きます。',
    d: '波全体の中心線を上下に動かします。波の形や周期は変わりません。',
  },
  examples: [
    { id: 'basic', label: '基本', values: { a: 1, b: 1, c: 0, d: 0 } },
    { id: 'amplitude-2', label: '振幅 2', values: { a: 2, b: 1, c: 0, d: 0 } },
    { id: 'period-half', label: '周期を半分', values: { a: 1, b: 2, c: 0, d: 0 } },
    { id: 'left-pi-2', label: '左へ π/2', values: { a: 1, b: 1, c: Math.PI / 2, d: 0 } },
    { id: 'up-1', label: '上へ 1', values: { a: 1, b: 1, c: 0, d: 1 } },
  ],
})

export const categories: Category[] = [
  {
    id: 'trig',
    title: '三角関数',
    chip: '三角関数',
    formulas: [
      {
        id: 'sin', title: 'サイン', menuName: 'サイン波', tag: 'sin',
        template: trigTemplate('sin'), holes: trigHoles(), graphCount: 1, family: 'trig', inMenu: true,
        learning: trigLearning(),
      },
      {
        id: 'cos', title: 'コサイン', menuName: 'コサイン波', tag: 'cos',
        template: trigTemplate('cos'), holes: trigHoles(), graphCount: 1, family: 'trig', inMenu: true,
        learning: trigLearning(),
      },
      tangentFormula,
    ],
  },
  ...functionCategories,
  {
    id: 'circle',
    title: '円',
    chip: '円',
    formulas: [
      {
        id: 'circle', title: '円', menuName: '円', tag: '(x−p)²+(y−q)²=r²',
        template: [
          { tex: '(x -' }, { hole: 'p' }, { tex: ')^2 + (y -' }, { hole: 'q' }, { tex: ')^2 =' },
          { hole: 'r' }, { tex: '{}^2' },
        ],
        holes: [
          {
            kind: 'number', key: 'p', symbol: 'p', name: '中心のx座標', hint: '中心の左右の位置',
            role: 'shift-x', min: -5, max: 5, step: 0.1, default: 0,
            inputMin: -INPUT_LIMIT, inputMax: INPUT_LIMIT,
          },
          {
            kind: 'number', key: 'q', symbol: 'q', name: '中心のy座標', hint: '中心の上下の位置',
            role: 'shift-y', min: -5, max: 5, step: 0.1, default: 0,
            inputMin: -INPUT_LIMIT, inputMax: INPUT_LIMIT,
          },
          {
            // 半径は 0 より大きい値だけ
            kind: 'number', key: 'r', symbol: 'r', name: '半径', hint: '半径(大きさ)',
            role: 'size', min: 0.5, max: 5, step: 0.1, default: 2, inputMin: 0.01, inputMax: INPUT_LIMIT,
          },
        ],
        graphCount: 1,
        family: 'circle',
        inMenu: true,
        learning: {
          holeNotes: {
            p: '円の中心を左右に動かします。半径や上下の位置は変わりません。',
            q: '円の中心を上下に動かします。半径や左右の位置は変わりません。',
            r: '円の中心を動かさずに、円の大きさだけを変えます。',
          },
          examples: [
            { id: 'basic', label: '基本', values: { p: 0, q: 0, r: 2 } },
            { id: 'move', label: '右2・上1', values: { p: 2, q: 1, r: 2 } },
            { id: 'radius-4', label: '半径 4', values: { p: 0, q: 0, r: 4 } },
          ],
        },
      },
    ],
  },
  {
    id: 'line',
    title: '直線',
    chip: '直線',
    formulas: [
      {
        id: 'line', title: '直線', menuName: '直線', tag: 'y=mx+n',
        template: [{ tex: 'y =' }, { hole: 'm' }, { tex: 'x +' }, { hole: 'n' }],
        holes: [
          {
            kind: 'number', key: 'm', symbol: 'm', name: '傾き', hint: '傾き',
            role: 'size', min: -3, max: 3, step: 0.1, default: 1,
            inputMin: -INPUT_LIMIT, inputMax: INPUT_LIMIT,
          },
          {
            kind: 'number', key: 'n', symbol: 'n', name: 'y切片', hint: '上下の動き(y切片)',
            role: 'shift-y', min: -5, max: 5, step: 0.1, default: 0.5,
            inputMin: -INPUT_LIMIT, inputMax: INPUT_LIMIT,
          },
        ],
        graphCount: 1,
        family: 'line',
        inMenu: true,
        learning: {
          holeNotes: {
            m: '傾きを変えます。正なら右上がり、負なら右下がりになり、0では水平です。',
            n: '直線と y 軸が交わる高さを上下に動かします。傾きは変わりません。',
          },
          examples: [
            { id: 'basic', label: '基本', values: { m: 1, n: 0.5 } },
            { id: 'steep', label: '急な直線', values: { m: 2, n: 0.5 } },
            { id: 'horizontal', label: '水平な直線', values: { m: 0, n: 2 } },
            { id: 'downward', label: '右下がり', values: { m: -1, n: 0.5 } },
          ],
        },
      },
      ...additionalLines,
    ],
  },
  {
    id: 'special',
    title: '特別メニュー',
    chip: '特別',
    formulas: [
      {
        id: 'unit-circle', title: '単位円', menuName: '単位円とサイン・コサイン', tag: 'θ',
        template: [{ tex: '\\theta =' }, { hole: 'theta' }, { tex: '{}^\\circ', unit: 'deg' }],
        holes: [
          {
            // 意味の色に当てはまらない穴は、色を付けずに文字で示す。角度は度で持つ
            kind: 'number', key: 'theta', symbol: '\\theta', name: '角度', hint: '角度',
            display: 'angle', min: 0, max: 360, step: 1, buttonStep: 15, default: 30, unit: '°',
            inputMin: -720, inputMax: 720,
          },
        ],
        graphCount: 2,
        family: 'unit-circle',
        inMenu: true,
        unique: true,
        learning: {
          holeNotes: {
            theta: '点 P を円周に沿って動かします。横の長さが cos、縦の長さが sin として波形にも表れます。',
          },
          examples: [
            { id: '0', label: '0°', values: { theta: 0 } },
            { id: '30', label: '30°', values: { theta: 30 } },
            { id: '45', label: '45°', values: { theta: 45 } },
            { id: '60', label: '60°', values: { theta: 60 } },
            { id: '90', label: '90°', values: { theta: 90 } },
            { id: '180', label: '180°', values: { theta: 180 } },
            { id: '270', label: '270°', values: { theta: 270 } },
          ],
        },
      },
    ],
  },
]

export function findFormula(id: string): FormulaDef {
  for (const c of categories) {
    const f = c.formulas.find((x) => x.id === id)
    if (f) return f
  }
  throw new Error(`未定義の式: ${id}`)
}

/** 追加メニューに出すカテゴリ(出せる式が1つもないカテゴリは除く) */
export function menuCategories(): Category[] {
  return categories
    .map((c) => ({ ...c, formulas: c.formulas.filter((f) => f.inMenu) }))
    .filter((c) => c.formulas.length > 0)
}
