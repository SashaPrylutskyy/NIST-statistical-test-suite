/**
 * runner.js — Test orchestration and summary rendering
 * SRP: responsible only for running all tests, collecting results, and
 *      updating the summary panel. Does not know about DOM cards or charts.
 * OCP: adding a new test = push one entry to TESTS and RENDERERS arrays.
 * DIP: depends on test-function and renderer abstractions, not concrete tests.
 */

'use strict';

/**
 * Registry of all 14 NIST tests.
 * Each entry: { run: Function, render: Function, extraArgs?: Function }
 *
 * extraArgs(params) → additional arguments beyond `bits` for tests that
 * require user-configurable parameters (block size, template length, etc.).
 */
var TESTS = [
  { run: testFrequency,                render: renderT1 },
  { run: testBlockFrequency,           render: renderT2,  extraArgs: function(p){ return [p.M]; } },
  { run: testRuns,                     render: renderT3 },
  { run: testLongestRun,               render: renderT4 },
  { run: testMatrixRank,               render: renderT5 },
  { run: testNonOverlapping,           render: renderT6,  extraArgs: function(p){ return [p.m]; } },
  { run: testOverlapping,              render: renderT7,  extraArgs: function(p){ return [p.m]; } },
  { run: testMaurer,                   render: renderT8 },
  { run: testLinearComplexity,         render: renderT9,  extraArgs: function(p){ return [p.lcM]; } },
  { run: testSerial,                   render: renderT10 },
  { run: testApproxEntropy,            render: renderT11 },
  { run: testCusum,                    render: renderT12 },
  { run: testRandomExcursions,         render: renderT13 },
  { run: testRandomExcursionsVariant,  render: renderT14 }
];

/**
 * Execute all 14 tests and render results + summary.
 *
 * @param {number[]} bits     Array of 0/1 values.
 * @param {{ M:number, m:number, lcM:number }} params  User-configurable parameters.
 */
function runAllTests(bits, params) {
  document.getElementById('results').innerHTML = '';

  var results = [];
  for (var i = 0; i < TESTS.length; i++) {
    var t    = TESTS[i];
    var args = [bits].concat(t.extraArgs ? t.extraArgs(params) : []);
    var r    = t.run.apply(null, args);
    results.push(r);

    // Render needs the extra args too (e.g. renderT2 needs M for the N/A message)
    var renderArgs = [r].concat(t.extraArgs ? t.extraArgs(params) : []);
    t.render.apply(null, renderArgs);
  }

  renderSummary(bits.length, results);
}

/**
 * Update the summary panel with pass / fail / N/A counts.
 *
 * @param {number}   totalBits
 * @param {Array}    results
 */
function renderSummary(totalBits, results) {
  var withPv  = results.filter(function(r) { return r && r.pValue !== null && r.pValue !== undefined; });
  var passed  = withPv.filter(function(r) { return r.pValue >= 0.01; }).length;
  var failed  = withPv.filter(function(r) { return r.pValue <  0.01; }).length;
  var na      = results.filter(function(r) { return !r || r.pValue === null || r.pValue === undefined; }).length;

  var sumEl = document.getElementById('summary');
  sumEl.innerHTML =
    '<h3>Summary</h3>' +
    '<span class="sum-item sum-pass">PASS: ' + passed + '</span>' +
    '<span class="sum-item sum-fail">FAIL: ' + failed + '</span>' +
    '<span class="sum-item" style="background:#1e1e2e;border:1px solid #444;color:#aaa">N/A: ' + na + '</span>' +
    '<span style="font-size:0.8rem;color:#555">Total bits: ' + totalBits + '</span>';
  sumEl.style.display = 'flex';
}