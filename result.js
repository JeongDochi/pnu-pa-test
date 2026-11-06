/* 결과지 캔버스 렌더링 (배경 bg.png 위에 그림)
   좌표 단위: 540 x 675  (출력 1620 x 2025 px)
   배경 이미지 기준 영역
     · 제목 "나의 진로 유형은?" : y 83~112
     · 독수리 : x 0~175, y 320~435  /  기둥 : x 45~102, y 435~675
     · 하단 안내문(배경에 포함) : y 607~ */
const RESULT = (() => {
  const K = 3, CW = 540, CH = 675;
  const FONT = "'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif";
  const C = { navy: '#0f3e7a', blue: '#0b5aa5', teal: '#16808d', gray: '#3b4757', sub: '#566477', light: '#e6f1f7' };
  const WH = a => `rgba(255,255,255,${a})`;
  const font = (size, weight) => `${weight} ${size}px ${FONT}`;

  function loadImg(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  }
  function rr(ctx, x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }
  /* 텍스트 (기준선 alphabetic) */
  function tb(ctx, t, x, y, size, weight, color, align = 'left') {
    ctx.font = font(size, weight); ctx.fillStyle = color;
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(t, x, y);
  }
  /* 텍스트 (세로 가운데 기준) */
  function tm(ctx, t, x, y, size, weight, color, align = 'left') {
    ctx.font = font(size, weight); ctx.fillStyle = color;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(t, x, y);
  }
  const wid = (ctx, t, size, weight) => { ctx.font = font(size, weight); return ctx.measureText(t).width; };

  /* 줄바꿈: 띄어쓰기 단위 → 단어 하나가 너무 길면 글자 단위 */
  function wrapLines(ctx, t, maxW, size, weight = 400) {
    ctx.font = font(size, weight);
    const lines = []; let line = '';
    const put = w => {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width <= maxW) { line = test; return; }
      if (line) { lines.push(line); line = ''; }
      if (ctx.measureText(w).width <= maxW) { line = w; return; }
      for (const ch of w) {
        if (line && ctx.measureText(line + ch).width > maxW) { lines.push(line); line = ch; } else line += ch;
      }
    };
    t.split(' ').forEach(put);
    if (line) lines.push(line);
    return lines;
  }

  /* code: 'PFD' 등 / pct: 각 축에서 왼쪽(a) 글자 비율(0~100) 3개 */
  async function render(canvas, code, pct) {
    // 글꼴 로딩은 최대 2.5초만 기다림 (인터넷이 느려도 결과지는 나오도록)
    try {
      await Promise.race([
        Promise.all(['400', '500', '700'].map(w => document.fonts.load(`${w} 12px "Noto Sans KR"`))),
        new Promise(res => setTimeout(res, 2500))
      ]);
    } catch (e) {}
    const T = TYPES[code];
    canvas.width = CW * K; canvas.height = CH * K;
    const ctx = canvas.getContext('2d');
    ctx.scale(K, K);
    ctx.drawImage(await loadImg(BG_DATA), 0, 0, CW, CH);

    /* ───────── 1. 유형 카드 (y 134~220, 제목과 22 간격) ───────── */
    const TY = 134, TH = 86, CY = TY + 4 + (TH - 4) / 2;     // CY: 상단 라인 아래 내용 영역의 세로 중심
    ctx.save();
    rr(ctx, 36, TY, 468, TH, 8, WH(.96), '#c5d3e3');
    ctx.clip();
    ctx.fillStyle = C.blue; ctx.fillRect(36, TY, 468, 4);
    ctx.restore();

    // 왼쪽 기준선(x=52)은 아래 카드들의 글자 시작선과 동일
    const LEFT = 52, BW = 112, BH = 52, GAP = 22;
    const rx = LEFT + BW + GAP + 1 + GAP;
    let nameSize = 28;                                        // 길면 오른쪽 여백(x=488)을 넘지 않게 줄임
    while (wid(ctx, T.name, nameSize, 700) > 488 - rx && nameSize > 16) nameSize -= .5;

    rr(ctx, LEFT, CY - BH / 2, BW, BH, 16, '#e8f1fa', '#a9c6e4');
    code.split('').forEach((ch, i) => tb(ctx, ch, LEFT + BW / 2 + (i - 1) * 34, CY + 10.2, 30, 700, C.blue, 'center'));
    ctx.fillStyle = '#d5dee9'; ctx.fillRect(LEFT + BW + GAP, CY - 29, 1, 58);
    tb(ctx, '나의 진로 유형', rx, CY - 20.5, 11, 700, C.teal);
    tb(ctx, T.name, rx, CY + 9.5, nameSize, 700, C.navy);
    tb(ctx, T.en, rx, CY + 28.5, 10.5, 500, C.sub);

    /* ───────── 2. 성향 설명 + 코드 해석 (y 228~338) ───────── */
    const DY = 228;
    rr(ctx, 36, DY, 468, 110, 10, WH(.94));
    tb(ctx, '성향 설명', 52, DY + 21, 13, 700, C.blue);
    let ds = 11, lines = wrapLines(ctx, T.desc, 436, ds);
    while (lines.length > 3 && ds > 9.5) { ds -= .5; lines = wrapLines(ctx, T.desc, 436, ds); }
    lines.slice(0, 3).forEach((l, i) => tb(ctx, l, 52, DY + 39 + i * 16, ds, 400, C.gray));
    ctx.fillStyle = '#d5dee9'; ctx.fillRect(52, DY + 78, 436, 1);
    code.split('').forEach((ch, i) => {
      const ax = AXES[i], isA = ch === ax.a, x = 52 + i * 148, y = DY + 84;
      rr(ctx, x, y, 16, 16, 5, C.blue);
      tm(ctx, ch, x + 8, y + 8.5, 10.5, 700, '#fff', 'center');
      tb(ctx, isA ? ax.aTitle : ax.bTitle, x + 22, DY + 92, 11.5, 700, C.navy);
      tb(ctx, isA ? ax.aDesc : ax.bDesc, x + 22, DY + 104, 10, 400, C.sub);
    });

    /* ───────── 3. 나의 성향 분석 (독수리를 피해 오른쪽, y 346~436) ───────── */
    const AY = 346;
    rr(ctx, 190, AY, 314, 90, 10, WH(.94));
    tb(ctx, '나의 성향 분석', 204, AY + 20, 13, 700, C.blue);
    AXES.forEach((ax, i) => {
      const y = AY + 41 + i * 19, l = pct[i], r = 100 - l, leftWins = l > r;
      tm(ctx, `${ax.aName} ${l}%`, 204, y, 10.5, leftWins ? 700 : 400, leftWins ? C.navy : C.sub);
      rr(ctx, 272, y - 3.5, 150, 7, 3.5, '#dce8f0');
      if (l > 0) rr(ctx, 272, y - 3.5, Math.max(7, 150 * l / 100), 7, 3.5, C.blue);
      if (r > 0) rr(ctx, 422 - Math.max(7, 150 * r / 100), y - 3.5, Math.max(7, 150 * r / 100), 7, 3.5, C.teal);
      tm(ctx, `${ax.bName} ${r}%`, 490, y, 10.5, !leftWins ? 700 : 400, !leftWins ? C.navy : C.sub, 'right');
    });

    /* ───────── 4. 추천 진로 (기둥을 피해 오른쪽, y 446~604) ───────── */
    const JY = 446;
    rr(ctx, 116, JY, 388, 158, 10, WH(.94));
    tb(ctx, '추천 진로', 130, JY + 22, 13, 700, C.blue);
    [['공공 · 국가', T.pub, 130, C.teal], ['민간 · 전문', T.pri, 314, C.blue]].forEach(([title, list, x, col]) => {
      tb(ctx, title, x, JY + 43, 11, 700, col);
      list.slice(0, 3).forEach((job, i) => {
        const y = JY + 50 + i * 36, W = 176, H = 32;
        rr(ctx, x, y, W, H, 6, C.light);
        rr(ctx, x, y, 4, H, 2, col);
        const name = job.replace(/\(/g, ' (');                // 괄호 앞에서 줄바꿈되도록
        let fs = 11, ls = wrapLines(ctx, name, W - 22, fs, 700);
        while (ls.length > 2 && fs > 9.5) { fs -= .5; ls = wrapLines(ctx, name, W - 22, fs, 700); }
        ls.slice(0, 2).forEach((l, k) => tm(ctx, l, x + 12, y + H / 2 + (k - (Math.min(ls.length, 2) - 1) / 2) * 12.5, fs, 700, C.navy));
      });
    });
  }
  return { render, wrapLines };
})();
