/* 설문 진행 · 점수 계산 · 화면 전환 */
const $ = id => document.getElementById(id);
const screens = { intro: $('screen-intro'), quiz: $('screen-quiz'), result: $('screen-result') };
let answers = [];   // 'A' | 'B' 를 문항 순서대로 저장
let cur = 0;

function show(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle('active', k === name));
  window.scrollTo(0, 0);
}

function drawQuestion() {
  const q = QUESTIONS[cur];
  $('qnum').textContent = `Q${cur + 1} / ${QUESTIONS.length}`;
  $('bar-fill').style.width = `${(cur / QUESTIONS.length) * 100}%`;
  $('qtext').textContent = q.q;
  $('optA').querySelector('span').textContent = q.A;
  $('optB').querySelector('span').textContent = q.B;
  ['optA', 'optB'].forEach(id => $(id).classList.remove('picked'));
  if (answers[cur]) $('opt' + answers[cur]).classList.add('picked');
  $('prev').style.visibility = cur === 0 ? 'hidden' : 'visible';
}

function pick(choice) {
  answers[cur] = choice;
  $('opt' + choice).classList.add('picked');
  setTimeout(() => {
    if (cur < QUESTIONS.length - 1) { cur++; drawQuestion(); }
    else finish();
  }, 220);
}

/* 점수 계산: 축마다 3문항 → 과반 글자가 유형 코드, A선택 비율이 pct */
function calculate(ans) {
  const cnt = AXES.map(() => ({ a: 0, total: 0 }));
  QUESTIONS.forEach((q, i) => { cnt[q.axis].total++; if (ans[i] === 'A') cnt[q.axis].a++; });
  const pct = cnt.map(c => Math.round((c.a / c.total) * 100));
  const code = AXES.map((ax, i) => (cnt[i].a * 2 > cnt[i].total ? ax.a : ax.b)).join('');
  return { code, pct };
}

async function finish() {
  $('bar-fill').style.width = '100%';
  const { code, pct } = calculate(answers);
  show('result');
  $('result-img').removeAttribute('src');
  $('result-img').style.display = '';
  $('error').textContent = '';
  document.querySelectorAll('#screen-result canvas').forEach(c => c.remove());
  $('loading').style.display = 'block';
  const cv = document.createElement('canvas');
  const img = $('result-img');
  try {
    await RESULT.render(cv, code, pct);
    img.dataset.name = `PNU_진로유형_${code}.png`;
    img.src = cv.toDataURL('image/png');
  } catch (e) {
    console.error(e);
    try {                       // 이미지 변환이 막힌 환경: 캔버스를 그대로 보여줌
      cv.style.cssText = 'width:100%;height:auto;border-radius:10px';
      img.style.display = 'none';
      img.parentNode.insertBefore(cv, img);
    } catch (e2) {}
    $('error').textContent = '이미지 저장이 제한된 환경이에요. 결과지를 길게 누르거나 우클릭해서 저장해 주세요.';
  }
  $('loading').style.display = 'none';
}

$('start').onclick = () => { answers = []; cur = 0; drawQuestion(); show('quiz'); };
$('optA').onclick = () => pick('A');
$('optB').onclick = () => pick('B');
$('prev').onclick = () => { if (cur > 0) { cur--; drawQuestion(); } };
$('retry').onclick = () => show('intro');
$('save').onclick = () => {
  const img = $('result-img');
  if (!img.src) return;
  const a = document.createElement('a');
  a.href = img.src; a.download = img.dataset.name || 'PNU_진로유형.png';
  document.body.appendChild(a); a.click(); a.remove();
};
