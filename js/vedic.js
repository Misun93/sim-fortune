/**
 * vedic.js — 베딕 점성술 (VedAstro API 연동)
 * API: https://api.vedastro.org (무료, FreeAPIUser 키)
 */

const VEDASTRO_BASE = 'https://api.vedastro.org/api/Calculate';
const FREE_API_KEY = 'FreeAPIUser';

// 황도궁 영어→인덱스 매핑
const SIGN_INDEX = {
  Aries: 0, Taurus: 1, Gemini: 2, Cancer: 3, Leo: 4, Virgo: 5,
  Libra: 6, Scorpio: 7, Sagittarius: 8, Capricorn: 9, Aquarius: 10, Pisces: 11,
};

// 낙샤트라 영어→인덱스
const NAKSHATRA_INDEX = {
  Ashwini:0,Bharani:1,Krittika:2,Rohini:3,Mrigashira:4,Ardra:5,
  Punarvasu:6,Pushya:7,Ashlesha:8,Magha:9,PurvaPhalguni:10,UttaraPhalguni:11,
  Hasta:12,Chitra:13,Swati:14,Vishakha:15,Anuradha:16,Jyeshtha:17,
  Mula:18,PurvaAshadha:19,UttaraAshadha:20,Shravana:21,Dhanishta:22,Shatabhisha:23,
  PurvaBhadrapada:24,UttaraBhadrapada:25,Revati:26,
};

// 지오코딩 (Nominatim)
export async function geocodeCity(cityName) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityName)}&format=json&limit=1`;
  try {
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'ko,en',
        'User-Agent': 'SamhapAstrology/1.0',
      },
    });
    const data = await res.json();
    if (data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        name: data[0].display_name,
      };
    }
  } catch (e) {
    console.warn('지오코딩 실패:', e);
  }
  return null;
}

// 시간대 오프셋 문자열 (+09:00 등)
function getTimezoneOffset(lat, lng) {
  // 간략화: 경도 기반 추정
  const offsetHours = Math.round(lng / 15);
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  return `${sign}${String(abs).padStart(2,'0')}:00`;
}

// VedAstro API 시간 형식: HH:mm/DD-MM-YYYY/+HH:MM
function formatVedAstroTime(year, month, day, hour, minute, tzOffset) {
  const hh = String(hour).padStart(2,'0');
  const mm = String(minute).padStart(2,'0');
  const dd = String(day).padStart(2,'0');
  const mo = String(month).padStart(2,'0');
  return `${hh}:${mm}/${dd}-${mo}-${year}/${tzOffset}`;
}

// VedAstro API 호출 (재시도 포함)
async function fetchVedAstro(path, retries = 3) {
  const url = `${VEDASTRO_BASE}/${path}`;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'x-api-key': FREE_API_KEY },
      });
      if (res.status === 429) {
        await delay(15000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
      const json = await res.json();
      return json;
    } catch (e) {
      if (i === retries - 1) throw e;
      await delay(2000);
    }
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// API 응답에서 행성 라시(sign) 파싱
function parseSignName(data) {
  // VedAstro 응답 형식 변동 있음 - 여러 경로 시도
  const payload = data?.Payload ?? data?.payload ?? data;
  if (typeof payload === 'string') {
    const match = payload.match(/([A-Z][a-z]+)/);
    return match ? match[1] : null;
  }
  if (payload?.SignName) return payload.SignName;
  if (payload?.PlanetSignName) return payload.PlanetSignName;
  if (payload?.Value) return payload.Value;
  return null;
}

// 낙샤트라 파싱
function parseNakshatraName(data) {
  const payload = data?.Payload ?? data?.payload ?? data;
  if (typeof payload === 'string') return payload.trim();
  if (payload?.NakshatraName) return payload.NakshatraName;
  if (payload?.Value) return payload.Value;
  return null;
}

// 행성 목록
const PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];

// 메인 베딕 계산 함수
export async function calculate(year, month, day, hour, minute, lat, lng, onProgress) {
  const tzOffset = getTimezoneOffset(lat, lng);
  const timeStr = formatVedAstroTime(year, month, day, hour, minute, tzOffset);
  const locStr = `${lat.toFixed(4)},${lng.toFixed(4)}`;

  const total = PLANETS.length + 2; // planets + lagna + nakshatra
  let done = 0;

  const result = {
    planets: {},
    lagnaSign: null,
    lagnaSignIndex: null,
    moonNakshatra: null,
    moonNakshatraIndex: null,
    lat, lng, tzOffset,
  };

  onProgress?.(0, total, '라그나 계산 중...');

  // 1. 라그나 (상승궁)
  try {
    const lagnaData = await fetchVedAstro(
      `LagnaSignName/Location/${locStr}/Time/${timeStr}/Ayanamsa/LAHIRI`
    );
    const signName = parseSignName(lagnaData);
    if (signName) {
      result.lagnaSign = signName;
      result.lagnaSignIndex = SIGN_INDEX[signName] ?? 0;
    }
  } catch (e) {
    console.warn('라그나 계산 실패:', e);
  }
  done++;
  onProgress?.(done, total, '행성 위치 계산 중...');
  await delay(300);

  // 2. 행성 라시
  for (const planet of PLANETS) {
    try {
      const data = await fetchVedAstro(
        `PlanetRasiD1Sign/PlanetName/${planet}/Location/${locStr}/Time/${timeStr}/Ayanamsa/LAHIRI`
      );
      const signName = parseSignName(data);
      if (signName) {
        result.planets[planet] = {
          sign: signName,
          signIndex: SIGN_INDEX[signName] ?? 0,
          isRetrograde: false,
        };
      }
    } catch (e) {
      console.warn(`${planet} 계산 실패:`, e);
      result.planets[planet] = { sign: 'Unknown', signIndex: 0, isRetrograde: false };
    }
    done++;
    onProgress?.(done, total, `${planet} 계산 완료...`);
    await delay(300); // rate limit 준수
  }

  // 3. 달의 낙샤트라
  try {
    const nakshatraData = await fetchVedAstro(
      `PlanetNakshatra/PlanetName/Moon/Location/${locStr}/Time/${timeStr}/Ayanamsa/LAHIRI`
    );
    const nakshatraName = parseNakshatraName(nakshatraData);
    if (nakshatraName) {
      result.moonNakshatra = nakshatraName;
      result.moonNakshatraIndex = NAKSHATRA_INDEX[nakshatraName] ?? null;
    }
  } catch (e) {
    console.warn('낙샤트라 계산 실패:', e);
  }
  done++;
  onProgress?.(done, total, '완료');

  return result;
}

// ===== 오프라인 폴백: 간략 계산 =====
// VedAstro API 불가 시 사용 (위성력 기반 근사값)
export function calculateFallback(year, month, day, hour, minute, lat, lng) {
  // 율리우스 일수로 태양 황경 근사 계산 (열대 황도 기준)
  function julianDay(y, m, d, h) {
    const A = Math.floor((14 - m) / 12);
    const Y = y + 4800 - A;
    const M = m + 12 * A - 3;
    return d + Math.floor((153 * M + 2) / 5) + 365 * Y +
           Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045 +
           (h - 12) / 24;
  }

  // 라히리 아야남샤 근사값 (1900~2100)
  function getLahiriAyanamsha(jd) {
    const J2000 = 2451545.0;
    const T = (jd - J2000) / 36525;
    return 23.85 + T * (1.396 / 100); // 근사값 (세차운동)
  }

  // 태양 황경 (열대) 근사
  function getSunLongitudeTropical(jd) {
    const J2000 = 2451545.0;
    const n = jd - J2000;
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = ((357.528 + 0.9856003 * n) % 360) * Math.PI / 180;
    return (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g) + 360) % 360;
  }

  const jd = julianDay(year, month, day, hour + minute / 60 - lng / 15);
  const ayanamsha = getLahiriAyanamsha(jd);
  const sunTropical = getSunLongitudeTropical(jd);
  const sunSidereal = (sunTropical - ayanamsha + 360) % 360;
  const sunSignIdx = Math.floor(sunSidereal / 30);

  // 달 황경 근사 (매우 단순화)
  const moonMeanLong = (218.316 + 13.176396 * (jd - 2451545)) % 360;
  const moonSidereal = (moonMeanLong - ayanamsha + 360) % 360;
  const moonSignIdx = Math.floor(moonSidereal / 30);
  const moonNakshatraIdx = Math.floor(moonSidereal / (360 / 27));

  // 라그나 (상승점) 근사: 태양 위치 + 시간 보정
  const lagnaLong = (sunSidereal + (hour + minute/60 - 6) * 15 + lat * 0.5 + 360) % 360;
  const lagnaSignIdx = Math.floor(lagnaLong / 30);

  const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                       'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];

  // 다른 행성은 태양 기준 근사 배치 (매우 부정확, 실제 천문 계산 불가)
  const planets = {
    Sun: { sign: SIGN_NAMES[sunSignIdx], signIndex: sunSignIdx, isRetrograde: false },
    Moon: { sign: SIGN_NAMES[moonSignIdx], signIndex: moonSignIdx, isRetrograde: false,
            nakshatraIndex: moonNakshatraIdx },
  };

  // 나머지 행성은 미확인 처리
  for (const p of ['Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']) {
    planets[p] = { sign: '계산중', signIndex: 0, isRetrograde: false };
  }

  const NAKSHATRA_NAMES = [
    'Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra',
    'Punarvasu','Pushya','Ashlesha','Magha','PurvaPhalguni','UttaraPhalguni',
    'Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha',
    'Mula','PurvaAshadha','UttaraAshadha','Shravana','Dhanishta','Shatabhisha',
    'PurvaBhadrapada','UttaraBhadrapada','Revati'
  ];

  return {
    planets,
    lagnaSign: SIGN_NAMES[lagnaSignIdx],
    lagnaSignIndex: lagnaSignIdx,
    moonNakshatra: NAKSHATRA_NAMES[moonNakshatraIdx],
    moonNakshatraIndex: moonNakshatraIdx,
    lat, lng, tzOffset: getTimezoneOffset(lat, lng),
    isFallback: true,
  };
}

// ===== 해석 텍스트 =====
const LAGNA_MEANINGS_KO = {
  Aries: '양자리 라그나: 진취적이고 독립적인 성격입니다. 리더십이 강하고 새로운 일을 시작하는 능력이 뛰어납니다.',
  Taurus: '황소자리 라그나: 안정적이고 실용적인 성격입니다. 물질적 안정을 추구하며 예술적 감각이 있습니다.',
  Gemini: '쌍둥이자리 라그나: 지적 호기심이 강하고 커뮤니케이션 능력이 뛰어납니다. 다재다능합니다.',
  Cancer: '게자리 라그나: 감수성이 풍부하고 가정을 중시합니다. 직관력이 강하고 돌보는 성향이 있습니다.',
  Leo: '사자자리 라그나: 카리스마가 넘치고 자부심이 강합니다. 창의적이고 무대 중앙에 서는 것을 좋아합니다.',
  Virgo: '처녀자리 라그나: 분석적이고 세밀한 성격입니다. 완벽주의적이며 건강에 관심이 많습니다.',
  Libra: '천칭자리 라그나: 균형과 조화를 추구합니다. 외교적이고 미적 감각이 뛰어납니다.',
  Scorpio: '전갈자리 라그나: 강렬하고 통찰력이 깊습니다. 변화와 재생의 에너지를 가집니다.',
  Sagittarius: '궁수자리 라그나: 철학적이고 모험적입니다. 지식 탐구와 자유를 사랑합니다.',
  Capricorn: '염소자리 라그나: 야망이 크고 인내력이 강합니다. 실용적이고 목표 지향적입니다.',
  Aquarius: '물병자리 라그나: 혁신적이고 인도주의적입니다. 독창적인 사고와 공동체 의식이 강합니다.',
  Pisces: '물고기자리 라그나: 영적이고 감수성이 풍부합니다. 직관력과 예술적 감수성이 높습니다.',
};

export function getInterpretationText(result) {
  const lagnaText = LAGNA_MEANINGS_KO[result.lagnaSign] || `${result.lagnaSign} 라그나`;
  const moonSign = result.planets?.Moon?.sign || '-';
  const nakshatra = result.moonNakshatra || '-';
  const fallbackNote = result.isFallback
    ? '<p style="color:var(--text-muted);font-size:0.75rem;">⚠ API 연결 불가로 근사값을 사용했습니다. 태양·달만 계산됩니다.</p>'
    : '';

  return `
${fallbackNote}
<h5>▸ 라그나 (상승궁)</h5>
<p>${lagnaText}</p>
<h5>▸ 달의 위치</h5>
<p>달 궁: ${moonSign} / 낙샤트라: ${nakshatra}</p>
<p>달의 낙샤트라는 정서적 패턴, 직관, 무의식적 반응을 나타냅니다.</p>
  `.trim();
}
