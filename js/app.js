/**
 * app.js — 메인 컨트롤러
 * 모든 모듈을 연결하고 UI 상태를 관리합니다.
 */

import * as Bazi from './bazi.js';
import * as Zwds from './zwds.js';
import * as Vedic from './vedic.js';
import { analyzeWithAI, markdownToHtml } from './ai.js';
import {
  renderBaziChart, renderWuxingBars, renderDaeunTable,
  renderZwdsGrid, renderVedicChart, renderVedicPlanetTable,
} from './charts.js';

// ===== 앱 상태 =====
const State = {
  baziResult: null,
  zwdsResult: null,
  vedicResult: null,
  birthInfo: {},
  apiKey: sessionStorage.getItem('anthropic_key') || '',
  model: sessionStorage.getItem('claude_model') || 'claude-sonnet-4-6',
};

// ===== DOM 요소 =====
const $ = (id) => document.getElementById(id);

const form = $('birth-form');
const panelsGrid = $('panels-grid');
const aiSection = $('ai-section');

// ===== 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
  // 설정 복원
  if (State.apiKey) {
    $('input-api-key').value = State.apiKey;
  }
  if (State.model) {
    $('input-model').value = State.model;
  }

  // 마지막 입력값 복원 (없으면 오늘 날짜 기본값)
  const saved = JSON.parse(localStorage.getItem('birth_form') || '{}');
  $('input-date').value   = saved.date     || new Date().toISOString().split('T')[0];
  $('input-time').value   = saved.time     || '12:00';
  $('input-name').value   = saved.name     || '';
  $('input-location').value = saved.location || '';
  if (saved.gender) {
    const radioEl = document.querySelector(`input[name="gender"][value="${saved.gender}"]`);
    if (radioEl) radioEl.checked = true;
  }

  // 이벤트 바인딩
  form.addEventListener('submit', onCalculate);
  $('btn-open-settings').addEventListener('click', openSettings);
  $('btn-open-settings-2')?.addEventListener('click', openSettings);
  $('btn-close-settings').addEventListener('click', closeSettings);
  $('btn-save-settings').addEventListener('click', saveSettings);
  $('modal-backdrop').addEventListener('click', closeSettings);
  $('btn-ai-analyze').addEventListener('click', onAIAnalyze);
});

// ===== 계산 시작 =====
async function onCalculate(e) {
  e.preventDefault();

  const dateVal = $('input-date').value;
  const timeVal = $('input-time').value;
  const name = $('input-name').value.trim();
  const genderEl = document.querySelector('input[name="gender"]:checked');
  const gender = genderEl?.value || 'male';
  const locationInput = $('input-location').value.trim();

  if (!dateVal || !timeVal) return;

  const [year, month, day] = dateVal.split('-').map(Number);
  const [hour, minute] = timeVal.split(':').map(Number);

  State.birthInfo = { name, date: dateVal, time: timeVal, year, month, day, hour, minute, gender };

  // 입력값 저장 (다음 방문 시 복원)
  localStorage.setItem('birth_form', JSON.stringify({ date: dateVal, time: timeVal, name, gender, location: locationInput }));

  // 패널 표시
  panelsGrid.removeAttribute('hidden');
  aiSection.removeAttribute('hidden');
  $('btn-ai-analyze').disabled = true;
  $('ai-key-warning').setAttribute('hidden', '');
  $('ai-result').setAttribute('hidden', '');

  // 버튼 비활성화
  const btnCalc = $('btn-calculate');
  btnCalc.disabled = true;
  btnCalc.querySelector('.btn-text').textContent = '계산 중...';

  // 스켈레톤 표시
  showSkeletons();

  try {
    // 1. 사주 계산 (동기)
    State.baziResult = Bazi.calculate(year, month, day, hour, minute, gender);
    renderBaziPanel(State.baziResult);

    // 2. 자미두수 계산 (동기)
    State.zwdsResult = Zwds.calculate(year, month, day, hour, minute, gender);
    renderZwdsPanel(State.zwdsResult);

    // 3. 베딕 (비동기 API)
    await renderVedicPanel(year, month, day, hour, minute, locationInput);

    // AI 버튼 활성화
    enableAIButton();

  } catch (err) {
    console.error('계산 오류:', err);
    showError('계산 중 오류가 발생했습니다: ' + err.message);
  } finally {
    btnCalc.disabled = false;
    btnCalc.querySelector('.btn-text').textContent = '운명 분석하기';
  }
}

// ===== 사주 패널 렌더링 =====
function renderBaziPanel(result) {
  const chartContainer = $('bazi-chart-container');
  chartContainer.innerHTML = '';
  renderBaziChart(chartContainer, result);

  renderWuxingBars($('bazi-wuxing-container'), result.wuxing);

  const currentYear = new Date().getFullYear();
  renderDaeunTable($('bazi-daeun-container'), result.daeun, currentYear, State.birthInfo.year);

  const interpEl = $('bazi-interpretation');
  interpEl.innerHTML = Bazi.getInterpretationText(result);
  interpEl.removeAttribute('hidden');
}

// ===== 자미두수 패널 렌더링 =====
function renderZwdsPanel(result) {
  const chartContainer = $('zwds-chart-container');
  chartContainer.innerHTML = '';
  renderZwdsGrid(chartContainer, result, onPalaceClick);

  const interpEl = $('zwds-interpretation');
  interpEl.innerHTML = Zwds.getInterpretationText(result);
  interpEl.removeAttribute('hidden');
}

function onPalaceClick(palace) {
  const detail = Zwds.getPalaceDetail(palace);
  const detailEl = $('zwds-detail');
  $('zwds-detail-title').textContent = detail.title;
  $('zwds-detail-text').textContent = detail.text;
  detailEl.removeAttribute('hidden');
}

// ===== 베딕 패널 렌더링 =====
async function renderVedicPanel(year, month, day, hour, minute, locationInput) {
  const chartContainer = $('vedic-chart-container');
  chartContainer.innerHTML = '<div class="skeleton skeleton--chart"></div>';

  let lat = 37.5665, lng = 126.9780; // 기본: 서울
  let useDefaultLocation = true;

  if (locationInput) {
    try {
      const geo = await Vedic.geocodeCity(locationInput);
      if (geo) {
        lat = geo.lat;
        lng = geo.lng;
        useDefaultLocation = false;
      }
    } catch {}
  }

  // 기본 위치 면책 배지
  if (useDefaultLocation) {
    $('vedic-disclaimer').removeAttribute('hidden');
  } else {
    $('vedic-disclaimer').setAttribute('hidden', '');
  }

  // 진행 상황 표시
  const progressEl = document.createElement('p');
  progressEl.style.cssText = 'font-size:0.78rem;color:var(--text-muted);text-align:center;margin-top:0.5rem;';
  chartContainer.appendChild(progressEl);

  let vedicResult;
  try {
    vedicResult = await Vedic.calculate(year, month, day, hour, minute, lat, lng, (done, total, msg) => {
      progressEl.textContent = `${msg} (${done}/${total})`;
    });
  } catch (err) {
    console.warn('VedAstro API 실패, 폴백 사용:', err);
    vedicResult = Vedic.calculateFallback(year, month, day, hour, minute, lat, lng);
  }

  State.vedicResult = vedicResult;

  // 차트 렌더링
  chartContainer.innerHTML = '';
  renderVedicChart(chartContainer, vedicResult);

  renderVedicPlanetTable($('vedic-planet-table'), vedicResult);

  const interpEl = $('vedic-interpretation');
  interpEl.innerHTML = Vedic.getInterpretationText(vedicResult);
  interpEl.removeAttribute('hidden');
}

// ===== 스켈레톤 표시 =====
function showSkeletons() {
  for (const id of ['bazi-chart-container', 'zwds-chart-container', 'vedic-chart-container']) {
    const el = $(id);
    el.innerHTML = '<div class="skeleton skeleton--chart"></div>';
  }
  $('bazi-wuxing-container').setAttribute('hidden', '');
  $('bazi-daeun-container').setAttribute('hidden', '');
  $('bazi-interpretation').setAttribute('hidden', '');
  $('zwds-detail').setAttribute('hidden', '');
  $('zwds-interpretation').setAttribute('hidden', '');
  $('vedic-planet-table').setAttribute('hidden', '');
  $('vedic-interpretation').setAttribute('hidden', '');
}

// ===== AI 버튼 활성화 =====
function enableAIButton() {
  const btn = $('btn-ai-analyze');
  if (State.apiKey) {
    btn.disabled = false;
    $('ai-key-warning').setAttribute('hidden', '');
  } else {
    btn.disabled = true;
    $('ai-key-warning').removeAttribute('hidden');
  }
}

// ===== AI 분석 =====
async function onAIAnalyze() {
  if (!State.baziResult || !State.zwdsResult || !State.vedicResult) return;

  const btn = $('btn-ai-analyze');
  btn.disabled = true;
  btn.textContent = '⏳ 분석 중...';

  const resultEl = $('ai-result');
  const contentEl = $('ai-result-content');
  resultEl.removeAttribute('hidden');
  contentEl.innerHTML = '<span class="ai-cursor"></span>';

  let fullHtml = '';

  await analyzeWithAI({
    apiKey: State.apiKey,
    model: State.model,
    baziResult: State.baziResult,
    zwdsResult: State.zwdsResult,
    vedicResult: State.vedicResult,
    birthInfo: State.birthInfo,
    onChunk: (chunk, fullText) => {
      fullHtml = markdownToHtml(fullText);
      contentEl.innerHTML = fullHtml + '<span class="ai-cursor"></span>';
      // 스크롤 따라가기
      contentEl.scrollIntoView({ behavior: 'smooth', block: 'end' });
    },
    onComplete: (fullText) => {
      fullHtml = markdownToHtml(fullText);
      contentEl.innerHTML = fullHtml;
      btn.disabled = false;
      btn.textContent = '✦ AI 종합 분석 재요청';
    },
    onError: (errMsg) => {
      contentEl.innerHTML = `<div class="error-msg">⚠ ${errMsg}</div>`;
      btn.disabled = false;
      btn.textContent = '✦ AI 종합 분석 요청';
    },
  });
}

// ===== 설정 모달 =====
function openSettings() {
  $('settings-modal').setAttribute('open', '');
  $('modal-backdrop').removeAttribute('hidden');
}

function closeSettings() {
  $('settings-modal').removeAttribute('open');
  $('modal-backdrop').setAttribute('hidden', '');
}

function saveSettings() {
  const key = $('input-api-key').value.trim();
  const model = $('input-model').value;

  State.apiKey = key;
  State.model = model;

  if (key) {
    sessionStorage.setItem('anthropic_key', key);
  } else {
    sessionStorage.removeItem('anthropic_key');
  }
  sessionStorage.setItem('claude_model', model);

  closeSettings();

  // AI 버튼 상태 갱신
  if (State.baziResult) {
    enableAIButton();
  }
}

function showError(msg) {
  console.error(msg);
}
