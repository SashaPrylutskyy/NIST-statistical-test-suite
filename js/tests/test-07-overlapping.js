/**
 * tests/test-07-overlapping.js — NIST SP 800-22, Section 2.8
 * Test 7: Overlapping Template Matching Test
 *
 * Purpose: Detects generators that produce too many consecutive 1s.
 * Uses an all-1s template of length m and counts overlapping matches
 * within M=1032 bit blocks. The match count distribution is compared
 * against Poisson(η) probabilities as specified in NIST SP 800-22.
 */

'use strict';

/**
 * Build Poisson PMF probabilities for the overlapping template test.
 * P(V=k) = e^{-η} · η^k / k!   for k < K
 * P(V≥K) = 1 - Σ P(V=k)         (tail)
 *
 * @param {number} eta  Expected number of matches per block.
 * @param {number} K    Number of categories minus 1.
 * @returns {number[]}  Array of K+1 probabilities.
 */
function buildOverlappingProbabilities(eta, K) {
  var pi = [];
  var term = Math.exp(-eta);   // P(0)
  pi.push(term);
  for (var i = 1; i < K; i++) {
    term = term * eta / i;
    pi.push(term);
  }
  var tail = 1.0;
  for (var i = 0; i < K; i++) tail -= pi[i];
  pi.push(Math.max(0, tail));
  return pi;
}

/**
 * @param {number[]} bits  Array of 0/1 values (minimum 1032 bits required).
 * @param {number}   m     Template length (NIST default: m=9).
 * @returns {{ pValue:number, chi2:number, N:number, M:number, m:number, lambda:number, eta:number, v:number[], pi:number[] }|{pValue:null,note:string}}
 */
function testOverlapping(bits, m) {
  var n = bits.length;
  var K = 5, M = 1032;
  var N = Math.floor(n / M);
  if (N < 1) return { pValue: null, note: 'Need at least 1032 bits' };

  var lambda = (M - m + 1) / Math.pow(2, m);
  var eta    = lambda / 2.0;
  var pi     = buildOverlappingProbabilities(eta, K);

  var v = [];
  for (var i = 0; i <= K; i++) v.push(0);

  for (var j = 0; j < N; j++) {
    var cnt = 0;
    for (var i = 0; i <= M - m; i++) {
      var ok = true;
      for (var k = 0; k < m; k++) {
        if (!bits[j * M + i + k]) { ok = false; break; }
      }
      if (ok) cnt++;
    }
    v[Math.min(cnt, K)]++;
  }

  var chi2 = 0;
  for (var i = 0; i <= K; i++) {
    if (pi[i] > 1e-15) chi2 += Math.pow(v[i] - N * pi[i], 2) / (N * pi[i]);
  }

  return { pValue: igamc(K / 2, chi2 / 2), chi2: chi2, N: N, M: M, m: m, lambda: lambda, eta: eta, v: v, pi: pi };
}
