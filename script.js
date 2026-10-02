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

// タイムライン生成とレンダリング
function generateTimeline() {
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
  // 要素が存在しない場合のNullエラー防止
  if (!listContainer) return

  listContainer.innerHTML = ''

  slots.forEach((slot) => {
    const slotHour = slot.getHours()
    const slotMinute = slot.getMinutes()

    // 何分後かを計算
    const diffMs = slot - getJSTDate()
    const diffMins = Math.ceil(diffMs / (1000 * 60))

    const pName = getProgramName(slotHour, slotMinute)
    const timeStr = `${String(slotHour).padStart(2, '0')}:${String(slotMinute).padStart(2, '0')}`

    const li = document.createElement('li')
    li.className = 'timeline-item'
    li.innerHTML = `
            <span class="timeline-time">${diffMins}分後（${timeStr}から）</span>
            <span class="timeline-name">${pName}</span>
        `
    listContainer.appendChild(li)
  })
}

// 読み込み時実行と1分ごとのループ
document.addEventListener('DOMContentLoaded', () => {
  generateTimeline()
  setInterval(generateTimeline, 60000)
})
