# 부산대학교 행정학과 진로유형테스트

9문항(A/B) → 3개 축(정책/현장 · 원칙/유연 · 데이터/가치) → 8가지 유형 → 결과지 PNG 자동 생성.

## 파일 구성
| 파일 | 역할 |
|---|---|
| `index.html` | 화면 구조 |
| `style.css` | 디자인 |
| `data.js` | **질문 · 8가지 유형 문구/진로** (내용 수정은 여기만) |
| `app.js` | 설문 진행 · 점수 계산 |
| `result.js` | 결과지 캔버스 그리기 |
| `bg.jpg` | 결과지 배경 원본 이미지 (4:5 비율, 1620×2025) |
| `bg-data.js` | `bg.jpg`를 코드에 내장한 파일 (실제로 쓰이는 건 이쪽) |

## GitHub Pages 배포
1. 저장소 생성 후 이 파일들을 **루트**에 업로드 (폴더째 말고 파일 그대로)
2. Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)` → Save
3. 1~2분 뒤 `https://<계정>.github.io/<저장소>/` 에서 접속

## 로컬 테스트
`index.html`을 더블클릭해서 열어도 동작합니다.

## 배경 이미지 교체
`bg.jpg`를 새 이미지로 바꾼 뒤 아래를 실행하면 `bg-data.js`가 다시 만들어집니다.
```
python -c "import base64;open('bg-data.js','w').write(\"const BG_DATA = 'data:image/jpeg;base64,\"+base64.b64encode(open('bg.jpg','rb').read()).decode()+\"';\")"
```
