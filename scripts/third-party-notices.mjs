// 配布する依存パッケージのライセンスを省略せず同梱する。個人用ファイルは参照しない。
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const lock = JSON.parse(await readFile(join(root, 'package-lock.json'), 'utf8'))
const mitPermission = (await readFile(join(root, 'LICENSE'), 'utf8')).split('Permission is hereby')[1]
const sections = [
  'Third-party notices for formula-graph-learning-tool',
  'The application itself is licensed under MIT. Third-party components retain their own licenses.',
  'This file includes production dependencies, including components not currently bundled.',
]
for (const [path, info] of Object.entries(lock.packages)) {
  if (!path.startsWith('node_modules/') || info.dev) continue
  const directory = join(root, path)
  const metadata = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
  const licenses = (await readdir(directory)).filter((file) => /^(licen[cs]e|copying|notice)(\.|$)/i.test(file)).sort()
  sections.push(`\n${'='.repeat(72)}\n${metadata.name} ${metadata.version}\nLicense: ${metadata.license ?? info.license ?? 'See below'}`)
  if (!licenses.length) {
    // これらの版は独立したLICENSEではなく、ソース先頭にライセンスを記載する。
    const inlineFiles = { 'javascript-natural-sort@0.7.1': 'naturalSort.js', 'seedrandom@3.0.5': 'seedrandom.js' }
    const file = inlineFiles[`${metadata.name}@${metadata.version}`]
    if (!file) throw new Error(`License text missing: ${metadata.name}`)
    const header = (await readFile(join(directory, file), 'utf8')).match(/^\/\*[\s\S]*?\*\//)?.[0]
    if (metadata.license !== 'MIT' || !header || !(header.includes('Released under MIT license') || header.includes('Permission is hereby'))) throw new Error(`Inline license missing: ${metadata.name}`)
    sections.push(header.includes('Permission is hereby') ? header : `${header}\n\nMIT License\n\nPermission is hereby${mitPermission}`)
  }
  for (const license of licenses) sections.push(`\n--- ${license} ---\n${await readFile(join(directory, license), 'utf8')}`)
}
const output = `${sections.join('\n\n').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd()}\n`
await mkdir(join(root, 'public'), { recursive: true })
await writeFile(join(root, 'public', 'third-party-notices.txt'), output)
console.log('Third-party notices generated from production dependency licenses.')
