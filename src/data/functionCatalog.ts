import type { Category, FormulaDef, HoleDef, LearningExample, TemplatePart } from './catalog'
import type { FunctionKind } from '../math/functions'

const tex = (text: string): TemplatePart => ({ tex: text })
const hole = (key: string): TemplatePart => ({ hole: key })
const shiftedX: TemplatePart[] = [tex('(x -'), hole('p'), tex(')')]
const number = (key: string, name: string, role?: HoleDef['role'], initial = 0): HoleDef => ({
  kind: 'number', key, symbol: key, name, hint: name, role,
  min: -5, max: 5, step: 0.1, default: initial, inputMin: -100, inputMax: 100,
})
const transforms = (): HoleDef[] => [number('a', '縦の倍率', 'size', 1), number('p', '横の移動', 'shift-x'), number('q', '縦の移動', 'shift-y')]
const moveNotes = {
  p: 'p を大きくすると右へ、小さくすると左へ動きます。形は変わりません。',
  q: 'グラフ全体を上下に動かします。形や左右の位置は変わりません。',
}
const example = (id: string, label: string, values: Record<string, number>): LearningExample => ({ id, label, values })
const commonExamples = [
  example('basic', '基本', { a: 1, p: 0, q: 0 }),
  example('double', '縦に 2 倍', { a: 2, p: 0, q: 0 }),
  example('reflect', '上下に反転', { a: -1, p: 0, q: 0 }),
  example('move', '右2・上1', { a: 1, p: 2, q: 1 }),
]
function definition(kind: FunctionKind, title: string, tag: string, template: TemplatePart[], note: string): FormulaDef {
  return { id: kind, title, menuName: title, tag, template: [tex('y ='), ...template],
    holes: transforms(), family: 'function', functionKind: kind, graphCount: 1, inMenu: true,
    learning: { holeNotes: { a: note, ...moveNotes }, examples: commonExamples },
  }
}

const exponential = definition('exponential', '指数関数', 'y = a b^(x−p) + q', [
  hole('a'), tex('\\cdot'), hole('b'), { exponent: shiftedX }, tex('+'), hole('q'),
], '縦の大きさが変わります。負の値では上下に反転します。')
exponential.holes.splice(1, 0, { ...number('b', '底', undefined, 2), min: 0.1, max: 5, inputMin: 0.01 })
exponential.learning.holeNotes.b = '底が 1 より大きいと右へ進むほど増え、0 と 1 の間では減ります。底は正の数です。'
exponential.learning.examples = [
  example('basic', '底 2', { a: 1, b: 2, p: 0, q: 0 }),
  example('decay', '底 1/2', { a: 1, b: 0.5, p: 0, q: 0 }),
  example('natural', '底 e', { a: 1, b: Math.E, p: 0, q: 0 }),
  example('move', '右2・上1', { a: 1, b: 2, p: 2, q: 1 }),
]
const logarithm = definition('logarithm', '対数関数', 'y = a log_b(x−p) + q', [
  hole('a'), tex('\\log'), { subscript: [hole('b')] }, ...shiftedX, tex('+'), hole('q'),
], '縦の大きさが変わります。負の値では上下に反転します。')
logarithm.holes.splice(1, 0, { ...number('b', '底', undefined, 2), min: 0.1, max: 5, inputMin: 0.01, excludedValues: [1] })
logarithm.learning.holeNotes.b = '底が 1 より大きいと増え、0 と 1 の間では減ります。底は正の数で、1 は使えません。'
logarithm.learning.holeNotes.p = '右へ p だけ動かします。括弧の中が正になる範囲にだけグラフがあります。'
logarithm.learning.examples = exponential.learning.examples

export const tangentFormula: FormulaDef = {
  id: 'tan', title: 'タンジェント', menuName: 'タンジェント', tag: 'tan',
  template: [tex('y ='), hole('a'), tex('\\tan('), hole('b'), { group: [tex('x +'), hole('c'), tex(')')] }, tex('+'), hole('d')],
  holes: [number('a', '縦の倍率', 'size', 1), number('b', '周期の係数', 'stretch', 1),
    { ...number('c', '横の移動', 'shift-x'), display: 'pi', min: -2 * Math.PI, max: 2 * Math.PI, step: Math.PI / 12, inputStep: 0.1 },
    number('d', '縦の移動', 'shift-y')],
  family: 'function', functionKind: 'tan', graphCount: 1, inMenu: true,
  learning: {
    holeNotes: {
      a: '縦の大きさが変わります。上下に限りなく伸びるため、サインと違って振幅はありません。',
      b: '|b| が大きいほど周期が短くなり、途切れる場所の間隔も狭くなります。',
      c: 'b が正のとき、c を大きくすると左へ動きます。曲線と途切れる場所が一緒に動きます。',
      d: '曲線全体を上下に動かします。途切れる場所の左右の位置は変わりません。',
    },
    examples: [example('basic', '基本', { a: 1, b: 1, c: 0, d: 0 }),
      example('half', '周期を半分', { a: 1, b: 2, c: 0, d: 0 }),
      example('left', '左へ π/4', { a: 1, b: 1, c: Math.PI / 4, d: 0 }),
      example('reflect', '上下に反転', { a: -1, b: 1, c: 0, d: 0 })],
  },
}

export const functionCategories: Category[] = [
  { id: 'powers', title: '二次・三次関数', chip: '二次・三次', formulas: [
    definition('quadratic', '二次関数（頂点の形）', 'y = a(x−p)² + q', [hole('a'), ...shiftedX, tex('{}^2 +'), hole('q')],
      '|a| が大きいほど放物線の幅が狭くなります。正なら上に開き、負なら下に開きます。'),
    { id: 'quadratic-standard', title: '二次関数（一般の形）', menuName: '二次関数（一般の形）', tag: 'y = ax² + bx + c',
      template: [tex('y ='), hole('a'), tex('x^2 +'), hole('b'), tex('x +'), hole('c')],
      holes: [number('a', '二次の係数', 'size', 1), number('b', '一次の係数'), number('c', '定数項', 'shift-y')],
      family: 'function', functionKind: 'quadratic-standard', graphCount: 1, inMenu: true,
      learning: { holeNotes: {
        a: '正なら上に開き、負なら下に開きます。0 にすると二次の項がなくなり、直線になります。',
        b: '放物線の軸と頂点が動きます。頂点の形の p と違い、単純な左右の移動だけではありません。',
        c: 'y 軸と交わる高さが変わり、グラフ全体が上下に動きます。',
      }, examples: [example('basic', '基本', { a: 1, b: 0, c: 0 }),
        example('two', 'x軸と2点で交わる', { a: 1, b: -2, c: -3 }),
        example('tangent', 'x軸に接する', { a: 1, b: -2, c: 1 }),
        example('none', 'x軸と交わらない', { a: 1, b: 0, c: 1 })] } },
    definition('cubic', '三次関数', 'y = a(x−p)³ + q', [hole('a'), ...shiftedX, tex('{}^3 +'), hole('q')],
      '縦の大きさが変わります。負の値では、右上がりの曲線が右下がりに反転します。'),
  ] },
  { id: 'exp-log', title: '指数・対数関数', chip: '指数・対数', formulas: [exponential, logarithm] },
  { id: 'other-functions', title: '分数・無理・絶対値の関数', chip: '分数・無理', formulas: [
    definition('reciprocal', '分数関数', 'y = a/(x−p) + q', [{ fraction: { numerator: [hole('a')], denominator: shiftedX } }, tex('+'), hole('q')],
      '2本の枝が漸近線から離れる大きさを変えます。負にすると上下に反転します。'),
    definition('sqrt', '無理関数（平方根）', 'y = a√(x−p) + q', [hole('a'), { radicand: shiftedX }, tex('+'), hole('q')],
      '縦の大きさが変わります。負の値では下向きになります。根号の中が負の範囲にはグラフがありません。'),
    definition('absolute', '絶対値の関数', 'y = a|x−p| + q', [hole('a'), tex('|x -'), hole('p'), tex('| +'), hole('q')],
      'V字の傾きが変わります。|a| が大きいほど急になり、負の値では上下に反転します。'),
  ] },
]
