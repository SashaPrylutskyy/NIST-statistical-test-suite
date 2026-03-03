/**
 * ui/renderers.js — Per-test result rendering functions
 * SRP: each renderTN function is responsible for exactly one test's visual output.
 * OCP: new renderers can be added without modifying existing ones.
 *
 * Dependencies (globals): makeCard, row, mkChart, barCfg, lineCfg, CHART_COLORS
 */

'use strict';

function renderT1(r) {
  makeCard(1, 'Frequency (Monobit)', 'Uniformity of 0s and 1s across entire sequence', r,
    row('S_obs',  r.sObs.toFixed(6)) +
    row('Ones',   r.ones  + ' (' + (r.ones  / r.n * 100).toFixed(1) + '%)') +
    row('Zeros',  r.zeros + ' (' + (r.zeros / r.n * 100).toFixed(1) + '%)') +
    row('n',      r.n),
    'cT1');
  mkChart('cT1', barCfg(['Zeros', 'Ones'], [r.zeros, r.ones], CHART_COLORS.blue));
}

function renderT2(r, M) {
  if (!r) {
    makeCard(2, 'Block Frequency', 'Proportion of 1s in each block',
      { pValue: null, note: 'Not enough bits for M=' + M }, '', '');
    return;
  }
  makeCard(2, 'Block Frequency', 'Proportion of 1s in each block of M=' + r.M, r,
    row('chi2',       r.chi2.toFixed(6)) +
    row('Blocks N',   r.N) +
    row('Block size M', r.M),
    'cT2');
  mkChart('cT2', lineCfg(
    r.props.map(function(_, i) { return 'B' + (i + 1); }),
    [
      {
        label: 'pi per block', data: r.props,
        borderColor: CHART_COLORS.blue, backgroundColor: CHART_COLORS.blue + '20',
        pointRadius: r.props.length > 200 ? 0 : 2, borderWidth: 1.5, fill: true, tension: 0.2
      },
      {
        label: 'Ideal 0.5', data: new Array(r.N).fill(0.5),
        borderColor: CHART_COLORS.orange, borderDash: [5, 5], borderWidth: 1, pointRadius: 0
      }
    ]
  ));
}

function renderT3(r) {
  var pretestRow = r.failed_pretest ? row('Pre-test', 'FAILED — |pi-0.5| >= 2/sqrt(n)') : '';
  var piStr      = typeof r.pi === 'number' ? r.pi.toFixed(6) : 'N/A';
  var showChart  = !r.failed_pretest && r.runLengths && r.runLengths.length > 0;

  makeCard(3, 'Runs', 'Number of uninterrupted sequences of identical bits', r,
    pretestRow +
    row('Total runs Vn',  r.Vn) +
    row('pi (ones ratio)', piStr) +
    row('Max run',         r.maxRun || 'N/A') +
    row('n',               r.n),
    showChart ? 'cT3' : '');

  if (showChart) {
    var maxRL = 0;
    for (var i = 0; i < r.runLengths.length; i++) if (r.runLengths[i] > maxRL) maxRL = r.runLengths[i];
    var mx = Math.min(maxRL, 20);
    if (mx < 1) return;
    var h = [], xlabels = [];
    for (var i = 0; i < mx; i++) h.push(0);
    for (var i = 0; i < r.runLengths.length; i++) {
      var l = r.runLengths[i];
      if (l >= 1 && l <= mx) h[l - 1]++;
    }
    for (var i = 1; i <= mx; i++) xlabels.push(String(i));
    mkChart('cT3', barCfg(xlabels, h, CHART_COLORS.purple, 'Run length'));
  }
}

function renderT4(r) {
  if (!r || r.pValue === null) {
    makeCard(4, 'Longest Run of Ones', 'Longest run of 1s in a block', r || { pValue: null, note: 'n < 128' }, '', '');
    return;
  }
  makeCard(4, 'Longest Run of Ones', 'Longest run of 1s in blocks of M=' + r.M, r,
    row('chi2',        r.chi2.toFixed(6)) +
    row('Blocks N',    r.N) +
    row('Block size M', r.M),
    'cT4');
  mkChart('cT4', barCfg(
    r.v.map(function(_, i) { return String(i + r.vObs_min); }),
    r.v, CHART_COLORS.cyan, 'Max run length'
  ));
}

function renderT5(r) {
  if (!r || r.pValue === null) {
    makeCard(5, 'Binary Matrix Rank', 'Linear independence of 32x32 substrings',
      r || { pValue: null, note: 'Need at least 1024 bits' }, '', '');
    return;
  }
  makeCard(5, 'Binary Matrix Rank', 'Rank of 32×32 binary matrices', r,
    row('chi2',        r.chi2.toFixed(6)) +
    row('Matrices N',  r.N) +
    row('Rank 32',     r.FM) +
    row('Rank 31',     r.FM1) +
    row('Rank <= 30',  r.rest),
    'cT5');
  mkChart('cT5', barCfg(['Rank 32', 'Rank 31', 'Rank <= 30'], [r.FM, r.FM1, r.rest], CHART_COLORS.green));
}

function renderT6(r) {
  if (!r || r.pValue === null) {
    makeCard(6, 'Non-Overlapping Template', 'Template 0...01 matching',
      r || { pValue: null, note: 'Too short' }, '', '');
    return;
  }
  makeCard(6, 'Non-Overlapping Template', 'Template: ' + '0'.repeat(r.m - 1) + '1 (m=' + r.m + ')', r,
    row('chi2',     r.chi2.toFixed(6)) +
    row('mu',       r.mu.toFixed(4)) +
    row('sigma2',   r.sigma2.toFixed(4)) +
    row('Blocks N', r.N),
    'cT6');
  mkChart('cT6', barCfg(r.Wj.map(function(_, i) { return 'B' + (i + 1); }), r.Wj, CHART_COLORS.orange, 'Block'));
}

function renderT7(r) {
  if (!r || r.pValue === null) {
    makeCard(7, 'Overlapping Template', 'All-ones template matching',
      r || { pValue: null, note: 'Need at least 1032 bits' }, '', '');
    return;
  }
  makeCard(7, 'Overlapping Template', 'All-ones template of length m=' + r.m, r,
    row('chi2',     r.chi2.toFixed(6)) +
    row('lambda',   r.lambda.toFixed(4)) +
    row('eta',      r.eta.toFixed(4)) +
    row('Blocks N', r.N),
    'cT7');
  mkChart('cT7', barCfg(r.v.map(function(_, i) { return String(i); }), r.v, CHART_COLORS.purple, 'Match count'));
}

function renderT8(r) {
  makeCard(8, "Maurer's Universal", 'Compressibility of the sequence', r,
    (r && r.fn !== undefined
      ? row('f_n',    r.fn.toFixed(6)) +
        row('E[f_n]', r.EL.toFixed(6)) +
        row('sigma',  r.sigma.toFixed(6)) +
        row('L',      r.L) +
        row('Q',      r.Q) +
        row('K',      r.K)
      : ''),
    '');
}

function renderT9(r) {
  if (!r || r.pValue === null) {
    makeCard(9, 'Linear Complexity', 'LFSR length via Berlekamp-Massey',
      r || { pValue: null, note: 'Too short' }, '', '');
    return;
  }
  makeCard(9, 'Linear Complexity', 'LFSR lengths over N=' + r.N + ' blocks of M=' + r.M, r,
    row('chi2',     r.chi2.toFixed(6)) +
    row('mu',       r.mu.toFixed(4)) +
    row('Blocks N', r.N),
    'cT9');
  mkChart('cT9', barCfg(
    ['<=-2.5', '(-2.5,-1.5]', '(-1.5,-0.5]', '(-0.5,0.5]', '(0.5,1.5]', '(1.5,2.5]', '>2.5'],
    r.v, CHART_COLORS.cyan, 'T category'
  ));
}

function renderT10(r) {
  makeCard(10, 'Serial', 'Frequency of all m-bit overlapping patterns (m=3)', r,
    row('del-psi2',  r.dPsi2.toFixed(6)) +
    row('del2-psi2', r.d2Psi2.toFixed(6)) +
    row('p-value 1', r.pv1.toFixed(8)) +
    row('p-value 2', r.pv2.toFixed(8)) +
    row('m',         r.m),
    '');
}

function renderT11(r) {
  makeCard(11, 'Approximate Entropy', 'Frequency of overlapping m vs (m+1)-bit patterns', r,
    row('ApEn',     r.ApEn.toFixed(6)) +
    row('phi(m)',   r.phi_m.toFixed(6)) +
    row('phi(m+1)', r.phi_m1.toFixed(6)) +
    row('chi2',     r.chi2.toFixed(6)) +
    row('m',        r.m),
    '');
}

function renderT12(r) {
  makeCard(12, 'Cumulative Sums', 'Max deviation of partial sums from zero', r,
    row('p-value fwd', r.pv_fwd.toFixed(8)) +
    row('p-value bwd', r.pv_bwd.toFixed(8)) +
    row('max|S| fwd',  r.maxF) +
    row('max|S| bwd',  r.maxB),
    'cT12');

  if (r.fwd) {
    var step = Math.max(1, Math.floor(r.fwd.length / 300));
    var lbl = [], dat = [];
    for (var i = 0; i < r.fwd.length; i += step) { lbl.push(i); dat.push(r.fwd[i]); }
    mkChart('cT12', lineCfg(lbl, [
      { label: 'Cumulative sum', data: dat, borderColor: CHART_COLORS.blue,   pointRadius: 0, borderWidth: 1.5, fill: false },
      { label: 'Zero',           data: new Array(lbl.length).fill(0),
        borderColor: CHART_COLORS.orange, borderDash: [4, 4], borderWidth: 1, pointRadius: 0 }
    ]));
  }
}

function renderT13(r) {
  if (!r || r.pValue === null) {
    makeCard(13, 'Random Excursions', 'Visits per state in each cycle',
      r || { pValue: null, note: 'Not enough cycles. Use >= 10 000 bits.' }, '', '');
    return;
  }
  var pvRows = r.states.map(function(s) {
    var res = r.results[s];
    return '<span style="color:#aaa">x=' + (s > 0 ? '+' : '') + s + ':</span> '
         + '<span style="color:#fff;font-family:monospace">'
         + res.pValue.toFixed(6) + ' ' + (res.pValue >= 0.01 ? 'PASS' : 'FAIL') + '</span>';
  }).join('&nbsp;&nbsp;');
  makeCard(13, 'Random Excursions', 'Distribution of visits per state across J=' + r.J + ' cycles', r,
    row('J (cycles)', r.J) + '<div class="pv-multi">' + pvRows + '</div>', '');
}

function renderT14(r) {
  if (!r || r.pValue === null) {
    makeCard(14, 'Random Excursions Variant', 'Total visits per state',
      r || { pValue: null, note: 'Not enough crossings. Use >= 10 000 bits.' }, '', '');
    return;
  }
  var pvRows = r.states.map(function(s) {
    var res = r.results[s];
    return '<span style="color:#aaa">x=' + (s > 0 ? '+' : '') + s + ':</span> '
         + '<span style="color:#fff;font-family:monospace">'
         + res.pValue.toFixed(6) + ' ' + (res.pValue >= 0.01 ? 'PASS' : 'FAIL') + '</span>';
  }).join('&nbsp;&nbsp;');
  makeCard(14, 'Random Excursions Variant', 'Total visits per state, J=' + r.J + ' crossings', r,
    row('J (zero crossings)', r.J) + '<div class="pv-multi">' + pvRows + '</div>', 'cT14');
  mkChart('cT14', barCfg(
    r.states.map(function(s) { return (s > 0 ? '+' : '') + s; }),
    r.states.map(function(s) { return r.results[s].cnt; }),
    CHART_COLORS.purple, 'State x'
  ));
}