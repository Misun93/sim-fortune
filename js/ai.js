/**
 * ai.js — Claude API 스트리밍 통합 분석
 * anthropic-dangerous-direct-browser-access 헤더로 브라우저 직접 호출
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPT = `당신은 동양 명리학과 인도 베딕 점성술을 통합적으로 분석하는 전문 운명학자입니다.
사주 명리학(四柱命理學), 자미두수(紫微斗數), 베딕 점성술(Jyotish)의 세 가지 체계를 깊이 이해하고 있습니다.

분석 원칙:
1. 세 시스템의 공통점과 차이점을 명확히 구분하여 설명합니다
2. 각 시스템이 강조하는 인생의 다른 측면을 종합합니다
3. 자연스럽고 이해하기 쉬운 한국어로 설명합니다
4. 과학적으로 검증되지 않은 영역임을 인지하고 참고 정보로 제시합니다
5. 성격과 기질 → 재능과 직업 → 인간관계 → 재물운 → 건강 → 시운 순서로 분석합니다
6. 각 주장의 근거가 어느 시스템의 어떤 요소인지 명시합니다
7. 마크다운 형식(##, **굵게**)으로 구조화하여 작성합니다`;

function buildPrompt(baziResult, zwdsResult, vedicResult, birthInfo) {
  const { yearPillar: yp, monthPillar: mp, dayPillar: dp, hourPillar: hp } = baziResult;
  const wuxing = baziResult.wuxing;
  const currentDaeun = getCurrentDaeun(baziResult);

  const mingPalace = zwdsResult.palaces[zwdsResult.mingGongIndex];
  const careerPalace = zwdsResult.palaces.find(p => p.name === '관록궁');
  const wealthPalace = zwdsResult.palaces.find(p => p.name === '재백궁');
  const spousePalace = zwdsResult.palaces.find(p => p.name === '부처궁');

  const vedicPlanets = Object.entries(vedicResult.planets || {})
    .map(([p, i]) => `${p}: ${i.sign}${i.isRetrograde ? '(역행)' : ''}`)
    .join(', ');

  const name = birthInfo.name ? `${birthInfo.name}님` : '의뢰인';

  return `다음은 ${name} (${birthInfo.date} ${birthInfo.time} 출생)의 세 가지 운명 분석 데이터입니다.

## 1. 사주 명리학 데이터
- 사주 팔자:
  - 년주: ${yp.stem}${yp.branch} (${yp.stemKo}${yp.branchKo} / ${yp.element})
  - 월주: ${mp.stem}${mp.branch} (${mp.stemKo}${mp.branchKo} / ${mp.element})
  - 일주: ${dp.stem}${dp.branch} (${dp.stemKo}${dp.branchKo} / ${dp.element}) ← 일간
  - 시주: ${hp.stem}${hp.branch} (${hp.stemKo}${hp.branchKo} / ${hp.element})
- 일간(Day Master): ${dp.stem}(${dp.stemKo}) — ${dp.element}기운 ${dp.yinYang}
- 오행 분포: 목${wuxing.count['목']||0} 화${wuxing.count['화']||0} 토${wuxing.count['토']||0} 금${wuxing.count['금']||0} 수${wuxing.count['수']||0}
- 현재 대운: ${currentDaeun}

## 2. 자미두수 데이터
- 오행국수: ${zwdsResult.bureau}국 (납음오행: ${zwdsResult.nayinElement})
- 명궁(${mingPalace.branch}): 주성 — ${mingPalace.stars.map(s=>s.name).join(', ')||'공궁'}
- 관록궁(${careerPalace?.branch||'?'}): 주성 — ${careerPalace?.stars.map(s=>s.name).join(', ')||'공궁'}
- 재백궁(${wealthPalace?.branch||'?'}): 주성 — ${wealthPalace?.stars.map(s=>s.name).join(', ')||'공궁'}
- 부처궁(${spousePalace?.branch||'?'}): 주성 — ${spousePalace?.stars.map(s=>s.name).join(', ')||'공궁'}
- 자미성 위치: ${zwdsResult.palaces[zwdsResult.ziweiIndex].branch}궁

## 3. 베딕 점성술 데이터
- 라그나(상승궁): ${vedicResult.lagnaSign || '미상'} (${vedicResult.lagnaSignIndex !== null ? vedicResult.lagnaSignIndex+1 : '?'}번째 라시)
- 달의 위치: ${vedicResult.planets?.Moon?.sign || '-'} / 낙샤트라: ${vedicResult.moonNakshatra || '-'}
- 태양 위치: ${vedicResult.planets?.Sun?.sign || '-'}
- 행성 위치: ${vedicPlanets || '미상'}
${vedicResult.isFallback ? '- ⚠ API 근사값 사용 (태양·달만 정확)' : ''}

---

위 세 가지 시스템을 종합하여 다음 항목을 한국어로 상세히 분석해 주세요:

## 1. 타고난 성격과 기질
## 2. 핵심 재능과 적합한 직업
## 3. 인간관계 패턴 (가족, 연애, 사회)
## 4. 재물운과 경제적 성향
## 5. 건강 주의 사항
## 6. 현재 시운과 향후 3년 전망
## 7. 세 시스템이 공통으로 강조하는 핵심 메시지

각 항목에서 어느 시스템의 어떤 요소가 근거인지 괄호로 표시해 주세요.`;
}

function getCurrentDaeun(baziResult) {
  const currentYear = new Date().getFullYear();
  // birthYear 역산은 어렵지만, yearPillar idx로 추정
  // 대운 중 현재에 해당하는 것 찾기
  const daeun = baziResult.daeun;
  if (!daeun || daeun.length === 0) return '알 수 없음';
  // 현재 대운 표시 (startAge 이후 10년 단위)
  const age = baziResult.startAge;
  return `${daeun[0].age}세 시작 — ${daeun[0].stem}${daeun[0].branch}(${daeun[0].stemKo}${daeun[0].branchKo}) 운`;
}

// 메인 스트리밍 함수
export async function analyzeWithAI({
  apiKey,
  model = 'claude-sonnet-4-6',
  baziResult,
  zwdsResult,
  vedicResult,
  birthInfo,
  onChunk,
  onComplete,
  onError,
}) {
  if (!apiKey) {
    onError?.('API 키가 없습니다. 설정에서 Anthropic API 키를 입력해 주세요.');
    return;
  }

  const userPrompt = buildPrompt(baziResult, zwdsResult, vedicResult, birthInfo);

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        stream: true,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      let errMsg = `API 오류 (${response.status})`;
      try {
        const errJson = JSON.parse(errBody);
        errMsg = errJson?.error?.message || errMsg;
      } catch {}
      onError?.(errMsg);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const chunk = parsed.delta.text;
            fullText += chunk;
            onChunk?.(chunk, fullText);
          }
        } catch {}
      }
    }

    onComplete?.(fullText);
  } catch (e) {
    if (e.name === 'TypeError' && e.message.includes('fetch')) {
      onError?.('네트워크 오류: API 서버에 연결할 수 없습니다. 인터넷 연결을 확인해 주세요.');
    } else {
      onError?.(e.message || 'AI 분석 중 오류가 발생했습니다.');
    }
  }
}

// 마크다운 → HTML 간단 변환
export function markdownToHtml(text) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|p])/gm, '')
    .replace(/^(.+)$/gm, (m) => m.startsWith('<') ? m : `<p>${m}</p>`)
    .replace(/<p><\/p>/g, '');
}
