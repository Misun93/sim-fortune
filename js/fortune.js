/**
 * fortune.js — 규칙 기반 운세 계산 엔진
 * 십신(十神) + 오행 생극 관계로 운세 해석
 */

import { STEMS, STEMS_KO, BRANCHES, BRANCHES_KO,
         STEM_ELEMENT, STEM_YY, BRANCH_ELEMENT, ELEMENT_COLORS } from './bazi.js';

// ===== 오행 관계 =====
const GENERATES = { 목: '화', 화: '토', 토: '금', 금: '수', 수: '목' }; // 상생
const CONTROLS  = { 목: '토', 화: '금', 토: '수', 금: '목', 수: '화' }; // 상극

// ===== 십신 계산 =====
// dmElement: 일간 오행, dmYY: 일간 음양, tElement: 대상 오행, tYY: 대상 음양
function getSipshin(dmElement, dmYY, tElement, tYY) {
  const sameYY = dmYY === tYY;
  if (dmElement === tElement)          return sameYY ? '비견' : '겁재';
  if (GENERATES[dmElement] === tElement) return sameYY ? '식신' : '상관';
  if (CONTROLS[dmElement]  === tElement) return sameYY ? '정재' : '편재';
  if (CONTROLS[tElement]   === dmElement) return sameYY ? '편관' : '정관';
  if (GENERATES[tElement]  === dmElement) return sameYY ? '편인' : '정인';
  return '─';
}

// ===== 십신별 운세 해석 =====
const SIPSHIN_MEANINGS = {
  비견: {
    icon: '⚖',
    general: '독립심과 자기 주장이 강해지는 시기입니다. 경쟁 상대가 나타날 수 있으나 협력하면 시너지가 납니다.',
    work: '실력으로 승부하는 시기. 동료와의 경쟁보다 협력에 집중하세요.',
    love: '자존심이 강해져 양보가 어려울 수 있어요. 먼저 다가가는 용기가 필요합니다.',
    money: '수입은 안정적이나 지출도 늘어납니다. 무리한 투자는 피하세요.',
    health: '체력은 좋으나 과로하기 쉬운 시기입니다. 두통·어깨 긴장 주의.',
    family: '형제·자매와 갈등이 생기거나 경쟁 관계가 될 수 있어요. 의견 충돌 시 한발 양보하세요.',
    caution: '독단적 결정은 금물. 주변의 조언을 듣는 자세가 필요합니다.',
  },
  겁재: {
    icon: '⚔',
    general: '재물 손실이나 경쟁·갈등이 생길 수 있는 시기입니다. 신중하게 처신하세요.',
    work: '경쟁자나 방해자가 나타날 수 있어요. 내 것을 지키는 데 집중하세요.',
    love: '질투나 삼각관계 주의. 감정 기복이 클 수 있어요.',
    money: '예상치 못한 지출, 사기·손실 주의. 금전 거래는 신중하게.',
    health: '스트레스성 질환 주의. 충분한 휴식이 필요합니다. 간·담 계통 유의.',
    family: '가족 간 금전 문제나 재산 분쟁 주의. 보증·연대 책임은 피하세요.',
    caution: '보증·투자·동업은 이 시기에 특히 주의. 계약서 꼼꼼히 확인하세요.',
  },
  식신: {
    icon: '✨',
    general: '창의력과 표현력이 풍부해지는 좋은 시기입니다. 식복(食福)이 따르고 즐거운 일이 많아요.',
    work: '아이디어가 넘치고 창작·기획 활동에 강한 시기. 새로운 프로젝트를 시작하기 좋아요.',
    love: '매력이 넘치고 자연스럽게 어필할 수 있어요. 새 인연이 생기기 좋은 시기.',
    money: '부드럽게 재물이 들어오는 시기. 재능을 살린 수익 활동이 효과적.',
    health: '심신이 안정되고 건강한 시기. 먹는 즐거움이 커집니다.',
    family: '가정에 화기애애함이 넘치는 시기. 가족과 함께하는 시간이 즐거워요.',
    caution: '과식·과음에 주의. 너무 편안함에 안주하다 게을러질 수 있어요.',
  },
  상관: {
    icon: '💫',
    general: '표현이 강해지고 기존 질서에 도전하는 시기입니다. 창의적이나 구설에 주의하세요.',
    work: '상사나 조직과 갈등이 생길 수 있어요. 독립·프리랜서에는 유리한 시기.',
    love: '자유로운 연애를 원하게 됩니다. 기혼자는 관계 변화 주의.',
    money: '수입원이 다양해지나 불규칙할 수 있어요. 예술·창작으로 수익 가능.',
    health: '신경계 피로 주의. 말이 많아지고 에너지 소모가 클 수 있어요.',
    family: '부모·어른과 의견 충돌 가능. 말 실수로 인한 갈등 주의.',
    caution: '직장 내 언행에 각별히 주의. SNS 발언도 조심하세요.',
  },
  편재: {
    icon: '💰',
    general: '활동적인 재물운이 따르는 시기입니다. 투자·사업 기회가 생기나 변동성도 큽니다.',
    work: '영업·외근·해외 활동에 강한 시기. 적극적으로 움직이면 성과가 납니다.',
    love: '이성 인연이 생기기 쉬운 시기. 감정적이고 열정적인 만남이 많아요.',
    money: '투자·사업 수익 기회. 단 변동성이 크니 무리하지 마세요.',
    health: '활동량이 늘어 체력 관리가 필요합니다. 과로 주의.',
    family: '아버지·부성적 존재와의 인연이 부각됩니다. 가족을 위한 지출이 늘 수 있어요.',
    caution: '충동적 투자·도박성 지출 금물. 큰 계약은 전문가와 상의하세요.',
  },
  정재: {
    icon: '🏦',
    general: '안정적인 수입과 현실적인 성과가 따르는 시기입니다. 꾸준한 노력이 결실을 맺어요.',
    work: '성실함이 인정받는 시기. 안정적인 직장생활, 계획적 업무 추진에 좋아요.',
    love: '안정적이고 진지한 인연. 결혼·동거 등 현실적 진전이 가능한 시기.',
    money: '급여·임금 등 고정 수입이 늘어납니다. 저축과 재무 계획에 좋은 시기.',
    health: '건강 관리에 신경 쓰면 좋은 결과를 얻어요. 규칙적 생활이 중요합니다.',
    family: '가정의 안정이 강화되는 시기. 부양 책임이 커질 수 있어요.',
    caution: '지나친 현실주의로 감정을 소홀히 하지 마세요.',
  },
  편관: {
    icon: '⚡',
    general: '도전과 압박이 따르는 시기입니다. 극복하면 강해지지만 무리하면 탈이 날 수 있어요.',
    work: '압박감·과중한 업무가 생길 수 있어요. 강인한 의지로 이겨내면 성장합니다.',
    love: '강렬하고 운명적인 만남이 있을 수 있어요. 지배·피지배 관계에 주의.',
    money: '지출 압박이 있을 수 있어요. 비상금을 챙겨두세요.',
    health: '사고·부상·수술 주의. 무리한 활동은 피하고 정기 검진을 받으세요.',
    family: '가족 중 건강 문제나 위기가 생길 수 있어요. 가족에게 더 신경 써주세요.',
    caution: '법적 분쟁·교통사고·관재구설 주의. 서류·계약 꼼꼼히 챙기세요.',
  },
  정관: {
    icon: '👑',
    general: '명예와 안정이 따르는 좋은 시기입니다. 사회적 인정을 받고 신뢰가 높아져요.',
    work: '승진·인정·자격 취득에 유리한 시기. 원칙을 지키면 좋은 평가를 받아요.',
    love: '안정적이고 신뢰 있는 관계로 발전. 결혼 적기이며 좋은 인연이 찾아와요.',
    money: '안정적인 재물운. 합법적이고 정당한 수익이 늘어납니다.',
    health: '건강이 안정적. 규칙적인 생활을 유지하면 더욱 좋아요.',
    family: '가정에 안정감이 흐르는 시기. 부모·어른과의 관계가 원만해요.',
    caution: '지나친 완벽주의나 경직된 사고는 오히려 스트레스가 될 수 있어요.',
  },
  편인: {
    icon: '🔮',
    general: '직관력과 영감이 강해지는 시기입니다. 고독하지만 깊은 사색과 학문에 유리해요.',
    work: '혼자 하는 연구·학습·예술 활동에 좋아요. 협업보다 단독 작업에 강한 시기.',
    love: '내향적이 되어 이성에게 무관심해질 수 있어요. 외로움을 느끼기 쉬운 시기.',
    money: '불규칙한 수입. 예상치 못한 지출이 생길 수 있어요.',
    health: '소화기·수면 문제 주의. 과식·폭식에 조심하고 정신 건강도 챙기세요.',
    family: '고독감·소외감을 느끼기 쉬워요. 가족과 대화를 늘려보세요.',
    caution: '사기·기만 주의. 지나친 의심도 독이 되니 균형을 찾으세요.',
  },
  정인: {
    icon: '📚',
    general: '학습과 성장, 귀인의 도움이 따르는 시기입니다. 배움과 자기계발에 최적기예요.',
    work: '학습·자격·교육 활동에 좋아요. 윗사람의 지지와 인정을 받기 쉬운 시기.',
    love: '모성적·부성적 사랑. 정신적 교류가 깊은 인연. 자연스럽게 편안한 관계.',
    money: '큰 욕심 없이 안정적. 부모·윗사람에게 도움받을 수 있어요.',
    health: '몸과 마음이 회복되는 시기. 충분한 휴식과 영양 보충이 필요합니다.',
    family: '어머니·모성적 존재의 도움이 큰 시기. 가족의 따뜻한 지지를 받아요.',
    caution: '의존심이 강해질 수 있어요. 스스로 결정하는 힘을 기르세요.',
  },
};

// ===== 오행 강약 평가 =====
function evaluateBalance(wuxing, dmElement) {
  const { count } = wuxing;
  const dmCount = count[dmElement] || 0;
  const total = Object.values(count).reduce((a, b) => a + b, 0);

  // 일간을 생(生)해주는 오행
  const genElement = Object.keys(GENERATES).find(k => GENERATES[k] === dmElement);
  const genCount = count[genElement] || 0;

  // 일간과 같은 오행 (비겁)
  const sameCount = dmCount;

  const strength = (dmCount + genCount) / total;
  if (strength >= 0.5) return 'strong'; // 신강(身强)
  if (strength <= 0.25) return 'weak';  // 신약(身弱)
  return 'balanced';
}

// ===== 일주 계산 (bazi.js 공유 로직) =====
function getJulianDay(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
         Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

const JIAZI_JD = getJulianDay(1900, 1, 31);

function getDayGanzhi(year, month, day) {
  const diff = getJulianDay(year, month, day) - JIAZI_JD;
  const idx = ((diff % 60) + 60) % 60;
  return { stemIndex: idx % 10, branchIndex: idx % 12, idx60: idx };
}

// 입춘 테이블 (년주 기준)
const IPCHUN = {
  1990:4,1991:5,1992:5,1993:4,1994:4,1995:5,1996:5,1997:4,1998:4,1999:4,
  2000:4,2001:4,2002:4,2003:4,2004:4,2005:4,2006:4,2007:4,2008:4,2009:4,
  2010:4,2011:4,2012:4,2013:4,2014:4,2015:4,2016:4,2017:3,2018:4,2019:4,
  2020:4,2021:3,2022:4,2023:4,2024:4,2025:3,2026:4,2027:4,2028:4,2029:3,
  2030:4,2031:4,2032:4,2033:3,2034:4,2035:4,
};

function getYearGanzhi(year, month, day) {
  const ipchunDay = IPCHUN[year] || 4;
  const birthDate = new Date(year, month - 1, day);
  const ipchun = new Date(year, 1, ipchunDay);
  const eff = birthDate < ipchun ? year - 1 : year;
  const idx = ((eff - 4) % 60 + 60) % 60;
  return { stemIndex: idx % 10, branchIndex: idx % 12, idx60: idx };
}

// 월주 절기 테이블
const MONTH_TERM = [
  {m:2,d:4},{m:3,d:6},{m:4,d:5},{m:5,d:6},{m:6,d:6},{m:7,d:7},
  {m:8,d:7},{m:9,d:8},{m:10,d:8},{m:11,d:7},{m:12,d:7},{m:1,d:6}
];
const MONTH_STEM_START = [2, 4, 6, 8, 0];

function getMonthGanzhi(year, month, day, yearStemIdx) {
  let mIdx = 10;
  for (let i = 11; i >= 0; i--) {
    const t = MONTH_TERM[i];
    const ty = i === 11 ? year + 1 : year;
    if (new Date(year, month - 1, day) >= new Date(ty, t.m - 1, t.d)) {
      mIdx = i; break;
    }
  }
  const start = MONTH_STEM_START[yearStemIdx % 5];
  const stemIdx = (start + mIdx) % 10;
  const branchIdx = (mIdx + 2) % 12;
  return { stemIndex: stemIdx, branchIndex: branchIdx };
}

// ===== 대상 날짜의 간지 구하기 =====
function getTargetGanzhi(year, month, day) {
  const yg = getYearGanzhi(year, month, day);
  const mg = getMonthGanzhi(year, month, day, yg.stemIndex);
  const dg = getDayGanzhi(year, month, day);
  return {
    year:  { stemIndex: yg.stemIndex, branchIndex: yg.branchIndex,
             stem: STEMS[yg.stemIndex], stemKo: STEMS_KO[yg.stemIndex],
             branch: BRANCHES[yg.branchIndex], branchKo: BRANCHES_KO[yg.branchIndex],
             element: STEM_ELEMENT[yg.stemIndex], branchElement: BRANCH_ELEMENT[yg.branchIndex],
             yinYang: STEM_YY[yg.stemIndex] },
    month: { stemIndex: mg.stemIndex, branchIndex: mg.branchIndex,
             stem: STEMS[mg.stemIndex], stemKo: STEMS_KO[mg.stemIndex],
             branch: BRANCHES[mg.branchIndex], branchKo: BRANCHES_KO[mg.branchIndex],
             element: STEM_ELEMENT[mg.stemIndex], branchElement: BRANCH_ELEMENT[mg.branchIndex],
             yinYang: STEM_YY[mg.stemIndex] },
    day:   { stemIndex: dg.stemIndex, branchIndex: dg.branchIndex,
             stem: STEMS[dg.stemIndex], stemKo: STEMS_KO[dg.stemIndex],
             branch: BRANCHES[dg.branchIndex], branchKo: BRANCHES_KO[dg.branchIndex],
             element: STEM_ELEMENT[dg.stemIndex], branchElement: BRANCH_ELEMENT[dg.branchIndex],
             yinYang: STEM_YY[dg.stemIndex] },
  };
}

// ===== 핵심 운세 해석 생성 =====
function buildFortune(baziResult, targetGanzhi, focusYear) {
  const dm = baziResult.dayMaster;
  const strength = evaluateBalance(baziResult.wuxing, dm.element);

  const yss = getSipshin(dm.element, dm.yinYang, targetGanzhi.year.element, targetGanzhi.year.yinYang);
  const mss = getSipshin(dm.element, dm.yinYang, targetGanzhi.month.element, targetGanzhi.month.yinYang);
  const dss = targetGanzhi.day
    ? getSipshin(dm.element, dm.yinYang, targetGanzhi.day.element, targetGanzhi.day.yinYang)
    : null;

  const mainSipshin = yss;
  const meaning = SIPSHIN_MEANINGS[mainSipshin] || SIPSHIN_MEANINGS['비견'];

  const strengthText = strength === 'strong' ? '신강(身强) 사주로, 강한 에너지를 발산하기 좋은 구조입니다.'
    : strength === 'weak' ? '신약(身弱) 사주로, 지지와 도움이 힘이 되는 구조입니다.'
    : '균형 잡힌 사주로, 다양한 분야에서 유연하게 대응할 수 있습니다.';

  return { mainSipshin, meaning, strengthText, yss, mss, dss, targetGanzhi, focusYear };
}

// ===== 오늘 운세 =====
export function getTodayFortune(baziResult) {
  const today = new Date();
  const y = today.getFullYear(), m = today.getMonth() + 1, d = today.getDate();
  const ganzhi = getTargetGanzhi(y, m, d);
  return buildFortune(baziResult, ganzhi, y);
}

// ===== 특정 날짜 운세 =====
export function getDateFortune(baziResult, year, month, day) {
  const ganzhi = getTargetGanzhi(year, month, day);
  return buildFortune(baziResult, ganzhi, year);
}

// ===== 연간 운세 (세운) =====
export function getYearFortune(baziResult, year) {
  const ganzhi = getTargetGanzhi(year, 6, 15); // 년주 기준
  return buildFortune(baziResult, ganzhi, year);
}

// ===== 현재 대운 찾기 =====
export function getCurrentDaeun(baziResult, birthYear) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const daeunList = baziResult.daeun;
  let current = daeunList[0];
  for (const d of daeunList) {
    if (age >= d.age) current = d;
    else break;
  }
  return current;
}

// ===== 대운 운세 =====
export function getDaeunFortune(baziResult, birthYear) {
  const dm = baziResult.dayMaster;
  const current = getCurrentDaeun(baziResult, birthYear);
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  const remaining = (current.age + 10) - age;

  const ss = getSipshin(dm.element, dm.yinYang, current.stemElement, STEM_YY[STEMS.indexOf(current.stem)]);
  const meaning = SIPSHIN_MEANINGS[ss] || SIPSHIN_MEANINGS['비견'];

  return { current, ss, meaning, remaining, age };
}

// ===== 연애운 =====
export function getLoveFortune(baziResult, zwdsResult) {
  const dm = baziResult.dayMaster;

  // 일지(日支) 분석
  const dayBranch = baziResult.dayPillar;
  const spouseElement = dayBranch.branchElement;

  // 일지와 일간의 관계
  const spouseSipshin = getSipshin(dm.element, dm.yinYang, spouseElement, STEM_YY[0]);

  // 오늘 기준 연애운
  const today = new Date();
  const todayGanzhi = getTargetGanzhi(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const todaySS = getSipshin(dm.element, dm.yinYang, todayGanzhi.day.element, todayGanzhi.day.yinYang);

  // 자미두수 부처궁
  let spousePalace = null;
  if (zwdsResult) {
    spousePalace = zwdsResult.palaces.find(p => p.name === '부처궁');
  }

  // 연애 길한 십신: 정관(여성), 정재(남성), 식신, 정인
  const loveGoodSS = ['정관', '정재', '식신', '편재', '정인'];
  const loveBadSS  = ['겁재', '상관', '편관'];

  const todayLoveGood = loveGoodSS.includes(todaySS);
  const todayLoveBad  = loveBadSS.includes(todaySS);

  // 일지별 배우자 특성
  const SPOUSE_BY_BRANCH = {
    子: '지적이고 감수성 풍부한 인연. 말이 잘 통하는 파트너.',
    丑: '현실적이고 성실한 인연. 안정적인 가정을 꾸리는 파트너.',
    寅: '활동적이고 독립심 강한 인연. 함께 성장하는 파트너.',
    卯: '감성적이고 예술적인 인연. 부드럽고 배려 있는 파트너.',
    辰: '카리스마 있고 포용력 있는 인연. 든든한 파트너.',
    巳: '지적이고 매력적인 인연. 열정적인 파트너.',
    午: '활발하고 사교적인 인연. 밝고 긍정적인 파트너.',
    未: '온화하고 배려심 깊은 인연. 가정적인 파트너.',
    申: '능력 있고 현실적인 인연. 추진력 있는 파트너.',
    酉: '섬세하고 완벽주의적인 인연. 미적 감각이 뛰어난 파트너.',
    戌: '충직하고 의리 있는 인연. 믿을 수 있는 파트너.',
    亥: '지혜롭고 깊이 있는 인연. 내면이 풍부한 파트너.',
  };

  const spouseDesc = SPOUSE_BY_BRANCH[dayBranch.branch] || '특별한 인연이 기다립니다.';

  return { spouseSipshin, spousePalace, todaySS, todayLoveGood, todayLoveBad, spouseDesc, dayBranch };
}

// ===== HTML 렌더링 =====
export function renderFortune(fortune, type = 'general') {
  const { mainSipshin, meaning, strengthText, yss, mss, dss, targetGanzhi } = fortune;
  const yg = targetGanzhi.year;
  const mg = targetGanzhi.month;

  const ssColor = {
    비견:'#42a5f5', 겁재:'#ef5350', 식신:'#4caf50', 상관:'#ff9800',
    편재:'#c9a84c', 정재:'#81c784', 편관:'#ef5350', 정관:'#7b2d8b',
    편인:'#9c27b0', 정인:'#26c6da',
  };

  const color = ssColor[mainSipshin] || '#aaa';

  return `
<div class="fortune-result">
  <div class="fortune-ganzhi-row">
    <div class="fortune-ganzhi-item">
      <span class="fortune-ganzhi-label">세운(歲運)</span>
      <span class="fortune-ganzhi-char" style="color:${ELEMENT_COLORS[yg.element]}">${yg.stem}</span>
      <span class="fortune-ganzhi-char" style="color:${ELEMENT_COLORS[yg.branchElement]}">${yg.branch}</span>
      <span class="fortune-sipshin" style="color:${color}">${yss}</span>
    </div>
    <div class="fortune-ganzhi-item">
      <span class="fortune-ganzhi-label">월운(月運)</span>
      <span class="fortune-ganzhi-char" style="color:${ELEMENT_COLORS[STEM_ELEMENT[mg.stemIndex]]}">${mg.stem}</span>
      <span class="fortune-ganzhi-char" style="color:${ELEMENT_COLORS[BRANCH_ELEMENT[mg.branchIndex]]}">${mg.branch}</span>
      <span class="fortune-sipshin" style="color:${ssColor[mss]||'#aaa'}">${mss}</span>
    </div>
    ${dss ? `<div class="fortune-ganzhi-item">
      <span class="fortune-ganzhi-label">일운(日運)</span>
      <span class="fortune-ganzhi-char" style="color:${ELEMENT_COLORS[targetGanzhi.day.element]}">${targetGanzhi.day.stem}</span>
      <span class="fortune-ganzhi-char" style="color:${ELEMENT_COLORS[targetGanzhi.day.branchElement]}">${targetGanzhi.day.branch}</span>
      <span class="fortune-sipshin" style="color:${ssColor[dss]||'#aaa'}">${dss}</span>
    </div>` : ''}
  </div>
  <div class="fortune-main-sipshin" style="border-color:${color}">
    <span class="fortune-sipshin-icon">${meaning.icon}</span>
    <span class="fortune-sipshin-name" style="color:${color}">${mainSipshin}</span>
    <p class="fortune-sipshin-desc">${meaning.general}</p>
  </div>
  <div class="fortune-detail-grid">
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">💼 직업·사회운</span>
      <p>${meaning.work}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">💕 연애·관계운</span>
      <p>${meaning.love}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">💰 재물운</span>
      <p>${meaning.money}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">🌿 건강운</span>
      <p>${meaning.health}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">👨‍👩‍👧 가족운</span>
      <p>${meaning.family}</p>
    </div>
    <div class="fortune-detail-item" style="border-color:rgba(248,113,113,0.3)">
      <span class="fortune-detail-label" style="color:#f87171">⚠ 주의사항</span>
      <p>${meaning.caution}</p>
    </div>
  </div>
  <p class="fortune-strength-note">${strengthText}</p>
</div>
  `.trim();
}

export function renderDaeunFortune(daeunFortune) {
  const { current, ss, meaning, remaining, age } = daeunFortune;
  const ssColor = {
    비견:'#42a5f5', 겁재:'#ef5350', 식신:'#4caf50', 상관:'#ff9800',
    편재:'#c9a84c', 정재:'#81c784', 편관:'#ef5350', 정관:'#7b2d8b',
    편인:'#9c27b0', 정인:'#26c6da',
  };
  const color = ssColor[ss] || '#aaa';

  return `
<div class="fortune-result">
  <div class="fortune-daeun-header">
    <div class="fortune-daeun-pillar">
      <span style="color:${ELEMENT_COLORS[current.stemElement]};font-size:2rem">${current.stem}</span>
      <span style="color:${ELEMENT_COLORS[current.branchElement]};font-size:2rem">${current.branch}</span>
    </div>
    <div class="fortune-daeun-info">
      <p>${current.age}세 ~ ${current.age + 9}세 대운</p>
      <p style="color:var(--text-muted);font-size:0.8rem">현재 나이 ${age}세 · ${remaining}년 남음</p>
      <span class="fortune-sipshin-name" style="color:${color}">${ss}</span>
    </div>
  </div>
  <div class="fortune-main-sipshin" style="border-color:${color}">
    <span class="fortune-sipshin-icon">${meaning.icon}</span>
    <p class="fortune-sipshin-desc">${meaning.general}</p>
  </div>
  <div class="fortune-detail-grid">
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">💼 직업·사회운</span>
      <p>${meaning.work}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">💕 연애·관계운</span>
      <p>${meaning.love}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">💰 재물운</span>
      <p>${meaning.money}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">🌿 건강운</span>
      <p>${meaning.health}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">👨‍👩‍👧 가족운</span>
      <p>${meaning.family}</p>
    </div>
    <div class="fortune-detail-item" style="border-color:rgba(248,113,113,0.3)">
      <span class="fortune-detail-label" style="color:#f87171">⚠ 주의사항</span>
      <p>${meaning.caution}</p>
    </div>
  </div>
</div>
  `.trim();
}

export function renderLoveFortune(loveFortune) {
  const { spouseSipshin, spousePalace, todaySS, todayLoveGood, todayLoveBad, spouseDesc, dayBranch } = loveFortune;
  const todayColor = todayLoveGood ? '#4caf50' : todayLoveBad ? '#ef5350' : '#aaa';
  const todayMsg = todayLoveGood ? '오늘은 연애운이 좋은 날입니다. 적극적으로 표현해보세요!'
    : todayLoveBad ? '오늘은 감정 기복에 주의. 중요한 고백이나 대화는 다른 날이 좋아요.'
    : '무난한 하루입니다. 자연스럽게 흘러가도록 하세요.';

  const stars = spousePalace?.stars.map(s => s.name).join(', ') || '무주성';

  return `
<div class="fortune-result">
  <div class="fortune-main-sipshin" style="border-color:#e879f9">
    <span class="fortune-sipshin-icon">💕</span>
    <p class="fortune-sipshin-desc">${spouseDesc}</p>
  </div>
  <div class="fortune-detail-grid">
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">오늘의 연애운</span>
      <p style="color:${todayColor}">${todayMsg}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">일지(日支) — ${dayBranch.branch}(${dayBranch.branchKo})</span>
      <p>배우자 인연의 오행: <strong style="color:var(--accent-gold)">${dayBranch.branchElement}</strong></p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">자미두수 부처궁 주성</span>
      <p style="color:#e879f9">${stars}</p>
    </div>
    <div class="fortune-detail-item">
      <span class="fortune-detail-label">연애 십신 경향</span>
      <p>${spouseSipshin} — ${SIPSHIN_MEANINGS[spouseSipshin]?.love || '깊은 인연이 기다립니다.'}</p>
    </div>
  </div>
</div>
  `.trim();
}
