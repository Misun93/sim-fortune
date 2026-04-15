# CLAUDE.md — 프로젝트 작업 규칙

## 언어
- 모든 대답과 설명은 **한국어**로 작성한다.
- 코드 주석은 한국어로, 변수명/함수명은 영어로 작성한다.

## 개발 방식
- **Test-Driven Development (TDD)** 를 따른다.
  1. 테스트 먼저 작성 (실패하는 테스트)
  2. 테스트를 통과하는 최소한의 코드 작성
  3. 리팩토링

## Git 규칙
- 기능 추가/수정 후 반드시 `git add . && git commit && git push` 까지 완료한다.
- 커밋 메시지는 한국어로 작성한다.

## 프로젝트 특성
- 순수 HTML/CSS/JS — 빌드 도구 없음, 프레임워크 없음
- `index.html`을 브라우저에서 직접 열어서 동작 확인
- 외부 API: VedAstro (베딕 점성술), Claude API (AI 분석), Nominatim (지오코딩)
