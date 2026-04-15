# PROJECT_NOTES.md — 타고난 것들

## 프로젝트 개요
사주 명리학, 자미두수, 베딕 점성술 세 가지 운명학 시스템을 한 화면에서 동시에 조회하는 웹사이트.

## GitHub 주소
- 저장소: https://github.com/Misun93/sim-fortune
- 배포 주소: https://Misun93.github.io/sim-fortune

## 기술 스택
- 순수 HTML/CSS/JS (빌드 도구 없음)
- 외부 라이브러리 없음 (CDN만 사용)

## 파일 구조
```
index.html       — 전체 레이아웃
css/style.css    — 다크 테마
js/bazi.js       — 사주 명리학 계산
js/zwds.js       — 자미두수 계산
js/vedic.js      — 베딕 점성술 (VedAstro API)
js/charts.js     — SVG 차트 시각화
js/ai.js         — Claude AI 종합 분석
js/app.js        — 메인 컨트롤러
```

## API 정보
| API | 용도 | 키 |
|-----|------|-----|
| VedAstro | 베딕 행성 계산 | 내장 (FreeAPIUser) |
| Anthropic Claude | AI 종합 분석 | 사용자 직접 입력 |
| Nominatim | 출생지 지오코딩 | 불필요 |

## 추가할 수 있는 기능
- [ ] 오늘의 운세 (일운 계산)
- [ ] 궁합 보기 (두 사람 비교)
- [ ] 결과 이미지로 저장/공유
- [ ] 다크/라이트 모드 전환
- [ ] 영어 버전 지원
- [ ] 신살(神殺) 표시 (사주)
- [ ] 년운/월운 캘린더

## 커밋 히스토리 주요 내용
- `첫 커밋` — 기본 구조 및 전체 기능 구현
- `제목 변경: 타고난 것들` — 사이트 제목 변경
- `이름 입력 필드 제거` — 이름 필드 삭제
- `Revert "이름 입력 필드 제거"` — 이름 필드 복구
