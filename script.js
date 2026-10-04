// 番組表スケジュール判定ロジック
function getProgramName(hour, minute) {
  // 0. 毎時00分：ねるるミュージックアカデミー
  if (minute === 0) return 'ねるるミュージックアカデミー'
  // 1. 毎時30分：ネルラジニュース
  if (minute === 30) return 'ネルラジニュース'
  // 2. 毎時45分：ガジェットマニア
  if (minute === 45) return 'ガジェットマニア'

  // 4. 毎時15分
  if (minute === 15) {
    if (hour >= 23 || hour <= 4) {
      return 'ねるるの眠れない話'
    }
    if (hour >= 5 && hour <= 10) {
      return 'オハラジオ'
    }
    if (hour >= 11 && hour <= 23) {
      return 'サボさんの千葉来ません？'
    }
  }

  // 5. 該当枠がない（未実施）の場合のフィラーBGM
  if (hour >= 23 || hour < 5) {
    return '著作権フリーの眠くなるLo-Fi楽曲（CMなし）'
  } else {
    return 'ときえのきオリジナル楽曲（CMあり）'
  }
}

function getJSTDate() {
  const now = new Date()

  // 実行環境のUTC時刻のミリ秒数を取得
  const utcMills = now.getTime() + now.getTimezoneOffset() * 60000

  // 日本時間（UTC+9時間）のミリ秒数を計算
  const jstOffset = 9 * 60 * 60 * 1000

  // 強制的に日本時間に固定されたDateオブジェクトを返す
  return new Date(utcMills + jstOffset)
}
// タイムライン生成とレンダリング（修正版）
function generateTimeline(openStatus) {
  let slots = []
  let checkTime = getJSTDate()
  checkTime.setSeconds(0)
  checkTime.setMilliseconds(0)

  // 15分単位の区切りに戻す
  let rem = checkTime.getMinutes() % 15
  checkTime.setMinutes(checkTime.getMinutes() - rem)

  // 現在より未来の直近4つのスロットを確保
  while (slots.length < 4) {
    checkTime.setMinutes(checkTime.getMinutes() + 15)
    if (checkTime > getJSTDate()) {
      slots.push(new Date(checkTime))
    }
  }

  const listContainer = document.getElementById('timelineMenu')
  if (!listContainer) return

  listContainer.innerHTML = ''
  const returnOpenStatus = []

  slots.forEach(async (slot, cnt) => {
    const slotHour = slot.getHours()
    const slotMinute = slot.getMinutes()

    const diffMs = slot - getJSTDate()
    const diffMins = Math.ceil(diffMs / (1000 * 60))

    const pName = getProgramName(slotHour, slotMinute)
    const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`

    // 前回の実行時にこのインデックス（0〜3）が開いていたかどうかを取得
    const finalOpenStatus = !!openStatus[cnt]
    returnOpenStatus.push(finalOpenStatus)

    // 初期スタイルの決定（開いていたなら 1fr、閉じ白なら 0fr）
    const initialGridRow = finalOpenStatus ? '1fr' : '0fr'

    const li = document.createElement('li')
    li.className = 'timeline-item'
    li.innerHTML = `
            <div class="timeline-main-wrapper"
              style=" flex-direction: row;
              display: flex;
              justify-content: space-between;
              width: 100%;">
              <div class="timeline-main">
                <span class="timeline-time">${diffMins}分後（${timeStr}から）</span>
                <span class="timeline-name">${pName}</span>
              </div>
              <div class="timeline-button">
                <button class="" onclick="toggleThisDetail(${cnt})">詳細</button>
              </div>
            </div>
            <div class="timeline-detail" id="detailProgramItem${cnt}"
                style="display: grid; grid-template-rows: ${initialGridRow}; transition: grid-template-rows 0.5s ease; overflow: hidden;">
              <div style="min-height: 0;">
                <p style="margin: 0; padding: 10px 0;">今回、もしくは前回のトーク内容（毎時23分に番組を生成しています）</p>
                <div id="detailBody${cnt}"></div>
              </div>
            </div>
        `
    listContainer.appendChild(li)

    const detailBody = document.getElementById(`detailBody${cnt}`)
    detailBody.style = `
      background: var(--surface-color);
      border: 1px solid #21262d;
      border-radius: 12px;
      padding: 1em;
      margin: 1em 0;
      `

    // 番組情報のテキスト読み込みと追加
    let programList = []
    if (slotMinute === 15) {
      if (slotHour >= 23 || slotHour <= 4) {
        programList.push(
          'どうしても目が冴えて眠れない夜、あなたにそっと語りかけるおやすみ前専用トーク。ナビゲーターの「ねるる」が、心温まるエピソードや不思議な昔話を静かにお話しします。',
        )
      } else if (slotHour >= 5 && slotHour <= 10) {
        // ★前述の23時重複バグも合わせて簡易修正
        programList.push(
          'さわやかな朝のスタートを応援する朝活応援番組。今日のお天気や一日の運勢、元気が湧いてくるポジティブな音楽とトークをお届けします。',
        )
      } else if (slotHour >= 11 && slotHour < 23) {
        programList.push(
          '千葉を愛し、千葉に愛された男「サボさん」が、千葉県の隠れた名所や絶品グルメ、ローカルな魅力を熱く語り尽くす観光勝手に応援バラエティ。',
        )
      }
    } else if (slotMinute == 30) {
      programList.push(
        '1時間に1回、世の中の動きをコンパクトにまとめた11分。これさえ聴いておけば、忙しいあなたも社会のトレンドに遅れることはありません。',
      )
    } else {
      programList = await fetchText(
        `${String(slotMinute).padEnd(2, '0')}-pickup.txt`,
      )
    }

    programList.forEach((program) => {
      const element = document.createElement('div')
      const programDiv = detailBody.appendChild(element)
      programDiv.innerHTML = `<div>${program}</div>`
    })
  })

  return returnOpenStatus
}

// 読み込み時実行と6秒ごとのループ（修正版）
document.addEventListener('DOMContentLoaded', () => {
  let openStatus = [false, false, false, false]

  // 初回レンダリング
  generateTimeline(openStatus)

  setInterval(() => {
    // 6秒ごとに、現在の0〜3番目の要素が「1fr（開いている）」かどうかを正しくチェックする
    for (let cnt = 0; cnt < 4; cnt++) {
      const el = document.getElementById(`detailProgramItem${cnt}`)
      if (el && el.style.gridTemplateRows === '1fr') {
        openStatus[cnt] = true
      } else {
        openStatus[cnt] = false
      }
    }
    // 状態を引き継いで再生成
    generateTimeline(openStatus)
  }, 6000)
})

function toggleThisDetail(cnt) {
  const detail = document.getElementById(`detailProgramItem${cnt}`)

  if (
    detail.style.gridTemplateRows === '0fr' ||
    !detail.style.gridTemplateRows
  ) {
    detail.style.gridTemplateRows = '1fr'
  } else {
    detail.style.gridTemplateRows = '0fr'
  }
}

async function fetchText(filename) {
  const res = await fetch(`./api/${filename}`)
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return json
  } catch (e) {
    return text
  }
}
