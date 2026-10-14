// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  })
  HTMLElement.prototype.scrollIntoView = vi.fn()
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
})

afterEach(cleanup)

async function addSin() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: '＋ 式を追加' }))
  await user.click(screen.getByRole('button', { name: /^サイン波\s*sin$/ }))
  return user
}

function equationText() {
  return screen.getByRole('region', { name: '確かめる: 同じ直線の式' }).querySelector('annotation')!.textContent
}

describe('学習用の操作', () => {
  it('削除の復帰待ちがあっても、追加した式と元に戻した式は別々に保つ', async () => {
    render(<App />)
    const user = await addSin()
    await user.click(screen.getByRole('button', { name: '振幅 2' }))
    await user.click(screen.getByRole('button', { name: /1番のサインを削除/ }))
    await user.click(screen.getByRole('button', { name: '＋ 式を追加' }))
    await user.click(screen.getByRole('button', { name: /^サイン波\s*sin$/ }))
    await user.click(screen.getByRole('button', { name: '元に戻す' }))
    expect(screen.getByRole('button', { name: /振幅、今の値 2/ })).toBeTruthy()
    const cards = within(screen.getByRole('list', { name: '式の一覧' })).getAllByRole('listitem')
    expect(cards).toHaveLength(2)
    await user.click(screen.getByRole('button', { name: /^2番 サイン、/ }))
    expect(screen.getByRole('button', { name: /振幅、今の値 1/ })).toBeTruthy()
  })

  it('2点の箱は連動し、式の形を切り替えても入力値を保つ。重なった点から復帰できる', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '＋ 式を追加' }))
    await user.click(screen.getByRole('button', { name: '直線' }))
    await user.click(screen.getByRole('button', { name: /^2点を通る直線/ }))
    const inputs = screen.getByRole('group', { name: '入力した点の座標' })
    expect(inputs.querySelector('[data-point="P"]')!.textContent).toContain('P = (1,2)')
    expect(inputs.querySelector('[data-point="Q"]')!.textContent).toContain('Q = (3,3)')
    expect(inputs.querySelector('[data-point="P"]')!.getAttribute('data-selected')).toBe('true')
    expect(screen.getAllByRole('button', { name: /^点Pのx座標、今の値/ })[0].querySelector('.hole-symbol')).toBeTruthy()
    expect(screen.queryByRole('region', { name: '確かめる: 同じ直線の式' })).toBeNull()
    await user.click(screen.getAllByRole('button', { name: /^点Pのx座標、今の値/ })[1])
    await user.click(screen.getByRole('button', { name: '傾き 1/3' }))
    const boxes = screen.getAllByRole('button', { name: /^点Pのx座標、今の値 0/ })
    expect(boxes).toHaveLength(2)
    expect(boxes.every((b) => b.getAttribute('aria-pressed') === 'true')).toBe(true)
    await user.click(screen.getByRole('switch', { name: /確かめる/ }))
    expect(equationText()).toBe('y=\\frac{1}{3}x+1')
    await user.click(screen.getByRole('button', { name: '1点と傾き' }))
    expect(equationText()).toBe('y-1=\\frac{1}{3}(x)')
    expect((screen.getByRole('spinbutton') as HTMLInputElement).value).toBe('0')
    await user.click(screen.getByRole('button', { name: '縦の直線' }))
    expect(equationText()).toBe('x=2')
    expect(screen.queryByRole('group', { name: '分数' })).toBeNull()
    await user.click(screen.getByRole('button', { name: /^点Qのy座標、今の値/ }))
    expect(inputs.querySelector('[data-point="Q"]')!.getAttribute('data-selected')).toBe('true')
    await user.clear(screen.getByRole('spinbutton'))
    await user.type(screen.getByRole('spinbutton'), '-1{Enter}')
    expect(inputs.querySelector('[data-point="Q"]')!.textContent).toContain('Q = (2,−1)')
    expect(screen.getByText(/2点が重なっています。/)).toBeTruthy()
    expect(screen.queryByRole('region', { name: '確かめる: 同じ直線の式' })).toBeNull()
    await user.click(screen.getByRole('button', { name: '初期値に戻す' }))
    expect(equationText()).toBe('y-2=\\frac{1}{2}(x-1)')
    expect(screen.getByRole('button', { name: /^点Qのy座標、今の値/ }).getAttribute('aria-pressed')).toBe('true')
  })

  it('1点と傾きの例を適用し、元の直線と同じ式を確かめられる', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '＋ 式を追加' }))
    await user.click(screen.getByRole('button', { name: '直線' }))
    await user.click(screen.getByRole('button', { name: /^1点と傾きから直線/ }))
    await user.click(screen.getByRole('button', { name: '水平な直線' }))
    await user.click(screen.getByRole('switch', { name: /確かめる/ }))
    expect(equationText()).toBe('y=2')
    await user.click(screen.getByRole('button', { name: '初期値に戻す' }))
    expect(equationText()).toBe('y=\\frac{1}{2}x+\\frac{3}{2}')
    await user.click(screen.getByRole('button', { name: /を削除$/ }))
    await user.click(screen.getByRole('button', { name: '元に戻す' }))
    expect(equationText()).toBe('y=\\frac{1}{2}x+\\frac{3}{2}')
  })

  it('例の適用と初期値への復帰で式の値を切り替えられる', async () => {
    render(<App />)
    const user = await addSin()

    await user.click(screen.getByRole('button', { name: '振幅 2' }))
    expect(screen.getByRole('button', { name: /振幅、今の値 2/ })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: '初期値に戻す' }))
    expect(screen.getByRole('button', { name: /振幅、今の値 1/ })).toBeTruthy()
  })

  it('確かめる、削除、元に戻すを続けて操作できる', async () => {
    render(<App />)
    const user = await addSin()

    await user.click(screen.getByRole('switch', { name: /確かめる/ }))
    expect(screen.getByText('振幅')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /1番のサインを削除/ }))
    expect(screen.getByText('まずは「式を追加」から')).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '元に戻す' }))
    expect(screen.getByRole('button', { name: /1番のサインを畳む/ })).toBeTruthy()
  })

  it('対数の底を選んだまま例を切り替え、不正な底は拒否する', async () => {
    render(<App />)
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '＋ 式を追加' }))
    await user.click(screen.getByRole('button', { name: '指数・対数' }))
    await user.click(screen.getByRole('button', { name: /^対数関数/ }))
    await user.click(screen.getByRole('button', { name: /^底、今の値/ }))
    await user.click(screen.getByRole('button', { name: '底 1/2' }))
    expect(screen.getByRole('button', { name: /^底、今の値/ }).getAttribute('aria-pressed')).toBe('true')
    const input = screen.getByRole('spinbutton', { name: '底の値' })
    expect((input as HTMLInputElement).value).toBe('0.5')
    await user.clear(input)
    await user.type(input, '1{Enter}')
    expect(screen.getByRole('alert').textContent).toContain('1 は使えません')
    expect((input as HTMLInputElement).value).toBe('0.5')
    await user.clear(input)
    await user.type(input, '0.9{Enter}')
    await user.click(screen.getByRole('button', { name: '底を大きくする' }))
    expect((input as HTMLInputElement).value).toBe('1.1')
    expect(screen.queryByRole('alert')).toBeNull()
    await user.click(screen.getByRole('button', { name: '底を小さくする' }))
    expect((input as HTMLInputElement).value).toBe('0.9')
    await user.click(screen.getByRole('button', { name: '初期値に戻す' }))
    expect((input as HTMLInputElement).value).toBe('2')
    expect(screen.queryByRole('region', { name: '確かめる: 関数の特徴' })).toBeNull()
    await user.click(screen.getByRole('switch', { name: /確かめる/ }))
    const readout = screen.getByRole('region', { name: '確かめる: 関数の特徴' })
    expect(within(readout).getByText('x > 0')).toBeTruthy()
    expect(within(readout).getByText('(1, 0)')).toBeTruthy()
    await user.click(screen.getByRole('switch', { name: /確かめる/ }))
    expect(screen.queryByRole('region', { name: '確かめる: 関数の特徴' })).toBeNull()
  })
})
