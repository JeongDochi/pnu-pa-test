/* 결과지 캔버스 렌더링 (배경 bg.jpg 위에 그림) */
const RESULT = (() => {
  const K = 3, CW = 540, CH = 675;           // 좌표 단위 540x675 → 출력 1620x2025px
  const FONT = "'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif";
  const C = { navy: '#0f3e7a', blue: '#0b5aa5', teal: '#2196a5', gray: '#465060', light: '#e1f0f6' };
  const WH = a => `rgba(255,255,255,${a})`;

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
  function txt(ctx, t, x, y, size, weight, color, align = 'left', maxW) {
    let s = size;
    ctx.font = `${weight} ${s}px ${FONT}`;
    if (maxW) while (ctx.measureText(t).width > maxW && s > 6) { s -= 0.25; ctx.font = `${weight} ${s}px ${FONT}`; }
    ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'top';
    ctx.fillText(t, x, y);
  }
  function wrap(ctx, t, x, y, maxW, lh, size, color) {
    ctx.font = `400 ${size}px ${FONT}`;
    let line = '', row = 0;
    for (const ch of t) {
      if (ctx.measureText(line + ch).width > maxW) { txt(ctx, line.trim(), x, y + row * lh, size, 400, color); line = ch; row++; }
      else line += ch;
    }
    if (line) txt(ctx, line.trim(), x, y + row * lh, size, 400, color);
  }

  /* code: 'PLD' 등 / pct: 각 축에서 왼쪽(a) 글자 비율(0~100) 3개 */
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

    // ※ 제목("나의 진로 유형은?"), 로고, 하단 안내문은 배경 이미지에 이미 들어 있음

    // 유형 카드
    rr(ctx, 36, 152, 468, 100, 16, WH(.9), C.blue);
    rr(ctx, 50, 166, 84, 72, 12, C.blue);
    txt(ctx, 'TYPE', 92, 175, 9, 500, '#c8e1f5', 'center');
    txt(ctx, code, 92, 191, 28, 700, '#fff', 'center');
    txt(ctx, T.name, 152, 166, 26, 700, C.navy, 'left', 336);
    txt(ctx, T.en, 152, 202, 10.5, 500, C.teal, 'left', 336);
    txt(ctx, code.split('').map((ch, i) => '#' + (ch === AXES[i].a ? AXES[i].aName : AXES[i].bName)).join('   '),
        152, 220, 11.5, 500, C.gray);

    // 성향 설명
    rr(ctx, 36, 262, 468, 70, 14, WH(.88));
    txt(ctx, '성향 설명', 52, 269, 11.5, 700, C.blue);
    wrap(ctx, T.desc, 52, 287, 436, 14.5, 10, C.gray);

    // 나의 성향 분석 (독수리 동상을 피해 오른쪽에 배치)
    rr(ctx, 190, 344, 314, 92, 14, WH(.9));
    txt(ctx, '나의 성향 분석', 206, 352, 11.5, 700, C.blue);
    AXES.forEach((ax, i) => {
      const y = 376 + i * 18, l = pct[i], r = 100 - l;
      const leftWins = l > r;
      txt(ctx, `${ax.aName} ${l}%`, 206, y, 9, leftWins ? 700 : 400, leftWins ? C.navy : C.gray);
      rr(ctx, 270, y + 2, 164, 7, 3.5, '#dce8f0');
      if (l > 0) rr(ctx, 270, y + 2, Math.max(7, 164 * l / 100), 7, 3.5, C.blue);
      if (r > 0) rr(ctx, 434 - Math.max(7, 164 * r / 100), y + 2, Math.max(7, 164 * r / 100), 7, 3.5, C.teal);
      txt(ctx, `${ax.bName} ${r}%`, 490, y, 9, !leftWins ? 700 : 400, !leftWins ? C.navy : C.gray, 'right');
    });

    // 추천 진로
    rr(ctx, 116, 446, 388, 156, 14, WH(.92));
    txt(ctx, '추천 진로', 132, 453, 12, 700, C.blue);
    [['공공 · 국가', T.pub, 132, C.teal], ['민간 · 전문', T.pri, 320, C.blue]].forEach(([title, list, x, col]) => {
      txt(ctx, title, x, 473, 9.5, 700, col);
      list.slice(0, 4).forEach((job, i) => {
        const y = 489 + i * 28;
        rr(ctx, x, y, 172, 24, 7, C.light);
        rr(ctx, x, y, 4, 24, 2, col);
        txt(ctx, job, x + 12, y + 7, 9, 700, C.navy, 'left', 152);
      });
    });
  }
  return { render };
})();
