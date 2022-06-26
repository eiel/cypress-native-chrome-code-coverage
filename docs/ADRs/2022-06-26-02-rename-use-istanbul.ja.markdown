# ADR 2022-06-27 カバレッジの結果の中間形式としてistanbul形式を利用する

カバレッジ結果の中間形式としてistanbulを利用する。
なぜなら、jestの内部でもistanbulを利用しているため、jestが対応しているレポート形式で出力可能になるためである。

# コンテキスト

* CypressのカバレッジをChromeのカバレッジツールを使って計測するPoCでもistanbulが利用されている
  * see also https://github.com/bahmutov/cypress-native-chrome-code-coverage-example/blob/master/package.json#L22
* なんのために利用するか推測した結果、Chromeのカバレッジツールの出力形式が独自のものであると予想した
* Cypress公式の方法もistanbulを利用しているし、Jestも利用している
* このライブラリでも同様の方法を使うことで、同じエコシステムを利用可能にする

# 結果

* 変換をどのタイミングで行うか検討する必要がある
* Chromeのカバレッジツールを利用するため、これを変換するためにv8-to-istanbulを利用する
* jestをつかっている場合、カバレッジをマージして全体のカバレッジを計測できる
* Chromeのカバレッジツールの出力形式だけでなく、istanbulの形式に依存することになる。これらに仕様の変更があった場合対応の必要がある
