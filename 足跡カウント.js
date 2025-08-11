/*────────────────────────────────────────────*
 * 自動スクロール付き：指定日時 “sinceDate” より
 * 古いアイテムが現れるまで最下部へスクロールして
 * から件数をカウントする完全版                     *
 *────────────────────────────────────────────*/

/* 0. sinceDate より古い行が見つかるまでスクロール */
async function scrollUntilOlderThan(sinceDate, wait = 800, maxTry = 30) {
    let lastHeight = 0;
  
    for (let i = 0; i < maxTry; i++) {
      // ページ最下部へ
      window.scrollTo(0, document.body.scrollHeight);
  
      // Ajax／遅延ロード待ち
      await new Promise(r => setTimeout(r, wait));
  
      // 末尾アイテムの日付を確認
      const items = Array.from(document.querySelectorAll('li'))
        .filter(li => li.querySelector('span[style*="font-size:11px"][style*="color:#555"]'));
      if (!items.length) break;
  
      const last = items[items.length - 1];
      const span = last.querySelector('span[style*="font-size:11px"][style*="color:#555"]');
      if (span) {
        const dt = parseJPDate(span.textContent.trim());
        if (dt && dt < sinceDate) break;                // 目的より古い行を確認 → スクロール終了
      }
  
      // 高さが伸びなくなったらデータ尽きたと判断
      const newHeight = document.body.scrollHeight;
      if (newHeight === lastHeight) break;
      lastHeight = newHeight;
    }
  }
  
  /* 1. 「今日／曜日／MM月DD日 HH:MM」→ Date */
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
  function countFriendItemsAfter(sinceDate) {
    let count = 0;
  
    document.querySelectorAll('li').forEach(li => {
      const span = li.querySelector('span[style*="font-size:11px"][style*="color:#555"]');
      if (!span) return;
  
      const msgDate = parseJPDate(span.textContent.trim());
      if (msgDate && msgDate >= sinceDate) count++;
    });
  
    return count;
  }
  
  /* 3. 実行例 */
  (async () => {
    const since = new Date('2025-07-09T00:00:00+09:00');
  
    // 必要な行が読み込まれるまで自動スクロール
    await scrollUntilOlderThan(since, /*wait=*/800, /*maxTry=*/30);
  
    // since 以降の件数を取得
    console.log(countFriendItemsAfter(since));
  })();
  