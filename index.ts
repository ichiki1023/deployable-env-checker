window.addEventListener('input', (event) => {
  if (!event.target) return
  const target = event.target as HTMLInputElement
  if (['issue_title', 'pull_request_title'].includes(target.id)) {
    const inputValue = target.value
    const cursor = target.selectionStart

    // deploy-devと入力された場合にtriggerを実行
    if (
      cursor &&
      inputValue.substring(cursor - 'deploy-dev'.length, cursor) ===
        'deploy-dev'
    ) {
      try {
        trigger()
      } catch (e) {
        console.error(e)
      }
    }
  }
})

const trigger = async (): Promise<void> => {
  // PRページからhtmlを取得
  const html = await fetchGithubPullRequestsHTML(location.href)

  // タイトル一覧を取得
  const prTitleList = getPrTitleList(html)

  // 現在使用中の環境の番号を取得
  const usedEnvNumbers: number[] = getUsedEnvNumbers(prTitleList)

  // 利用可能な環境の数字
  const availableEnvNum = [...Array(8).keys()]
    .map((i) => i + 1)
    .find((index) => !usedEnvNumbers.includes(index))

  if (availableEnvNum) {
    // 環境番号を含めた入力値の置き換え
    const input = document.activeElement as HTMLInputElement | null
    if (input) {
      input.value = input.value.replace(
        /deploy-dev/,
        `deploy-dev${availableEnvNum}`,
      )
    }
  } else {
    alert('使える環境はありません')
  }
}

/**
 * 現在のurlからrepository名を取得して、GitHubのPull RequestページのHTMLを取得する
 */
const fetchGithubPullRequestsHTML = async (href: string): Promise<Document> => {
  const url = new URL(href)
  const pathnames = url.pathname.split('/')
  const requestUrl = `${url.origin}/${pathnames[1]}/${pathnames[2]}/pulls` // ex: https://github.com/organization/repository

  const response = await fetch(requestUrl)
  const data = await response.text()

  const parser = new DOMParser()
  const html = parser.parseFromString(data, 'text/html')

  return html
}

/**
 * htmlからPRのタイトル一覧を取得
 */
const getPrTitleList = (html: Document): string[] => {
  return Array.from(
    html.querySelectorAll('.js-issue-row > div > div > a.markdown-title'),
  ).map((a) => a.innerHTML)
}

/**
 * 現在使用中の環境の番号をタイトル一覧から抽出
 */
const getUsedEnvNumbers = (prTitleList: string[]): number[] => {
  const usedEnvNumbers: number[] = []
  prTitleList.forEach((title) => {
    const matchedTitle = (title.match(/^\[deploy-dev([1-9])\]/g) || []).join('')
    const matchedNum = (matchedTitle.match(/[1-9]/g) || []).join('')
    if (matchedNum) {
      usedEnvNumbers.push(Number(matchedNum))
    }
  })

  return usedEnvNumbers
}
