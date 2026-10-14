import { expect, test } from '@playwright/test'
import { categories } from '../src/data/catalog'
import { inputText } from '../src/math/input'

async function addSin(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '＋ 式を追加' }).click()
  await page.getByRole('button', { name: /^サイン波\s*sin$/ }).click()
}

test('サインの例、確かめる、削除と元に戻すを操作できる', async ({ page }) => {
  await page.goto('/')
  await addSin(page)

  await page.getByRole('button', { name: '振幅 2' }).click()
  await expect(page.getByRole('button', { name: /振幅、今の値 2/ })).toBeVisible()
  await page.getByRole('switch', { name: /確かめる/ }).click()
  await expect(page.getByText('振幅', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: /1番のサインを削除/ }).click()
  await page.getByRole('button', { name: '元に戻す' }).click()
  await expect(page.getByRole('button', { name: /1番のサインを畳む/ })).toBeVisible()
})

test('各カテゴリを追加し、代表例を選べる', async ({ page }) => {
  await page.goto('/')
  await addSin(page)
  for (const [category, formula, example] of [
    ['円', '円', '右2・上1'],
    ['直線', '直線', '急な直線'],
    ['特別', '単位円とサイン・コサイン', '90°'],
  ]) {
    await page.getByRole('button', { name: '＋ 式を追加' }).click()
    const dialog = page.getByRole('dialog', { name: '式を追加' })
    await dialog.getByRole('button', { name: category, exact: true }).click()
    await dialog.locator('.add-list').getByRole('button', { name: new RegExp(`^${formula}`) }).click()
    await page.getByRole('button', { name: example }).click()
  }
})

test('スマホ幅で横にはみ出さず、調整部品が操作できる', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'スマホ表示だけを確認する')
  await page.goto('/')
  await addSin(page)

  const widths = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: window.innerWidth }))
  expect(widths.page).toBeLessThanOrEqual(widths.viewport)
  await expect(page.getByRole('slider', { name: '振幅をスライダーで調整' })).toBeVisible()
  await expect(page.getByRole('button', { name: '振幅を大きくする' })).toBeVisible()
})

for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 740 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
  test(`${viewport.width}×${viewport.height}: ボタンはグラフに重ならず、入力しながら使える`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    await addSin(page)
    await expect(page.getByRole('button', { name: /1番のサインを畳む/ })).toBeInViewport()
    const graph = await page.locator('.plane-svg').boundingBox()
    const check = await page.getByRole('switch', { name: /確かめる/ }).boundingBox()
    expect(check!.y + check!.height).toBeLessThanOrEqual(graph!.y)
    const add = await page.getByRole('button', { name: '＋ 式を追加' }).boundingBox()
    if (viewport.width < 768) {
      expect(add!.y + add!.height).toBeLessThanOrEqual(graph!.y)
      expect(check!.x + check!.width).toBeLessThanOrEqual(add!.x)
    }
    const input = page.getByRole('spinbutton', { name: '振幅の値' })
    await input.fill('2')
    await input.press('Enter')
    await expect(page.getByRole('button', { name: /振幅、今の値 2/ })).toBeVisible()
    await expect(page.getByRole('button', { name: '振幅 2', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await page.getByRole('button', { name: '振幅を大きくする' }).click()
    await expect(input).toHaveValue('2.1')
    await page.getByRole('slider', { name: '振幅をスライダーで調整' }).focus()
    await page.getByRole('slider', { name: '振幅をスライダーで調整' }).press('ArrowRight')
    await expect(input).toHaveValue('2.2')
    await page.getByRole('switch', { name: /確かめる/ }).click()
    const sizes = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, card: document.querySelector('.card-open')!.scrollWidth, cardWidth: document.querySelector('.card-open')!.clientWidth }))
    expect(sizes.scroll).toBeLessThanOrEqual(sizes.width)
    expect(sizes.card).toBeLessThanOrEqual(sizes.cardWidth)
    const taps = await page.locator('.hole, .step-btn, .learning-example').evaluateAll((elements) => elements.map((el) => el.getBoundingClientRect().height))
    expect(taps.every((height) => height >= 44)).toBe(true)
    expect(await input.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16)
    await page.getByRole('button', { name: '＋ 式を追加' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '特別', exact: true }).click()
    await page.getByRole('button', { name: /^単位円とサイン・コサイン/ }).click()
    await page.getByRole('button', { name: '90°', exact: true }).click()
    await expect(page.locator('.unit-svg')).toBeVisible()
    const unit = await page.locator('.unit-svg').boundingBox()
    expect(unit!.y).toBeGreaterThanOrEqual(check!.y + check!.height)
    expect(unit!.height).toBeGreaterThan(40)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width)
  })
}

for (const category of categories) for (const def of category.formulas.filter((f) => f.functionKind)) {
  test(`${def.title}: 全例・全調整部品・数値表示が使える`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await page.getByRole('button', { name: '＋ 式を追加' }).click()
    const dialog = page.getByRole('dialog', { name: '式を追加' })
    await dialog.getByRole('button', { name: category.chip, exact: true }).click()
    await dialog.locator('.add-list').getByRole('button', { name: new RegExp(`^${def.menuName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`) }).click()
    for (const example of def.learning.examples) {
      // 基本と初期値が同じとき、初期値ボタンがその役割を兼ねる。
      const initial = def.holes.every((h) => h.default === example.values[h.key])
      await page.getByRole('button', { name: initial ? '初期値に戻す' : example.label, exact: true }).click()
      for (const hole of def.holes) {
        const button = page.getByRole('button', { name: new RegExp(`^${hole.name}、今の値`) })
        await button.click()
        const input = page.getByRole('spinbutton', { name: new RegExp(`^${hole.name}の値`) })
        await expect(input).toHaveValue(inputText(example.values[hole.key]))
        await input.scrollIntoViewIfNeeded()
        for (const control of [input, page.getByRole('slider'), page.getByRole('button', { name: `${hole.name}を小さくする` }), page.getByRole('button', { name: `${hole.name}を大きくする` })]) {
          const box = await control.boundingBox()
          expect(box).not.toBeNull()
          expect(box!.x).toBeGreaterThanOrEqual(0)
          expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width)
        }
      }
      const path = page.locator(`g[data-function="${def.functionKind}"] path.function-curve`)
      await expect(path).toHaveAttribute('d', /^M/)
      expect(await path.getAttribute('d')).not.toMatch(/NaN|Infinity/)
      const sizes = await page.evaluate(() => ({
        screen: document.documentElement.scrollWidth, width: window.innerWidth,
        card: document.querySelector('.card-open')!.scrollWidth, cardWidth: document.querySelector('.card-open')!.clientWidth,
      }))
      expect(sizes.screen).toBeLessThanOrEqual(sizes.width)
      expect(sizes.card).toBeLessThanOrEqual(sizes.cardWidth)
    }
    await page.getByRole('switch', { name: /確かめる/ }).click()
    await expect(page.getByRole('region', { name: '確かめる: 関数の特徴' })).toBeVisible()
    await page.getByRole('button', { name: '初期値に戻す' }).click()
    for (const hole of def.holes) {
      await page.getByRole('button', { name: new RegExp(`^${hole.name}、今の値`) }).click()
      await expect(page.getByRole('spinbutton', { name: new RegExp(`^${hole.name}の値`) })).toHaveValue(inputText(hole.default))
    }
    await page.getByRole('button', { name: /を削除$/ }).click()
    await page.getByRole('button', { name: '元に戻す' }).click()
    await expect(page.getByRole('button', { name: /を畳む$/ })).toBeVisible()
    expect(errors).toEqual([])
  })
}
