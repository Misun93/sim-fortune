/**
 * bazi.js — 사주 명리학 계산 엔진
 * 순수 JS, 외부 의존성 없음 (만세력 룩업 테이블 내장)
 */

// ===== 천간 (Heavenly Stems) =====
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const STEMS_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];
export const STEM_ELEMENT = ['목', '목', '화', '화', '토', '토', '금', '금', '수', '수'];
export const STEM_YY = ['양', '음', '양', '음', '양', '음', '양', '음', '양', '음'];

// ===== 지지 (Earthly Branches) =====
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const BRANCHES_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];
export const BRANCH_ZODIAC = ['쥐', '소', '호랑이', '토끼', '용', '뱀', '말', '양', '원숭이', '닭', '개', '돼지'];
export const BRANCH_ELEMENT = ['수', '토', '목', '목', '토', '화', '화', '토', '금', '금', '토', '수'];
export const BRANCH_YY = ['양', '음', '양', '음', '양', '음', '양', '음', '양', '음', '양', '음'];

// 오행 색상
export const ELEMENT_COLORS = {
  목: '#4caf50', 화: '#ef5350', 토: '#ff9800', 금: '#bdbdbd', 수: '#42a5f5'
};

// ===== 절기 날짜 데이터 (1900~2100) =====
// 각 연도별 24절기 중 12개 月절기(입춘~대한 홀수번째)
// 형식: { year: [2월입춘일, 3월경칩일, 4월청명일, 5월입하일, 6월망종일, 7월소서일,
//                8월입추일, 9월백로일, 10월한로일, 11월입동일, 12월대설일, 1월소한일(다음해)] }
// 간소화: 입춘(year), 경칩(year), 청명(year), 입하(year), 망종(year), 소서(year),
//         입추(year), 백로(year), 한로(year), 입동(year), 대설(year), 소한(year+1)
// 여기서는 절기를 계산 공식으로 근사치 계산 (실제는 천문학 계산 필요)

// 절기 근사 계산 (중국력 기준)
function getSolarTermDate(year, termIndex) {
  // termIndex: 0=소한(1월), 1=대한(1월), 2=입춘(2월), ..., 23=동지(12월)
  // 간략 공식 사용 (실제 차이 ±1일 이내)
  const month = Math.floor(termIndex / 2) + 1;
  const isSecond = termIndex % 2 === 1;

  // 각 절기의 대략적 날짜 (양력)
  const approxDays = [6, 20, 4, 19, 6, 21, 5, 20, 5, 21, 6, 21,
                      7, 23, 7, 23, 8, 23, 8, 23, 7, 22, 7, 22];
  const day = approxDays[termIndex];
  return new Date(year, month - 1, day);
}

// 입춘 날짜 반환 (년주 변경 기준)
function getIpchun(year) {
  // 입춘은 양력 2월 3~5일
  // 정확한 계산 테이블 (2000~2050)
  const ipchunTable = {
    1900:4,1901:5,1902:5,1903:5,1904:5,1905:4,1906:4,1907:5,1908:5,1909:4,
    1910:5,1911:5,1912:5,1913:4,1914:4,1915:5,1916:5,1917:4,1918:5,1919:5,
    1920:5,1921:4,1922:4,1923:5,1924:5,1925:4,1926:4,1927:5,1928:5,1929:4,
    1930:4,1931:5,1932:5,1933:4,1934:4,1935:5,1936:5,1937:4,1938:4,1939:5,
    1940:5,1941:4,1942:4,1943:5,1944:5,1945:4,1946:4,1947:5,1948:5,1949:4,
    1950:4,1951:5,1952:5,1953:4,1954:4,1955:5,1956:5,1957:4,1958:4,1959:5,
    1960:5,1961:4,1962:4,1963:5,1964:5,1965:4,1966:4,1967:5,1968:5,1969:4,
    1970:4,1971:5,1972:5,1973:4,1974:4,1975:5,1976:5,1977:4,1978:4,1979:5,
    1980:5,1981:4,1982:4,1983:5,1984:5,1985:4,1986:4,1987:5,1988:5,1989:4,
    1990:4,1991:5,1992:5,1993:4,1994:4,1995:5,1996:5,1997:4,1998:4,1999:4,
    2000:4,2001:4,2002:4,2003:4,2004:4,2005:4,2006:4,2007:4,2008:4,2009:4,
    2010:4,2011:4,2012:4,2013:4,2014:4,2015:4,2016:4,2017:3,2018:4,2019:4,
    2020:4,2021:3,2022:4,2023:4,2024:4,2025:3,2026:4,2027:4,2028:4,2029:3,
    2030:4,2031:4,2032:4,2033:3,2034:4,2035:4,2036:4,2037:3,2038:4,2039:4,
    2040:4,2041:3,2042:4,2043:4,2044:4,2045:3,2046:4,2047:4,2048:4,2049:3,
    2050:4
  };
  return ipchunTable[year] || 4;
}

// 절기 날짜 테이블 (월주 계산용, 2000~2050 핵심 년도)
// [소한,대한,입춘,우수,경칩,춘분,청명,곡우,입하,소만,망종,하지,
//  소서,대서,입추,처서,백로,추분,한로,상강,입동,소설,대설,동지]
function getSolarTerms(year) {
  // 간략 근사값 (±1일)
  const baseTerms = [6,20,4,19,6,21,5,20,6,21,6,21,7,23,7,23,8,23,8,23,7,22,7,22];
  const result = [];
  for (let i = 0; i < 24; i++) {
    const month = i < 2 ? 1 : Math.floor(i / 2) + 1;
    const actualYear = i < 2 ? year : year;
    result.push(new Date(actualYear, month - 1, baseTerms[i]));
  }
  return result;
}

// 월절기(月節) 날짜 계산 (12개 월 절기만)
function getMonthTermDate(year, monthIndex) {
  // monthIndex: 0=인월(입춘,2월), 1=묘월(경칩,3월), ..., 11=축월(소한,1월)
  const monthTermDays = {
    // year -> [2월입춘, 3월경칩, 4월청명, 5월입하, 6월망종, 7월소서, 8월입추, 9월백로, 10월한로, 11월입동, 12월대설, 1월소한]
  };
  // 간략 근사값
  const approx = [4, 6, 5, 6, 6, 7, 7, 8, 8, 7, 7, 6];
  const months  = [2, 3, 4, 5, 6, 7, 8, 9,10,11,12, 1];
  const yr = monthIndex === 11 ? year + 1 : year;
  return new Date(yr, months[monthIndex] - 1, approx[monthIndex]);
}

// ===== 년주 계산 =====
function getYearPillar(year, month, day) {
  // 입춘(2월 4일경) 전이면 전년도 기준
  const ipchunDay = getIpchun(year);
  const birthDate = new Date(year, month - 1, day);
  const ipchun = new Date(year, 1, ipchunDay); // 2월
  const effectiveYear = birthDate < ipchun ? year - 1 : year;

  // 甲子년 = 1984년 (갑자년 기준)
  // (effectiveYear - 4) % 60
  const idx = ((effectiveYear - 4) % 60 + 60) % 60;
  return {
    stemIndex: idx % 10,
    branchIndex: idx % 12,
    stem: STEMS[idx % 10],
    stemKo: STEMS_KO[idx % 10],
    branch: BRANCHES[idx % 12],
    branchKo: BRANCHES_KO[idx % 12],
    element: STEM_ELEMENT[idx % 10],
    branchElement: BRANCH_ELEMENT[idx % 12],
    yinYang: STEM_YY[idx % 10],
    idx60: idx,
  };
}

// ===== 월주 계산 =====
// 月節 기준: 입춘(寅월), 경칩(卯월), 청명(辰월), 입하(巳월), 망종(午월), 소서(未월),
//            입추(申월), 백로(酉월), 한로(戌월), 입동(亥월), 대설(子월), 소한(丑월)
const MONTH_TERM_APPROX = [
  {m:2,d:4},{m:3,d:6},{m:4,d:5},{m:5,d:6},{m:6,d:6},{m:7,d:7},
  {m:8,d:7},{m:9,d:8},{m:10,d:8},{m:11,d:7},{m:12,d:7},{m:1,d:6}
];

function getMonthIndex(year, month, day) {
  // 출생일이 어느 월주에 해당하는지 반환 (0=寅월, 1=卯월, ..., 11=丑월)
  for (let i = 11; i >= 0; i--) {
    const t = MONTH_TERM_APPROX[i];
    const termYear = i === 11 ? year + 1 : year;
    const termDate = new Date(termYear, t.m - 1, t.d);
    const birthDate = new Date(year, month - 1, day);
    if (birthDate >= termDate) {
      return i;
    }
  }
  // 1월 소한 이전 → 전년도 11월(子월)
  return 10;
}

// 월간 계산: 년간에 따른 월간 오프셋
// 甲己년 → 寅월 시작이 丙寅, 乙庚년 → 戊寅, 丙辛년 → 庚寅, 丁壬년 → 壬寅, 戊癸년 → 甲寅
const MONTH_STEM_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // 년간 인덱스 → 寅월 천간 인덱스

function getMonthPillar(yearStemIdx, monthIdx) {
  // monthIdx: 0=寅, 1=卯, ..., 11=丑
  const startStem = MONTH_STEM_START[yearStemIdx % 5 * 2];
  const stemIdx = (startStem + monthIdx) % 10;
  const branchIdx = (monthIdx + 2) % 12; // 寅=2, 卯=3, ...
  return {
    stemIndex: stemIdx,
    branchIndex: branchIdx,
    stem: STEMS[stemIdx],
    stemKo: STEMS_KO[stemIdx],
    branch: BRANCHES[branchIdx],
    branchKo: BRANCHES_KO[branchIdx],
    element: STEM_ELEMENT[stemIdx],
    branchElement: BRANCH_ELEMENT[branchIdx],
    yinYang: STEM_YY[stemIdx],
    idx60: stemIdx * 2 + Math.floor(stemIdx / 5) + branchIdx, // approximate
  };
}

// ===== 일주 계산 =====
// 甲子일 기준: 1900년 1월 1일 = 甲戌일 (idx=10)
// 율리우스 일수 활용
function getJulianDay(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y +
         Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getDayPillar(year, month, day) {
  // 甲子일 기준 율리우스일: 1900년 1월 31일 = 甲子 (확인값)
  const JIAZI_JD = getJulianDay(1900, 1, 31);
  const birthJD = getJulianDay(year, month, day);
  const diff = birthJD - JIAZI_JD;
  const idx = ((diff % 60) + 60) % 60;
  return {
    stemIndex: idx % 10,
    branchIndex: idx % 12,
    stem: STEMS[idx % 10],
    stemKo: STEMS_KO[idx % 10],
    branch: BRANCHES[idx % 12],
    branchKo: BRANCHES_KO[idx % 12],
    element: STEM_ELEMENT[idx % 10],
    branchElement: BRANCH_ELEMENT[idx % 12],
    yinYang: STEM_YY[idx % 10],
    idx60: idx,
  };
}

// ===== 시주 계산 =====
// 子시=23~01, 丑시=01~03, ..., 亥시=21~23
function getHourBranchIndex(hour) {
  return Math.floor(((hour + 1) % 24) / 2);
}

// 일간에 따른 시간 천간 시작 인덱스
const HOUR_STEM_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]; // 일간→자시 천간

function getHourPillar(dayStemIdx, hour) {
  const branchIdx = getHourBranchIndex(hour);
  const startStem = HOUR_STEM_START[dayStemIdx % 5 * 2];
  const stemIdx = (startStem + branchIdx) % 10;
  return {
    stemIndex: stemIdx,
    branchIndex: branchIdx,
    stem: STEMS[stemIdx],
    stemKo: STEMS_KO[stemIdx],
    branch: BRANCHES[branchIdx],
    branchKo: BRANCHES_KO[branchIdx],
    element: STEM_ELEMENT[stemIdx],
    branchElement: BRANCH_ELEMENT[branchIdx],
    yinYang: STEM_YY[stemIdx],
    idx60: (stemIdx + branchIdx * 10) % 60,
  };
}

// ===== 오행 균형 계산 =====
export function getWuxingBalance(pillars) {
  const count = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  for (const p of pillars) {
    count[p.element] = (count[p.element] || 0) + 1;
    count[p.branchElement] = (count[p.branchElement] || 0) + 1;
  }
  const total = Object.values(count).reduce((a, b) => a + b, 0);
  const pct = {};
  for (const k in count) pct[k] = Math.round(count[k] / total * 100);
  return { count, pct, total };
}

// ===== 대운 계산 =====
// 월절기까지의 일수 ÷ 3 = 대운 시작 나이
function calcDaeunStartAge(year, month, day, gender, yearStemIdx, monthIdx) {
  const isYearYang = yearStemIdx % 2 === 0;
  const isMale = gender === 'male';
  // 순행(forward): 양남 또는 음녀
  const isForward = (isYearYang && isMale) || (!isYearYang && !isMale);

  const birthDate = new Date(year, month - 1, day);
  let days;

  if (isForward) {
    // 다음 월절기 날짜
    const nextTermIdx = (monthIdx + 1) % 12;
    const nextYear = nextTermIdx === 0 ? year : year;
    const t = MONTH_TERM_APPROX[nextTermIdx];
    const nextTermDate = new Date(nextTermIdx === 0 ? year + 1 : year, t.m - 1, t.d);
    days = Math.max(0, Math.round((nextTermDate - birthDate) / 86400000));
  } else {
    // 이전 월절기 날짜
    const prevTermIdx = monthIdx === 0 ? 11 : monthIdx - 1;
    const t = MONTH_TERM_APPROX[prevTermIdx];
    const prevTermYear = prevTermIdx === 11 ? year - 1 : year;
    const prevTermDate = new Date(prevTermYear, t.m - 1, t.d);
    days = Math.max(0, Math.round((birthDate - prevTermDate) / 86400000));
  }

  return { startAge: Math.round(days / 3), isForward };
}

function getDaeun(yearStemIdx, monthStemIdx, monthBranchIdx, startAge, isForward, count = 8) {
  const daeun = [];
  for (let i = 0; i < count; i++) {
    const offset = isForward ? i + 1 : -(i + 1);
    const stemIdx = ((monthStemIdx + offset) % 10 + 10) % 10;
    const branchIdx = ((monthBranchIdx + offset) % 12 + 12) % 12;
    daeun.push({
      age: startAge + i * 10,
      stem: STEMS[stemIdx],
      stemKo: STEMS_KO[stemIdx],
      branch: BRANCHES[branchIdx],
      branchKo: BRANCHES_KO[branchIdx],
      stemElement: STEM_ELEMENT[stemIdx],
      branchElement: BRANCH_ELEMENT[branchIdx],
    });
  }
  return daeun;
}

// ===== 한자 2글자 → 주柱 객체 파싱 =====
function parsePillar(hanja) {
  const stem = hanja[0];
  const branch = hanja[1];
  const stemIndex = STEMS.indexOf(stem);
  const branchIndex = BRANCHES.indexOf(branch);
  return {
    stemIndex,
    branchIndex,
    stem,
    stemKo: STEMS_KO[stemIndex],
    branch,
    branchKo: BRANCHES_KO[branchIndex],
    element: STEM_ELEMENT[stemIndex],
    branchElement: BRANCH_ELEMENT[branchIndex],
    yinYang: STEM_YY[stemIndex],
    idx60: stemIndex + branchIndex * 10, // 참고용
  };
}

// ===== 메인 계산 함수 (manseryeok 라이브러리 사용) =====
export function calculate(year, month, day, hour, minute, gender, longitude = 126.978) {
  const lib = window.manseryeok;
  if (!lib || !lib.calculateSaju) {
    throw new Error('manseryeok 라이브러리가 로드되지 않았습니다. 페이지를 새로고침 해주세요.');
  }

  const raw = lib.calculateSaju(year, month, day, hour, minute, { longitude });

  const yearPillar  = parsePillar(raw.yearPillarHanja  || raw.yearPillar);
  const monthPillar = parsePillar(raw.monthPillarHanja || raw.monthPillar);
  const dayPillar   = parsePillar(raw.dayPillarHanja   || raw.dayPillar);
  const hourPillar  = parsePillar(raw.hourPillarHanja  || raw.hourPillar);

  const pillars = [yearPillar, monthPillar, dayPillar, hourPillar];
  const wuxing = getWuxingBalance(pillars);

  // 대운: manseryeok이 제공하지 않으므로 기존 절기 로직 유지
  const monthIdx = getMonthIndex(year, month, day);
  const { startAge, isForward } = calcDaeunStartAge(
    year, month, day, gender, yearPillar.stemIndex, monthIdx
  );
  const daeun = getDaeun(
    yearPillar.stemIndex,
    monthPillar.stemIndex,
    monthPillar.branchIndex,
    startAge,
    isForward
  );

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    pillars,
    wuxing,
    daeun,
    startAge,
    isForward,
    dayMaster: {
      stem: dayPillar.stem,
      stemKo: dayPillar.stemKo,
      element: dayPillar.element,
      yinYang: dayPillar.yinYang,
    },
  };
}

// ===== 한국어 해석 텍스트 =====
const DAY_MASTER_MEANINGS = {
  '甲': { title: '갑목(甲木) 일간', text: '큰 나무처럼 곧고 강직한 성격입니다. 리더십이 강하고 독립심이 뛰어나며, 새로운 것에 도전하는 개척 정신이 있습니다. 자존심이 강하고 고집이 있으나 정의감도 강합니다.' },
  '乙': { title: '을목(乙木) 일간', text: '덩굴처럼 유연하고 환경 적응력이 뛰어납니다. 감수성이 풍부하고 예술적 감각이 있으며, 대인관계에서 부드럽고 친화력이 강합니다.' },
  '丙': { title: '병화(丙火) 일간', text: '태양처럼 밝고 활발한 성격입니다. 낙천적이고 사교적이며 주변을 환하게 만드는 매력이 있습니다. 열정적이고 추진력이 강하지만 지구력이 약할 수 있습니다.' },
  '丁': { title: '정화(丁火) 일간', text: '촛불처럼 집중력이 강하고 내면이 밝습니다. 섬세하고 직관력이 뛰어나며, 예술·학문 분야에 재능이 있습니다. 감정 기복이 있을 수 있습니다.' },
  '戊': { title: '무토(戊土) 일간', text: '산처럼 듬직하고 중후한 성격입니다. 신뢰감이 높고 인내력이 강하며, 책임감이 뛰어납니다. 보수적이고 안정을 추구하는 경향이 있습니다.' },
  '己': { title: '기토(己土) 일간', text: '평원처럼 포용력이 넓고 인정이 많습니다. 현실적이고 실용적이며, 사람들과 잘 어울립니다. 세심하고 꼼꼼한 성격으로 관리 능력이 뛰어납니다.' },
  '庚': { title: '경금(庚金) 일간', text: '강철처럼 단단하고 결단력이 강합니다. 의지가 강하고 원칙주의적이며, 불의를 참지 못합니다. 용감하고 직선적인 성격으로 리더십이 있습니다.' },
  '辛': { title: '신금(辛金) 일간', text: '보석처럼 섬세하고 완벽을 추구합니다. 미적 감각이 뛰어나고 분석력이 강하며, 세밀한 작업에 강합니다. 자기 기준이 높아 완벽주의적인 면이 있습니다.' },
  '壬': { title: '임수(壬水) 일간', text: '대양처럼 포용력이 크고 지혜롭습니다. 지적 호기심이 강하고 적응력이 뛰어나며, 창의적 사고를 합니다. 감정을 잘 드러내지 않고 속 깊은 성격입니다.' },
  '癸': { title: '계수(癸水) 일간', text: '빗물처럼 섬세하고 민감한 성격입니다. 직관력과 감수성이 뛰어나고, 비밀을 잘 지킵니다. 내성적이지만 깊은 사고력과 통찰력을 가지고 있습니다.' },
};

const WUXING_BALANCE_COMMENTS = {
  balanced: '오행이 비교적 균형을 이루고 있어 다방면에서 능력을 발휘할 수 있습니다.',
  wood_high: '목(木)이 강하여 창의력과 성장 에너지가 풍부합니다. 새로운 시작에 강하지만 유연성에 주의하세요.',
  fire_high: '화(火)가 강하여 열정과 표현력이 넘칩니다. 사교적이고 활발하지만 과도한 충동에 주의하세요.',
  earth_high: '토(土)가 강하여 안정감과 신뢰감이 높습니다. 현실적이고 지속력이 있지만 변화를 두려워할 수 있습니다.',
  metal_high: '금(金)이 강하여 결단력과 집중력이 뛰어납니다. 원칙을 지키지만 때로는 유연함도 필요합니다.',
  water_high: '수(水)가 강하여 지혜와 포용력이 넘칩니다. 적응력이 뛰어나지만 우유부단해질 수 있습니다.',
};

export function getInterpretationText(result) {
  const dm = result.dayMaster;
  const dmMeaning = DAY_MASTER_MEANINGS[dm.stem] || { title: '일간 해석', text: '' };

  // 오행 균형 판단
  const { count, pct } = result.wuxing;
  let wuxingComment = WUXING_BALANCE_COMMENTS.balanced;
  const maxElement = Object.entries(count).sort((a,b) => b[1]-a[1])[0];
  if (maxElement && maxElement[1] >= 4) {
    const key = `${maxElement[0]}_high`;
    if (WUXING_BALANCE_COMMENTS[key]) wuxingComment = WUXING_BALANCE_COMMENTS[key];
  }

  const currentAge = new Date().getFullYear() - (result.yearPillar
    ? parseInt(Object.keys({}).toString()) : 2000);

  return `
<h5>▸ ${dmMeaning.title}</h5>
<p>${dmMeaning.text}</p>
<h5>▸ 오행 분포 분석</h5>
<p>${wuxingComment}</p>
<h5>▸ 대운 흐름</h5>
<p>대운은 ${result.startAge}세부터 시작하며, 10년 단위로 운의 흐름이 바뀝니다. ${result.isForward ? '순행(順行) 대운으로' : '역행(逆行) 대운으로'} 흘러갑니다.</p>
  `.trim();
}
