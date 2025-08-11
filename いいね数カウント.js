/**
 * ──────────────────────────────── 〈スクロール付き最新版〉 ────────────────────────────────
 *  ✔ <li> 全体を走査。内部に “font-size:11px;color:#555” の日時 <span> があるものを
 *      “トーク／いいね一覧アイテム” とみなす
 *  ✔ since より古い行が読み込まれるまで自動で最下部へスクロールして Ajax 追加分を取得
 *
 *  使い方（例）:
 *      (async () => {
 *        const since = new Date('2025-02-01T00:00:00+09:00');
 *        await scrollUntilOlderThan(since);          // ① 必要な分だけ読み込む
 *        console.log(countItemsAfter(since));        // ② since 以降の行数を出力
 *      })();
 * ──────────────────────────────────────────────────────────────────────────────
 */

/* 0. since より「古い」行が現れるまで自動スクロール */
async function scrollUntilOlderThan(sinceDate, wait = 800, maxTry = 30) {
    let lastHeight = 0;
  
    for (let i = 0; i < maxTry; i++) {
      window.scrollTo(0, document.body.scrollHeight);            // 最下部へ
      await new Promise(r => setTimeout(r, wait));               // 追加ロード待ち
  
      // 一番下にあるアイテムの日付が since より古ければ十分読み込めたと判断
      const items = document.querySelectorAll('li');
      if (!items.length) break;
  
      const last = items[items.length - 1];
      const span = last.querySelector('span[style*="font-size:11px"][style*="color:#555"]');
      if (span) {
        const dt = parseJPDate(span.textContent.trim());
        if (dt && dt < sinceDate) break;
      }
  
      // これ以上高さが伸びない → データ尽きた
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) break;
      lastHeight = newHeight;
    }
  }
  
  /* 1. 日付文字列 → Date へ変換 */
  function parseJPDate(txt) {
    const mTime = txt.match(/(\d{1,2}):(\d{2})/);
    if (!mTime) return null;
    const hh = +mTime[1], mm = +mTime[2];
  
    const now = new Date();
    const weekdayJP = { 日:0, 月:1, 火:2, 水:3, 木:4, 金:5, 土:6 };
  
    if (txt.startsWith('今日')) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
    }
  
    const mWeek = txt.match(/^([月火水木金土日])(?:曜日)?/);
    if (mWeek) {
      const wd = weekdayJP[mWeek[1]];
      for (let offset = 1; offset <= 6; offset++) {
        const cand = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, hh, mm);
        if (cand.getDay() === wd) return cand;
      }
    }
  
    const mMD = txt.match(/(\d{1,2})月(\d{1,2})日/);
    if (mMD) {
      const d = new Date(now.getFullYear(), +mMD[1] - 1, +mMD[2], hh, mm);
      if (d > now) d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    return null;
  }
  
  /* 2. sinceDate 以降のアイテム数をカウント */
  function countItemsAfter(sinceDate) {
    let count = 0;
    document.querySelectorAll('li').forEach(li => {
      const span = li.querySelector('span[style*="font-size:11px"][style*="color:#555"]');
      if (!span) return;
      const dt = parseJPDate(span.textContent.trim());
      if (dt && dt >= sinceDate) count++;
    });
    return count;
  }
  
  /* 3. 実行例 */
(async () => {
    const since = new Date('2025-02-01T00:00:00+09:00');
    await scrollUntilOlderThan(since);      // スクロールで読み込む
    console.log(countItemsAfter(since));    // 件数を表示
})();
