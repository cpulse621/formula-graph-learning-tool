import { expect, test } from '@playwright/test'
import { additionalLines } from '../src/data/lineCatalog'

for (const width of [320, 390, 1280]) for (const def of additionalLines) {
  test(`${width}px ${def.title}: 全例・式の比較・円との交点`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
    await page.goto('/')
    await page.getByRole('button', { name: '＋ 式を追加' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '円', exact: true }).click()
    await page.locator('.add-list').getByRole('button', { name: /^円/ }).click()
    await page.getByRole('button', { name: '＋ 式を追加' }).click()
    await page.getByRole('dialog').getByRole('button', { name: '直線', exact: true }).click()
    await page.locator('.add-list').getByRole('button', { name: new RegExp(`^${def.menuName}`) }).click()
    if (width === 390) {
      await expect(page.getByRole('slider')).toBeInViewport()
      await expect(page.locator('.step-btn').last()).toBeInViewport()
    }
    await expect(page.getByRole('region', { name: '確かめる: 同じ直線の式' })).toHaveCount(0)
    await page.getByRole('switch', { name: /確かめる/ }).click()
    for (const example of def.learning.examples) {
      await page.getByRole('button', { name: example.id === 'basic' ? '初期値に戻す' : example.label, exact: true }).click()
      for (const hole of def.holes) {
        await page.getByRole('button', { name: new RegExp(`^${hole.name}、今の値`) }).first().click()
        const input = page.getByRole('spinbutton')
        await expect(input).toHaveValue(String(example.values[hole.key]))
        const box = await input.boundingBox()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(width)
        await expect(page.getByRole('slider')).toBeVisible()
        if (hole.showSymbol) {
          await expect(page.locator(`[data-hole-key="${hole.key}"] .hole-symbol`).first()).toBeVisible()
          await expect(page.locator('[data-coordinate-guide]')).toHaveAttribute('data-coordinate-guide', hole.key)
          await expect(page.locator('[data-selected-point]')).toHaveAttribute('data-selected-point', hole.key.endsWith('1') ? 'P' : 'Q')
          await expect(page.locator('.line-input-point[data-selected="true"]')).toHaveAttribute('data-point', hole.key.endsWith('1') ? 'P' : 'Q')
          // 座標を選んだとき、差（Δx・Δy）をその座標として強調しない。
          await expect(page.locator('.plane-svg')).not.toContainText('Δx')
          await expect(page.locator('.plane-svg')).not.toContainText('Δy')
        }
      }
      await expect(page.locator('[data-line] > line')).toHaveCount(1)
      const points = await page.locator('[data-input-point]').count()
      expect(points).toBe(def.id === 'line-point' ? 1 : 2)
      await expect(page.getByRole('region', { name: '確かめる: 1番の円と2番の直線' })).toBeVisible()
      const sizes = await page.evaluate(() => ({ width: innerWidth, page: document.documentElement.scrollWidth, card: document.querySelector('.card-open')!.scrollWidth, cardWidth: document.querySelector('.card-open')!.clientWidth }))
      expect(sizes.page).toBeLessThanOrEqual(sizes.width)
      expect(sizes.card).toBeLessThanOrEqual(sizes.cardWidth)
      await expect(page.getByRole('heading', { name: '軸との交点（◇）' })).toBeVisible()
      if (example.id === 'vertical') {
        await expect(page.locator('.line-equation annotation')).toHaveText('x=2')
        await expect(page.getByText('接する(1 個)', { exact: true })).toBeVisible()
        const line = page.locator('[data-line] > line')
        expect(await line.getAttribute('x1')).toBe(await line.getAttribute('x2'))
      } else {
        const before = await page.locator('[data-line]').innerHTML()
        await page.getByRole('button', { name: '1点と傾き', exact: true }).click()
        await expect(page.getByRole('button', { name: '1点と傾き', exact: true })).toHaveAttribute('aria-pressed', 'true')
        expect(await page.locator('[data-line]').innerHTML()).toBe(before)
        await page.getByRole('button', { name: 'y=ax+b', exact: true }).click()
      }
    }
    if (def.id === 'line-two-points') {
      await page.getByRole('button', { name: '縦の直線', exact: true }).click()
      await page.getByRole('button', { name: /^点Qのy座標、今の値/ }).click()
      await page.getByRole('spinbutton').fill('-1')
      await page.getByRole('spinbutton').press('Enter')
      await expect(page.getByText(/2点が重なっています。/)).toBeVisible()
      await expect(page.locator('[data-line]')).toHaveCount(0)
      await expect(page.locator('[data-input-point]')).toHaveCount(2)
      await expect(page.getByRole('region', { name: '確かめる: 1番の円と2番の直線' })).toHaveCount(0)
      await page.getByRole('button', { name: /^点Qのx座標、今の値/ }).click()
      await page.getByRole('spinbutton').fill('3')
      await page.getByRole('spinbutton').press('Enter')
      await expect(page.locator('[data-line]')).toHaveCount(1)
      await expect(page.locator('.line-equation annotation')).toHaveText('y=-1')
    }
    await page.getByRole('button', { name: '初期値に戻す' }).click()
    await page.getByRole('button', { name: /2番の.*を削除$/ }).click()
    await expect(page.locator('[data-line]')).toHaveCount(0)
    await page.getByRole('button', { name: '元に戻す' }).click()
    await expect(page.locator('.line-equation annotation')).toHaveText('y=\\frac{1}{2}x+\\frac{3}{2}')
    expect(errors).toEqual([])
  })
}
