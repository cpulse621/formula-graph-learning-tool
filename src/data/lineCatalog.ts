import type { FormulaDef, NumberHole } from './catalog'

const coordinate = (key: string, symbol: string, name: string, value: number, axis: 'x' | 'y'): NumberHole => ({
  kind: 'number', key, symbol, showSymbol: true, name, hint: name, role: axis === 'x' ? 'shift-x' : 'shift-y',
  min: -5, max: 5, step: 0.1, default: value, inputMin: -100, inputMax: 100,
})

export const additionalLines: FormulaDef[] = [
  {
    id: 'line-point', title: '直線：1点と傾き', menuName: '1点と傾きから直線', tag: 'y−y₁=a(x−x₁)',
    family: 'line', graphCount: 1, inMenu: true,
    template: [
      { group: [{ tex: 'y -' }, { hole: 'y1' }] }, { tex: '=' }, { hole: 'a' },
      { group: [{ tex: '(x -' }, { hole: 'x1' }, { tex: ')' }] },
    ],
    holes: [
      { kind: 'number', key: 'a', symbol: 'a', name: '傾き', hint: '傾き', role: 'size', min: -3, max: 3, step: 0.1, default: 0.5, inputMin: -100, inputMax: 100 },
      coordinate('x1', 'x_1', '点Pのx座標', 1, 'x'),
      coordinate('y1', 'y_1', '点Pのy座標', 2, 'y'),
    ],
    learning: {
      holeNotes: {
        a: '点 P を通ったまま、直線の傾きを変えます。傾きは「横に1進んだときの縦の変化」です。',
        x1: '直線が通る点 P の横の位置を変えます。傾きはそのままです。',
        y1: '直線が通る点 P の縦の位置を変えます。傾きはそのままです。',
      },
      examples: [
        { id: 'basic', label: '基本：傾き 1/2', values: { a: 0.5, x1: 1, y1: 2 } },
        { id: 'origin', label: '原点を通る', values: { a: 1, x1: 0, y1: 0 } },
        { id: 'steep', label: '傾き 2', values: { a: 2, x1: 1, y1: 2 } },
        { id: 'horizontal', label: '水平な直線', values: { a: 0, x1: 1, y1: 2 } },
        { id: 'downward', label: '右下がり', values: { a: -1, x1: 1, y1: 2 } },
      ],
    },
  },
  {
    id: 'line-two-points', title: '直線：2点を通る', menuName: '2点を通る直線', tag: 'y−y₁=((y₂−y₁)/(x₂−x₁))(x−x₁)',
    family: 'line', graphCount: 1, inMenu: true,
    template: [
      { group: [{ tex: 'y -' }, { hole: 'y1' }] }, { tex: '=' },
      { fraction: {
        numerator: [{ hole: 'y2' }, { tex: '-' }, { hole: 'y1' }],
        denominator: [{ hole: 'x2' }, { tex: '-' }, { hole: 'x1' }],
      } },
      { group: [{ tex: '(x -' }, { hole: 'x1' }, { tex: ')' }] },
    ],
    holes: [
      coordinate('x1', 'x_1', '点Pのx座標', 1, 'x'),
      coordinate('y1', 'y_1', '点Pのy座標', 2, 'y'),
      coordinate('x2', 'x_2', '点Qのx座標', 3, 'x'),
      coordinate('y2', 'y_2', '点Qのy座標', 3, 'y'),
    ],
    learning: {
      holeNotes: {
        x1: '点 P の横の位置を変えます。分母は P から Q までの横の変化で、同じ x 座標なら縦の直線です。',
        y1: '点 P の縦の位置を変えます。同じ記号の箱は連動します。分子は P から Q までの縦の変化です。',
        x2: '点 Q の横の位置を変えます。2点を通る直線は、2点の外側にも続きます。',
        y2: '点 Q の縦の位置を変えます。縦の変化を横の変化で割ったものが傾きです。',
      },
      examples: [
        { id: 'basic', label: '基本：傾き 1/2', values: { x1: 1, y1: 2, x2: 3, y2: 3 } },
        { id: 'third', label: '傾き 1/3', values: { x1: 0, y1: 1, x2: 3, y2: 2 } },
        { id: 'horizontal', label: '水平な直線', values: { x1: -2, y1: 2, x2: 2, y2: 2 } },
        { id: 'downward', label: '右下がり', values: { x1: -1, y1: 2, x2: 2, y2: -1 } },
        { id: 'vertical', label: '縦の直線', values: { x1: 2, y1: -1, x2: 2, y2: 3 } },
      ],
    },
  },
]
