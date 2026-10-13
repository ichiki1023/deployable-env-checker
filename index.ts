const KEYWORD = 'deploy-dev'
const MAX_ENV_NUM = 9

window.addEventListener('input', (event) => {
  const target = event.target
  // GitHubのUI変更でclass名が変わりやすいため、class名ではなく要素の種類で判定する
  if (!(target instanceof HTMLInputElement) || target.type !== 'text') return

  const inputValue = target.value
  const cursor = target.selectionStart

  // deploy-devと入力された場合にtriggerを実行
  if (
    cursor &&
    inputValue.substring(cursor - KEYWORD.length, cursor) === KEYWORD
  ) {
    trigger(target, cursor).catch((e) => console.error(e))
  }
})

const trigger = async (
  input: HTMLInputElement,
  cursor: number,
): Promise<void> => {
  // PRページからhtmlを取得
  const html = await fetchGithubPullRequestsHTML(location.href)

  // タイトル一覧を取得
  const prTitleList = getPrTitleList(html)

  // 現在使用中の環境の番号を取得
  const usedEnvNumbers = getUsedEnvNumbers(prTitleList)

  // 利用可能な環境の数字
  const availableEnvNum = [...Array(MAX_ENV_NUM).keys()]
    .map((i) => i + 1)
    .find((index) => !usedEnvNumbers.includes(index))

  if (availableEnvNum) {
    // 環境番号を含めた入力値の置き換え (fetch中に入力が変わっていたら何もしない)
    const value = input.value
    if (value.substring(cursor - KEYWORD.length, cursor) !== KEYWORD) return

    setInputValue(
      input,
      value.substring(0, cursor) + availableEnvNum + value.substring(cursor),
    )
    input.setSelectionRange(cursor + 1, cursor + 1)
  } else {
    alert('使える環境はありません')
  }
}

/**
 * Reactで管理されたinputにも反映されるように、ネイティブのsetterで値を設定してinputイベントを発火する
 */
const setInputValue = (input: HTMLInputElement, value: string): void => {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    'value',
  )?.set
  if (setter) {
    setter.call(input, value)
  } else {
    input.value = value
  }
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

/**
 * 現在のurlからrepository名を取得して、GitHubのPull RequestページのHTMLを取得する
 * 1ページ(25件)に収まらないケースを避けるため、タイトルにdeploy-devを含むopenなPRに絞り込む
 */
const fetchGithubPullRequestsHTML = async (href: string): Promise<Document> => {
  const url = new URL(href)
  const pathnames = url.pathname.split('/')
  const requestUrl = new URL(
    `${url.origin}/${pathnames[1]}/${pathnames[2]}/pulls`,
  ) // ex: https://github.com/organization/repository/pulls
  requestUrl.searchParams.set('q', `is:pr is:open in:title ${KEYWORD}`)

  const response = await fetch(requestUrl.toString())
  const data = await response.text()

  const parser = new DOMParser()
  const html = parser.parseFromString(data, 'text/html')

  return html
}

/**
 * htmlからPRのタイトル一覧を取得
 */
const getPrTitleList = (html: Document): string[] => {
  const anchors = html.querySelectorAll(
    [
      'a[data-testid="listitem-title-link"]',
      '.js-issue-row a.markdown-title', // 旧UI
    ].join(','),
  )
  return Array.from(anchors).map((a) => (a.textContent || '').trim())
}

/**
 * 現在使用中の環境の番号をタイトル一覧から抽出
 */
const getUsedEnvNumbers = (prTitleList: string[]): number[] => {
  const usedEnvNumbers: number[] = []
  prTitleList.forEach((title) => {
    const matched = title.match(/^\[deploy-dev([1-9])\]/)
    if (matched) {
      usedEnvNumbers.push(Number(matched[1]))
    }
  })

  return usedEnvNumbers
}
