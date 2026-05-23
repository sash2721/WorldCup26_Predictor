/* ═══════════════════════════════════════════════════
   FIFA WORLD CUP 2026 PREDICTOR - app.js
═══════════════════════════════════════════════════ */

// ══════════════════════════════════════════════════════════
//  DATA
// ══════════════════════════════════════════════════════════
const GROUPS = {
  A: [{n:"Mexico",f:"🇲🇽"},{n:"South Africa",f:"🇿🇦"},{n:"South Korea",f:"🇰🇷"},{n:"Czech Republic",f:"🇨🇿"}],
  B: [{n:"Canada",f:"🇨🇦"},{n:"Switzerland",f:"🇨🇭"},{n:"Bosnia & Herz.",f:"🇧🇦"},{n:"Qatar",f:"🇶🇦"}],
  C: [{n:"Brazil",f:"🇧🇷"},{n:"Morocco",f:"🇲🇦"},{n:"Scotland",f:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"},{n:"Haiti",f:"🇭🇹"}],
  D: [{n:"USA",f:"🇺🇸"},{n:"Türkiye",f:"🇹🇷"},{n:"Australia",f:"🇦🇺"},{n:"Paraguay",f:"🇵🇾"}],
  E: [{n:"Germany",f:"🇩🇪"},{n:"Ecuador",f:"🇪🇨"},{n:"Ivory Coast",f:"🇨🇮"},{n:"Curaçao",f:"🇨🇼"}],
  F: [{n:"Netherlands",f:"🇳🇱"},{n:"Japan",f:"🇯🇵"},{n:"Sweden",f:"🇸🇪"},{n:"Tunisia",f:"🇹🇳"}],
  G: [{n:"Belgium",f:"🇧🇪"},{n:"Iran",f:"🇮🇷"},{n:"Egypt",f:"🇪🇬"},{n:"New Zealand",f:"🇳🇿"}],
  H: [{n:"Spain",f:"🇪🇸"},{n:"Uruguay",f:"🇺🇾"},{n:"Saudi Arabia",f:"🇸🇦"},{n:"Cape Verde",f:"🇨🇻"}],
  I: [{n:"France",f:"🇫🇷"},{n:"Senegal",f:"🇸🇳"},{n:"Norway",f:"🇳🇴"},{n:"Iraq",f:"🇮🇶"}],
  J: [{n:"Argentina",f:"🇦🇷"},{n:"Austria",f:"🇦🇹"},{n:"Algeria",f:"🇩🇿"},{n:"Jordan",f:"🇯🇴"}],
  K: [{n:"Portugal",f:"🇵🇹"},{n:"Colombia",f:"🇨🇴"},{n:"DR Congo",f:"🇨🇩"},{n:"Uzbekistan",f:"🇺🇿"}],
  L: [{n:"England",f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},{n:"Croatia",f:"🇭🇷"},{n:"Ghana",f:"🇬🇭"},{n:"Panama",f:"🇵🇦"}]
};
const GROUP_KEYS = Object.keys(GROUPS);

// Official FIFA R32 bracket
const R32 = [
  {label:"M1",  t1:{g:'A',p:2}, t2:{g:'B',p:2}},
  {label:"M2",  t1:{g:'C',p:1}, t2:{g:'F',p:2}},
  {label:"M3",  t1:{g:'E',p:1}, t2:{g:'', p:3, from:'ABCDF'}},
  {label:"M4",  t1:{g:'F',p:1}, t2:{g:'C',p:2}},
  {label:"M5",  t1:{g:'E',p:2}, t2:{g:'I',p:2}},
  {label:"M6",  t1:{g:'I',p:1}, t2:{g:'', p:3, from:'CDFGH'}},
  {label:"M7",  t1:{g:'A',p:1}, t2:{g:'', p:3, from:'CEFHI'}},
  {label:"M8",  t1:{g:'L',p:1}, t2:{g:'', p:3, from:'EHIJK'}},
  {label:"M9",  t1:{g:'G',p:1}, t2:{g:'', p:3, from:'AEHIJ'}},
  {label:"M10", t1:{g:'D',p:1}, t2:{g:'', p:3, from:'BEFIJ'}},
  {label:"M11", t1:{g:'K',p:2}, t2:{g:'L',p:2}},
  {label:"M12", t1:{g:'H',p:1}, t2:{g:'J',p:2}},
  {label:"M13", t1:{g:'B',p:1}, t2:{g:'', p:3, from:'EFGIJ'}},
  {label:"M14", t1:{g:'J',p:1}, t2:{g:'H',p:2}},
  {label:"M15", t1:{g:'K',p:1}, t2:{g:'', p:3, from:'DEIJL'}},
  {label:"M16", t1:{g:'D',p:2}, t2:{g:'G',p:2}},
];

// ── State ──
let rankings = {};       // { A: [team,...], B: [...], ... }
let third8   = new Set();// selected 3rd-place team names
let ko       = {};       // { r32_0: team, r16_0: team, ... }
const _matchTeams = {};  // team registry for click handling

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════
function init() {
  GROUP_KEYS.forEach(g => { rankings[g] = GROUPS[g].map(t => ({...t})); });
  buildTicker();
  renderGroupsPage();
  updateGSProgress();
}

// ══════════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════════
function goTo(idx) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + idx).classList.add('active');
  document.querySelectorAll('.step-btn').forEach((b, i) => {
    b.classList.toggle('active', i === idx);
  });
  if (idx === 1) renderThirdPage();
  if (idx === 2) renderKOPage('r32');
  if (idx === 3) renderKOPage('r16');
  if (idx === 4) renderKOPage('qf');
  if (idx === 5) renderKOPage('sf');
  if (idx === 6) renderKOPage('final');
  if (idx === 7) renderChampion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Toast ──
let _toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ══════════════════════════════════════════════════════════
//  FLAGS TICKER
// ══════════════════════════════════════════════════════════
function buildTicker() {
  const allFlags = GROUP_KEYS.flatMap(g => GROUPS[g].map(t => t.f));
  const doubled  = [...allFlags, ...allFlags]; // seamless loop
  const track    = document.getElementById('ticker-track');
  if (!track) return;
  track.innerHTML = doubled.map(f => `<span class="ticker-flag">${f}</span>`).join('');
}

// ══════════════════════════════════════════════════════════
//  GROUP STAGE
// ══════════════════════════════════════════════════════════
function renderGroupsPage() {
  const grid = document.getElementById('groups-grid');
  grid.innerHTML = GROUP_KEYS.map(g => renderGroupCard(g)).join('');
  GROUP_KEYS.forEach(g => initDrag(g));
  updateGSProgress();
}

function renderGroupCard(g) {
  const rows = rankings[g].map((t, i) => renderTeamRow(g, t, i)).join('');
  return `
    <div class="group-card" id="gc-${g}" data-group="${g}">
      <div class="gc-header">
        <div>
          <div class="gc-label">Group ${g}</div>
          <div class="gc-sublabel">${rankings[g].map(t=>t.f).join(' ')}</div>
        </div>
        <span class="gc-status">Drag to rank</span>
      </div>
      <div class="gc-teams" id="gt-${g}">${rows}</div>
    </div>`;
}

function renderTeamRow(g, t, pos) {
  const badges = ['badge-q1','badge-q2','badge-3','badge-out'];
  const texts  = ['1st ✓','2nd ✓','3rd','4th'];
  return `
    <div class="team-row" draggable="true" data-g="${g}" data-pos="${pos}">
      <span class="drag-handle">⠿</span>
      <span class="t-pos">${pos+1}</span>
      <span class="t-flag">${t.f}</span>
      <span class="t-name">${t.n}</span>
      <span class="t-badge ${badges[pos]}">${texts[pos]}</span>
    </div>`;
}

function initDrag(g) {
  const container = document.getElementById('gt-' + g);
  let dragged = null;

  container.addEventListener('dragstart', e => {
    dragged = e.target.closest('.team-row');
    if (!dragged) return;
    dragged.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });
  container.addEventListener('dragend', () => {
    container.querySelectorAll('.team-row').forEach(r => r.classList.remove('dragging','drag-over'));
  });
  container.addEventListener('dragover', e => {
    e.preventDefault();
    const target = e.target.closest('.team-row');
    if (target && target !== dragged) {
      container.querySelectorAll('.team-row').forEach(r => r.classList.remove('drag-over'));
      target.classList.add('drag-over');
    }
  });
  container.addEventListener('dragleave', e => {
    const t = e.target.closest('.team-row');
    if (t) t.classList.remove('drag-over');
  });
  container.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('.team-row');
    if (!target || target === dragged) return;
    const from = parseInt(dragged.dataset.pos);
    const to   = parseInt(target.dataset.pos);
    [rankings[g][from], rankings[g][to]] = [rankings[g][to], rankings[g][from]];
    third8.clear();
    clearKOFrom('r32');
    reRenderGroup(g);
    updateGSProgress();
  });
}

function reRenderGroup(g) {
  const old = document.getElementById('gc-' + g);
  const tmp = document.createElement('div');
  tmp.innerHTML = renderGroupCard(g);
  old.replaceWith(tmp.firstElementChild);
  initDrag(g);
}

function updateGSProgress() {
  document.getElementById('gs-progress').style.width = '100%';
  document.getElementById('gs-count').textContent = '12 / 12';
}

function resetGroups() {
  GROUP_KEYS.forEach(g => { rankings[g] = GROUPS[g].map(t => ({...t})); });
  third8.clear();
  clearKOFrom('r32');
  renderGroupsPage();
  toast('Groups reset to default order');
}

// ══════════════════════════════════════════════════════════
//  3RD PLACE SELECTION
// ══════════════════════════════════════════════════════════
function get3rdTeams() {
  return GROUP_KEYS.map(g => ({ ...rankings[g][2], group: g }));
}

function renderThirdPage() {
  const teams = get3rdTeams();
  document.getElementById('third-grid').innerHTML = teams.map(t => {
    const sel      = third8.has(t.n);
    const disabled = !sel && third8.size >= 8;
    return `
      <div class="third-card${sel?' selected':''}${disabled?' disabled':''}" onclick="toggleThird('${t.n}')">
        <span class="tc-flag">${t.f}</span>
        <div class="tc-info">
          <div class="tc-name">${t.n}</div>
          <div class="tc-sub">3rd - Group ${t.group}</div>
        </div>
        <div class="tc-check">${sel?'✓':''}</div>
      </div>`;
  }).join('');
  updateThirdUI();
}

function toggleThird(name) {
  if (third8.has(name)) {
    third8.delete(name);
  } else {
    if (third8.size >= 8) { toast('Already selected 8 - deselect one first'); return; }
    third8.add(name);
  }
  clearKOFrom('r32');
  renderThirdPage();
}

function updateThirdUI() {
  const n = third8.size;
  document.getElementById('third-count').textContent    = n;
  document.getElementById('third-progress').style.width = (n / 8 * 100) + '%';
  document.getElementById('btn-proceed-3rd').disabled   = n !== 8;
}

// ══════════════════════════════════════════════════════════
//  R32 TEAM RESOLUTION
// ══════════════════════════════════════════════════════════
function getR32Teams() {
  const selected3rd = [...third8]
    .map(name => get3rdTeams().find(t => t.n === name))
    .filter(Boolean);

  // Collect all 3rd-place slots
  const slots = [];
  R32.forEach((m, i) => {
    if (m.t1.p === 3) slots.push({ matchIdx: i, side: 't1', pools: m.t1.from.split('') });
    if (m.t2.p === 3) slots.push({ matchIdx: i, side: 't2', pools: m.t2.from.split('') });
  });

  const assignments = {};
  const used = new Set();

  // Pass 1: pool-preference match
  slots.forEach(slot => {
    const key   = slot.side + '_' + slot.matchIdx;
    const match = selected3rd.find(t => !used.has(t.n) && slot.pools.includes(t.group));
    if (match) { assignments[key] = match; used.add(match.n); }
  });

  // Pass 2: fill remaining slots with any unassigned teams
  const remaining = selected3rd.filter(t => !used.has(t.n));
  slots.forEach(slot => {
    const key = slot.side + '_' + slot.matchIdx;
    if (!assignments[key] && remaining.length) {
      const t = remaining.shift();
      assignments[key] = t;
      used.add(t.n);
    }
  });

  return R32.map((m, i) => ({
    label: m.label,
    t1: m.t1.p === 3
      ? (assignments['t1_' + i] || null)
      : ({ ...rankings[m.t1.g][m.t1.p - 1], group: m.t1.g }),
    t2: m.t2.p === 3
      ? (assignments['t2_' + i] || null)
      : ({ ...rankings[m.t2.g][m.t2.p - 1], group: m.t2.g }),
  }));
}

// ══════════════════════════════════════════════════════════
//  KNOCKOUT RENDERING
// ══════════════════════════════════════════════════════════
function clearKOFrom(round) {
  const order = ['r32','r16','qf','sf','final'];
  const from  = order.indexOf(round);
  order.slice(from).forEach(r => {
    Object.keys(ko).filter(k => k.startsWith(r + '_')).forEach(k => delete ko[k]);
  });
  updateAllProceedBtns();
}

function updateAllProceedBtns() {
  const c = key => Object.keys(ko).filter(k => k.startsWith(key + '_')).length;
  setBtn('btn-proceed-r32',   c('r32')   < 16);
  setBtn('btn-proceed-r16',   c('r16')   < 8);
  setBtn('btn-proceed-qf',    c('qf')    < 4);
  setBtn('btn-proceed-sf',    c('sf')    < 2);
  setBtn('btn-proceed-final', !ko['final_0']);
}
function setBtn(id, disabled) {
  const el = document.getElementById(id);
  if (el) el.disabled = disabled;
}

function renderKOPage(round) {
  const counts = { r32:16, r16:8, qf:4, sf:2, final:1 };
  const el     = document.getElementById('ko-' + round);
  const pairs  = getMatchPairs(round, counts[round]);

  // Clear old team entries for this round
  Object.keys(_matchTeams).filter(k => k.startsWith(round + '_')).forEach(k => delete _matchTeams[k]);

  let html = '';
  if (round === 'r32') {
    html = renderKOColumn(round, pairs.slice(0, 8),  'Matches 1–8')
         + renderKOColumn(round, pairs.slice(8, 16), 'Matches 9–16');
  } else {
    html = renderKOColumn(round, pairs, '');
  }
  el.innerHTML = html;

  // Event delegation - assign to .onclick so re-renders overwrite, never stack
  el.onclick = e => {
    const teamEl = e.target.closest('.ko-team[data-tkey]');
    if (!teamEl) return;
    const r    = teamEl.dataset.round;
    const idx  = parseInt(teamEl.dataset.idx);
    const team = _matchTeams[teamEl.dataset.tkey];
    if (!team) return;
    ko[r + '_' + idx] = team;
    const next = { r32:'r16', r16:'qf', qf:'sf', sf:'final' };
    if (next[r]) clearKOFrom(next[r]);
    renderKOPage(r);
    toast(`${team.f} ${team.n} advances!`);
  };

  updateAllProceedBtns();
}

function getMatchPairs(round, count) {
  if (round === 'r32') {
    return getR32Teams().map((m, i) => ({ idx: i, label: m.label, t1: m.t1, t2: m.t2 }));
  }
  const prev = { r16:'r32', qf:'r16', sf:'qf', final:'sf' }[round];
  return Array.from({ length: count }, (_, i) => ({
    idx:   i,
    label: 'Match ' + (i + 1),
    t1:    ko[prev + '_' + (i * 2)]     || null,
    t2:    ko[prev + '_' + (i * 2 + 1)] || null,
  }));
}

function renderKOColumn(round, pairs, colTitle) {
  const html = pairs.map(m => renderKOMatch(round, m)).join('<div class="ko-spacer"></div>');
  return `<div class="ko-col">
    <div class="ko-round-title">${colTitle}</div>
    <div class="ko-matches">${html}</div>
  </div>`;
}

function renderKOMatch(round, m) {
  const winner     = ko[round + '_' + m.idx];
  const winnerName = winner ? winner.n : null;

  const teamHtml = (t, side) => {
    if (!t) return `<div class="ko-team tbd"><span class="ko-flag">⬜</span><span class="ko-name">TBD</span></div>`;
    const tkey = `${round}_${m.idx}_${side}`;
    _matchTeams[tkey] = t;
    const isW = winnerName === t.n;
    const isL = winnerName && !isW;
    return `
      <div class="ko-team${isW?' winner':''}${isL?' loser':''}"
        data-round="${round}" data-idx="${m.idx}" data-tkey="${tkey}">
        <span class="ko-flag">${t.f || '⬜'}</span>
        <span class="ko-name">${t.n}</span>
        ${isW ? '<span class="ko-tick">✓</span>' : ''}
      </div>`;
  };

  return `
    <div class="ko-match">
      <div class="ko-match-label">${m.label}</div>
      ${teamHtml(m.t1, 0)}
      ${teamHtml(m.t2, 1)}
    </div>`;
}

// ══════════════════════════════════════════════════════════
//  CHAMPION
// ══════════════════════════════════════════════════════════
function renderChampion() {
  const champ  = ko['final_0'];
  const sf0    = ko['sf_0'];
  const sf1    = ko['sf_1'];
  const runner = champ ? (sf0?.n !== champ.n ? sf0 : sf1) : null;
  const wrap   = document.getElementById('champ-wrap');

  if (!champ) {
    wrap.innerHTML = `
      <div class="trophy-hero">
        <div class="trophy-content">
          <span class="trophy-icon">🏆</span>
          <div class="trophy-eyebrow">FIFA World Cup 2026</div>
          <p class="trophy-empty">Complete all rounds to crown your World Cup champion.<br>Go back and make your picks!</p>
        </div>
      </div>
      <div style="text-align:center;margin-top:1.5rem">
        <button class="btn ghost" onclick="goTo(6)">← Go to the Final</button>
      </div>`;
    return;
  }

  // Confetti pieces
  const colors = ['#FFD600','#FF3B3B','#1E90FF','#00E676','#FF6D00','#AA00FF','#FFFFFF'];
  const confetti = Array.from({length:30}, (_,i) => {
    const c   = colors[i % colors.length];
    const dur = 2 + Math.random() * 3;
    const del = Math.random() * 3;
    const lft = Math.random() * 100;
    return `<div class="confetti-piece" style="left:${lft}%;background:${c};animation-duration:${dur}s;animation-delay:${del}s;border-radius:${Math.random()>0.5?'50%':'2px'}"></div>`;
  }).join('');

  wrap.innerHTML = `
    <div class="trophy-hero">
      <div class="trophy-confetti">${confetti}</div>
      <div class="trophy-content">
        <span class="trophy-icon">🏆</span>
        <div class="trophy-eyebrow">FIFA World Cup 2026 Champion</div>
        <span class="trophy-flag">${champ.f}</span>
        <div class="trophy-name">${champ.n}</div>
        <div class="trophy-subtitle">MetLife Stadium, New Jersey | July 19, 2026</div>
      </div>
    </div>
    <div class="results-grid">
      <div class="result-card">
        <div class="result-label">🥇 Champion</div>
        <span class="result-flag">${champ.f}</span>
        <div class="result-name">${champ.n}</div>
      </div>
      <div class="result-card">
        <div class="result-label">🥈 Runner-Up</div>
        <span class="result-flag">${runner ? runner.f : '-'}</span>
        <div class="result-name${runner ? '' : ' empty'}">${runner ? runner.n : 'TBD'}</div>
      </div>
      ${sf0 ? `<div class="result-card">
        <div class="result-label">🥉 Semi-finalist</div>
        <span class="result-flag">${sf0.f}</span>
        <div class="result-name">${sf0.n}</div>
      </div>` : ''}
      ${sf1 ? `<div class="result-card">
        <div class="result-label">🥉 Semi-finalist</div>
        <span class="result-flag">${sf1.f}</span>
        <div class="result-name">${sf1.n}</div>
      </div>` : ''}
    </div>
    <div class="champ-actions">
      <button class="btn ghost" onclick="resetAll()">↺ Start Over</button>
      <button class="btn" style="border-color:rgba(0,230,118,.4);color:#00E676" onclick="copyResults()">📋 Copy My Predictions</button>
    </div>`;
}

function copyResults() {
  const champ = ko['final_0'];
  const sf0 = ko['sf_0'];
  const sf1 = ko['sf_1'];
  const runner = champ ? (sf0?.n !== champ.n ? sf0 : sf1) : null;

  const lines = [];

  // Header
  lines.push('⚽🏆 FIFA WORLD CUP 2026 - MY PREDICTIONS 🏆⚽');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  // Champion highlight
  lines.push(`🥇 CHAMPION: ${champ?.f || ''} ${champ?.n || 'TBD'} 🏆`);
  if (runner) lines.push(`🥈 Runner-up: ${runner.f} ${runner.n}`);
  lines.push('');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Final & Semis
  lines.push('');
  lines.push('🏟️ THE FINAL');
  lines.push(`   ${sf0?.f || ''} ${sf0?.n || 'TBD'} vs ${sf1?.f || ''} ${sf1?.n || 'TBD'}`);
  lines.push(`   Winner: ${champ?.f || ''} ${champ?.n || 'TBD'} 🏆`);
  lines.push('');

  lines.push('🔥 SEMI-FINALS');
  const qf0 = ko['qf_0'], qf1 = ko['qf_1'], qf2 = ko['qf_2'], qf3 = ko['qf_3'];
  if (qf0 && qf1) lines.push(`   ${qf0.f} ${qf0.n} vs ${qf1.f} ${qf1.n} → ${sf0?.f || ''} ${sf0?.n || '?'}`);
  if (qf2 && qf3) lines.push(`   ${qf2.f} ${qf2.n} vs ${qf3.f} ${qf3.n} → ${sf1?.f || ''} ${sf1?.n || '?'}`);
  lines.push('');

  lines.push('⚡ QUARTER-FINALS');
  for (let i = 0; i < 4; i++) {
    const w = ko['qf_' + i];
    if (w) lines.push(`   ${w.f} ${w.n} ✓`);
  }
  lines.push('');

  // Groups - compact
  lines.push('📋 GROUP STAGE');
  GROUP_KEYS.forEach(g => {
    const r = rankings[g];
    lines.push(`   ${g}: ${r[0].f}${r[0].n} > ${r[1].f}${r[1].n} > ${r[2].f}${r[2].n} > ${r[3].f}${r[3].n}`);
  });
  lines.push('');

  // 3rd place
  lines.push('🎫 3RD-PLACE QUALIFIERS');
  const thirdTeams = get3rdTeams().filter(t => third8.has(t.n));
  lines.push('   ' + thirdTeams.map(t => `${t.f}${t.n}`).join(', '));
  lines.push('');

  // Footer
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('Make yours → fifawc26-predictor.vercel.app');
  lines.push('#WorldCup2026 #FIFAWorldCup');

  navigator.clipboard.writeText(lines.join('\n'))
    .then(() => toast('Predictions copied to clipboard! 📋'))
    .catch(() => toast('Copy failed - try again'));
}

function resetAll() {
  GROUP_KEYS.forEach(g => { rankings[g] = GROUPS[g].map(t => ({...t})); });
  third8.clear();
  ko = {};
  renderGroupsPage();
  goTo(0);
  toast('Tournament reset - start fresh!');
}

// ══════════════════════════════════════════════════════════
//  START
// ══════════════════════════════════════════════════════════
init();