# deployable-env-checker
GitHubのPR一覧のタイトルから[deploy-devN]の文字を抜き出して、現在利用可能な環境をGitHubのPR作成時に自動入力するChrome Extension (ほぼ個人用)

## デモ
https://user-images.githubusercontent.com/7994534/164845412-2ce33929-39d6-4df6-897e-ebc257bfd953.mov

## インストール
1. [Releases](https://github.com/ichiki1023/deployable-env-checker/releases) から最新バージョンの `deployable-env-checker.zip` をダウンロード
2. ダウンロードしたファイルを解凍
3. `chrome://extensions/` で　`デベロッパーモード` に変更
4. `パッケージされていない拡張機能を読み込む` を選択して解凍した `deployable-env-checker` のフォルダを指定する
5. 後はGitHubのPRタイトルを入力すると確認できる
