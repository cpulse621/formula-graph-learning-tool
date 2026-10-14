export function ReleaseNotice() {
  return <footer className="release-notice" aria-label="試験公開について">
    <p><strong>試験公開・学習用</strong><br />再読み込みすると、入力した式は消えます。</p>
    <details>
      <summary>利用上の注意・ソースコード</summary>
      <p>計算や表示に不具合が残っている可能性があります。結果は教科書や自分の計算と照らし合わせてください。解法の提示や採点は行いません。</p>
      <p>MITライセンスで再利用・改変できます。不具合の報告に個人情報を含めないでください。</p>
      <nav aria-label="公開情報">
        <a href="https://github.com/cpulse621/formula-graph-learning-tool">ソースコード</a>
        <a href="https://github.com/cpulse621/formula-graph-learning-tool/issues">不具合・提案</a>
        <a href="./third-party-notices.txt">使用部品の著作権表示</a>
      </nav>
    </details>
  </footer>
}
