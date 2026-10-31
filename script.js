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
    if (hour >= 11 && hour < 23) {
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

// 現在放送中の番組・フィラー情報判定
function getCurrentProgramInfo(now) {
  const currentSlot = new Date(now)
  currentSlot.setSeconds(0)
  currentSlot.setMilliseconds(0)
  const rem = currentSlot.getMinutes() % 15
  currentSlot.setMinutes(currentSlot.getMinutes() - rem)

  const elapsedMs = now.getTime() - currentSlot.getTime()
  // 表示時間は番組放送開始時刻から10分間とする
  const isProgramOnAir = elapsedMs < 10 * 60 * 1000

  const slotHour = currentSlot.getHours()
  const slotMinute = currentSlot.getMinutes()

  if (isProgramOnAir) {
    return {
      name: getProgramName(slotHour, slotMinute),
      slotHour: slotHour,
      slotMinute: slotMinute,
      hasDetails: true,
    }
  } else {
    // 番組放送時間が終わり、次の番組が流れるまでの間
    // 5時～23時は「ときえのきオススメ楽曲」、23時～翌朝5時は「Chill Music」
    const currentHour = now.getHours()
    const name =
      currentHour >= 5 && currentHour < 23
        ? 'ときえのきオススメ楽曲'
        : 'Chill Music'
    return {
      name: name,
      slotHour: slotHour,
      slotMinute: slotMinute,
      hasDetails: false,
    }
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

// 各番組の詳細テキスト取得
async function getProgramDetails(slotHour, slotMinute) {
  let programList = []
  if (slotMinute === 0) {
    programList.push(
      '音楽理論や打ち込み楽曲の極意について、初心者でもわかりやすく解説する音楽学習番組。音楽制作に興味がある方は必聴です。',
    )
    const fetched = await fetchText('00-pickup.txt')
    if (Array.isArray(fetched)) {
      programList = [...programList, ...fetched]
    } else if (fetched) {
      programList.push(fetched)
    }
  } else if (slotMinute === 15) {
    if (slotHour >= 23 || slotHour <= 4) {
      programList.push(
        'どうしても目が冴えて眠れない夜、あなたにそっと語りかけるおやすみ前専用トーク。ナビゲーターの「ねるる」が、心温まるエピソードや不思議な昔話を静かにお話しします。',
      )
    } else if (slotHour >= 5 && slotHour <= 10) {
      programList.push(
        'さわやかな朝のスタートを応援する朝活応援番組。今日のお天気や一日の運勢、元気が湧いてくるポジティブな音楽とトークをお届けします。',
      )
    } else if (slotHour >= 11 && slotHour < 23) {
      programList.push(
        '千葉を愛し、千葉に愛された男「サボさん」が、千葉県の隠れた名所や絶品グルメ、ローカルな魅力を熱く語り尽くす観光勝手に応援バラエティ。',
      )
      const fetched = await fetchText('15-sabochiba-pickup.txt')
      if (Array.isArray(fetched)) {
        programList = [...programList, ...fetched]
      } else if (fetched) {
        programList.push(fetched)
      }
    }
  } else if (slotMinute === 30) {
    programList.push(
      '1時間に1回、世の中の動きをコンパクトにまとめた11分。これさえ聴いておけば、忙しいあなたも社会のトレンドに遅れることはありません。',
    )
  } else if (slotMinute === 45) {
    programList.push(
      'ガジェットやプログラミング、AIに興味のある皆さんをしっかりと沼に突き落とす番組。これを聞けばあなたも立派なキモオタです。',
    )
    const fetched = await fetchText('45-pickup.txt')
    if (Array.isArray(fetched)) {
      programList = [...programList, ...fetched]
    } else if (fetched) {
      programList.push(fetched)
    }
  } else {
    const fetched = await fetchText(
      `${String(slotMinute).padEnd(2, '0')}-pickup.txt`,
    )
    if (Array.isArray(fetched)) {
      programList = [...programList, ...fetched]
    } else if (fetched) {
      programList.push(fetched)
    }
  }
  return programList
}

// タイムライン生成とレンダリング
async function generateTimeline(openStatus = []) {
  const now = getJSTDate()

  // 1. 現在放送中のスロット
  const currentProgram = getCurrentProgramInfo(now)

  // 2. 現在より未来の直近4つのスロットを確保
  let slots = []
  let checkTime = new Date(now)
  checkTime.setSeconds(0)
  checkTime.setMilliseconds(0)

  // 15分単位の区切りに戻す
  let rem = checkTime.getMinutes() % 15
  checkTime.setMinutes(checkTime.getMinutes() - rem)

  while (slots.length < 4) {
    checkTime.setMinutes(checkTime.getMinutes() + 15)
    if (checkTime > now) {
      slots.push(new Date(checkTime))
    }
  }

  // 3. 表示アイテムリスト（一番上に「現在放送中」、続けて未来のスロット）
  const items = [
    {
      isCurrent: true,
      timeLabel: '現在放送中',
      name: currentProgram.name,
      hasDetails: currentProgram.hasDetails,
      slotHour: currentProgram.slotHour,
      slotMinute: currentProgram.slotMinute,
    },
    ...slots.map((slot) => {
      const slotHour = slot.getHours()
      const slotMinute = slot.getMinutes()
      const diffMs = slot - now
      const diffMins = Math.ceil(diffMs / (1000 * 60))
      const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`
      return {
        isCurrent: false,
        timeLabel: `${diffMins}分後（${timeStr}から）`,
        name: getProgramName(slotHour, slotMinute),
        hasDetails: true,
        slotHour: slotHour,
        slotMinute: slotMinute,
      }
    }),
  ]

  const listContainer = document.getElementById('timelineMenu')
  if (!listContainer) return

  listContainer.innerHTML = ''
  const returnOpenStatus = []

  for (let cnt = 0; cnt < items.length; cnt++) {
    const item = items[cnt]

    // 前回の実行時にこのインデックスが開いていたかどうかを取得
    const finalOpenStatus = !!openStatus[cnt]
    returnOpenStatus.push(finalOpenStatus)

    const initialGridRow = finalOpenStatus ? '1fr' : '0fr'

    const li = document.createElement('li')
    li.className = item.isCurrent
      ? 'timeline-item timeline-current'
      : 'timeline-item'

    const buttonHtml = item.hasDetails
      ? `<button class="" onclick="toggleThisDetail(${cnt})">詳細</button>`
      : ''

    const detailHtml = item.hasDetails
      ? `
          <div class="timeline-detail" id="detailProgramItem${cnt}"
              style="display: grid; grid-template-rows: ${initialGridRow}; transition: grid-template-rows 0.5s ease; overflow: hidden;">
            <div style="min-height: 0;">
              <p style="margin: 0; padding: 10px 0;" class="detail-description">今回、もしくは前回のトーク内容（毎時23分に番組を生成しています）</p>
              <div id="detailBody${cnt}" class="detail-body"></div>
            </div>
          </div>
        `
      : ''

    li.innerHTML = `
            <div class="timeline-main-wrapper"
              style=" flex-direction: row;
              display: flex;
              justify-content: space-between;
              width: 100%;">
              <div class="timeline-main">
                <span class="timeline-time">${item.timeLabel}</span>
                <span class="timeline-name">${item.name}</span>
              </div>
              <div class="timeline-button">
                ${buttonHtml}
              </div>
            </div>
            ${detailHtml}
        `
    listContainer.appendChild(li)

    if (item.hasDetails) {
      const detailBody = document.getElementById(`detailBody${cnt}`)
      if (detailBody) {
        detailBody.style = `
          background: var(--surface-color);
          border: 1px solid #21262d;
          border-radius: 12px;
          padding: 1em;
          margin: 1em 0;
        `
        const programList = await getProgramDetails(
          item.slotHour,
          item.slotMinute,
        )
        programList.forEach((program) => {
          const element = document.createElement('div')
          const programDiv = detailBody.appendChild(element)
          programDiv.innerHTML = `<div>${program}</div>`
        })
      }
    }
  }

  return returnOpenStatus
}

// 読み込み時実行と6秒ごとのループ（修正版）
document.addEventListener('DOMContentLoaded', () => {
  let openStatus = [false, false, false, false, false]

  // 初回レンダリング
  generateTimeline(openStatus)

  setInterval(() => {
    // 6秒ごとに、現在の要素が「1fr（開いている）」かどうかを正しくチェックする
    const listContainer = document.getElementById('timelineMenu')
    const totalItems = listContainer ? listContainer.children.length : 5
    for (let cnt = 0; cnt < totalItems; cnt++) {
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
  if (!detail) return

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
  try {
    const res = await fetch(`./api/${filename}`)
    if (!res.ok) return []
    const text = await res.text()
    try {
      const json = JSON.parse(text)
      return json
    } catch (e) {
      return text
    }
  } catch (e) {
    return []
  }
}
