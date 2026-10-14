import { describe, expect, it } from 'vitest'
import {
  TAN_UNDEFINED, angleBoth, degToRad, normalizeDeg, parseRadians, radToDeg, trigDisplay, trigValues,
} from './unitCircle'

describe('角度の正規化と変換', () => {
  it('0°以上360°未満にそろえる', () => {
    expect(normalizeDeg(-30)).toBe(330)
    expect(normalizeDeg(390)).toBe(30)
    expect(normalizeDeg(720)).toBe(0)
    expect(normalizeDeg(360)).toBe(0)
    expect(normalizeDeg(-720)).toBe(0)
    expect(normalizeDeg(0)).toBe(0)
    expect(normalizeDeg(359.9999999999)).toBe(0) // 誤差で 360 に近い値
    expect(Object.is(normalizeDeg(-0), 0)).toBe(true)
  })
  it('度とラジアン', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI, 12)
    expect(degToRad(30)).toBeCloseTo(Math.PI / 6, 12)
    expect(radToDeg(Math.PI / 4)).toBeCloseTo(45, 12)
  })
  it('度とラジアンの表示', () => {
    expect(angleBoth(30)).toEqual({ deg: '30°', rad: 'π/6' })
    expect(angleBoth(270)).toEqual({ deg: '270°', rad: '3π/2' })
    expect(angleBoth(0)).toEqual({ deg: '0°', rad: '0' })
    expect(angleBoth(-30)).toEqual({ deg: '−30°', rad: '−π/6' })
  })
})

describe('sin・cos・tan と特別な角の正確な値', () => {
  const t = (deg: number) => {
    const d = trigDisplay(deg)
    return [d.sin.text, d.cos.text, d.tan === null ? 'なし' : d.tan.text]
  }
  it('0°, 30°, 45°, 60°, 90°', () => {
    expect(t(0)).toEqual(['0', '1', '0'])
    expect(t(30)).toEqual(['1/2', '√3/2', '√3/3'])
    expect(t(45)).toEqual(['√2/2', '√2/2', '1'])
    expect(t(60)).toEqual(['√3/2', '1/2', '√3'])
    expect(t(90)).toEqual(['1', '0', 'なし'])
  })
  it('120°, 135°, 150°, 180°, 270°', () => {
    expect(t(120)).toEqual(['√3/2', '−1/2', '−√3'])
    expect(t(135)).toEqual(['√2/2', '−√2/2', '−1'])
    expect(t(150)).toEqual(['1/2', '−√3/2', '−√3/3'])
    expect(t(180)).toEqual(['0', '−1', '0'])
    expect(t(270)).toEqual(['−1', '0', 'なし'])
  })
  it('第3・第4象限', () => {
    expect(t(210)).toEqual(['−1/2', '−√3/2', '√3/3'])
    expect(t(225)).toEqual(['−√2/2', '−√2/2', '1'])
    expect(t(240)).toEqual(['−√3/2', '−1/2', '√3'])
    expect(t(300)).toEqual(['−√3/2', '1/2', '−√3'])
    expect(t(315)).toEqual(['−√2/2', '√2/2', '−1'])
    expect(t(330)).toEqual(['−1/2', '√3/2', '−√3/3'])
  })
  it('360°、720°、−30°(= 330°)、390°(= 30°)は、同じ角として扱う', () => {
    expect(t(360)).toEqual(t(0))
    expect(t(720)).toEqual(t(0))
    expect(t(-30)).toEqual(t(330))
    expect(t(390)).toEqual(t(30))
    expect(t(-720)).toEqual(t(0))
    expect(t(-270)).toEqual(t(90))
  })
  it('すべての特別な角で、正確な値が数値と一致する', () => {
    const num: Record<string, number> = {
      '0': 0, '1': 1, '−1': -1, '1/2': 0.5, '−1/2': -0.5, '√2/2': Math.SQRT1_2, '−√2/2': -Math.SQRT1_2,
      '√3/2': Math.sqrt(3) / 2, '−√3/2': -Math.sqrt(3) / 2, '√3': Math.sqrt(3), '−√3': -Math.sqrt(3),
      '√3/3': Math.sqrt(3) / 3, '−√3/3': -Math.sqrt(3) / 3,
    }
    for (let k = 0; k < 360; k += 15) {
      const v = trigValues(k)
      if (!v.exact) {
        expect([30, 45].some((u) => k % u === 0)).toBe(false) // 特別な角が抜けていない
        continue
      }
      expect(num[v.exact.sin.text]).toBeCloseTo(v.sin, 12)
      expect(num[v.exact.cos.text]).toBeCloseTo(v.cos, 12)
      if (v.exact.tan) expect(num[v.exact.tan.text]).toBeCloseTo(v.tan!, 12)
      else expect(v.tan).toBeNull()
    }
  })
  it('KaTeX 用の形', () => {
    const v = trigValues(60).exact!
    expect(v.sin.latex).toBe('\\frac{\\sqrt{3}}{2}')
    expect(v.cos.latex).toBe('\\frac{1}{2}')
    expect(v.tan!.latex).toBe('\\sqrt{3}')
    expect(trigValues(135).exact!.cos.latex).toBe('-\\frac{\\sqrt{2}}{2}')
  })
})

describe('tan の「なし」と、誤差の処理', () => {
  it('tan 90° と tan 270°(と 450°、−90°)は定義されない', () => {
    for (const d of [90, 270, 450, -90, -270]) {
      expect(trigValues(d).tan).toBeNull()
      expect(trigDisplay(d).tan).toBeNull()
    }
    expect(TAN_UNDEFINED).toBe('なし(定義されない)')
  })
  it('cos 90° が 6e-17 のように見えない(0 にそろえる)', () => {
    expect(trigValues(90).cos).toBe(0)
    expect(trigValues(270).cos).toBe(0)
    expect(trigValues(180).sin).toBe(0)
    expect(trigValues(360).sin).toBe(0)
    expect(Object.is(trigValues(180).sin, 0)).toBe(true) // −0 にならない
  })
  it('90° に非常に近い角では、1e-9 より大きければ tan は定義される', () => {
    expect(trigValues(89.9).tan).not.toBeNull()
    expect(trigValues(90 + 1e-12).tan).toBeNull()
  })
})

describe('特別でない角の小数の丸め(小数第4位まで、末尾の 0 は省く)', () => {
  it('10° → sin 0.1736、cos 0.9848、tan 0.1763', () => {
    const d = trigDisplay(10)
    expect(d.exactAngle).toBe(false)
    expect(d.sin.text).toBe('0.1736')
    expect(d.cos.text).toBe('0.9848')
    expect(d.tan!.text).toBe('0.1763')
  })
  it('末尾の 0 を省く・マイナス', () => {
    expect(trigDisplay(37).sin.text).toBe('0.6018')
    const d = trigDisplay(200) // 200° は第3象限
    expect(d.sin.text).toBe('−0.342')
    expect(d.cos.text).toBe('−0.9397')
    expect(d.tan!.text).toBe('0.364')
  })
  it('1°', () => {
    const d = trigDisplay(1)
    expect(d.sin.text).toBe('0.0175')
    expect(d.cos.text).toBe('0.9998')
  })
  it('値が正しい(sin² + cos² = 1)', () => {
    for (let k = -720; k <= 720; k += 7) {
      const v = trigValues(k)
      expect(v.sin ** 2 + v.cos ** 2).toBeCloseTo(1, 12)
      expect(Number.isFinite(v.sin) && Number.isFinite(v.cos)).toBe(true)
    }
  })
})

describe('ラジアンの入力', () => {
  const close = (a: number | null, b: number) => {
    expect(a).not.toBeNull()
    expect(a as number).toBeCloseTo(b, 12)
  }
  it('小数・π・分数', () => {
    close(parseRadians('0.5236'), 0.5236)
    close(parseRadians('-1.5'), -1.5)
    close(parseRadians('−1.5'), -1.5)
    close(parseRadians('π'), Math.PI)
    close(parseRadians('2π'), 2 * Math.PI)
    close(parseRadians('π/6'), Math.PI / 6)
    close(parseRadians('-3π/4'), (-3 * Math.PI) / 4)
    close(parseRadians('0.5π'), Math.PI / 2)
    close(parseRadians('pi/6'), Math.PI / 6)
    close(parseRadians(' π / 6 '), Math.PI / 6)
    close(parseRadians('3/4'), 0.75)
  })
  it('読めない文字は null', () => {
    for (const s of ['', '-', 'π/', 'π/0', 'abc', '1e999', 'π π', '/6', '++1']) {
      expect(parseRadians(s)).toBeNull()
    }
  })
})
