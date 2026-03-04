/**
 * js/ui/carousel.js — Apple-style carousel UI controller
 *
 * Responsibilities:
 *  - Build the left sidebar with test buttons + indicator dots
 *  - Build the right panel viewport with one slide per test
 *  - Animate slide transitions (slide-in from right, old slide exits left)
 *  - Sync sidebar active state
 *  - Expose applyResults(results, params) called by runner after tests complete
 *
 * Dependencies: none (pure DOM manipulation)
 */

'use strict';

// ── Test metadata ─────────────────────────────────────────────────────────────

var TEST_META = [
  { id:1,  name: 'Frequency',            shortName: 'Monobit',       desc: 'Uniformity of 0s and 1s across the entire sequence.' },
  { id:2,  name: 'Block Frequency',      shortName: 'Block Freq.',   desc: 'Proportion of 1s within fixed-size blocks (Block M parameter).' },
  { id:3,  name: 'Runs',                 shortName: 'Runs',          desc: 'Number and length of uninterrupted runs of identical bits.' },
  { id:4,  name: 'Longest Run',          shortName: 'Longest Run',   desc: 'Longest consecutive run of 1s in each M-bit block.' },
  { id:5,  name: 'Matrix Rank',          shortName: 'Rank',          desc: 'GF(2) rank of 32×32 binary matrices from sub-sequences.' },
  { id:6,  name: 'Non-Overlapping',      shortName: 'Non-Overlap.',  desc: 'Occurrences of the aperiodic m-bit template (Template m).' },
  { id:7,  name: 'Overlapping',          shortName: 'Overlapping',   desc: 'Overlapping occurrences of the all-ones m-bit template.' },
  { id:8,  name: "Maurer's Universal",   shortName: 'Maurer',        desc: 'Compressibility of the sequence — predictable sequences compress.' },
  { id:9,  name: 'Linear Complexity',    shortName: 'LFSR',          desc: 'Berlekamp–Massey LFSR length per block (LC block parameter).' },
  { id:10, name: 'Serial',               shortName: 'Serial',        desc: 'Frequency of all overlapping 3-bit patterns (two p-values).' },
  { id:11, name: 'Approx. Entropy',      shortName: 'ApEn',          desc: 'Difference between m-bit and (m+1)-bit pattern frequencies.' },
  { id:12, name: 'Cumulative Sums',      shortName: 'CuSum',         desc: 'Maximum deviation of the partial-sum walk from zero.' },
  { id:13, name: 'Random Excursions',    shortName: 'Excursions',    desc: 'Visits to states ±1…±4 in each cycle of the partial-sum walk.' },
  { id:14, name: 'Excursions Variant',   shortName: 'Exc. Variant',  desc: 'Total visits to states ±1…±9 across the full walk.' }
];

// ── State ─────────────────────────────────────────────────────────────────────

var _activeIdx  = 0;       // currently visible panel index (0-based)
var _prevIdx    = -1;
var _results    = [];      // raw test results (filled after run)
var _charts     = {};      // Chart.js instances keyed by panel id
var _panelEls   = [];      // panel DOM elements
var _btnEls     = [];      // sidebar button elements

// ── Build DOM ─────────────────────────────────────────────────────────────────

function buildCarousel() {
  var sidebar  = document.getElementById('testSidebar');
  var viewport = document.getElementById('panelViewport');
  if (!sidebar || !viewport) return;

  sidebar.innerHTML  = '';
  viewport.innerHTML = '';
  _panelEls = [];
  _btnEls   = [];

  for (var i = 0; i < TEST_META.length; i++) {
    (function(idx) {
      var m = TEST_META[idx];

      // ── Sidebar button ──────────────────────────────────────────────────
      var btn = document.createElement('button');
      btn.className = 'test-btn' + (idx === 0 ? ' active' : '');
      btn.id        = 'tbtn-' + idx;
      btn.innerHTML =
        '<div class="test-btn-header">' +
          '<span class="test-indicator" id="dot-' + idx + '"></span>' +
          '<span class="test-btn-num">' + String(m.id).padStart(2,'0') + '</span>' +
          '<span class="test-btn-name">' + m.shortName + '</span>' +
        '</div>' +
        '<div class="test-btn-desc">' + m.desc + '</div>' +
        '<div class="test-btn-pvalue" id="tbtn-pv-' + idx + '">—</div>';

      btn.onclick = function() { navigateTo(idx); };
      sidebar.appendChild(btn);
      _btnEls.push(btn);

      // ── Panel slide ─────────────────────────────────────────────────────
      var panel = document.createElement('div');
      panel.className = 'test-panel' + (idx === 0 ? ' active' : '');
      panel.id        = 'panel-' + idx;

      panel.innerHTML =
        '<div class="panel-info" id="pinfo-' + idx + '">' +
          '<div class="panel-title">Test ' + m.id + ' of 14</div>' +
          '<div class="panel-name">' + m.name + '</div>' +
          '<div class="panel-desc">' + m.desc + '</div>' +
          '<div id="pbadge-' + idx + '"></div>' +
          '<div id="pstats-' + idx + '"></div>' +
        '</div>' +
        '<div class="panel-chart" id="pchart-' + idx + '">' +
          '<div class="no-chart-msg">Run tests to see results</div>' +
        '</div>';

      viewport.appendChild(panel);
      _panelEls.push(panel);

    })(i);
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────

function navigateTo(idx) {
  if (idx === _activeIdx) return;

  var oldPanel = _panelEls[_activeIdx];
  var newPanel = _panelEls[idx];

  // Exit old panel to left
  oldPanel.classList.remove('active');
  oldPanel.classList.add('exit-left');

  // Remove exit-left after transition ends
  setTimeout(function() {
    oldPanel.classList.remove('exit-left');
  }, 380);

  // Enter new panel from right
  newPanel.classList.add('active');

  // Update sidebar
  _btnEls[_activeIdx].classList.remove('active');
  _btnEls[idx].classList.add('active');

  _prevIdx   = _activeIdx;
  _activeIdx = idx;

  // Scroll sidebar button into view
  _btnEls[idx].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Apply results ─────────────────────────────────────────────────────────────

/**
 * Called by runner.js after all tests complete.
 * Populates sidebar indicators, stats, and charts for each test.
 *
 * @param {Array}  results  Array of 14 raw result objects (may be null for N/A)
 * @param {Object} params   { M, m, lcM }
 */
function applyResults(results, params) {
  _results = results;

  // Destroy existing charts to avoid memory leaks
  Object.keys(_charts).forEach(function(k) {
    if (_charts[k]) { _charts[k].destroy(); delete _charts[k]; }
  });

  for (var i = 0; i < TEST_META.length; i++) {
    var r = results[i];
    _applyTestResult(i, r, params);
  }

  // Show the first test by default
  navigateTo(0);
}

function _applyTestResult(idx, r, params) {
  var m       = TEST_META[idx];
  var dotEl   = document.getElementById('dot-' + idx);
  var pvEl    = document.getElementById('tbtn-pv-' + idx);
  var badgeEl = document.getElementById('pbadge-' + idx);
  var statsEl = document.getElementById('pstats-' + idx);
  var chartEl = document.getElementById('pchart-' + idx);

  // Determine status
  var status  = 'na';
  var pValue  = null;
  if (r && r.pValue !== null && r.pValue !== undefined) {
    pValue = r.pValue;
    status = pValue >= 0.01 ? 'pass' : 'fail';
  }

  // ── Sidebar dot & label ─────────────────────────────────────────────────
  dotEl.className = 'test-indicator ' + status;

  if (pValue !== null) {
    pvEl.textContent = 'p = ' + pValue.toFixed(6);
  } else {
    pvEl.textContent = r && r.note ? r.note : 'N/A — sequence too short';
  }

  // ── Panel badge ─────────────────────────────────────────────────────────
  var badgeLabel = status === 'pass' ? '● PASS' : status === 'fail' ? '● FAIL' : '● N/A';
  badgeEl.innerHTML =
    '<span class="status-badge ' + status + '">' +
      '<span class="dot"></span>' +
      (status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : 'N/A') +
      (pValue !== null ? ' &nbsp; p = ' + pValue.toFixed(6) : '') +
    '</span>';

  // ── Panel stats ─────────────────────────────────────────────────────────
  statsEl.innerHTML = _buildStats(idx, r, params);

  // ── Chart ───────────────────────────────────────────────────────────────
  _buildPanelChart(idx, r, chartEl);
}

// ── Stats HTML ────────────────────────────────────────────────────────────────

function _row(key, val) {
  return '<div class="stat-row"><span class="stat-key">' + key +
    '</span><span class="stat-val">' + val + '</span></div>';
}

function _buildStats(idx, r, params) {
  if (!r) return '<div style="color:var(--text3);font-size:0.78rem;margin-top:8px">Run tests to see statistics.</div>';

  var s = '';
  var id = idx + 1;

  if (r.pValue === null || r.pValue === undefined) {
    return '<div style="color:var(--warn);font-size:0.78rem;margin-top:8px">' + (r.note || 'N/A') + '</div>';
  }

  switch(id) {
    case 1:
      s += _row('S_obs', r.sObs.toFixed(6));
      s += _row('Ones', r.ones + ' (' + (r.ones/r.n*100).toFixed(1) + '%)');
      s += _row('Zeros', r.zeros + ' (' + (r.zeros/r.n*100).toFixed(1) + '%)');
      s += _row('n', r.n);
      break;
    case 2:
      s += _row('chi²', r.chi2.toFixed(6));
      s += _row('Blocks N', r.N);
      s += _row('Block M', r.M);
      break;
    case 3:
      if (r.failed_pretest) s += _row('Pre-test', 'FAILED');
      s += _row('Total runs V_n', r.Vn);
      s += _row('π (1s ratio)', typeof r.pi==='number' ? r.pi.toFixed(6) : 'N/A');
      s += _row('Max run', r.maxRun || '—');
      s += _row('n', r.n);
      break;
    case 4:
      s += _row('chi²', r.chi2.toFixed(6));
      s += _row('Blocks N', r.N);
      s += _row('Block M', r.M);
      break;
    case 5:
      s += _row('chi²', r.chi2.toFixed(6));
      s += _row('Matrices N', r.N);
      s += _row('Rank 32', r.FM);
      s += _row('Rank 31', r.FM1);
      s += _row('Rank ≤ 30', r.rest);
      break;
    case 6:
      s += _row('chi²', r.chi2.toFixed(6));
      s += _row('μ', r.mu.toFixed(4));
      s += _row('σ²', r.sigma2.toFixed(4));
      s += _row('Blocks N', r.N);
      s += _row('Template m', r.m);
      break;
    case 7:
      s += _row('chi²', r.chi2.toFixed(6));
      s += _row('λ', r.lambda.toFixed(4));
      s += _row('η', r.eta.toFixed(4));
      s += _row('Blocks N', r.N);
      break;
    case 8:
      s += _row('f_n', r.fn.toFixed(6));
      s += _row('E[f_n]', r.EL.toFixed(6));
      s += _row('σ', r.sigma.toFixed(6));
      s += _row('L', r.L);
      s += _row('Q', r.Q);
      s += _row('K', r.K);
      break;
    case 9:
      s += _row('chi²', r.chi2.toFixed(6));
      s += _row('μ', r.mu.toFixed(4));
      s += _row('Blocks N', r.N);
      s += _row('Block M', r.M);
      break;
    case 10:
      s += _row('ΔΨ²', r.dPsi2.toFixed(6));
      s += _row('Δ²Ψ²', r.d2Psi2.toFixed(6));
      s += _row('p-value 1', r.pv1.toFixed(8));
      s += _row('p-value 2', r.pv2.toFixed(8));
      s += _row('m', r.m);
      break;
    case 11:
      s += _row('ApEn', r.ApEn.toFixed(6));
      s += _row('φ(m)', r.phi_m.toFixed(6));
      s += _row('φ(m+1)', r.phi_m1.toFixed(6));
      s += _row('chi²', r.chi2.toFixed(6));
      s += _row('m', r.m);
      break;
    case 12:
      s += _row('p-value fwd', r.pv_fwd.toFixed(8));
      s += _row('p-value bwd', r.pv_bwd.toFixed(8));
      s += _row('max|S| fwd', r.maxF);
      s += _row('max|S| bwd', r.maxB);
      break;
    case 13:
      s += _row('J (cycles)', r.J);
      s += '<div style="margin-top:10px;font-size:0.72rem;color:var(--text2)">Per-state p-values:</div>';
      s += '<div class="pv-grid">' + r.states.map(function(st) {
        var res = r.results[st];
        var cls = res.pValue >= 0.01 ? 'pv-pass' : 'pv-fail';
        return '<div class="pv-item ' + cls + '"><span class="pv-state">x=' +
          (st>0?'+':'') + st + '</span><br><span class="pv-val">' +
          res.pValue.toFixed(5) + '</span></div>';
      }).join('') + '</div>';
      break;
    case 14:
      s += _row('J (crossings)', r.J);
      s += '<div style="margin-top:10px;font-size:0.72rem;color:var(--text2)">Per-state p-values:</div>';
      s += '<div class="pv-grid">' + r.states.slice(0,8).map(function(st) {
        var res = r.results[st];
        var cls = res.pValue >= 0.01 ? 'pv-pass' : 'pv-fail';
        return '<div class="pv-item ' + cls + '"><span class="pv-state">x=' +
          (st>0?'+':'') + st + '</span><br><span class="pv-val">' +
          res.pValue.toFixed(5) + '</span></div>';
      }).join('') + '</div>';
      break;
  }
  return s;
}

// ── Charts ────────────────────────────────────────────────────────────────────

function _buildPanelChart(idx, r, chartEl) {
  chartEl.innerHTML = '';

  if (!r || r.pValue === null || r.pValue === undefined) {
    chartEl.innerHTML = '<div class="no-chart-msg">Not enough bits to run this test.</div>';
    return;
  }

  var id  = idx + 1;
  var cid = 'pc-' + idx;

  // Tests with no chart
  if (id === 8 || id === 10 || id === 11) {
    // Maurer: show a visual gauge for fn vs EL
    if (id === 8 && r.fn !== undefined) {
      _makeMaurerGauge(chartEl, r);
    } else if (id === 10) {
      _makeSerial2Chart(chartEl, cid, r);
    } else if (id === 11) {
      _makeApEnGauge(chartEl, r);
    }
    return;
  }

  var canvas = document.createElement('canvas');
  canvas.id  = cid;
  var wrap   = document.createElement('div');
  wrap.className = 'chart-container';
  wrap.appendChild(canvas);
  chartEl.appendChild(wrap);

  var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  var gridC  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  var tickC  = isDark ? '#636366' : '#8e8e93';

  var chartDefs = {
    scales: {
      x: { ticks: { color: tickC, font: { size: 10 } }, grid: { color: gridC } },
      y: { ticks: { color: tickC, font: { size: 10 } }, grid: { color: gridC } }
    },
    plugins: { legend: { display: false } },
    animation: { duration: 400 },
    responsive: true,
    maintainAspectRatio: false
  };

  var cfg = null;

  switch(id) {
    case 1:
      cfg = { type: 'bar', data: { labels: ['Zeros','Ones'], datasets: [{ data: [r.zeros,r.ones], backgroundColor: ['#0071e3','#30d158'], borderRadius: 6, borderSkipped: false }] }, options: chartDefs };
      break;
    case 2:
      cfg = { type: 'line', data: { labels: r.props.map(function(_,i){ return 'B'+(i+1); }), datasets: [
        { label:'π per block', data: r.props, borderColor:'#0071e3', backgroundColor:'rgba(0,113,227,0.15)', pointRadius: r.props.length>200?0:2, borderWidth:1.5, fill:true, tension:0.2 },
        { label:'Ideal 0.5',  data: new Array(r.N).fill(0.5), borderColor:'#ff9f0a', borderDash:[5,5], borderWidth:1, pointRadius:0 }
      ] }, options: Object.assign({}, chartDefs, { plugins: { legend: { display: true, labels: { color: tickC, font: { size: 10 } } } } }) };
      break;
    case 3:
      if (r.runLengths && r.runLengths.length > 0) {
        var mx = 0; for(var ii=0;ii<r.runLengths.length;ii++) if(r.runLengths[ii]>mx) mx=r.runLengths[ii]; mx=Math.min(mx,20);
        var h=[]; for(var ii=0;ii<mx;ii++) h.push(0);
        for(var ii=0;ii<r.runLengths.length;ii++){ var l=r.runLengths[ii]; if(l>=1&&l<=mx) h[l-1]++; }
        cfg = { type:'bar', data:{ labels: Array.from({length:mx},function(_,i){return String(i+1);}), datasets:[{ data:h, backgroundColor:'#bf5af2', borderRadius:4, borderSkipped:false }] }, options: chartDefs };
      }
      break;
    case 4:
      cfg = { type:'bar', data:{ labels: r.v.map(function(_,i){return String(i+r.vObs_min);}), datasets:[{ data:r.v, backgroundColor:'#0071e3', borderRadius:4, borderSkipped:false }] }, options: chartDefs };
      break;
    case 5:
      cfg = { type:'bar', data:{ labels:['Rank 32','Rank 31','Rank ≤30'], datasets:[{ data:[r.FM,r.FM1,r.rest], backgroundColor:['#30d158','#0071e3','#636366'], borderRadius:6, borderSkipped:false }] }, options: chartDefs };
      break;
    case 6:
      cfg = { type:'bar', data:{ labels: r.Wj.map(function(_,i){return 'B'+(i+1);}), datasets:[{ data:r.Wj, backgroundColor:'#ff9f0a', borderRadius:3, borderSkipped:false }] }, options: chartDefs };
      break;
    case 7:
      cfg = { type:'bar', data:{ labels: r.v.map(function(_,i){return String(i);}), datasets:[{ data:r.v, backgroundColor:'#bf5af2', borderRadius:4, borderSkipped:false }] }, options: chartDefs };
      break;
    case 9:
      cfg = { type:'bar', data:{ labels:['≤-2.5','(-2.5,-1.5]','(-1.5,-0.5]','(-0.5,0.5]','(0.5,1.5]','(1.5,2.5]','>2.5'], datasets:[{ data:r.v, backgroundColor:'#32ade6', borderRadius:4, borderSkipped:false }] }, options: chartDefs };
      break;
    case 12:
      if (r.fwd) {
        var step = Math.max(1, Math.floor(r.fwd.length/300));
        var lbl=[],dat=[];
        for(var ii=0;ii<r.fwd.length;ii+=step){lbl.push(ii);dat.push(r.fwd[ii]);}
        cfg = { type:'line', data:{ labels:lbl, datasets:[
          { label:'Cumulative sum', data:dat, borderColor:'#0071e3', pointRadius:0, borderWidth:1.5, fill:false },
          { label:'Zero', data:new Array(lbl.length).fill(0), borderColor:'#ff453a', borderDash:[4,4], borderWidth:1, pointRadius:0 }
        ] }, options: Object.assign({}, chartDefs, { plugins:{ legend:{ display:true, labels:{ color:tickC, font:{size:10} } } } }) };
      }
      break;
    case 13:
      cfg = { type:'bar', data:{ labels: r.states.map(function(s){return (s>0?'+':'')+s;}),
        datasets:[{ data: r.states.map(function(s){return r.results[s].pValue;}),
          backgroundColor: r.states.map(function(s){return r.results[s].pValue>=0.01?'#30d158':'#ff453a';}),
          borderRadius:4, borderSkipped:false }] }, options: chartDefs };
      break;
    case 14:
      cfg = { type:'bar', data:{ labels: r.states.map(function(s){return (s>0?'+':'')+s;}),
        datasets:[{ data: r.states.map(function(s){return r.results[s].cnt;}),
          backgroundColor:'#bf5af2', borderRadius:3, borderSkipped:false }] }, options: chartDefs };
      break;
  }

  if (cfg) {
    _charts[cid] = new Chart(canvas, cfg);
  } else {
    chartEl.innerHTML = '<div class="no-chart-msg">No chart for this test.</div>';
  }
}

function _makeMaurerGauge(el, r) {
  var pct = Math.min(Math.max(r.fn / (r.EL * 1.4) * 100, 0), 100);
  el.innerHTML =
    '<div style="text-align:center;padding:20px">' +
    '<div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px">f_n vs E[f_n]</div>' +
    '<div style="font-size:2.8rem;font-weight:300;color:var(--text);letter-spacing:-0.03em;font-family:var(--font-mono)">' + r.fn.toFixed(4) + '</div>' +
    '<div style="font-size:0.8rem;color:var(--text3);margin-bottom:20px">Expected: ' + r.EL.toFixed(4) + ' &nbsp;|&nbsp; L=' + r.L + '</div>' +
    '<div style="background:var(--bg4);border-radius:8px;height:8px;overflow:hidden;max-width:280px;margin:0 auto">' +
      '<div style="width:' + pct + '%;height:100%;background:var(--accent);border-radius:8px;transition:width 0.5s"></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:space-between;max-width:280px;margin:6px auto 0;font-size:0.7rem;color:var(--text3)"><span>0</span><span>E[f_n]</span></div>' +
    '</div>';
}

function _makeApEnGauge(el, r) {
  el.innerHTML =
    '<div style="text-align:center;padding:20px">' +
    '<div style="font-size:0.72rem;color:var(--text3);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px">Approximate Entropy</div>' +
    '<div style="font-size:2.8rem;font-weight:300;color:var(--text);letter-spacing:-0.03em;font-family:var(--font-mono)">' + r.ApEn.toFixed(6) + '</div>' +
    '<div style="font-size:0.8rem;color:var(--text3);margin-top:6px">χ² = ' + r.chi2.toFixed(4) + ' &nbsp;|&nbsp; m = ' + r.m + '</div>' +
    '</div>';
}

function _makeSerial2Chart(el, cid, r) {
  var canvas = document.createElement('canvas');
  canvas.id  = cid;
  var wrap = document.createElement('div');
  wrap.className = 'chart-container';
  wrap.appendChild(canvas);
  el.appendChild(wrap);

  var isDark = document.documentElement.getAttribute('data-theme') !== 'light';
  var tickC  = isDark ? '#636366' : '#8e8e93';
  var gridC  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  _charts[cid] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['p-value 1', 'p-value 2'],
      datasets: [{
        data: [r.pv1, r.pv2],
        backgroundColor: [r.pv1>=0.01?'#30d158':'#ff453a', r.pv2>=0.01?'#30d158':'#ff453a'],
        borderRadius: 8, borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      scales: {
        x: { min:0, max:1, ticks:{ color:tickC, font:{size:10} }, grid:{ color:gridC } },
        y: { ticks:{ color:tickC, font:{size:10} }, grid:{ color:'transparent' } }
      },
      plugins: { legend:{ display:false } },
      animation:{ duration:400 }, responsive:true, maintainAspectRatio:false
    }
  });
}

// ── Theme toggle ──────────────────────────────────────────────────────────────

function toggleTheme() {
  var html = document.documentElement;
  var isDark = html.getAttribute('data-theme') === 'dark';
  html.setAttribute('data-theme', isDark ? 'light' : 'dark');
  document.getElementById('themeBtn').textContent = isDark ? '🌙' : '☀️';

  // Re-render charts with updated colors
  if (_results.length > 0) {
    setTimeout(function() { applyResults(_results, _lastParams || {}); }, 50);
  }
}

// ── Navigation ────────────────────────────────────────────────────────────────

function showPage(name, btn) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.nav-pill').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('page-' + name).classList.add('active');
  btn.classList.add('active');
}

// ── Initialise ────────────────────────────────────────────────────────────────

var _lastParams = {};

document.addEventListener('DOMContentLoaded', function() {
  buildCarousel();
});