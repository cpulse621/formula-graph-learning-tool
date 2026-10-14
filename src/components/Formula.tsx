import katex from 'katex'
import 'katex/dist/katex.min.css'

// KaTeX で式を表示する。読み上げ用のMathMLも一緒に出る。
export function Formula({ latex, block = false }: { latex: string; block?: boolean }) {
  const html = katex.renderToString(latex, {
    throwOnError: false,
    displayMode: block,
    output: 'htmlAndMathml',
  })
  return <span className="formula" dangerouslySetInnerHTML={{ __html: html }} />
}
