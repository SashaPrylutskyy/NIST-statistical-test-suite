/**
 * tests/test-04-longest-run.js — NIST SP 800-22, Section 2.4
 * Test 4: Test for the Longest Run of Ones in a Block
 *
 * Purpose: Determines whether the longest run of 1s within M-bit blocks
 * is consistent with the distribution expected for a random sequence.
 * Block size M and thresholds are selected automatically based on n.
 */

'use strict';

// Theoretical probabilities from NIST SP 800-22 Table 2.4
var LONGEST_RUN_PARAMS = {
  8:     { K: 3, N: 16,  vMin: 1,  pi: [0.21484375, 0.36718750, 0.23046875, 0.18750000] },
  128:   { K: 5, N: 49,  vMin: 4,  pi: [0.11743772, 0.24308928, 0.24927108, 0.17517706, 0.10274308, 0.11228178] },
  10000: { K: 6, N: 75,  vMin: 10, pi: [0.08834131, 0.20921252, 0.24836008, 0.19323214, 0.12077825, 0.06759409, 0.07248162] }
};

/**
 * @param {number[]} bits  Array of 0/1 values (minimum 128 bits required).
 * @returns {{ pValue:number, chi2:number, N:number, M:number, K:number, v:number[], vObs_min:number }|{pValue:null, note:string}}
 */
function testLongestRun(bits) {
  var n = bits.length;
  if (n < 128) return { pValue: null, note: 'n < 128, not applicable' };

  // Select block size M based on sequence length
  var M;
  if      (n < 6272)    M = 8;
  else if (n < 750000)  M = 128;
  else                  M = 10000;

  var p     = LONGEST_RUN_PARAMS[M];
  var K     = p.K;
  var N     = p.N;
  var vMin  = p.vMin;
  var piTbl = p.pi;

  var v = [];
  for (var i = 0; i <= K; i++) v.push(0);

  for (var i = 0; i < N; i++) {
    var maxR = 0, cur = 0;
    for (var j = 0; j < M; j++) {
      if (bits[i * M + j]) { cur++; if (cur > maxR) maxR = cur; }
      else                   cur = 0;
    }
    var idx = maxR - vMin;
    if (idx < 0) idx = 0;
    if (idx > K) idx = K;
    v[idx]++;
  }

  var chi2 = 0;
  for (var i = 0; i <= K; i++) chi2 += Math.pow(v[i] - N * piTbl[i], 2) / (N * piTbl[i]);

  return { pValue: igamc(K / 2, chi2 / 2), chi2: chi2, N: N, M: M, K: K, v: v, vObs_min: vMin };
}
