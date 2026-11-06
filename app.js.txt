/* 설문 진행 · 점수 계산 · 화면 전환 */
const $ = id => document.getElementById(id);
const screens = { intro: $('screen-intro'), quiz: $('screen-quiz'), result: $('screen-result') };
let answers = [];   // 'A' | 'B' 를 문항 순서대로 저장
let cur = 0;
let last = null;   // 마지막 결과 {code, file}

function show(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle('active', k === name));
  window.scrollTo(0, 0);
}

/* 진행 표시: 9칸 막대 */
const stepBar = $('steps');
QUESTIONS.forEach(() => stepBar.appendChild(document.createElement('i')));
function setSteps(n) {
  [...stepBar.children].forEach((el, i) => { el.className = i < n ? 'done' : i === n ? 'now' : ''; });
}

function drawQuestion() {
  const q = QUESTIONS[cur];
  $('qnum').innerHTML = `QUESTION <b>${cur + 1}</b> / ${QUESTIONS.length}`;
  setSteps(cur);
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
  setSteps(QUESTIONS.length);
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
    const blobP = new Promise(res => cv.toBlob(res, 'image/png'));
    last = { code, blobP, file: null };
    blobP.then(b => { if (b && last && last.code === code) last.file = new File([b], img.dataset.name, { type: 'image/png' }); });
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
$('save').onclick = async () => {
  const img = $('result-img');
  if (!img.src || !last) return;
  const name = img.dataset.name || 'PNU_진로유형.png';
  let blob = null;
  try { blob = await last.blobP; } catch (e) {}
  if (!blob) {                       // blob 변환 실패 시 dataURL → blob
    try { blob = await (await fetch(img.src)).blob(); } catch (e) {}
  }
  if (!blob) { toast('저장에 실패했어요. 결과지를 길게 누르거나 우클릭해서 저장해 주세요.'); return; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.style.display = 'none';
  document.body.appendChild(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000);
};

/* ===== 공유: 결과지 이미지를 복사 → 카톡 채팅방 / 인스타 DM 에 붙여넣기 ===== */
const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

function siteUrl() {
  if (CONFIG.SITE_URL) return CONFIG.SITE_URL;
  return location.origin + location.pathname.replace(/index\.html$/, '');
}
let toastTimer;
function toast(msg) {
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 4200);
}

/* 이미지를 클립보드에 복사. 클릭 직후 바로 호출해야 사파리에서도 동작함 */
async function copyImage() {
  if (!last) return false;
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': last.blobP })]);
      return true;
    }
  } catch (e) { console.error(e); }
  return false;
}

async function copyLink() {
  const url = siteUrl();
  try { await navigator.clipboard.writeText(url); }
  catch (e) {
    const ta = document.createElement('textarea'); ta.value = url; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e2) {} ta.remove();
  }
  toast('테스트 링크를 복사했어요.');
}

/* 기기 공유창 (이미지 복사가 안 되는 환경 · 보조 버튼) */
async function nativeShare() {
  if (!last) return false;
  try {
    if (last.file && navigator.canShare && navigator.canShare({ files: [last.file] })) {
      await navigator.share({ files: [last.file], title: '진로유형테스트' });
      return true;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return true;   // 사용자가 공유창을 닫음
  }
  return false;
}

const APP_URL = {
  '카카오톡 채팅방': 'kakaotalk://launch',
  '인스타그램 DM': 'instagram://app'
};
async function copyTo(place) {
  if (!last) return;
  if (await copyImage()) {
    if (isMobile && APP_URL[place]) {
      toast(`복사됐어요! ${place === '인스타그램 DM' ? '인스타' : '카카오톡'}이 열리면 입력창을 길게 눌러 붙여넣기 하세요.`);
      setTimeout(() => { location.href = APP_URL[place]; }, 900);
    } else {
      toast(isMobile
        ? `결과지를 복사했어요. ${place}에서 입력창을 길게 눌러 붙여넣기 하세요.`
        : `결과지를 복사했어요. ${place}에서 Ctrl+V (맥은 ⌘+V)로 붙여넣으세요.`);
    }
    return;
  }
  if (await nativeShare()) return;
  $('save').click();
  toast(`이 브라우저는 이미지 복사를 지원하지 않아 결과지를 저장했어요. 저장한 사진을 ${place}에 첨부해 주세요.`);
}

$('share-kakao').onclick = () => copyTo('카카오톡 채팅방');
$('share-insta').onclick = () => copyTo('인스타그램 DM');
$('share-link').onclick = copyLink;

if (navigator.share && navigator.canShare) {
  const b = $('share-sheet'); b.hidden = false;
  b.onclick = async () => { if (!(await nativeShare())) toast('이 기기에서는 공유창을 열 수 없어요.'); };
}

(function(){
  const lb=document.getElementById('lightbox'),li=document.getElementById('lb-img'),im=document.getElementById('result-img');
  function open(){ if(!im.src) return; li.src=im.src; lb.hidden=false; document.body.style.overflow='hidden'; }
  function close(){ lb.hidden=true; document.body.style.overflow=''; }
  document.getElementById('paper').addEventListener('click',open);
  document.getElementById('lb-close').addEventListener('click',close);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') close(); });
})();
