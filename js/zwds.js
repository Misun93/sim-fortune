/**
 * zwds.js — 자미두수(紫微斗數) 계산 엔진
 * 순수 JS, 외부 의존성 없음
 * 참고: 전통 자미두수 명반 작성법
 */

// ===== 지지 순서 (寅=0, 卯=1, ..., 丑=11) =====
const BRANCHES = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑'];
const BRANCHES_KO = ['인', '묘', '진', '사', '오', '미', '신', '유', '술', '해', '자', '축'];

// ===== 12궁 이름 (명궁 기준 시계 반대방향 순서) =====
const PALACE_NAMES = [
  '명궁', '부모궁', '복덕궁', '전택궁', '관록궁', '노복궁',
  '천이궁', '질액궁', '재백궁', '자녀궁', '부처궁', '형제궁'
];

// ===== 천간 =====
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const STEMS_KO = ['갑', '을', '병', '정', '무', '기', '경', '신', '임', '계'];

// ===== 납음오행 (60갑자 쌍 기준) =====
// 0=금, 1=화, 2=목, 3=수, 4=토 (각 쌍은 2개씩)
const NAYIN_ELEMENTS = [
  '금', '금', '화', '화', '목', '목', '수', '수', '토', '토',  // 甲子~癸酉
  '토', '토', '화', '화', '금', '금', '목', '목', '수', '수',  // 甲戌~癸未 (실제는 계산 필요)
  '목', '목', '금', '금', '수', '수', '토', '토', '화', '화',  // 甲申~癸巳
  '화', '화', '목', '목', '토', '토', '금', '금', '수', '수',  // 甲辰~癸丑
  '수', '수', '토', '토', '화', '화', '목', '목', '금', '금',  // 甲子(다음)~癸酉 (순환)
  '토', '토', '화', '화', '금', '금', '목', '목', '수', '수',  // 추가 (순환)
];

// 오행 → 국수
const ELEMENT_TO_BUREAU = { '금': 4, '화': 6, '목': 3, '수': 2, '토': 5 };

// ===== 음력 변환 (간략 구현) =====
// 실제 음력 변환은 복잡하므로, 간략 테이블 기반 근사값 사용
// 주요 연도 음력 1월 1일 양력 날짜
const LUNAR_NEW_YEAR = {
  1990:[1,27],1991:[2,15],1992:[2,4],1993:[1,23],1994:[2,10],1995:[1,31],
  1996:[2,19],1997:[2,7],1998:[1,28],1999:[2,16],2000:[2,5],2001:[1,24],
  2002:[2,12],2003:[2,1],2004:[1,22],2005:[2,9],2006:[1,29],2007:[2,18],
  2008:[2,7],2009:[1,26],2010:[2,14],2011:[2,3],2012:[1,23],2013:[2,10],
  2014:[1,31],2015:[2,19],2016:[2,8],2017:[1,28],2018:[2,16],2019:[2,5],
  2020:[1,25],2021:[2,12],2022:[2,1],2023:[1,22],2024:[2,10],2025:[1,29],
  2026:[2,17],2027:[2,6],2028:[1,26],2029:[2,13],2030:[2,3]
};

// 음력 월 길이 근사값 (30/29일 교차)
function getLunarMonthLengths(year) {
  // 단순화: 홀수 월=30일, 짝수 월=29일 (실제와 약간 차이 있을 수 있음)
  return [30,29,30,29,30,29,30,29,30,29,30,29];
}

export function solarToLunar(year, month, day) {
  // 해당 연도 음력 설날 찾기
  let lunarYear = year;
  let nyEntry = LUNAR_NEW_YEAR[year];
  if (!nyEntry) {
    // 없는 년도면 근사값 (2월 4일경)
    nyEntry = [2, 4];
  }

  const nyDate = new Date(year, nyEntry[0] - 1, nyEntry[1]);
  const birthDate = new Date(year, month - 1, day);

  if (birthDate < nyDate) {
    // 설날 이전 → 전년도 음력
    lunarYear = year - 1;
    const prevNY = LUNAR_NEW_YEAR[year - 1] || [2, 5];
    const prevNyDate = new Date(year - 1, prevNY[0] - 1, prevNY[1]);
    const daysSinceNY = Math.floor((birthDate - prevNyDate) / 86400000);
    return getLunarDateFromDays(lunarYear, daysSinceNY);
  } else {
    const daysSinceNY = Math.floor((birthDate - nyDate) / 86400000);
    return getLunarDateFromDays(lunarYear, daysSinceNY);
  }
}

function getLunarDateFromDays(lunarYear, daysSinceNY) {
  const lengths = getLunarMonthLengths(lunarYear);
  let remaining = daysSinceNY;
  let lunarMonth = 1;
  for (let i = 0; i < 12; i++) {
    if (remaining < lengths[i]) {
      lunarMonth = i + 1;
      break;
    }
    remaining -= lengths[i];
    if (i === 11) lunarMonth = 12;
  }
  return {
    year: lunarYear,
    month: lunarMonth,
    day: remaining + 1,
  };
}

// ===== 出生時 → 時支 인덱스 (子=0, ..., 亥=11) =====
// ZWDS는 子시 기준이므로 지지 인덱스가 다름 (子=0, 丑=1, ..., 亥=11)
const ZI_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZI_BRANCHES_KO = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

function getShichenIndex(hour) {
  return Math.floor(((hour + 1) % 24) / 2);
}

// ===== 명궁 계산 =====
// 명궁궁지 = (음력월 + 출생시지 - 2 + 12) % 12 의 보궁
// 寅宮(index 0)에서 시작하여 음력월만큼 앞으로 가고, 시지만큼 되돌아옴
function getMingGongIndex(lunarMonth, hourIndex) {
  // 寅(0)을 기준으로 음력월 index: 1월=0(寅), 2월=1(卯), ...
  // 출생시지(子=0기준): 子=0, 丑=1, ..., 亥=11
  // 명궁 = (寅 기준 + 음력월 - 1 - 시지index) mod 12
  const idx = ((lunarMonth - 1) - hourIndex + 12) % 12;
  return idx;
}

// ===== 납음오행 30쌍 테이블 (전통 60갑자 납음, 쌍 인덱스 0~29) =====
// 甲子乙丑=海中金, 丙寅丁卯=爐中火, 戊辰己巳=大林木, 庚午辛未=路傍土, 壬申癸酉=劍鋒金,
// 甲戌乙亥=山頭火, 丙子丁丑=澗下水, 戊寅己卯=城頭土, 庚辰辛巳=白蠟金, 壬午癸未=楊柳木,
// 甲申乙酉=泉中水, 丙戌丁亥=屋上土, 戊子己丑=霹靂火, 庚寅辛卯=松柏木, 壬辰癸巳=長流水,
// 甲午乙未=砂中金, 丙申丁酉=山下火, 戊戌己亥=平地木, 庚子辛丑=壁上土, 壬寅癸卯=金箔金,
// 甲辰乙巳=覆燈火, 丙午丁未=天河水, 戊申己酉=大驛土, 庚戌辛亥=釵釧金, 壬子癸丑=桑柘木,
// 甲寅乙卯=大溪水, 丙辰丁巳=沙中土, 戊午己未=天上火, 庚申辛酉=石榴木, 壬戌癸亥=大海水
const NAYIN_30 = [
  '금','화','목','토','금','화','수','토','금','목',
  '수','토','화','목','수','금','화','목','토','금',
  '화','수','토','금','목','수','토','화','목','수',
];

// 60갑자 인덱스 계산 (천간 0~9, 지지 子=0 기준 0~11)
function calcGanzhi60(stemIdx, branchZiIdx) {
  // n ≡ stemIdx (mod 10), n ≡ branchZiIdx (mod 12) → 5의 역원(mod 6)=5
  const k = ((5 * ((branchZiIdx - stemIdx) / 2)) % 6 + 6) % 6;
  return stemIdx + 10 * k;
}

// ===== 오행국수 (납음오행으로 결정) =====
function getBureauNumber(lunarYear, mingGongIndex) {
  const yearStemIdx = ((lunarYear - 4) % 10 + 10) % 10;
  // 甲己년→寅=丙(2), 乙庚→戊(4), 丙辛→庚(6), 丁壬→壬(8), 戊癸→甲(0)
  const monthStemStarts = [2, 4, 6, 8, 0];
  const monthStemStart = monthStemStarts[yearStemIdx % 5];
  const mingGongStemIdx = (monthStemStart + mingGongIndex) % 10;
  // 명궁 지지 (子=0 기준): 寅=2
  const branchZi = (mingGongIndex + 2) % 12;

  // 올바른 60갑자 인덱스 → 납음쌍 번호
  const ganzhi60Idx = calcGanzhi60(mingGongStemIdx, branchZi);
  const nayinPairIdx = Math.floor(ganzhi60Idx / 2);
  const nayinElement = NAYIN_30[nayinPairIdx] || '토';

  const bureau = ELEMENT_TO_BUREAU[nayinElement] || 5;
  return { bureau, nayinElement };
}

// ===== 자미성 위치 계산 =====
function getZiweiIndex(bureau, lunarDay) {
  // 자미성 위치 계산 알고리즘 (전통 방법)
  // 寅宮(index 0)에서 시작
  let pos = lunarDay;

  // 국수로 나누어 위치 결정
  const q = Math.ceil(lunarDay / bureau);
  const r = q * bureau - lunarDay;

  // 홀수 나머지: pos = q-1 - r (역방향)
  // 짝수 나머지: pos = q-1 + r (순방향)
  let ziweiPos;
  if (r === 0) {
    ziweiPos = q - 1;
  } else if (r % 2 === 1) {
    ziweiPos = q - 1 - r;
  } else {
    ziweiPos = q - 1 + r;
  }

  return ((ziweiPos % 12) + 12) % 12;
}

// ===== 천부성 위치 (자미성 맞은편) =====
function getTianfuIndex(ziweiIndex) {
  // 寅宮 기준으로 자미성과 천부성은 서로 거울 위치
  // 자미:寅 → 천부:寅, 자미:卯 → 천부:丑, 자미:辰 → 천부:子
  // 공식: tianfu = (14 - ziwei) % 12 (寅=0 기준)
  return (14 - ziweiIndex) % 12;
}

// ===== 14주성 배치 =====
// 자미군(6성): 자미 기준 반시계방향 오프셋
const ZIWEI_CLUSTER = [
  { name: '자미', nameKo: '紫微', offset: 0, isMajor: true },
  { name: '천기', nameKo: '天機', offset: -1, isMajor: true },
  { name: '태양', nameKo: '太陽', offset: -2, isMajor: true },
  { name: '무곡', nameKo: '武曲', offset: -3, isMajor: true },
  { name: '천동', nameKo: '天同', offset: -4, isMajor: true },
  { name: '염정', nameKo: '廉貞', offset: -5, isMajor: true },
];

// 천부군(8성): 천부 기준 시계방향 오프셋
const TIANFU_CLUSTER = [
  { name: '천부', nameKo: '天府', offset: 0, isMajor: true },
  { name: '태음', nameKo: '太陰', offset: 1, isMajor: true },
  { name: '탐랑', nameKo: '貪狼', offset: 2, isMajor: true },
  { name: '거문', nameKo: '巨門', offset: 3, isMajor: true },
  { name: '천상', nameKo: '天相', offset: 4, isMajor: true },
  { name: '천량', nameKo: '天梁', offset: 5, isMajor: true },
  { name: '칠살', nameKo: '七殺', offset: 6, isMajor: true },
  { name: '파군', nameKo: '破軍', offset: 10, isMajor: true },
];

// ===== 보조성 배치 (간략화) =====
// 문창성, 문곡성, 좌보, 우필 등 일부만 구현
function getAuxiliaryStars(lunarYear, lunarMonth, lunarDay, hourIdx) {
  const yearBranch = ((lunarYear - 4) % 12 + 12) % 12; // 子=0 기준
  // 문창성: 년지 기준 (子=4궁/申방향)
  const wenchang = [(10-yearBranch%12+12)%12, // 근사값
  ];
  return [];
}

// ===== 궁 천간 배치 =====
// 인궁 천간은 년간에 따라 결정
const PALACE_STEM_START = [
  [2,3,4,5,6,7,8,9,0,1,2,3], // 甲/己년 → 寅=丙
  [4,5,6,7,8,9,0,1,2,3,4,5], // 乙/庚년 → 寅=戊
  [6,7,8,9,0,1,2,3,4,5,6,7], // 丙/辛년 → 寅=庚
  [8,9,0,1,2,3,4,5,6,7,8,9], // 丁/壬년 → 寅=壬
  [0,1,2,3,4,5,6,7,8,9,0,1], // 戊/癸년 → 寅=甲
];

function getPalaceStems(lunarYear) {
  const yearStemIdx = ((lunarYear - 4) % 10 + 10) % 10;
  const row = PALACE_STEM_START[yearStemIdx % 5];
  return row.map(i => ({ stem: STEMS[i], stemKo: STEMS_KO[i], stemIdx: i }));
}

// ===== 메인 계산 함수 =====
export function calculate(solarYear, solarMonth, solarDay, hour, gender) {
  // 1. 음력 변환
  const lunar = solarToLunar(solarYear, solarMonth, solarDay);

  // 2. 시지 인덱스 (子=0)
  const hourIdx = getShichenIndex(hour);

  // 3. 명궁 위치 (寅=0 기준)
  const mingGongIndex = getMingGongIndex(lunar.month, hourIdx);

  // 4. 오행국수
  const { bureau, nayinElement } = getBureauNumber(lunar.year, mingGongIndex);

  // 5. 자미성 위치
  const ziweiIndex = getZiweiIndex(bureau, lunar.day);

  // 6. 천부성 위치
  const tianfuIndex = getTianfuIndex(ziweiIndex);

  // 7. 14주성 배치
  const stars = {}; // palaceIndex -> star[]
  for (let i = 0; i < 12; i++) stars[i] = [];

  for (const s of ZIWEI_CLUSTER) {
    const pos = ((ziweiIndex + s.offset) % 12 + 12) % 12;
    stars[pos].push({ ...s });
  }

  for (const s of TIANFU_CLUSTER) {
    const pos = (tianfuIndex + s.offset) % 12;
    stars[pos].push({ ...s });
  }

  // 8. 궁 배치
  const palaceStems = getPalaceStems(lunar.year);
  const palaces = [];
  for (let i = 0; i < 12; i++) {
    const palaceNameIdx = ((i - mingGongIndex) % 12 + 12) % 12;
    palaces.push({
      index: i,
      branch: BRANCHES[i],
      branchKo: BRANCHES_KO[i],
      stem: palaceStems[i].stem,
      stemKo: palaceStems[i].stemKo,
      name: PALACE_NAMES[palaceNameIdx],
      stars: stars[i],
    });
  }

  return {
    lunar,
    mingGongIndex,
    tianfuIndex,
    ziweiIndex,
    bureau,
    nayinElement,
    palaces,
    hourIdx,
    gender,
  };
}

// ===== 12궁 해석 텍스트 =====
const PALACE_INTERPRETATIONS = {
  '명궁': '명궁은 개인의 성격, 기질, 외모, 그리고 인생 전반을 나타냅니다.',
  '부모궁': '부모궁은 부모와의 인연, 어린 시절 환경, 윗사람과의 관계를 나타냅니다.',
  '복덕궁': '복덕궁은 복과 덕, 정신적 풍요, 종교/철학적 성향을 나타냅니다.',
  '전택궁': '전택궁은 부동산 운, 가정 환경, 거주지의 안정성을 나타냅니다.',
  '관록궁': '관록궁은 직업, 사회적 성취, 명예, 직장 운을 나타냅니다.',
  '노복궁': '노복궁은 아랫사람, 직원, 사회적 네트워크와의 관계를 나타냅니다.',
  '천이궁': '천이궁은 이동, 여행, 해외 운, 외부 활동을 나타냅니다.',
  '질액궁': '질액궁은 건강, 질병, 신체적 활력을 나타냅니다.',
  '재백궁': '재백궁은 금전 운, 재물의 축적과 소비 패턴을 나타냅니다.',
  '자녀궁': '자녀궁은 자녀와의 인연, 창의적 활동, 부하 직원을 나타냅니다.',
  '부처궁': '부처궁은 배우자와의 인연, 결혼 생활, 이성 관계를 나타냅니다.',
  '형제궁': '형제궁은 형제자매, 동료, 친구와의 관계를 나타냅니다.',
};

const STAR_MEANINGS = {
  '자미': '자미성은 황제성으로, 명궁에 있으면 리더십과 카리스마가 강합니다.',
  '천기': '천기성은 지혜와 전략을 상징하며, 총명하고 다재다능합니다.',
  '태양': '태양성은 명예와 권위를 상징하며, 사회적 영향력이 강합니다.',
  '무곡': '무곡성은 재물과 행동력을 상징하며, 재운이 강하고 추진력이 있습니다.',
  '천동': '천동성은 복록성으로, 편안함과 안락을 추구하며 인복이 있습니다.',
  '염정': '염정성은 사교와 예술적 감각을 상징하며, 매력이 넘칩니다.',
  '천부': '천부성은 재물 창고성으로, 재물복과 안정성이 높습니다.',
  '태음': '태음성은 달의 성으로, 감수성이 풍부하고 재물 운이 있습니다.',
  '탐랑': '탐랑성은 욕망과 재능을 상징하며, 다방면에 재능이 있습니다.',
  '거문': '거문성은 구설과 언변을 상징하며, 언어 능력이 뛰어납니다.',
  '천상': '천상성은 관리와 보좌를 상징하며, 조직 능력이 뛰어납니다.',
  '천량': '천량성은 어른의 성으로, 의료/법률/복지 분야에 인연이 있습니다.',
  '칠살': '칠살성은 강인함과 결단력을 상징하며, 강한 의지력이 있습니다.',
  '파군': '파군성은 변화와 혁신을 상징하며, 기존 틀을 깨는 힘이 있습니다.',
};

export function getPalaceDetail(palace) {
  const palaceMeaning = PALACE_INTERPRETATIONS[palace.name] || '';
  const starMeanings = palace.stars.map(s => STAR_MEANINGS[s.name] || '').filter(Boolean);

  return {
    title: `${palace.name} (${palace.branch} · ${palace.stem})`,
    text: [palaceMeaning, ...starMeanings].join(' '),
  };
}

export function getInterpretationText(result) {
  const mingPalace = result.palaces[result.mingGongIndex];
  const careerPalace = result.palaces.find(p => p.name === '관록궁');
  const wealthPalace = result.palaces.find(p => p.name === '재백궁');

  const mingStars = mingPalace.stars.map(s => s.name).join(', ') || '무주성(無主星)';
  const careerStars = careerPalace?.stars.map(s => s.name).join(', ') || '무주성';
  const wealthStars = wealthPalace?.stars.map(s => s.name).join(', ') || '무주성';

  return `
<h5>▸ 명궁 (${mingPalace.branch}궁)</h5>
<p>주성: ${mingStars}</p>
<p>${PALACE_INTERPRETATIONS['명궁']}</p>
<h5>▸ 관록궁 (직업·사회운)</h5>
<p>주성: ${careerStars} — ${PALACE_INTERPRETATIONS['관록궁']}</p>
<h5>▸ 재백궁 (재물운)</h5>
<p>주성: ${wealthStars} — ${PALACE_INTERPRETATIONS['재백궁']}</p>
<p style="color:var(--text-muted);font-size:0.75rem;">궁을 클릭하면 상세 해석을 볼 수 있습니다.</p>
  `.trim();
}
