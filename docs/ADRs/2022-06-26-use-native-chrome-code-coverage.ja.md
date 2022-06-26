# ADR 2022-06-26 カバレッジを取得するためにChromeのカバレッジツールを利用する

Cypressでカバレッジを計測するためにChromeのカバレッジツールを利用する。
なぜなら、Cypress公式でサポートしている方法はカバレッジを計測可能にするための特別なコード変換が必要で、 ユーザが実行するコードとするにはオーバーヘッドが生まれてしまう。
これを回避する方法として、Chromeのカバレッジツールを用いた方法があり。この方法はコード変換不要でカバレッジの計測が可能となる。

# 背景

* Cypress公式のカバレッジの取得方法では事前にコードの変換が必要である
  * [ドキュメント](https://docs.cypress.io/guides/tooling/code-coverage#E2E-and-unit-code-coverage)
  * Babelを使う場合は[babel-plugin-istanbul](https://github.com/istanbuljs/babel-plugin-istanbul)を利用することになる
* この方法で変換して作成したアーティファクトをユーザに提供するのは好ましくない。
  * Coverageが計測できるようにするための処理が追加されるためである
* ユーザに提供するものと分けて生成する方法が考えることができるが、その場合両方に同じテストを実行させるべきである
  * カバレッジ用のアーティファクトへテストしたとしても、そのアーティファクトでユーザが価値提供されるわけではないため
* [将来の予定としてChromeのカバレッジツールを使う方法がある](https://docs.cypress.io/guides/tooling/code-coverage#Future-work)
  * [PoCをしているリポジトリが存在する](https://github.com/bahmutov/cypress-native-chrome-code-coverage-example)
* Chromeのカバレッジツールを使うことで複数のアーティファクトをつくることを回避することを試みる

# 結果

* Cypressによるテストのカバレッジを取得するためにコード変換が不要になる
* 非公式な方法になるため、公式による実装が行われた場合、置き換えたほうが良い可能性がある
* Cypressの構造に制限を受けるため、応えるのが難しい要求が存在する可能性がある
