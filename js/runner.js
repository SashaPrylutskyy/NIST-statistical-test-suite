/**
 * runner.js — Test orchestration
 * Updated to call applyResults() for the carousel UI.
 */

'use strict';

var TESTS = [
  { run: testFrequency,                render: null },
  { run: testBlockFrequency,           render: null, extraArgs: function(p){ return [p.M]; } },
  { run: testRuns,                     render: null },
  { run: testLongestRun,               render: null },
  { run: testMatrixRank,               render: null },
  { run: testNonOverlapping,           render: null, extraArgs: function(p){ return [p.m]; } },
  { run: testOverlapping,              render: null, extraArgs: function(p){ return [p.m]; } },
  { run: testMaurer,                   render: null },
  { run: testLinearComplexity,         render: null, extraArgs: function(p){ return [p.lcM]; } },
  { run: testSerial,                   render: null },
  { run: testApproxEntropy,            render: null },
  { run: testCusum,                    render: null },
  { run: testRandomExcursions,         render: null },
  { run: testRandomExcursionsVariant,  render: null }
];

function runAllTests(bits, params) {
  var results = [];
  for (var i = 0; i < TESTS.length; i++) {
    var t    = TESTS[i];
    var args = [bits].concat(t.extraArgs ? t.extraArgs(params) : []);
    var r    = t.run.apply(null, args);
    results.push(r);
  }

  // Carousel UI
  _lastParams = params;
  applyResults(results, params);
  renderSummary(bits.length, results);
}

function renderSummary(totalBits, results) {
  var withPv = results.filter(function(r){ return r && r.pValue !== null && r.pValue !== undefined; });
  var passed = withPv.filter(function(r){ return r.pValue >= 0.01; }).length;
  var failed = withPv.filter(function(r){ return r.pValue <  0.01; }).length;
  var na     = results.filter(function(r){ return !r || r.pValue === null || r.pValue === undefined; }).length;

  var el = document.getElementById('summary');
  el.innerHTML =
    '<span class="sum-pill sum-pass"><span class="dot"></span>PASS: ' + passed + '</span>' +
    '<span class="sum-pill sum-fail"><span class="dot"></span>FAIL: ' + failed + '</span>' +
    '<span class="sum-pill sum-na"><span class="dot"></span>N/A: ' + na + '</span>' +
    '<span class="sum-bits">' + totalBits + ' bits</span>';
  el.classList.add('visible');

  var layout = document.getElementById('carouselLayout');
  if (layout) layout.classList.add('visible');
}