/*───────────────────────────────────────*
 * 0. スクロールで必要なデータを読み切る *
 *───────────────────────────────────────*/
/**
 * sinceDate より「古い」レコードが 1 行でも読み込まれるまで
 * 自動で最下部へスクロールし続ける。
 *
 *   - 画面の高さが増えなくなった／指定回数スクロールした
 *     → データが尽きたと判断して停止
 *
 *   - 適宜 wait(ms) を調整（Ajax が遅いサイトなら長めに）
 */
async function scrollUntilOlderThan(sinceDate, wait = 800, maxTry = 30) {
  let lastHeight = 0;

  for (let i = 0; i < maxTry; i++) {
    // 一番下までスクロール
    window.scrollTo(0, document.body.scrollHeight);

    // Ajax で要素が追加されるのを待つ
    await new Promise(r => setTimeout(r, wait));

    // 直近ロードされた最終行の日付を取得
    const lis  = document.querySelectorAll('li[id^="li_friend_"]');
    if (!lis.length) break;
    const last = lis[lis.length - 1];
    const span = last.querySelector('div[style*="right:0"] span');
    if (span) {
      const lastDate = parseJPDate(span.textContent.trim());
      if (lastDate && lastDate < sinceDate) {
        // 目的より古い行を確認 → 十分読み込めたので停止
        break;
      }
    }

    // これ以上高さが伸びない＝追加データなし → 終了
    const newHeight = document.body.scrollHeight;
    if (newHeight === lastHeight) break;
    lastHeight = newHeight;
  }
}

/*───────────────────────────────────────*
 * 1. 日付文字列 → Date                   *
 *───────────────────────────────────────*/
function parseJPDate(txt) {
  const mTime = txt.match(/(\d{1,2}):(\d{2})/);      // HH:MM を抽出
  if (!mTime) return null;
  const hh = +mTime[1], mm = +mTime[2];

  const now = new Date();                            // 現在（JST）
  const weekdayJP = { 日:0, 月:1, 火:2, 水:3, 木:4, 金:5, 土:6 };

  // ── 「今日」 ──
  if (txt.startsWith('今日')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
  }

  // ── 曜日（1～6日前） ──
  const mWeek = txt.match(/^([月火水木金土日])(?:曜日)?/);   // 「水」or「水曜日」
  if (mWeek) {
    const wd = weekdayJP[mWeek[1]];
    for (let offset = 1; offset <= 6; offset++) {
      const cand = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, hh, mm);
      if (cand.getDay() === wd) return cand;
    }
  }

  // ── 「MM月DD日」形式（7日以上前） ──
  const mMD = txt.match(/(\d{1,2})月(\d{1,2})日/);
  if (mMD) {
    const d = new Date(now.getFullYear(), +mMD[1] - 1, +mMD[2], hh, mm);
    if (d > now) d.setFullYear(d.getFullYear() - 1); // 未来なら前年扱い
    return d;
  }
  return null;
}

/*───────────────────────────────────────*
 * 2. sinceDate 以降の <li id="li_friend_…"> を数える *
 *───────────────────────────────────────*/
function countFriendItemsAfter(sinceDate) {
  const lis = document.querySelectorAll('li[id^="li_friend_"]');
  let count = 0;

  lis.forEach(li => {
    const span = li.querySelector('div[style*="right:0"] span'); // 右上の日時表示
    if (!span) return;
    const msgDate = parseJPDate(span.textContent.trim());
    if (msgDate && msgDate >= sinceDate) count++;
  });

  return count;
}

/*───────────────────────────────────────*
 * 3. 実行例                               *
 *───────────────────────────────────────*/
(async () => {
  const since = new Date('2025-07-09T00:00:00+09:00');

  // ① スクロールして必要な分だけ読み込む
  await scrollUntilOlderThan(since, /*wait=*/800, /*maxTry=*/30);

  // ② 目的期間の行数を数える
  const cnt = countFriendItemsAfter(since);
  console.log(`since 以降の件数: ${cnt}`);
})();
