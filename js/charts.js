/**
 * charts.js — SVG 시각화 모듈
 * 사주 8글자 그리드, 자미두수 12궁 격자, 베딕 남인도 차트
 */

import { ELEMENT_COLORS } from './bazi.js';

// SVG 헬퍼
function svgEl(tag, attrs = {}, text = '') {
  const ns = 'http://www.w3.org/2000/svg';
  const el = document.createElementNS(ns, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text) el.textContent = text;
  return el;
}

function makeSVG(width, height) {
  return svgEl('svg', {
    width, height,
    viewBox: `0 0 ${width} ${height}`,
    xmlns: 'http://www.w3.org/2000/svg',
  });
}

// ===== 사주 8글자 차트 =====
export function renderBaziChart(container, result) {
  container.innerHTML = '';
  const W = 320, H = 200;
  const svg = makeSVG(W, H);

  const cols = [
    { label: '년주(年)', pillar: result.yearPillar },
    { label: '월주(月)', pillar: result.monthPillar },
    { label: '일주(日)', pillar: result.dayPillar },
    { label: '시주(時)', pillar: result.hourPillar },
  ];

  const cellW = 70, cellH = 80, startX = 20, startY = 30;
  const gap = 10;

  // 헤더 배경
  const headerBg = svgEl('rect', {
    x: 0, y: 0, width: W, height: 24,
    fill: 'rgba(0,0,0,0.3)',
  });
  svg.appendChild(headerBg);

  // 제목
  const title = svgEl('text', { x: W/2, y: 16, fill: '#c9a84c', 'font-size': 11,
    'font-family': 'serif', 'text-anchor': 'middle' }, '사주 팔자');
  svg.appendChild(title);

  cols.forEach((col, i) => {
    const x = startX + i * (cellW + gap);
    const p = col.pillar;

    // 열 제목
    const hdr = svgEl('text', {
      x: x + cellW / 2, y: startY - 4,
      fill: '#a0a0c0', 'font-size': 10,
      'font-family': 'sans-serif', 'text-anchor': 'middle',
    }, col.label);
    svg.appendChild(hdr);

    // 천간 셀
    const stemColor = ELEMENT_COLORS[p.element] || '#888';
    const stemBg = svgEl('rect', {
      x, y: startY, width: cellW, height: cellH / 2 - 2,
      rx: 6, fill: stemColor + '22', stroke: stemColor + '66', 'stroke-width': 1,
    });
    svg.appendChild(stemBg);

    // 일주 강조
    if (i === 2) {
      const highlight = svgEl('rect', {
        x: x - 2, y: startY - 2, width: cellW + 4, height: cellH + 4,
        rx: 8, fill: 'none', stroke: '#c9a84c', 'stroke-width': 1.5, 'stroke-dasharray': '4,2',
      });
      svg.appendChild(highlight);
    }

    // 천간 한자
    const stemChar = svgEl('text', {
      x: x + cellW / 2, y: startY + cellH / 4 + 6,
      fill: stemColor, 'font-size': 24, 'font-family': 'serif',
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
    }, p.stem);
    svg.appendChild(stemChar);

    // 천간 한글
    const stemKo = svgEl('text', {
      x: x + cellW / 2, y: startY + cellH / 4 + 24,
      fill: stemColor + 'aa', 'font-size': 10, 'font-family': 'sans-serif',
      'text-anchor': 'middle',
    }, `${p.stemKo}(${p.element}·${p.yinYang})`);
    svg.appendChild(stemKo);

    // 지지 셀
    const branchColor = ELEMENT_COLORS[p.branchElement] || '#888';
    const branchBg = svgEl('rect', {
      x, y: startY + cellH / 2 + 2, width: cellW, height: cellH / 2 - 2,
      rx: 6, fill: branchColor + '22', stroke: branchColor + '66', 'stroke-width': 1,
    });
    svg.appendChild(branchBg);

    // 지지 한자
    const branchChar = svgEl('text', {
      x: x + cellW / 2, y: startY + cellH * 3 / 4 + 2,
      fill: branchColor, 'font-size': 24, 'font-family': 'serif',
      'text-anchor': 'middle', 'dominant-baseline': 'middle',
    }, p.branch);
    svg.appendChild(branchChar);

    // 지지 한글
    const branchKo = svgEl('text', {
      x: x + cellW / 2, y: startY + cellH - 2,
      fill: branchColor + 'aa', 'font-size': 10, 'font-family': 'sans-serif',
      'text-anchor': 'middle',
    }, `${p.branchKo}(${p.branchElement})`);
    svg.appendChild(branchKo);
  });

  // 일주 라벨
  const dayLabel = svgEl('text', {
    x: startX + 2 * (cellW + gap) + cellW / 2, y: H - 4,
    fill: '#c9a84c', 'font-size': 9, 'font-family': 'sans-serif',
    'text-anchor': 'middle',
  }, '▲ 일간(日干)');
  svg.appendChild(dayLabel);

  container.appendChild(svg);
}

// ===== 오행 바차트 =====
export function renderWuxingBars(container, wuxing) {
  container.removeAttribute('hidden');
  container.innerHTML = `<h4>오행 분포</h4><div class="wuxing-bars" id="wuxing-bars-inner"></div>`;
  const inner = container.querySelector('#wuxing-bars-inner');

  const elements = [
    { key: '목', label: '목(木)' },
    { key: '화', label: '화(火)' },
    { key: '토', label: '토(土)' },
    { key: '금', label: '금(金)' },
    { key: '수', label: '수(水)' },
  ];

  for (const e of elements) {
    const pct = wuxing.pct[e.key] || 0;
    const color = ELEMENT_COLORS[e.key];
    const row = document.createElement('div');
    row.className = 'wuxing-row';
    row.innerHTML = `
      <span class="wuxing-label">${e.label}</span>
      <div class="wuxing-bar-bg">
        <div class="wuxing-bar-fill" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="wuxing-count">${wuxing.count[e.key] || 0}</span>
    `;
    inner.appendChild(row);
  }
}

// ===== 대운 테이블 =====
export function renderDaeunTable(container, daeun, currentYear, birthYear) {
  container.removeAttribute('hidden');
  const currentAge = currentYear - birthYear;

  let rows = '';
  for (const d of daeun) {
    const isCurrent = currentAge >= d.age && currentAge < d.age + 10;
    const cls = isCurrent ? 'daeun-current' : '';
    const stemColor = ELEMENT_COLORS[d.stemElement] || 'inherit';
    const branchColor = ELEMENT_COLORS[d.branchElement] || 'inherit';
    rows += `
      <tr class="${cls}">
        <td>${d.age}세</td>
        <td><span style="color:${stemColor};font-size:1.1em;font-family:serif">${d.stem}</span>${d.stemKo}</td>
        <td><span style="color:${branchColor};font-size:1.1em;font-family:serif">${d.branch}</span>${d.branchKo}</td>
      </tr>
    `;
  }

  container.innerHTML = `
    <h4>대운 (10년 주기)</h4>
    <table class="daeun-table">
      <thead><tr><th>나이</th><th>천간</th><th>지지</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ===== 자미두수 12궁 격자 =====
// 4×3 격자 배치: 인(0)~축(11) → 위치 매핑
// 격자 위치 (row, col): 시계 반대방향
const ZWDS_GRID_POS = [
  // 인(0)=row3/col0, 묘(1)=row2/col0, 진(2)=row1/col0, 사(3)=row0/col0
  // 오(4)=row0/col1, 미(5)=row0/col2, 신(6)=row0/col3, 유(7)=row1/col3
  // 술(8)=row2/col3, 해(9)=row3/col3, 자(10)=row3/col2, 축(11)=row3/col1
  {row:3,col:0}, // 寅(0)
  {row:2,col:0}, // 卯(1)
  {row:1,col:0}, // 辰(2)
  {row:0,col:0}, // 巳(3)
  {row:0,col:1}, // 午(4)
  {row:0,col:2}, // 未(5)
  {row:0,col:3}, // 申(6)
  {row:1,col:3}, // 酉(7)
  {row:2,col:3}, // 戌(8)
  {row:3,col:3}, // 亥(9)
  {row:3,col:2}, // 子(10)
  {row:3,col:1}, // 丑(11)
];

export function renderZwdsGrid(container, result, onPalaceClick) {
  container.innerHTML = '';
  const grid = document.createElement('div');
  grid.className = 'zwds-grid';

  // 4×3=12 셀 생성
  const cells = Array.from({length:4}, () => Array(4).fill(null));

  for (let i = 0; i < 12; i++) {
    const palace = result.palaces[i];
    const pos = ZWDS_GRID_POS[i];
    const cell = document.createElement('div');
    cell.className = 'zwds-cell';
    if (i === result.mingGongIndex) cell.classList.add('zwds-cell--ming');

    const majorStars = palace.stars.filter(s => s.isMajor);
    const starsHtml = majorStars.map(s =>
      `<span class="star-major">${s.name}</span>`
    ).join(' ');

    cell.innerHTML = `
      <div class="zwds-cell-branch">${palace.stem}${palace.branch}</div>
      <div class="zwds-cell-palace">${palace.name}</div>
      <div class="zwds-cell-stars">${starsHtml || '<span class="star-minor">공궁</span>'}</div>
    `;

    cell.addEventListener('click', () => onPalaceClick(palace));
    cells[pos.row][pos.col] = cell;
  }

  // 빈 셀(중앙) 채우기
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let cell = cells[r][c];
      if (!cell) {
        // 중앙 2×2 위치 (row 1-2, col 1-2) — 정보 표시
        cell = document.createElement('div');
        cell.style.cssText = 'background:transparent;border:1px solid rgba(201,168,76,0.08);border-radius:4px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px;';
        if (r === 1 && c === 1) {
          cell.innerHTML = `<span style="font-size:0.6rem;color:var(--text-muted)">음력</span><span style="font-size:0.75rem;color:var(--accent-gold)">${result.lunar.month}월 ${result.lunar.day}일</span>`;
        } else if (r === 1 && c === 2) {
          cell.innerHTML = `<span style="font-size:0.6rem;color:var(--text-muted)">국수</span><span style="font-size:0.9rem;color:var(--accent-gold)">${result.bureau}국</span>`;
        } else if (r === 2 && c === 1) {
          cell.innerHTML = `<span style="font-size:0.6rem;color:var(--text-muted)">자미</span><span style="font-size:0.75rem;color:#e879f9">▲${result.palaces[result.ziweiIndex].branch}</span>`;
        } else if (r === 2 && c === 2) {
          cell.innerHTML = `<span style="font-size:0.6rem;color:var(--text-muted)">천부</span><span style="font-size:0.75rem;color:#60a5fa">▲${result.palaces[result.tianfuIndex].branch}</span>`;
        }
      }
      grid.appendChild(cell);
    }
  }

  container.appendChild(grid);
}

// ===== 베딕 남인도 차트 =====
// 남인도: 4×4 그리드, 고정 위치에 12 황도궁 배치
// 12궁 위치 (row, col): 메샤(양자리)=row0/col1 시작, 시계 반대방향
const SOUTH_INDIAN_POS = [
  {row:0,col:1}, // House 1 / Aries (메샤)
  {row:0,col:2}, // House 2 / Taurus (브리샤바)
  {row:0,col:3}, // House 3 / Gemini (미투나)
  {row:1,col:3}, // House 4 / Cancer (카르카타)
  {row:2,col:3}, // House 5 / Leo (심하)
  {row:3,col:3}, // House 6 / Virgo (칸야)
  {row:3,col:2}, // House 7 / Libra (툴라)
  {row:3,col:1}, // House 8 / Scorpio (브리쉬치카)
  {row:3,col:0}, // House 9 / Sagittarius (다누)
  {row:2,col:0}, // House 10 / Capricorn (마카라)
  {row:1,col:0}, // House 11 / Aquarius (쿰바)
  {row:0,col:0}, // House 12 / Pisces (미나)
];

const RASI_NAMES_KO = [
  '메샤\n(양)', '브리샤바\n(황)', '미투나\n(쌍)',
  '카르카\n(게)', '심하\n(사)', '칸야\n(처녀)',
  '툴라\n(천칭)', '브리쉬치\n(전갈)', '다누\n(궁수)',
  '마카라\n(염소)', '쿰바\n(물병)', '미나\n(물고기)',
];

const RASI_NAMES_EN = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
];

const PLANET_ABBREV_KO = {
  'Sun': '태양', 'Moon': '달', 'Mars': '화성', 'Mercury': '수성',
  'Jupiter': '목성', 'Venus': '금성', 'Saturn': '토성',
  'Rahu': '라후', 'Ketu': '케투',
};

const PLANET_COLORS = {
  'Sun': '#fbbf24', 'Moon': '#e2e8f0', 'Mars': '#ef4444',
  'Mercury': '#4ade80', 'Jupiter': '#fb923c', 'Venus': '#f472b6',
  'Saturn': '#94a3b8', 'Rahu': '#a78bfa', 'Ketu': '#a78bfa',
};

export function renderVedicChart(container, vedicData) {
  container.innerHTML = '';
  const cellSize = 72;
  const W = cellSize * 4, H = cellSize * 4;
  const svg = makeSVG(W, H);

  // lagna sign index (0=Aries)
  const lagnaSignIdx = vedicData.lagnaSignIndex ?? 0;

  // 각 라시에 있는 행성 목록
  const signPlanets = Array.from({length: 12}, () => []);
  for (const [planet, info] of Object.entries(vedicData.planets || {})) {
    const signIdx = info.signIndex ?? 0;
    signPlanets[signIdx].push({ planet, ...info });
  }

  for (let signIdx = 0; signIdx < 12; signIdx++) {
    const pos = SOUTH_INDIAN_POS[signIdx];
    const x = pos.col * cellSize;
    const y = pos.row * cellSize;
    const isLagna = signIdx === lagnaSignIdx;

    // 셀 배경
    const bg = svgEl('rect', {
      x, y, width: cellSize, height: cellSize,
      fill: isLagna ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.02)',
      stroke: isLagna ? '#c9a84c' : 'rgba(201,168,76,0.2)',
      'stroke-width': isLagna ? 2 : 1,
    });
    svg.appendChild(bg);

    // 라그나 대각선 표시
    if (isLagna) {
      const diag = svgEl('line', {
        x1: x, y1: y, x2: x + 20, y2: y + 20,
        stroke: '#c9a84c', 'stroke-width': 1.5, opacity: 0.7,
      });
      svg.appendChild(diag);
      const lagLabel = svgEl('text', {
        x: x + cellSize - 3, y: y + 10,
        fill: '#c9a84c', 'font-size': 7,
        'font-family': 'sans-serif', 'text-anchor': 'end',
      }, 'Lag');
      svg.appendChild(lagLabel);
    }

    // 황도궁 이름
    const rasi = RASI_NAMES_KO[signIdx].split('\n');
    const rasiText = svgEl('text', {
      x: x + cellSize / 2, y: y + 12,
      fill: 'rgba(255,255,255,0.3)', 'font-size': 7.5,
      'font-family': 'sans-serif', 'text-anchor': 'middle',
    }, rasi[0]);
    svg.appendChild(rasiText);

    // 행성 표시
    const planets = signPlanets[signIdx];
    planets.forEach((p, pi) => {
      const row = Math.floor(pi / 2);
      const col = pi % 2;
      const px = x + col * 33 + 12;
      const py = y + 22 + row * 16;

      const pColor = PLANET_COLORS[p.planet] || '#fff';
      const abbrev = PLANET_ABBREV_KO[p.planet] || p.planet.slice(0,2);
      const retro = p.isRetrograde ? 'ℛ' : '';

      const pText = svgEl('text', {
        x: px, y: py, fill: pColor,
        'font-size': 9.5, 'font-family': 'sans-serif', 'text-anchor': 'middle',
      }, abbrev + retro);
      svg.appendChild(pText);
    });
  }

  // 중앙 2×2 빈 영역 채우기
  for (let r = 1; r <= 2; r++) {
    for (let c = 1; c <= 2; c++) {
      const x = c * cellSize, y = r * cellSize;
      const bg = svgEl('rect', {
        x, y, width: cellSize, height: cellSize,
        fill: 'rgba(0,0,0,0.3)',
        stroke: 'rgba(201,168,76,0.1)', 'stroke-width': 1,
      });
      svg.appendChild(bg);
    }
  }

  // 중앙 제목
  const cx = 2 * cellSize, cy = 2 * cellSize;
  const centerText = svgEl('text', {
    x: cx, y: cy - 8, fill: '#c9a84c',
    'font-size': 10, 'font-family': 'sans-serif', 'text-anchor': 'middle',
  }, '베딕 차트');
  svg.appendChild(centerText);
  const centerSub = svgEl('text', {
    x: cx, y: cy + 8, fill: 'rgba(255,255,255,0.3)',
    'font-size': 8, 'font-family': 'sans-serif', 'text-anchor': 'middle',
  }, 'South Indian');
  svg.appendChild(centerSub);

  container.appendChild(svg);
}

// ===== 베딕 행성 테이블 =====
export function renderVedicPlanetTable(container, vedicData) {
  container.removeAttribute('hidden');

  const NAKSHATRA_NAMES_KO = [
    '아쉬위니','바라니','크리티카','로히니','므리가쉬라','아르드라',
    '푸나르바수','푸샤','아슬레샤','마가','푸르바팔구니','우타라팔구니',
    '하스타','치트라','스와티','비샤카','아누라다','졔쉬타',
    '물라','푸르바샤다','우타라샤다','샤라바나','다니쉬타','샤타비샤',
    '푸르바바드라','우타라바드라','레바티'
  ];

  let rows = '';
  const ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu'];
  for (const planet of ORDER) {
    const info = vedicData.planets?.[planet];
    if (!info) continue;
    const ko = PLANET_ABBREV_KO[planet] || planet;
    const sign = RASI_NAMES_KO[info.signIndex ?? 0]?.replace('\n', '') || '-';
    const nakshatra = info.nakshatraIndex !== undefined
      ? (NAKSHATRA_NAMES_KO[info.nakshatraIndex] || '-') : '-';
    const retro = info.isRetrograde
      ? '<span class="planet-retrograde">역행</span>' : '';
    rows += `
      <tr>
        <td><span class="planet-name-ko">${ko}</span></td>
        <td>${planet}</td>
        <td>${sign}</td>
        <td>${nakshatra}</td>
        <td>${retro}</td>
      </tr>
    `;
  }

  container.innerHTML = `
    <table>
      <thead><tr><th>행성</th><th>EN</th><th>라시</th><th>낙샤트라</th><th>역행</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
