// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReleaseNotice } from './ReleaseNotice'

afterEach(cleanup)
it('保存されないことを常時案内し、注意・MIT・公開リンクを確認できる', async () => {
  render(<ReleaseNotice />)
  expect(screen.getByText('再読み込みすると、入力した式は消えます。')).toBeTruthy()
  await userEvent.setup().click(screen.getByText('利用上の注意・ソースコード'))
  expect(screen.getByText(/MITライセンスで再利用・改変できます/)).toBeTruthy()
  expect(screen.getByRole('link', { name: 'ソースコード' }).getAttribute('href')).toBe('https://github.com/cpulse621/formula-graph-learning-tool')
  expect(screen.getByRole('link', { name: '使用部品の著作権表示' }).getAttribute('href')).toBe('./third-party-notices.txt')
})
