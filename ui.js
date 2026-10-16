/* Right of Way — browser UI (vanilla JS, no modules so it runs from file://) */
(function () {
'use strict';
const R = window.ROW;
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const C = 50, M = 34, W = M * 2 + 12 * C;
const ZCOL = { SFD: '#f6e7a8', DUP: '#f3d98b', CC: '#f0c96c', TH: '#ecb35a', MP: '#e39b4a', MR: '#d9773a', HR: '#c4552c', MU: '#c98bd6', NC: '#8ec5f0', OF: '#4f86c6', LI: '#bdbdbd', HI: '#7d7d7d', PK: '#8fd18f', HQ: '#9fb3c8', ST: '#5fb35f' };
const MODE_LABEL = { bike: 'Bike lane', road: 'Road', bus: 'Bus', ferry: 'Ferry', lr: 'Light rail', hwy: 'Freight road' };
let S = null;
const ui = { mode: null, tab: 'act', undo: [], revealed: null, aiTimer: null, speed: 400, seenReport: 0, err: '', homeSel: null, logFilter: 'all', overShown: false, secret: {} };
const col = pid => R.PLAYER_COLORS[pid].hex;
const tint = pid => R.PLAYER_COLORS[pid].tint;
const pname = pid => `<span class="pdot" style="background:${col(pid)}"></span><b>${esc(S.players[pid].name)}</b>`;
const humans = () => S.players.filter(p => p.kind === 'human');
const fmt = v => (v >= 0 ? '+' : '−') + '$' + Math.abs(v);
const NX = x => M + x * C;

function save() { try { localStorage.setItem('row-save', JSON.stringify(S)); } catch (e) { } }
function load() { try { const s = localStorage.getItem('row-save'); return s ? JSON.parse(s) : null; } catch (e) { return null; } }

function doAct(pid, a, opts) {
  ui.err = '';
  const pd = R.pending(S);
  const snap = JSON.stringify(S);
  try { R.act(S, pid, a); }
  catch (e) { ui.err = e.message; render(); return false; }
  const human = S.players[pid].kind === 'human';
  if (ui.undo.length && ui.undo[ui.undo.length - 1].pid !== pid) ui.undo = [];
  if (human && pd && pd.type === 'action' && humans().length) ui.undo.push({ snap, pid, round: S.round }); else ui.undo = [];
  if (!(opts && opts.keepMode)) ui.mode = null;
  refresh(); return true;
}
function refresh() {
  save(); clearTimeout(ui.aiTimer);
  if (ui.modalKind === 'secret' || ui.modalKind === 'dialog') hideModal();
  const pd = R.pending(S);
  if (ui.undo.length && (!pd || pd.type !== 'action' || S.round !== ui.undo[ui.undo.length - 1].round)) ui.undo = [];
  render();
  if (S.phase === 'over') { if (!ui.overShown) { ui.overShown = true; showSummary(true); } return; }
  if (S.reports.length > ui.seenReport && humans().length) { ui.seenReport = S.reports.length; showSummary(false); return; }
  ui.seenReport = S.reports.length;
  if (!pd) return;
  const p = S.players[pd.pid];
  if (p.kind === 'ai') { ui.aiTimer = setTimeout(aiStep, ui.speed); return; }
  if (pd.secret) {
    const key = `${pd.type}:${pd.pid}:${S.round}`;
    if (humans().length > 1 && ui.revealed !== key) return showHandoff(pd, key);
    return showSecret(pd);
  }
  hideModal(); setTab('act');
}
function aiStep() {
  if (!$('modal').classList.contains('hidden') && !ui.modalAllowsAI) return;
  const pd = R.pending(S); if (!pd || S.players[pd.pid].kind !== 'ai') return;
  try { R.runAI(S, 1); } catch (e) { console.error(e); ui.err = 'AI error: ' + e.message; }
  refresh();
}
function showModal(html, allowAI, kind) { $('modalBox').innerHTML = html; $('modal').classList.remove('hidden'); ui.modalAllowsAI = !!allowAI; ui.modalKind = kind || 'dialog'; }
function hideModal() { $('modal').classList.add('hidden'); ui.modalKind = null; }
function showHandoff(pd, key) {
  const what = { partners: 'Secret partner selection', bid: 'Secret Zoning Board bid', election: 'Secret campaign contribution', hq: 'Secret HQ pledge & incentive', stadium: 'Secret Stadium bid' }[pd.type] || 'Secret choice';
  showModal(`<div class="handoff"><h2>Pass the device to ${pname(pd.pid)}</h2><p class="muted">${what} — other players look away.</p>
  <button class="primary" data-a="reveal" data-k="${key}">I am ${esc(S.players[pd.pid].name)} — show my choice</button></div>`, false, 'secret');
}
function partnerCard(kind, id, chosen) {
  const c = kind === 'eng' ? R.ENGINEERS[id] : R.CONTRACTORS[id];
  return `<div class="card pick ${chosen ? 'chosen' : ''}" data-a="pickPartner" data-kind="${kind}" data-id="${id}">
  <div class="t">${id} ${esc(c.name)} ${c.star ? '★' : ''} <span class="chip">${esc(c.mode)}</span></div>
  <div><span class="okc">Ability:</span> ${esc(c.ability)}</div><div><span class="err">Drawback:</span> ${esc(c.drawback)}</div></div>`;
}
function adjLots(l) { const [c, r] = R.parseK(l); return [[c + 1, r], [c, r + 1]].filter(([a, b]) => a < 12 && b < 12).map(([a, b]) => a + ':' + b); }
function councilMiniHTML() {
  return `<h4>This game's councils</h4><div class="councils">${S.councils.map((c, d) => `<div class="council"><b>${R.DISTRICTS[d]}</b><br>${c.map(b => `<span class="tok" title="${esc(R.BOARDS[b])}">${b}</span>`).join('')}</div>`).join('')}</div>`;
}
function showSecret(pd) {
  const p = S.players[pd.pid]; const key = pd.type + pd.pid + S.round;
  if (ui.secret.key !== key) ui.secret = { key };
  const sc = ui.secret;
  let h = `<h2>${pname(pd.pid)} — `;
  if (pd.type === 'partners') {
    h += `hire your partners</h2><p class="muted">Keep 1 Engineering Consultant and 1 Contractor. The councils are already seated — choose partners that fit the map.</p>
    <div class="grid2"><div><h3>Engineering Consultant (how it works)</h3>${pd.offer.eng.map(e => partnerCard('eng', e, sc.eng === e)).join('')}</div>
    <div><h3>Contractor (how much / how fast)</h3>${pd.offer.con.map(c => partnerCard('con', c, sc.con === c)).join('')}</div></div>
    ${councilMiniHTML()}<div class="row"><button class="primary" data-a="submitPartners" ${sc.eng && sc.con ? '' : 'disabled'}>Hire these partners</button></div>`;
  } else if (pd.type === 'bid' || pd.type === 'stadium') {
    sc.amount = sc.amount === undefined ? 0 : Math.min(sc.amount, p.cash);
    h += pd.type === 'bid' ? `Zoning Board bid</h2><p>Secretly bid any amount of your cash ($${p.cash}). Bids go to the bank. Highest bidder goes first and picks a Permit first; ties go to lower ${S.opts.victory === 'networth' ? 'Net Worth' : 'Progress'}.</p>
    <h4>Permits on offer</h4>${S.permitMarket.map(c => `<div class="card"><b>${esc(R.PERMIT_INFO[c].name)}</b> — ${esc(R.PERMIT_INFO[c].text)}</div>`).join('')}`
      : `Stadium Deal bid</h2><p>Blind bid. The winner pays and places a free Stadium (counts as a Park + 4 job slots at $1).</p>`;
    h += `<div class="row"><button data-a="bidAdj" data-d="-1">−</button><input id="bidAmt" type="number" min="0" max="${p.cash}" value="${sc.amount}" style="width:80px"><button data-a="bidAdj" data-d="1">+</button>
    <button class="primary" data-a="submitBid">Lock in bid</button></div>`;
  } else if (pd.type === 'election') {
    sc.cand = sc.cand === undefined ? 0 : sc.cand; sc.amount = sc.amount || 0;
    h += `Election</h2><p>Back one candidate and secretly contribute $0–$6. Votes = cash + 1 endorsement per district where you are Favored/Champion that seats one of the candidate's Allied Boards.</p><div class="grid2">` +
      pd.candidates.map((m, i) => { const X = R.MAYORS[m]; return `<div class="card pick ${sc.cand === i ? 'chosen' : ''}" data-a="pickCand" data-i="${i}"><div class="t">${esc(X.name)} — “${esc(X.platform)}”</div><div><b>Policy:</b> ${esc(X.policy)}</div><div><b>Mandate:</b> ${esc(X.mandate)}</div><div><b>Allies:</b> ${X.allies.map(b => `<span class="tok">${b}</span>`).join('')}</div><div class="muted">Your endorsements: ${R.endorsements(S, pd.pid, m)}</div></div>`; }).join('') +
      `</div><div class="row">Contribution: <input id="elAmt" type="number" min="0" max="${Math.min(6, p.cash)}" value="${sc.amount}" style="width:70px"> <button class="primary" data-a="submitElection">Submit</button></div>`;
  } else if (pd.type === 'hq') {
    const sites = []; for (const l of R.BOARD.lots) for (const m of adjLots(l)) { const site = [l, m]; if (!R.hqSiteErrors(S, pd.pid, site).length) sites.push(site); }
    sc.pledge = sc.pledge === undefined ? 6 : sc.pledge; sc.inc = sc.inc || 0;
    const scored = sites.map(s => ({ s, sc: R.hqScore(S, pd.pid, { site: s, pledge: sc.pledge, incentive: sc.inc }) })).sort((a, b) => b.sc.total - a.sc.total).slice(0, 25);
    if (!sc.site || !scored.some(x => x.s.join() === sc.site.join())) sc.site = scored[0] && scored[0].s;
    const cur = scored.find(x => sc.site && x.s.join() === sc.site.join());
    const co = R.CORPS[S.corp];
    h += `Corporate Relocation: ${esc(co.name)}</h2><p><b>Site requirement:</b> ${esc(co.req)} <b>Preference (+2):</b> ${esc(co.pref)} ${co.special ? '<b>Special:</b> ' + esc(co.special) : ''}</p>
    <p class="muted">Nominate 2 adjacent empty lots, a Housing Pledge (Pop you must add within radius 2 by Round ${S.opts.pledgeRound} City Hall) and an Incentive ($0–$9, max 3 points). The Host gets the HQ free and +4 Pop; missing the Pledge loses the bonus and 2 standing.</p>` +
      (scored.length ? `<div class="row">Site: <select id="hqSite">${scored.map(x => `<option value="${x.s.join(',')}" ${sc.site && x.s.join() === sc.site.join() ? 'selected' : ''}>${x.s.map(R.lotName).join('–')} (${R.DISTRICTS[R.lotDistrict(x.s[0])]}) — score ${x.sc.total}</option>`).join('')}</select></div>
      <div class="row">Pledge: <select id="hqPledge">${[0, 2, 4, 6, 8, 10].map(v => `<option ${v === sc.pledge ? 'selected' : ''}>${v}</option>`).join('')}</select> Incentive $<input id="hqInc" type="number" min="0" max="${Math.min(9, p.cash)}" value="${sc.inc}" style="width:60px"> <button data-a="hqRecalc">Recalculate</button></div>
      ${cur ? `<table class="bd">${cur.sc.rows.map(r => `<tr><td>${esc(r[0])}</td><td class="n">${r[1]}</td></tr>`).join('')}<tr><th>Total</th><th class="n">${cur.sc.total}</th></tr></table>` : ''}
      <div class="row"><button class="primary" data-a="submitHQ">Submit bid</button><button data-a="passHQ">Pass</button></div>`
        : `<p class="err">You have no qualifying site.</p><button class="primary" data-a="passHQ">Pass</button>`);
  }
  if (ui.err) h += `<p class="err">${esc(ui.err)}</p>`;
  showModal(h, false, 'secret');
}
// ---------------- board ----------------
const MODE_OFF = { road: 0, bike: -7, hwy: 7, bus: -3, lr: 4, hr: 10 };
const MODE_STYLE = { road: ['#555', 5, ''], bike: ['#2ca02c', 2.5, '4 3'], hwy: ['#8e44ad', 7, ''], bus: ['#e67e22', 2.5, '1 3'], lr: ['#16a085', 3.5, ''] };
function edgeXY(e, off) {
  const [a, b] = R.edgeNodes(e); const [x1, y1] = R.parseK(a), [x2, y2] = R.parseK(b);
  const h = y1 === y2; off = off || 0;
  return { x1: NX(x1) + (h ? 0 : off), y1: NX(y1) + (h ? off : 0), x2: NX(x2) + (h ? 0 : off), y2: NX(y2) + (h ? off : 0) };
}
function line(e, off, stroke, w, dash, extra) { const p = edgeXY(e, off); return `<line x1="${p.x1}" y1="${p.y1}" x2="${p.x2}" y2="${p.y2}" stroke="${stroke}" stroke-width="${w}" ${dash ? `stroke-dasharray="${dash}"` : ''} stroke-linecap="round" ${extra || ''}/>`; }
function renderBoard() {
  const svg = $('board'); svg.setAttribute('viewBox', `0 0 ${W} ${W}`);
  const ev = R.evalCity(S); const h = [];
  // lots
  for (const l of R.BOARD.lots) {
    const [c, r] = R.parseK(l); const x = M + c * C, y = M + r * C;
    const river = R.BOARD.river.has(l);
    h.push(`<rect class="lot" data-lot="${l}" x="${x}" y="${y}" width="${C}" height="${C}" fill="${river ? '#9ccbec' : R.BOARD.water.has(l) ? '#eef6f2' : '#f7f5ef'}" stroke="#ddd"/>`);
    if (S.reserves[l]) h.push(`<rect x="${x + 3}" y="${y + 3}" width="${C - 6}" height="${C - 6}" fill="none" stroke="${col(S.reserves[l].pid)}" stroke-dasharray="3 3"/>`);
  }
  // districts
  for (let d = 0; d < 9; d++) {
    const x = M + (d % 3) * 4 * C, y = M + Math.floor(d / 3) * 4 * C;
    h.push(`<rect x="${x}" y="${y}" width="${4 * C}" height="${4 * C}" fill="none" stroke="#999" stroke-width="2"/>`);
    h.push(`<text class="dname" x="${x + 4}" y="${y + 4 * C - 4}">${R.DISTRICTS[d]} ${S.councils[d].map(b => `[${b}]`).join('')}</text>`);
  }
  // zones
  for (const id in S.zones) {
    const z = S.zones[id]; const ls = z.lots.map(R.parseK);
    const c0 = Math.min(...ls.map(a => a[0])), r0 = Math.min(...ls.map(a => a[1])), c1 = Math.max(...ls.map(a => a[0])), r1 = Math.max(...ls.map(a => a[1]));
    const x = M + c0 * C + 4, y = M + r0 * C + 4, w = (c1 - c0 + 1) * C - 8, hh = (r1 - r0 + 1) * C - 8;
    const zi = ev.Z[id] || {}; const own = z.owner;
    h.push(`<g class="zone" data-zone="${id}"><rect x="${x}" y="${y}" width="${w}" height="${hh}" rx="4" fill="${ZCOL[z.type] || '#ccc'}" stroke="${own === null || own === undefined ? '#333' : col(own)}" stroke-width="3"/>
      <text class="zt" x="${x + w / 2}" y="${y + hh / 2 - 2}">${R.ZT[z.type].abbr}${z.decline ? '↓' : ''}</text>
      <text class="zs" x="${x + w / 2}" y="${y + hh / 2 + 11}">${zi.pop ? zi.pop + 'p' : ''}${zi.slots ? ' ' + (zi.filled || 0) + '/' + zi.slots + 'j' : ''}</text></g>`);
  }
  // bridge sites, connectors
  for (const e of R.BOARD.bridgeSites) h.push(line(e, 0, '#c9a227', 12, '', 'opacity="0.35"'));
  for (const n of R.BOARD.connectors) { const [x, y] = R.parseK(n); h.push(`<circle cx="${NX(x)}" cy="${NX(y)}" r="10" fill="#fff" stroke="#8e44ad" stroke-width="2"/><text class="zt" x="${NX(x)}" y="${NX(y) + 4}">M</text>`); }
  // edges
  for (const e in S.edges) for (const m in S.edges[e]) {
    const st = MODE_STYLE[m]; if (!st) continue; const pid = S.edges[e][m];
    const building = S.build[R.opKey('e', e, m)];
    h.push(line(e, MODE_OFF[m], m === 'road' || m === 'hwy' ? st[0] : col(pid), st[1], building ? '2 4' : st[2], `opacity="${building ? 0.55 : 1}"`));
    if (m === 'road' || m === 'hwy') h.push(line(e, MODE_OFF[m], col(pid), 1.2, ''));
  }
  // lines
  for (const id in S.lines) {
    const L = S.lines[id]; const pid = L.owner;
    if (L.mode === 'bus') for (const e of L.edges) h.push(line(e, MODE_OFF.bus, col(pid), 2.5, '1 4'));
    if (L.mode === 'shuttle' || L.mode === 'river') { for (let i = 0; i + 1 < L.stops.length; i++) { const [x1, y1] = R.parseK(L.stops[i]), [x2, y2] = R.parseK(L.stops[i + 1]); h.push(`<path d="M${NX(x1)},${NX(y1)} Q${(NX(x1) + NX(x2)) / 2 + 15},${(NX(y1) + NX(y2)) / 2} ${NX(x2)},${NX(y2)}" stroke="${col(pid)}" stroke-width="2.5" fill="none" stroke-dasharray="6 3"/>`); } }
    L.stops.forEach(n => {
      const [x, y] = R.parseK(n); const big = L.mode === 'lr';
      const sym = L.mode === 'bus' ? 'B' : L.mode === 'lr' ? 'L' : '⛴';
      const b = S.build['S:' + n];
      h.push(`<g class="stop" data-node="${n}"><circle cx="${NX(x)}" cy="${NX(y)}" r="${big ? 9 : 7}" fill="#fff" stroke="${col(pid)}" stroke-width="2.5" ${b ? 'stroke-dasharray="2 2"' : ''}/><text class="st" x="${NX(x)}" y="${NX(y) + 3.5}">${sym}</text></g>`);
    });
  }
  for (const n in S.ics) { const [x, y] = R.parseK(n); h.push(`<rect x="${NX(x) - 7}" y="${NX(y) - 7}" width="14" height="14" transform="rotate(45 ${NX(x)} ${NX(y)})" fill="#8e44ad" stroke="${col(S.ics[n])}" stroke-width="2.5"/>`); }
  // labels
  for (let c = 0; c < 12; c++) h.push(`<text class="lab" x="${M + c * C + C / 2}" y="${M - 8}">${R.COLS[c]}</text>`);
  for (let r = 0; r < 12; r++) h.push(`<text class="lab" x="${M - 14}" y="${M + r * C + C / 2 + 4}">${r + 1}</text>`);
  h.push(overlay());
  svg.innerHTML = h.join('');
}
// selection overlay + hit targets for builders
function overlay() {
  const m = ui.mode; const h = [];
  if (!m) return '';
  const pid = curPid();
  if (m.kind === 'zone' || m.kind === 'home' || m.kind === 'pickLots') {
    for (const l of m.legal || []) { const [c, r] = R.parseK(l); h.push(`<rect class="hit legal" data-lot="${l}" x="${M + c * C + 1}" y="${M + r * C + 1}" width="${C - 2}" height="${C - 2}"/>`); }
    for (const l of m.lots || []) { const [c, r] = R.parseK(l); h.push(`<rect class="sel" x="${M + c * C + 2}" y="${M + r * C + 2}" width="${C - 4}" height="${C - 4}"/>`); }
  }
  if (m.kind === 'zonePick') for (const id of m.legal) { const z = S.zones[id]; for (const l of z.lots) { const [c, r] = R.parseK(l); h.push(`<rect class="hit legal" data-zone="${id}" x="${M + c * C + 1}" y="${M + r * C + 1}" width="${C - 2}" height="${C - 2}"/>`); } }
  if (m.kind === 'transit') {
    for (const e of m.legalE || []) h.push(line(e, 0, 'rgba(46,204,113,.55)', 9, '', `class="hit hitE" data-edge="${e}"`));
    for (const e of m.edges || []) h.push(line(e, 0, col(pid), 6, '', 'class="selE" pointer-events="none"'));
    for (const n of m.legalN || []) { const [x, y] = R.parseK(n); h.push(`<circle class="hit legalN" data-node="${n}" cx="${NX(x)}" cy="${NX(y)}" r="7"/>`); }
    for (const n of (m.stations || []).concat(m.ics || [], m.docks || [])) { const [x, y] = R.parseK(n); h.push(`<circle cx="${NX(x)}" cy="${NX(y)}" r="9" fill="none" stroke="${col(pid)}" stroke-width="3" pointer-events="none"/>`); }
  }
  return h.join('');
}
function curPid() { const pd = R.pending(S); return pd ? pd.pid : 0; }
// ---------------- builders (legal-move highlighting + cost preview) ----------------
const SOFT = /at least 1 stop|^Select|stations yet|Select track|Select highway|Choose a ferry/i;
const softOk = pv => pv.errors.every(e => SOFT.test(e));
function tSpec(m, extra) {
  const s = { mode: m.mode, edges: (m.edges || []).slice(), bonus: m.bonus || undefined, grant: m.grant || undefined, free: m.free || undefined };
  if (m.mode === 'bus') { s.stations = (m.stations || []).slice(); if (m.line) s.line = m.line; }
  if (m.mode === 'lr') s.stations = (m.stations || []).slice();
  if (m.mode === 'ferry') {
    s.mode = m.fkind || 'shuttle';
    if (m.fop === 'open') s.ops = [{ op: 'open', kind: m.fkind || 'shuttle', docks: (m.docks || []).slice() }];
    else if (m.fop === 'dock') s.ops = (m.docks || []).map(n => ({ op: 'dock', line: m.line, node: n }));
    else s.ops = [{ op: 'boat', line: m.line }];
    delete s.edges;
  }
  if (extra) { if (extra.e) s.edges = s.edges.concat([extra.e]); if (extra.n) { const k = m.mode === 'hwy' ? 'ics' : 'stations'; s[k] = (s[k] || []).concat([extra.n]); } }
  return s;
}
function computeLegal() {
  const m = ui.mode; if (!m) return; const pid = curPid();
  if (m.kind === 'transit') {
    m.legalE = []; m.legalN = [];
    if (m.mode === 'ferry') {
      if (m.fop !== 'boat') for (const n of R.BOARD.riverbank) if (!(m.docks || []).includes(n)) m.legalN.push(n);
    } else {
      for (const e of R.BOARD.edges) { if (m.edges.includes(e)) continue; if (softOk(R.previewTransit(S, pid, tSpec(m, { e })))) m.legalE.push(e); }
      if (['bus', 'lr'].includes(m.mode)) {
        const L = m.mode === 'bus' ? (m.line ? S.lines[m.line] : null) : R.linesOf(S, pid, [m.mode])[0];
        const ns = new Set(m.edges.flatMap(R.edgeNodes)); if (L) L.edges.forEach(e => R.edgeNodes(e).forEach(n => ns.add(n)));
        const sel = m.stations;
        for (const n of ns) if (!sel.includes(n) && softOk(R.previewTransit(S, pid, tSpec(m, { n })))) m.legalN.push(n);
      }
    }
  } else if (m.kind === 'zone' || m.kind === 'pickLots') {
    const T = m.kind === 'zone' ? R.ZT[m.type] : null; m.legal = [];
    const sp = lots => R.previewZone(S, pid, { type: m.type, lots, permit: m.permit || undefined });
    const free = l => !R.BOARD.river.has(l) && !S.lotZone[l];
    for (const l of R.BOARD.lots) {
      if (m.lots.includes(l) || !free(l)) continue;
      if (m.kind === 'pickLots') { if (m.lots.length < m.max) m.legal.push(l); continue; }
      if (T.lots === 1) { if (sp([l]).ok) m.legal.push(l); }
      else if (m.lots.length === 1) { if (sp([m.lots[0], l]).ok) m.legal.push(l); }
      else if (adjLots(l).concat(adjLotsBack(l)).some(x => free(x) && sp([l, x]).ok)) m.legal.push(l);
    }
  }
}
function adjLotsBack(l) { const [c, r] = R.parseK(l); return [[c - 1, r], [c, r - 1]].filter(([a, b]) => a >= 0 && b >= 0).map(([a, b]) => a + ':' + b); }
function startMode(m) { ui.err = ''; ui.mode = Object.assign({ edges: [], stations: [], ics: [], docks: [], lots: [] }, m); computeLegal(); render(); }
function modePreview() {
  const m = ui.mode; const pid = curPid(); if (!m) return null;
  if (m.kind === 'transit') return R.previewTransit(S, pid, tSpec(m));
  if (m.kind === 'zone') return m.lots.length ? R.previewZone(S, pid, { type: m.type, lots: m.lots, permit: m.permit || undefined }) : null;
  return null;
}
function boardClick(ev) {
  const t = ev.target.closest('[data-edge],[data-node],[data-lot],[data-zone]'); if (!t) return;
  const m = ui.mode;
  if (!m) { if (t.dataset.zone) showZoneInfo(t.dataset.zone); return; }
  if (m.kind === 'transit') {
    if (t.dataset.edge) { const e = t.dataset.edge; const i = m.edges.indexOf(e); i >= 0 ? m.edges.splice(i, 1) : m.edges.push(e); }
    else if (t.dataset.node) {
      const n = t.dataset.node; const arr = m.mode === 'ferry' ? m.docks : m.mode === 'hwy' ? m.ics : m.stations;
      const i = arr.indexOf(n); if (i >= 0) arr.splice(i, 1); else { if (m.mode === 'ferry' && m.fop === 'open' && arr.length >= 2) arr.shift(); arr.push(n); }
    } else return;
    computeLegal(); render(); return;
  }
  if ((m.kind === 'zone' || m.kind === 'pickLots') && t.dataset.lot) {
    const l = t.dataset.lot; const i = m.lots.indexOf(l);
    if (i >= 0) m.lots.splice(i, 1); else if ((m.legal || []).includes(l)) m.lots.push(l); else return;
    computeLegal(); render(); return;
  }
  if (m.kind === 'zonePick' && t.dataset.zone && m.legal.includes(t.dataset.zone)) { m.onPick(t.dataset.zone); return; }
}
function commitMode() {
  const m = ui.mode; const pid = curPid();
  if (m.kind === 'transit') {
    const spec = tSpec(m);
    if (m.free === 'BKS') return doAct(pid, { type: 'permit', code: 'BKS', edges: spec.edges });
    return doAct(pid, { type: 'transit', spec });
  }
  if (m.kind === 'zone') return doAct(pid, { type: 'zone', spec: { type: m.type, lots: m.lots, permit: m.permit || undefined } });
  if (m.kind === 'pickLots') return m.onDone(m.lots);
}
function showZoneInfo(id) {
  const z = S.zones[id]; const ev = R.evalCity(S); const zi = ev.Z[id] || {};
  let h = `<h2>${esc(R.zoneLabel(S, z))}</h2>`;
  if (zi.parts && zi.parts.length) h += `<h4>Population ${zi.pop}</h4><table class="bd">${zi.parts.map(r => `<tr><td>${esc(r[0])}</td><td class="n">${r[1]}</td></tr>`).join('')}</table>`;
  if (zi.taxParts && zi.taxParts.length) h += `<h4>Property tax $${zi.tax}</h4><table class="bd">${zi.taxParts.map(r => `<tr><td>${esc(r[0])}</td><td class="n">${r[1]}</td></tr>`).join('')}</table>`;
  if (zi.slots) h += `<h4>Jobs ${zi.filled}/${zi.slots} filled — $${zi.job}</h4>`;
  if (z.workers && z.workers.length) h += `<h4>Commuters</h4><ul>${z.workers.map(w => `<li>${w.job ? '→ ' + esc(R.zoneLabel(S, S.zones[w.job] || { owner: null, type: 'NC', lots: [] })) + (w.route && w.route.length ? ' via ' + esc(w.route.map(x => x.mode || x).join(' + ')) : ' (walk)') : '<i>unemployed</i>'}</li>`).join('')}</ul>`;
  h += `<div class="row"><button data-a="close">Close</button></div>`;
  showModal(h, true, 'info');
}
// ---------------- turn panel ----------------
function bdTable(pv) {
  if (!pv) return '';
  let h = `<table class="bd">${pv.breakdown.map(r => `<tr><td>${esc(r[0])}</td><td class="n">${r[1] < 0 ? '−$' + (-r[1]) : '$' + r[1]}</td></tr>`).join('')}`;
  if (pv.cost !== undefined) h += `<tr><th>Cost</th><th class="n">$${pv.cost}</th></tr>`;
  if (pv.gain) h += `<tr><th>Gain</th><th class="n">+$${pv.gain}</th></tr>`;
  h += '</table>';
  if (pv.markers && pv.markers.length) h += `<div class="muted">Build time: ${Math.max(...pv.markers.map(x => x.n))} round(s) until operational</div>`;
  if (pv.reactions && pv.reactions.length) h += `<div class="muted">Council reactions: ${pv.reactions.map(esc).join('; ')}</div>`;
  if (pv.errors.length) h += `<ul class="err">${pv.errors.slice(0, 4).map(e => `<li>${esc(e)}</li>`).join('')}</ul>`;
  return h;
}
function modePanel() {
  const m = ui.mode; const pid = curPid(); const p = S.players[pid];
  let h = `<div class="modebox"><h3>${esc(m.title || '')}</h3><p class="muted">${esc(m.help || '')}</p>`;
  if (m.kind === 'transit' && m.mode === 'ferry') {
    const fl = R.linesOf(S, pid, ['shuttle', 'river']);
    h += `<div class="row"><button data-a="fop" data-v="open" class="${m.fop === 'open' ? 'on' : ''}">Open route</button>${fl.length ? `<button data-a="fop" data-v="dock" class="${m.fop === 'dock' ? 'on' : ''}">Add dock</button><button data-a="fop" data-v="boat" class="${m.fop === 'boat' ? 'on' : ''}">Add boat</button>` : ''}</div>`;
    if (m.fop !== 'open') h += `<div class="row">Route: <select id="ferryLine">${fl.map(L => `<option value="${L.id}" ${m.line === L.id ? 'selected' : ''}>${esc(R.lineLabel(S, L))}</option>`).join('')}</select></div>`;
  }
  if (m.kind === 'transit' && m.mode !== 'ferry' && R.FARE[m.mode] !== undefined && p.permits.includes('FTG') && ['lr'].includes(m.mode)) h += `<label><input type="checkbox" id="useGrant" ${m.grant ? 'checked' : ''}> Use Federal Transit Grant (−$6)</label>`;
  if (m.kind === 'zone' && (p.permits.includes('CLT') || p.permits.includes('PRP'))) h += `<div class="row">Permit: <select id="zonePermit"><option value="">none</option>${['CLT', 'PRP'].filter(c => p.permits.includes(c)).map(c => `<option value="${c}" ${m.permit === c ? 'selected' : ''}>${R.PERMIT_INFO[c].name}</option>`).join('')}</select></div>`;
  if (m.kind === 'pickLots') h += `<div>Selected: ${m.lots.map(R.lotName).join(', ') || '—'}</div>`;
  h += bdTable(modePreview());
  const pv = modePreview();
  const can = m.kind === 'pickLots' ? m.lots.length >= (m.min || 1) : pv && pv.ok;
  if (m.kind === 'zonePick') return h + `<div class="row"><button data-a="cancel">Cancel</button></div></div>`;
  h += `<div class="row"><button class="primary" data-a="commit" ${can ? '' : 'disabled'}>Confirm${pv && pv.cost !== undefined && pv.ok ? ' ($' + pv.cost + ')' : ''}</button><button data-a="cancel">Cancel</button></div></div>`;
  return h;
}
function transitButtons(p, pid, bonus) {
  const modes = [['bike', 'Bike lanes'], ['road', 'Roads'], ['bus', 'Bus'], ['ferry', 'Ferry'], ['lr', 'Light rail'], ['hwy', 'Freight road']];
  return modes.filter(([k]) => !bonus || ((!bonus.mode || bonus.mode === k) && bonus.except !== k)).map(([k, n]) => {
    const era = k === 'ferry' ? 1 : R.MODES[k].era; const ok = R.availableEra(S, pid, era, k);
    if (k === 'bus') {
      const ls = R.linesOf(S, pid, ['bus']);
      return ls.map(L => `<button data-a="tmode" data-m="bus" data-line="${L.id}" ${bonus ? 'data-bonus="1"' : ''}>Extend ${esc(R.lineLabel(S, L).replace(p.name + ' ', ''))}</button>`).join('') + (ls.length < 2 ? `<button data-a="tmode" data-m="bus" ${bonus ? 'data-bonus="1"' : ''}>New bus route</button>` : '');
    }
    return `<button data-a="tmode" data-m="${k}" ${bonus ? 'data-bonus="1"' : ''} ${ok ? '' : 'disabled title="Era ' + era + '"'}>${n}</button>`;
  }).join('');
}
function zoneButtons(pid) {
  return R.ZONABLE.map(t => { const T = R.ZT[t]; const ok = R.availableEra(S, pid, T.era, t); return `<button class="zbtn" data-a="zmode" data-t="${t}" ${ok ? '' : 'disabled'} style="border-left:8px solid ${ZCOL[t]}" title="${esc(T.name)}">${T.abbr} $${T.cost}${T.pop ? ' · ' + T.pop + 'p' : ''}${T.slots ? ' · ' + T.slots + 'j' : ''}</button>`; }).join('');
}
function actionPanel(pd) {
  const pid = pd.pid; const p = S.players[pid];
  let h = `<div class="who" style="background:${tint(pid)}">${pname(pid)} — <b>${p.actionsLeft}</b> action${p.actionsLeft === 1 ? '' : 's'} left · cash <b>$${p.cash}</b></div>`;
  if (ui.err) h += `<p class="err">${esc(ui.err)}</p>`;
  if (ui.mode) return h + modePanel();
  if (p.bonus) return h + `<div class="modebox"><h3>Bonus build</h3><p>${esc(p.bonus.label)}</p><div class="btns">${transitButtons(p, pid, p.bonus)}</div><button data-a="skipBonus">Skip bonus</button></div>`;
  h += `<h4>Build Transit</h4><div class="btns">${transitButtons(p, pid)}</div>`;
  h += `<h4>Zone</h4><div class="btns zgrid">${zoneButtons(pid)}</div>`;
  h += `<h4>Other actions</h4><div class="btns"><button data-a="upzone">Upzone…</button><button data-a="consult">Consult (+$${R.previewSimple(S, pid, { type: 'consult' }).gain})</button>
    <button data-a="outreach">Outreach…</button><button data-a="finance" ${p.bonds >= 3 ? 'disabled' : ''}>Take Bond (+$8)</button>${p.bonds ? '<button data-a="repay">Repay Bond ($8)</button>' : ''}
    ${S.era >= 3 ? '<button data-a="program">Upgrade bus to BRT…</button>' : ''}</div>`;
  h += `<h4>Free actions</h4><div class="btns">${p.permits.map(c => `<button data-a="usePermit" data-c="${c}" title="${esc(R.PERMIT_INFO[c].text)}">Use ${esc(R.PERMIT_INFO[c].name)}</button>`).join('')}</div>`;
  h += `<p class="muted">Tip: click any zone on the board to see its Pop, tax and commuters.</p>`;
  return h;
}
let renderTurn = function () {
  const pd = R.pending(S); let h = '';
  if (S.phase === 'over') { h = `<div class="who win">🏆 ${pname(S.winner.pid)} wins — ${esc(S.winner.why)}</div><button class="primary" data-a="summary">Final summary</button><button data-a="newGame">New game</button>`; $('tab-act').innerHTML = h; return; }
  if (S.event) h += `<div class="event"><b>Event: ${esc(S.event.name)}</b> — ${esc(S.event.text)}</div>`;
  if (!pd) { $('tab-act').innerHTML = h + '<p>Resolving…</p>'; return; }
  const p = S.players[pd.pid];
  if (p.kind === 'ai') { $('tab-act').innerHTML = h + `<div class="who" style="background:${tint(pd.pid)}">${pname(pd.pid)} (AI, ${esc(p.persona)}) is thinking…</div>${aiControls()}`; return; }
  if (pd.secret) { $('tab-act').innerHTML = h + `<div class="who" style="background:${tint(pd.pid)}">${pname(pd.pid)} is making a secret choice</div><button data-a="reopen">Open choice</button>`; return; }
  if (pd.type === 'action') h += actionPanel(pd);
  else if (pd.type === 'home') {
    const taken = S.players.map(q => q.home);
    const d = ui.homeSel ? ui.homeSel.d : null;
    h += `<div class="who" style="background:${tint(pd.pid)}">${pname(pd.pid)} — choose your home district</div><p class="muted">You get a Duplex, a Neighborhood Commercial lot and up to 3 roads. Downtown cannot be a home.</p><div class="btns">` +
      R.DISTRICTS.map((n, i) => `<button data-a="homeD" data-d="${i}" ${i === R.DOWNTOWN || taken.includes(i) ? 'disabled' : ''} class="${d === i ? 'on' : ''}">${n} ${S.councils[i].join('+')}</button>`).join('') + '</div>';
    if (d !== null) { const lays = R.homeLayouts(S, d); h += `<div class="row">Layout ${ui.homeSel.v + 1}/${lays.length} <button data-a="homeV" data-v="-1">◀</button><button data-a="homeV" data-v="1">▶</button><button class="primary" data-a="homeGo">Place home here</button></div>`; }
  } else if (pd.type === 'petition') {
    h += `<div class="who" style="background:${tint(pd.pid)}">${pname(pd.pid)} — Petition your home council (${R.DISTRICTS[p.home]})</div><p class="muted">Optionally swap one seated Board for a random unused token (it must be legal).</p>
    <div class="btns"><button data-a="petition" data-s="-1">Keep ${S.councils[p.home].join(' + ')}</button>${S.councils[p.home].map((b, i) => `<button data-a="petition" data-s="${i}">Replace ${esc(R.BOARDS[b])}</button>`).join('')}</div>`;
  } else if (pd.type === 'permit') {
    h += `<div class="who" style="background:${tint(pd.pid)}">${pname(pd.pid)} — take a Permit (you hold ${p.permits.length}/2)</div>` + S.permitMarket.map(c => `<div class="card pick" data-a="takePermit" data-c="${c}"><b>${esc(R.PERMIT_INFO[c].name)}</b><br>${esc(R.PERMIT_INFO[c].text)}</div>`).join('');
  } else if (pd.type === 'stadium_place') {
    h += `<div class="who" style="background:${tint(pd.pid)}">${pname(pd.pid)} — place the Stadium</div>`;
    if (!ui.mode) setTimeout(() => startMode({ kind: 'pickLots', max: 1, title: 'Place Stadium', help: 'Click one empty lot', onDone: l => doAct(pd.pid, { lot: l[0] }) }), 0); else h += modePanel();
  }
  $('tab-act').innerHTML = h;
};
function aiControls() { return `<div class="row muted">AI speed: <select id="aiSpeed">${[[50, 'fast'], [400, 'normal'], [1200, 'slow']].map(([v, n]) => `<option value="${v}" ${ui.speed == v ? 'selected' : ''}>${n}</option>`).join('')}</select></div>`; }
// ---------------- mats / hall / log / status ----------------
function renderStatus() {
  const pd = R.pending(S);
  $('status').innerHTML = `Round <b>${S.round || '–'}</b>/${S.opts.rounds} · Era <b>${['I', 'II', 'III'][S.era - 1]}</b> · ${esc(S.phase.replace('_', ' '))}${S.opts.quick ? ' · quick game' : ''}${S.opts.victory === 'networth' ? ' · Net Worth $' + S.opts.nwRate + '/Pop' : ''}${pd ? ' · waiting for ' + pname(pd.pid) : ''}`;
  $('btnUndo').disabled = !ui.undo.length;
}
function renderMats() {
  const ev = R.evalCity(S);
  $('tab-mats').innerHTML = S.order.map(pid => {
    const p = S.players[pid]; const pp = R.playerPop(S, pid, ev); const prog = R.progressOf(S, pid, pp.pop, p.cash);
    const lines = Object.values(S.lines).filter(L => L.owner === pid);
    const zones = Object.values(S.zones).filter(z => z.owner === pid);
    return `<div class="mat" style="border-color:${col(pid)};background:${tint(pid)}">
    <div class="mh">${pname(pid)} ${p.kind === 'ai' ? '<span class="chip">AI ' + esc(p.persona) + '</span>' : ''} ${S.winner && S.winner.pid === pid ? '🏆' : ''}</div>
    <div class="stats">${S.opts.victory === 'networth' ? `<span>Cash <b>$${p.cash}</b></span><span>Pop <b>${pp.pop}</b></span>` : `<span>Cash <b>$${p.cash}</b>/${R.cashTarget(S)}</span><span>Pop <b>${pp.pop}</b>/${S.opts.popTarget}</span>`}${S.opts.victory === 'networth' ? `<span>Net Worth <b>$${R.netWorth(S, pid, pp.pop)}</b></span>` : `<span>Progress <b>${Math.round(prog * 100)}%</b></span>`}<span>Bonds ${p.bonds}</span></div>
    <div class="bar"><div style="width:${Math.min(100, pp.pop / S.opts.popTarget * 100)}%;background:${col(pid)}"></div></div>
    <div class="bar"><div style="width:${Math.min(100, p.cash / R.cashTarget(S) * 100)}%;background:#c9a227"></div></div>
    <div><b>Partners:</b> ${p.eng ? `<span title="${esc(R.ENGINEERS[p.eng].ability + ' | Drawback: ' + R.ENGINEERS[p.eng].drawback)}">${esc(R.ENGINEERS[p.eng].name)}</span>` : '?'} · ${p.con ? `<span title="${esc(R.CONTRACTORS[p.con].ability + ' | Drawback: ' + R.CONTRACTORS[p.con].drawback)}">${esc(R.CONTRACTORS[p.con].name)}</span>` : '?'}</div>
    <div><b>Home:</b> ${p.home === null ? '—' : R.DISTRICTS[p.home]} · <b>Permits:</b> ${p.permits.map(c => esc(R.PERMIT_INFO[c].name)).join(', ') || '—'} ${p.pilot.length ? '· <b>Pilots:</b> ' + p.pilot.join(', ') : ''}</div>
    <div class="standing">${p.standing.map((v, d) => `<span class="sd s${v}" title="${R.DISTRICTS[d]}: ${R.standingName(v)}">${R.DISTRICTS[d].slice(0, 5)} ${v > 0 ? '+' + v : v}</span>`).join('')}</div>
    <div class="muted">Zones: ${zones.map(z => R.ZT[z.type].abbr).join(' ') || '—'}<br>Lines: ${lines.map(L => esc(R.lineLabel(S, L).replace(p.name + ' ', '')) + (L.stops.length ? ` (${L.stops.length} stops)` : '')).join(', ') || '—'} · Line limit 2 bus, 2 ferry, 1 LR, 1 HR</div>
    </div>`;
  }).join('');
}
function renderHall() {
  const M_ = R.MAYORS[S.mayor]; const co = R.CORPS[S.corp]; const cg = R.congestion(S);
  let h = `<h3>Mayor: ${esc(M_.name)} — “${esc(M_.platform)}”</h3><p><b>Policy:</b> ${esc(M_.policy)}<br><b>Mandate:</b> ${esc(M_.mandate)}<br><b>Allies:</b> ${M_.allies.map(b => R.BOARDS[b]).join(', ')}</p>`;
  if (S.event) h += `<h3>Event: ${esc(S.event.name)}</h3><p>${esc(S.event.text)}</p>`;
  h += `<h3>Corporate Relocation (Round ${S.opts.hqRound}): ${esc(co.name)}</h3><p>${esc(co.req)} · Preference: ${esc(co.pref)}</p>`;
  h += `<h3>Councils (advisory boards)</h3><table class="bd"><tr><th>District</th><th>Boards</th><th>Congestion</th>${S.players.map(p => `<th style="color:${col(p.id)}">${esc(p.name)}</th>`).join('')}</tr>` +
    R.DISTRICTS.map((n, d) => `<tr><td>${n}</td><td>${S.councils[d].map(b => `<span class="tok" title="${esc(R.BOARDS[b])}">${b}</span>`).join('')}</td><td>${cg.cnt ? cg.cnt[d] + '/' + cg.limit[d] : ''}${cg.congested && cg.congested[d] ? ' 🚗' : ''}</td>${S.players.map(p => `<td class="s${p.standing[d]}">${p.standing[d]}</td>`).join('')}</tr>`).join('') + '</table>';
  h += `<h3>Boards</h3><ul>${Object.entries(R.BOARDS).map(([k, v]) => `<li><span class="tok">${k}</span> ${esc(v)}</li>`).join('')}</ul>`;
  h += `<h3>Projects under construction</h3><ul>${S.projects.map(pj => `<li style="color:${col(pj.owner)}">${esc(pj.label)}</li>`).join('') || '<li>none</li>'}</ul>`;
  if (S.opts.victory === 'networth') h += `<p class="muted"><b>Victory: Net Worth.</b> No instant win; the game ends after Round ${S.opts.rounds}. Winner = highest cash + Pop × $${S.opts.nwRate} − $${S.opts.bondValue} per Bond (rulebook tiebreakers).</p>`; else
  h += `<p class="muted"><b>Race to Target variant:</b> ${S.opts.popTarget} Pop (with $${S.opts.cashMinForPop}+) or $${R.cashTarget(S)} (with ${S.opts.popMinForCash}+ Pop). Otherwise highest Progress after Round ${S.opts.rounds}.</p>`;
  $('tab-hall').innerHTML = h;
}
function renderLog() {
  const f = ui.logFilter;
  const items = S.log.filter(e => f === 'all' || (f === 'cash' ? e.cls === 'cash' : f === 'stand' ? e.cls === 'stand' : e.cls !== 'cash')).slice(-400).reverse();
  $('tab-log').innerHTML = `<div class="row">${['all', 'events', 'cash', 'stand'].map(k => `<button data-a="logf" data-v="${k}" class="${f === k ? 'on' : ''}">${k}</button>`).join('')}</div>` +
    items.map(e => `<div class="le ${e.cls}" ${e.pid !== null ? `style="border-left:4px solid ${col(e.pid)}"` : ''}><span class="muted">R${e.r}</span> ${esc(e.msg)}</div>`).join('');
}
function render() {
  if (!S) return;
  renderStatus(); renderBoard(); renderTurn(); renderMats(); renderHall(); if (ui.tab === 'log') renderLog();
  $('legend').innerHTML = Object.entries(MODE_STYLE).map(([k, s]) => `<span><svg width="26" height="10"><line x1="1" y1="5" x2="25" y2="5" stroke="${s[0]}" stroke-width="${Math.min(s[1], 5)}" stroke-dasharray="${s[2]}"/></svg>${MODE_LABEL[k]}</span>`).join('') + '<span>B/L/⛴ stops</span><span>dashed = under construction</span>';
}
function setTab(t) { ui.tab = t; document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t)); document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.id === 'tab-' + t)); if (t === 'log') renderLog(); }
// ---------------- income summary ----------------
function showSummary(final) {
  const rep = S.reports[S.reports.length - 1];
  let h = final ? `<h2>🏆 ${pname(S.winner.pid)} wins</h2><p>${esc(S.winner.why)}</p>` : '';
  if (!rep) { showModal(h + '<p>No income round yet.</p><button data-a="close">Close</button>', true, 'summary'); return; }
  h += `<h2>Round ${rep.round} — income breakdown</h2><div class="sumgrid">`;
  for (const pid of S.order) {
    const r = rep.rows[pid]; if (!r) continue; const sum = a => (a || []).reduce((x, t) => x + t[1], 0);
    h += `<div class="mat" style="border-color:${col(pid)}"><div class="mh">${pname(pid)}</div><table class="bd">
    <tr><td>Cash before income</td><td class="n">$${r.cashBeforeIncome}</td></tr>
    <tr><td>Property tax</td><td class="n">$${r.tax}</td></tr>${(r.taxParts || []).slice(0, 8).map(t => `<tr class="sub"><td>${esc(t[0])}</td><td class="n">${t[1]}</td></tr>`).join('')}
    <tr><td>Wages</td><td class="n">$${r.wages}</td></tr><tr><td>Job slots</td><td class="n">$${r.jobs}</td></tr>${(r.jobParts || []).slice(0, 8).map(t => `<tr class="sub"><td>${esc(t[0])}</td><td class="n">${t[1]}</td></tr>`).join('')}
    <tr><td>Gross</td><td class="n">$${r.gross}</td></tr><tr><td>Overhead</td><td class="n">−$${r.gross - r.afterOH}</td></tr>
    ${(r.transfers || []).map(t => `<tr><td>${esc(t[0])}</td><td class="n">${fmt(t[1])}</td></tr>`).join('')}
    ${(r.upkeep || []).map(t => `<tr><td>Upkeep: ${esc(t[0])}</td><td class="n">−$${t[1]}</td></tr>`).join('')}
    ${r.interest ? `<tr><td>Bond interest</td><td class="n">−$${r.interest}</td></tr>` : ''}
    <tr><th>Net income</th><th class="n">${fmt(r.net)}</th></tr><tr><th>Cash after</th><th class="n">$${r.cashAfter}</th></tr>
    ${r.forcedBonds ? `<tr class="err"><td>Forced bonds</td><td class="n">${r.forcedBonds}</td></tr>` : ''}
    <tr><td>Population</td><td class="n">${r.popAfter !== undefined ? r.popAfter : '?'}</td></tr>${r.netWorth !== undefined ? `<tr><th>Net Worth</th><th class="n">$${r.netWorth}</th></tr>` : `<tr><td>Progress</td><td class="n">${r.progress !== undefined ? Math.round(r.progress * 100) + '%' : '?'}</td></tr>`}</table>
    ${r.ledger && r.ledger.items && r.ledger.items.length ? `<details><summary>Spending this round (${fmt(sum(r.ledger.items))})</summary><table class="bd">${r.ledger.items.map(t => `<tr><td>${esc(t[0])}</td><td class="n">${fmt(t[1])}</td></tr>`).join('')}</table></details>` : ''}</div>`;
  }
  h += `</div>${chartHTML()}<div class="row"><button class="primary" data-a="close">${final ? 'Close' : 'Continue'}</button></div>`;
  showModal(h, false, 'summary');
}
function chartHTML() {
  const w = 420, hh = 120; const NW = S.opts.victory === 'networth'; const H = p => NW ? (p.nwHist || []) : p.progHist;
  const n = Math.max(...S.players.map(p => H(p).length)); if (n < 1) return '';
  const max = Math.max(1, ...S.players.flatMap(p => H(p)));
  return `<h4>${NW ? 'Net Worth' : 'Progress'} by round</h4><svg width="${w}" height="${hh}" class="chart">${NW ? '' : `<line x1="0" y1="${hh - hh / max}" x2="${w}" y2="${hh - hh / max}" stroke="#aaa" stroke-dasharray="3 3"/>`}` + S.players.map(p => `<polyline fill="none" stroke="${col(p.id)}" stroke-width="2.5" points="${H(p).map((v, i) => `${(i + 0.5) * w / n},${hh - 4 - v / max * (hh - 8)}`).join(' ')}"/>`).join('') + '</svg>';
}
// ---------------- sub-dialogs for simple actions ----------------
function districtOptions(filter) { return R.DISTRICTS.map((n, d) => filter && !filter(d) ? '' : `<option value="${d}">${n}</option>`).join(''); }
function outreachDialog(pid) {
  const others = S.players.filter(q => q.id !== pid);
  showModal(`<h2>Outreach</h2><p class="muted">Community outreach: +1 standing ($2 with presence, $4 without). Opposition campaign: −1 to a Favored/Champion rival where you are +1 or better ($3). Once per round.</p>
  <div class="row">District <select id="orD">${districtOptions()}</select> Target <select id="orT"><option value="">(community outreach, +1 me)</option>${others.map(q => `<option value="${q.id}">Oppose ${esc(q.name)}</option>`).join('')}</select></div>
  <div id="orPv"></div><div class="row"><button class="primary" data-a="orGo">Do it</button><button data-a="close">Cancel</button></div>`);
  const upd = () => { const a = orSpec(); $('orPv').innerHTML = bdTable(R.previewSimple(S, pid, a)); };
  $('orD').onchange = upd; $('orT').onchange = upd; upd();
}
function orSpec() { const t = $('orT').value; return { type: 'outreach', district: +$('orD').value, target: t === '' ? undefined : +t }; }
function programDialog(pid) {
  const opts = [];
  for (const L of R.linesOf(S, pid, ['bus'])) opts.push([{ type: 'program', prog: 'brt', line: L.id }, 'Upgrade ' + R.lineLabel(S, L) + ' to BRT']);
  showModal(`<h2>Era III: Bus Rapid Transit</h2>${opts.map(([a, n], i) => { const pv = R.previewSimple(S, pid, a); return `<div class="card"><b>${esc(n)}</b>${bdTable(pv)}<button data-a="progGo" data-i="${i}" ${pv.ok ? '' : 'disabled'}>Do it</button></div>`; }).join('')}<button data-a="close">Cancel</button>`);
  ui.progOpts = opts;
}
function upzoneStart(pid) {
  const legal = Object.values(S.zones).filter(z => z.owner === pid && R.upzoneTargets(S, pid, z).length).map(z => z.id);
  startMode({ kind: 'zonePick', legal, title: 'Upzone', help: 'Click one of your highlighted zones.', onPick: zid => { ui.mode = null; upzoneDialog(pid, zid); } });
}
function upzoneDialog(pid, zid, variance) {
  const z = S.zones[zid]; const has = S.players[pid].permits.includes('VAR');
  ui.upz = R.upzoneTargets(S, pid, z).map(t => ({ zid, to: t.to, variance: variance || undefined }));
  showModal(`<h2>Upzone ${esc(R.zoneLabel(S, z))}</h2>${has ? `<label><input type="checkbox" id="useVar" ${variance ? 'checked' : ''}> Use Variance permit</label>` : ''}` +
    ui.upz.map((sp, i) => { const pv = R.previewUpzone(S, pid, sp); return `<div class="card"><b>→ ${esc(R.ZT[sp.to].name)}</b>${bdTable(pv)}<button class="primary" data-a="upGo" data-i="${i}" ${pv.ok ? '' : 'disabled'}>Upzone${pv.ok ? ' ($' + pv.cost + ')' : ''}</button></div>`; }).join('') + `<button data-a="close">Cancel</button>`);
  if (has) $('useVar').onchange = e => upzoneDialog(pid, zid, e.target.checked);
}
function usePermit(pid, c) {
  const done = a => doAct(pid, Object.assign({ type: 'permit', code: c }, a));
  if (['XSH', 'RID'].includes(c)) return done({});
  if (c === 'CMT') { showModal(`<h2>Community Meeting</h2><div class="row">District <select id="cmtD">${districtOptions()}</select><button class="primary" data-a="cmtGo">+2 standing</button><button data-a="close">Cancel</button></div>`); return; }
  if (c === 'DEV') return startMode({ kind: 'pickLots', max: 2, title: 'Development Rights', help: 'Pick 1–2 empty lots to reserve.', onDone: lots => done({ lots }) });
  if (c === 'BKS') return startMode({ kind: 'transit', mode: 'bike', free: 'BKS', title: 'Bike Share (free)', help: 'Select up to 4 connected bike edges.' });
  ui.err = R.PERMIT_INFO[c].name + ': ' + R.PERMIT_INFO[c].text; render();
}
const MODE_HELP = { bike: 'Click green edges to add bike lanes (connected).', road: 'Click edges to add roads.', bus: 'Click road edges for the route, then click nodes for stops (≥2 edges apart).', lr: 'Click track edges, then nodes for stations.',  hwy: 'Upgrade your own road edges to freight road; the first edge must touch an M connector or your freight road.', ferry: 'Pick riverbank nodes for docks.' };
// ---------------- event delegation ----------------
document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return;
  const a = b.dataset.a; const pd = R.pending(S || { queue: [] }); const pid = pd ? pd.pid : 0;
  const sc = ui.secret;
  switch (a) {
    case 'reveal': ui.revealed = b.dataset.k; refresh(); break;
    case 'reopen': ui.revealed = null; refresh(); break;
    case 'pickPartner': sc[b.dataset.kind] = b.dataset.id; showSecret(pd); break;
    case 'submitPartners': doAct(pid, { eng: sc.eng, con: sc.con }); break;
    case 'bidAdj': sc.amount = Math.max(0, Math.min(S.players[pid].cash, (+$('bidAmt').value || 0) + +b.dataset.d)); showSecret(pd); break;
    case 'submitBid': doAct(pid, { amount: Math.max(0, Math.floor(+$('bidAmt').value || 0)) }); break;
    case 'pickCand': sc.cand = +b.dataset.i; sc.amount = +$('elAmt').value || 0; showSecret(pd); break;
    case 'submitElection': doAct(pid, { candidate: sc.cand, amount: Math.floor(+$('elAmt').value || 0) }); break;
    case 'hqRecalc': sc.site = $('hqSite').value.split(','); sc.pledge = +$('hqPledge').value; sc.inc = +$('hqInc').value || 0; showSecret(pd); break;
    case 'submitHQ': doAct(pid, { site: $('hqSite').value.split(','), pledge: +$('hqPledge').value, incentive: Math.floor(+$('hqInc').value || 0) }); break;
    case 'passHQ': doAct(pid, { pass: true }); break;
    case 'close': hideModal(); refresh(); break;
    case 'tmode': { const m = b.dataset.m; startMode({ kind: 'transit', mode: m, line: b.dataset.line || (m === 'ferry' ? (R.linesOf(S, pid, ['shuttle', 'river'])[0] || {}).id : undefined), fop: 'open', fkind: 'shuttle', bonus: !!b.dataset.bonus, title: (b.dataset.bonus ? 'Bonus: ' : '') + (MODE_LABEL[m] || 'Ferry'), help: MODE_HELP[m] }); break; }
    case 'fop': ui.mode.fop = b.dataset.v; ui.mode.docks = []; computeLegal(); render(); break;
    case 'fkind': ui.mode.fkind = b.dataset.v; computeLegal(); render(); break;
    case 'zmode': startMode({ kind: 'zone', type: b.dataset.t, title: 'Zone ' + R.ZT[b.dataset.t].name, help: `Click a highlighted lot${R.ZT[b.dataset.t].lots === 2 ? ' (2 adjacent lots)' : ''}. Highlighted = legal now.` }); break;
    case 'commit': commitMode(); break;
    case 'cancel': ui.mode = null; ui.err = ''; render(); break;
    case 'skipBonus': doAct(pid, { type: 'skipBonus' }); break;
    case 'consult': doAct(pid, { type: 'consult' }); break;
    case 'finance': doAct(pid, { type: 'finance' }); break;
    case 'repay': doAct(pid, { type: 'finance', repay: true }); break;
    case 'outreach': outreachDialog(pid); break;
    case 'orGo': { const s = orSpec(); hideModal(); doAct(pid, s); break; }
    case 'program': programDialog(pid); break;
    case 'progGo': hideModal(); doAct(pid, ui.progOpts[+b.dataset.i][0]); break;
    case 'upzone': upzoneStart(pid); break;
    case 'upGo': hideModal(); doAct(pid, { type: 'upzone', spec: ui.upz[+b.dataset.i] }); break;
    case 'usePermit': usePermit(pid, b.dataset.c); break;
    case 'cmtGo': { const d = +$('cmtD').value; hideModal(); doAct(pid, { type: 'permit', code: 'CMT', district: d }); break; }
    case 'takePermit': doAct(pid, { code: b.dataset.c }); break;
    case 'petition': { const s = +b.dataset.s; doAct(pid, { slot: s < 0 ? null : s }); break; }
    case 'homeD': ui.homeSel = { d: +b.dataset.d, v: 0 }; showHomeLayout(); break;
    case 'homeV': { const n = R.homeLayouts(S, ui.homeSel.d).length; ui.homeSel.v = (ui.homeSel.v + +b.dataset.v + n) % n; showHomeLayout(); break; }
    case 'homeGo': { const hs = ui.homeSel; ui.homeSel = null; ui.mode = null; doAct(pid, { district: hs.d, variant: hs.v }); break; }
    case 'logf': ui.logFilter = b.dataset.v; renderLog(); break;
    case 'summary': showSummary(S.phase === 'over'); break;
    case 'newGame': showSetup(); break;
    case 'startGame': startFromSetup(false); break;
    case 'tutorial': startTutorial(); break;
    case 'resume': hideModal(); refresh(); break;
    case 'helpPage': showHelp(+b.dataset.p); break;
  }
});
function showHomeLayout() {
  const lay = R.homeLayouts(S, ui.homeSel.d)[ui.homeSel.v];
  ui.mode = lay ? { kind: 'home', lots: [lay.dup, lay.nc], legal: [] } : null; render();
  if (lay) $('board').insertAdjacentHTML('beforeend', lay.roads.map(e => line(e, 0, '#555', 5, '3 2')).join(''));
}
document.addEventListener('change', ev => {
  if (ev.target.id === 'aiSpeed') ui.speed = +ev.target.value;
  if (ev.target.id === 'ferryLine') { ui.mode.line = ev.target.value; computeLegal(); render(); }
  if (ev.target.id === 'useGrant') { ui.mode.grant = ev.target.checked; render(); }
  if (ev.target.id === 'zonePermit') { ui.mode.permit = ev.target.value || null; computeLegal(); render(); }
  if (ev.target.id === 'setN') renderSetupPlayers();
});
// ---------------- touch / mobile layer (no-op on desktop mouse) ----------------
(function () {
  const vb = { z: 1, x: 0, y: 0 }; // zoom and top-left in board units
  function clampVB() { const s = W / vb.z; vb.x = Math.max(0, Math.min(W - s, vb.x)); vb.y = Math.max(0, Math.min(W - s, vb.y)); }
  function applyVB() { clampVB(); const s = W / vb.z; const svg = $('board'); if (svg) svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${s} ${s}`); }
  function zoomAt(f, cx, cy) { // cx,cy in board units
    const nz = Math.max(1, Math.min(5, vb.z * f)); const s0 = W / vb.z, s1 = W / nz;
    vb.x = cx - (cx - vb.x) * s1 / s0; vb.y = cy - (cy - vb.y) * s1 / s0; vb.z = nz; applyVB();
  }
  const _rb = renderBoard; renderBoard = function () { _rb(); if (vb.z !== 1) applyVB(); };
  function toBoard(px, py) { const r = $('board').getBoundingClientRect(); const s = W / vb.z; return [vb.x + (px - r.left) / r.width * s, vb.y + (py - r.top) / r.height * s]; }
  let pts = new Map(), start = null, moved = false, suppress = false;
  function setup() {
    const svg = $('board');
    svg.addEventListener('pointerdown', e => { if (e.pointerType === 'mouse') return; pts.set(e.pointerId, [e.clientX, e.clientY]); moved = false;
      start = { pts: new Map(pts), vb: { ...vb } }; });
    svg.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      const r = svg.getBoundingClientRect(); const unit = (W / start.vb.z) / r.width;
      const a = [...pts.values()], b = [...start.pts.values()];
      if (a.length >= 2 && b.length >= 2) {
        const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]); const f = d(a[0], a[1]) / Math.max(1, d(b[0], b[1]));
        const mx = (b[0][0] + b[1][0]) / 2, my = (b[0][1] + b[1][1]) / 2, nx = (a[0][0] + a[1][0]) / 2, ny = (a[0][1] + a[1][1]) / 2;
        Object.assign(vb, start.vb); const c = [vb.x + (mx - r.left) * unit, vb.y + (my - r.top) * unit];
        zoomAt(f, c[0], c[1]); vb.x -= (nx - mx) * (W / vb.z) / r.width; vb.y -= (ny - my) * (W / vb.z) / r.width; applyVB(); moved = true;
      } else if (a.length === 1 && b.length === 1) {
        const dx = a[0][0] - b[0][0], dy = a[0][1] - b[0][1];
        if (moved || Math.hypot(dx, dy) > 10) { moved = true; if (start.vb.z > 1) { vb.x = start.vb.x - dx * unit; vb.y = start.vb.y - dy * unit; applyVB(); } }
      }
      e.preventDefault(); });
    const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if (moved) suppress = true;
      if (pts.size) start = { pts: new Map(pts), vb: { ...vb } }; };
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    // a drag/pinch must not count as a tap on a lot/edge
    svg.addEventListener('click', e => { if (suppress) { suppress = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
    svg.addEventListener('wheel', e => { if (!e.ctrlKey) return; e.preventDefault(); const c = toBoard(e.clientX, e.clientY); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, c[0], c[1]); }, { passive: false });
    // zoom buttons
    $('boardWrap').insertAdjacentHTML('afterbegin', '<div id="zoomBar"><button id="zIn" aria-label="Zoom in">+</button><button id="zOut" aria-label="Zoom out">−</button><button id="zFit" aria-label="Fit board">⤢</button></div>');
    $('zIn').onclick = () => zoomAt(1.5, vb.x + W / vb.z / 2, vb.y + W / vb.z / 2);
    $('zOut').onclick = () => zoomAt(1 / 1.5, vb.x + W / vb.z / 2, vb.y + W / vb.z / 2);
    $('zFit').onclick = () => { vb.z = 1; vb.x = vb.y = 0; applyVB(); };
    // drawer: tapping the active tab collapses/expands
    document.querySelectorAll('.tab').forEach(t => t.insertAdjacentHTML('afterbegin', ''));
    document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.wasOn === '1') document.body.classList.toggle('drawer-closed'); else document.body.classList.remove('drawer-closed');
      document.querySelectorAll('#tabs button').forEach(x => x.dataset.wasOn = x.classList.contains('on') ? '1' : '');
    }));
    document.querySelectorAll('#tabs button').forEach(x => x.dataset.wasOn = x.classList.contains('on') ? '1' : '');
    $('tabs').insertAdjacentHTML('beforeend', '<button id="sideToggle" aria-label="Collapse panel">⇥</button>');
    $('sideToggle').onclick = () => { document.body.classList.toggle('drawer-closed'); $('sideToggle').textContent = document.body.classList.contains('drawer-closed') ? '⇤' : '⇥'; };
    // tap-for-hover: any non-button element with a title shows it in a toast; long-press on a button shows its title
    document.body.insertAdjacentHTML('beforeend', '<div id="ttip" class="ttip" role="status"></div>');
    let tt; const tip = s => { const el = $('ttip'); el.textContent = s; el.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 3500); };
    const coarse = () => matchMedia('(pointer:coarse)').matches || innerWidth < 800;
    document.addEventListener('click', e => { if (!coarse()) return; const el = e.target.closest('[title]');
      if (el && el.tagName !== 'BUTTON' && !el.closest('#board')) tip(el.title); else if (!el) $('ttip').classList.remove('on'); });
    let lp; document.addEventListener('pointerdown', e => { const b = e.target.closest('button[title]'); if (!b || e.pointerType === 'mouse') return; lp = setTimeout(() => tip(b.title), 500); });
    ['pointerup', 'pointercancel', 'pointermove'].forEach(n => document.addEventListener(n, () => clearTimeout(lp)));
    // PWA: only over http(s); file:// skips silently
    if (location.protocol.startsWith('http') && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  window.addEventListener('DOMContentLoaded', setup);
  window.ROW_UI_MOBILE = { vb, zoomAt, applyVB };
})();
// ---------------- setup / tutorial / help ----------------
function showSetup() {
  clearTimeout(ui.aiTimer);
  const saved = load();
  showModal(`<h2>Right of Way — new game</h2>
  <p class="muted">Build the richest city by the end of Round 10: Net Worth = cash + $1 per Pop. Rules v0.7 (line limit: 2 bus, 2 ferry, 1 light rail per player).</p>
  <div class="row">Players <select id="setN">${[2, 3, 4].map(n => `<option ${n === 3 ? 'selected' : ''}>${n}</option>`).join('')}</select>
  Length <select id="setLen"><option value="quick">Quick (6 rounds, lower targets)</option><option value="std">Standard (10 rounds)</option></select>
  Councils <select id="setCouncil"><option value="draw">Random draw</option><option value="intro">Intro setup</option></select>
  Seed <input id="setSeed" placeholder="random" style="width:90px"></div>
  <div class="row">Victory <select id="setVic"><option value="networth" selected>Net Worth (default: plays all rounds)</option><option value="standard">Race to Target variant (85 Pop or $145 Treasury)</option></select>
  <span id="nwBox">rate $<input id="setRate" type="number" min="0" step="0.5" value="1" style="width:60px"> per Pop (0 = most cash wins); Bonds count −$8 each</span></div>
  <div id="setPlayers"></div>
  <div class="row"><button class="primary" data-a="startGame">Start game</button><button data-a="tutorial">Tutorial game (you vs 2 AIs, quick)</button>${saved && saved.phase !== 'over' ? '<button data-a="resume">Resume saved game</button>' : ''}<button data-a="helpPage" data-p="0">How to play</button></div>`, false, 'setup');
  renderSetupPlayers();
}
function renderSetupPlayers() {
  const n = +$('setN').value;
  $('setPlayers').innerHTML = Array.from({ length: n }, (_, i) => `<div class="row" style="border-left:6px solid ${R.PLAYER_COLORS[i].hex};padding-left:6px">
  <input id="pn${i}" value="${R.PLAYER_COLORS[i].name}" style="width:110px">
  <select id="pk${i}"><option value="human" ${i === 0 ? 'selected' : ''}>Human (hotseat)</option><option value="ai" ${i ? 'selected' : ''}>AI</option></select>
  <select id="pp${i}"><option value="balanced">balanced</option><option value="pop" ${i === 1 ? 'selected' : ''}>pop-focused</option><option value="money" ${i === 2 ? 'selected' : ''}>money-focused</option></select></div>`).join('');
}
function newGameWith(o) {
  S = R.newGame(o); ui.undo = []; ui.mode = null; ui.revealed = null; ui.seenReport = 0; ui.overShown = false; ui.secret = {}; ui.err = '';
  hideModal(); setTab('act'); refresh();
}
function startFromSetup() {
  const n = +$('setN').value; const seed = $('setSeed').value.trim();
  const players = Array.from({ length: n }, (_, i) => ({ name: $('pn' + i).value || R.PLAYER_COLORS[i].name, kind: $('pk' + i).value, persona: $('pp' + i).value }));
  ui.tutorial = false;
  const vic = $('setVic').value; const opts = vic === 'networth' ? { victory: 'networth', nwRate: Math.max(0, +$('setRate').value || 0) } : {};
  newGameWith({ players, quick: $('setLen').value === 'quick', council: $('setCouncil').value, seed: seed ? (+seed || hash(seed)) : undefined, opts });
}
function hash(s) { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return h; }
function startTutorial() {
  ui.tutorial = true;
  newGameWith({ players: [{ name: 'You', kind: 'human' }, { name: 'Pop Bot', kind: 'ai', persona: 'pop' }, { name: 'Money Bot', kind: 'ai', persona: 'money' }], quick: true, council: 'intro', seed: 2026 });
}
const TUT = {
  setup_partners: 'Pick one Engineer (changes HOW your transit works) and one Contractor (how MUCH/FAST you build). Hover the cards to compare.',
  setup_home: 'Pick a home district. Look at its two council boards: e.g. Bike & Pedestrian likes bike lanes; Homeowners dislike density.',
  bid: 'The Zoning Board auction: bid for turn order and first Permit pick. Bids are lost, so $0–2 is normal early.',
  permits: 'Take a Permit. Tax Abatement = $5 now; Extra Shift = a 4th action.',
  actions: 'You have 3 actions. A good opener: zone homes (SFD/Duplex/Townhomes) near your jobs and add bike lanes or a road so residents can commute. Consult pays only $1 (once per round), so build instead when you can. Industry next to a freight road earns more; Offices need a light rail station. Hover/click zones to see why they score.',
  election: 'Back a mayoral candidate. Their policy changes costs for the next era.',
  hq: 'Bid to host the Corporate HQ: big Pop bonus if you can keep the housing pledge.',
};
function tutorialTip() { if (!ui.tutorial || !S) return ''; const t = TUT[S.phase] || (R.pending(S) && TUT[R.pending(S).type]); return t ? `<div class="tutorial">💡 ${esc(t)}</div>` : ''; }
const HELP = [
  ['Goal', `The game always runs to the end of Round 10 (quick game: Round 6). Then the highest <b>Net Worth</b> wins: cash + $1 per Pop − $8 per Bond. Pop also raises your Tax every round, so growing early pays twice. (Optional Race to Target variant: first to 85 Pop or $145 wins.)`],
  ['Round structure', `Event → (HQ / Stadium) → Zoning Board bid → Permits → <b>3 Actions each</b> in turn order → Commute → Council hearings → Income → Pop & Net Worth bookkeeping (game ends after the last round) → City Hall (elections, mandates) → Cleanup (construction advances).`],
  ['Actions', `<b>Build Transit</b> (bike, road, bus, ferry, light rail, freight road), <b>Zone</b> an empty lot, <b>Upzone</b> one rung up the housing ladder (SFD→Duplex→Cottage Court→Townhomes→Multiplex→Mid-Rise→High-Rise), <b>Outreach</b>, <b>Consult</b> (+$1, first time each round; $0 after), <b>Finance</b> (bond +$8, $1 interest/round). Era III: upgrade a bus route to BRT. Free: Permits.`],
  ['Commuting & income', `Each home has workers. At Commute, each worker needs a reachable job slot: walk, one transit leg, or two legs with one transfer. Workers fill their own player's jobs first, then any reachable job. You earn property tax on homes, wages on employed workers and $ per filled job slot you own (even for rivals' workers). Fares go to line owners. Upkeep and Municipal Overhead apply (gross income above $30 counts half, above $60 a third).`],
  ['Councils & standing', `Each district has two advisory boards. Builds they like raise your standing; builds they hate lower it. Favored (+2) and Champion (+3) give discounts and election votes; Opposed/Blocked add costs or block you.`],
  ['Using this app', `Pick an action in the Turn tab: legal edges/lots light up green on the board, and the cost breakdown updates as you click. Confirm to commit. <b>Undo</b> works until the next player acts. Secret choices (bids, partners, elections) use a pass-the-device screen. Click zones to inspect them; Round summary shows the income breakdown.`],
];
function showHelp(p) {
  p = p || 0; const [t, body] = HELP[p];
  showModal(`<h2>How to play — ${t}</h2><p>${body}</p><div class="row">${p > 0 ? `<button data-a="helpPage" data-p="${p - 1}">◀ Back</button>` : ''}${p < HELP.length - 1 ? `<button class="primary" data-a="helpPage" data-p="${p + 1}">Next ▶</button>` : ''}<button data-a="${S ? 'close' : 'newGame'}">Close</button></div><p class="muted">${p + 1}/${HELP.length}</p>`, true, 'info');
}
// ---------------- undo / init ----------------
function undo() {
  const u = ui.undo.pop(); if (!u) return;
  S = JSON.parse(u.snap); R.touch(S); ui.mode = null; ui.err = ''; refresh();
}
function init() {
  $('board').addEventListener('click', boardClick);
  $('btnUndo').onclick = undo; $('btnHelp').onclick = () => showHelp(0); $('btnNew').onclick = showSetup;
  $('btnSummary').onclick = () => S && showSummary(S.phase === 'over');
  document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => setTab(b.dataset.tab));
  document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); } if (e.key === 'Escape' && ui.mode) { ui.mode = null; render(); } });
  const saved = load();
  if (saved && saved.v === 'row-0.7' && saved.phase !== 'over') { S = saved; ui.seenReport = S.reports.length; render(); }
  showSetup();
}
// test / screenshot hooks
window.ROW_UI = {
  get state() { return S; }, ui,
  startQuick(players, seed) { ui.tutorial = false; newGameWith({ players, quick: true, seed: seed === undefined ? 7 : seed }); },
  start(o) { newGameWith(o); },
  setSpeed(ms) { ui.speed = ms; },
  runAI(n) { const r = R.runAI(S, n || 1e6); refresh(); return r; },
  summary() { showSummary(S.phase === 'over'); },
  close() { hideModal(); },
  tab: setTab, render, refresh,
};
// show tutorial tips above the turn panel
const _rt = renderTurn; renderTurn = function () { _rt(); const t = tutorialTip(); if (t) $('tab-act').insertAdjacentHTML('afterbegin', t); };
window.addEventListener('DOMContentLoaded', init);
})();
