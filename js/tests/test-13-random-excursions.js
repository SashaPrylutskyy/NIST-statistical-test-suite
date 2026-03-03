/**
 * tests/test-13-random-excursions.js — NIST SP 800-22, Section 2.14
 * Test 13: Random Excursions Test
 *
 * Purpose: Determines whether the number of visits to a state x within
 * a cycle (excursion from 0) matches the distribution expected for a
 * random walk. Evaluated for states x ∈ {-4,-3,-2,-1,1,2,3,4}.
 * Requires at least 500 complete excursion cycles (J ≥ 500).
 */

'use strict';

var EXCURSION_STATES = [-4, -3, -2, -1, 1, 2, 3, 4];
var EXCURSION_K      = 5;   // maximum visit category

/**
 * Theoretical probability that state x is visited exactly k times in one cycle.
 * From NIST SP 800-22 Table 2.14.
 *
 * @param {number} x  State value (|x| ≥ 1).
 * @param {number} k  Visit count (0 ≤ k ≤ K).
 * @returns {number}
 */
function piExcursionState(x, k) {
  var ax = Math.abs(x);
  if (k === 0)              return 1.0 - 1.0 / (2.0 * ax);
  if (k < EXCURSION_K)     return (1.0 / (4.0 * ax * ax)) * Math.pow(1.0 - 1.0 / (2.0 * ax), k - 1);
  /* k === K (tail) */     return (1.0 / (2.0 * ax))       * Math.pow(1.0 - 1.0 / (2.0 * ax), EXCURSION_K - 1);
}

/**
 * Build the partial sum array S[0..n+1] with S[0]=0 and S[n+1]=0.
 * The trailing 0 closes the final incomplete cycle if needed.
 *
 * @param {number[]} bits
 * @returns {Int32Array}
 */
function buildPartialSums(bits) {
  var n = bits.length;
  var S = new Int32Array(n + 2);
  S[0] = 0;
  for (var i = 0; i < n; i++) S[i + 1] = S[i] + (bits[i] ? 1 : -1);
  S[n + 1] = 0;
  return S;
}

/**
 * Find all positions where S[i] = 0, including the sentinel start at 0.
 * @param {Int32Array} S
 * @param {number}     n  Original sequence length.
 * @returns {number[]}  Sorted array of zero-crossing indices.
 */
function findCycleBoundaries(S, n) {
  var boundaries = [0];
  for (var i = 1; i <= n + 1; i++) if (S[i] === 0) boundaries.push(i);
  return boundaries;
}

/**
 * @param {number[]} bits  Array of 0/1 values (recommended: ≥ 10 000 bits).
 * @returns {{
 *   pValue: number, J: number,
 *   results: Object.<number, {pValue:number, chi2:number, v:number[]}>,
 *   states: number[]
 * }|{pValue:null, note:string}}
 */
function testRandomExcursions(bits) {
  var n   = bits.length;
  var S   = buildPartialSums(bits);
  var cyc = findCycleBoundaries(S, n);
  var J   = cyc.length - 1;

  if (J < 500) return { pValue: null, note: 'Too few cycles (J=' + J + '). Use >= 10 000 bits.' };

  var results = {};

  for (var si = 0; si < EXCURSION_STATES.length; si++) {
    var xs = EXCURSION_STATES[si];
    var v  = [0, 0, 0, 0, 0, 0];  // visit counts for k = 0..K

    for (var ci = 0; ci < J; ci++) {
      var start = cyc[ci] + 1;
      var end   = cyc[ci + 1];
      var cnt   = 0;
      for (var pos = start; pos <= end; pos++) if (S[pos] === xs) cnt++;
      v[Math.min(cnt, EXCURSION_K)]++;
    }

    var chi2 = 0;
    for (var k = 0; k <= EXCURSION_K; k++) {
      var p = piExcursionState(xs, k);
      if (p > 1e-15) chi2 += Math.pow(v[k] - J * p, 2) / (J * p);
    }
    results[xs] = { pValue: igamc(EXCURSION_K / 2, chi2 / 2), chi2: chi2, v: v };
  }

  // Conservative overall p-value: minimum across all states
  var minPv = 1;
  for (var si = 0; si < EXCURSION_STATES.length; si++)
    if (results[EXCURSION_STATES[si]].pValue < minPv) minPv = results[EXCURSION_STATES[si]].pValue;

  return { pValue: minPv, J: J, results: results, states: EXCURSION_STATES };
}
