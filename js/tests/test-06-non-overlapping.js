/**
 * tests/test-06-non-overlapping.js — NIST SP 800-22, Section 2.7
 * Test 6: Non-overlapping Template Matching Test
 *
 * Purpose: Detects generators that produce too many occurrences of a given
 * non-periodic (aperiodic) pattern. Uses the default NIST template: 0^(m-1)1.
 * After each match the search window is advanced by m positions.
 */

'use strict';

/**
 * @param {number[]} bits  Array of 0/1 values.
 * @param {number}   m     Template length (2 ≤ m ≤ 16; NIST uses m=9 by default).
 * @returns {{ pValue:number, chi2:number, mu:number, sigma2:number, Wj:number[], N:number, M:number, m:number }|{pValue:null,note:string}}
 */
function testNonOverlapping(bits, m) {
  var n = bits.length;
  var N = 8;                          // NIST fixed: 8 disjoint blocks
  var M = Math.floor(n / N);
  if (M < m) return { pValue: null, note: 'Sequence too short (need ' + N * m + ' bits min)' };

  // Build aperiodic template: (m-1) zeros followed by one 1
  var tmpl = [];
  for (var i = 0; i < m - 1; i++) tmpl.push(0);
  tmpl.push(1);

  var mu     = (M - m + 1) / Math.pow(2, m);
  var sigma2 = M * (1.0 / Math.pow(2, m) - (2 * m - 1) / Math.pow(2, 2 * m));

  var Wj = [];
  for (var j = 0; j < N; j++) {
    var cnt = 0, pos = 0;
    while (pos <= M - m) {
      var match = true;
      for (var k = 0; k < m; k++) {
        if (bits[j * M + pos + k] !== tmpl[k]) { match = false; break; }
      }
      if (match) { cnt++; pos += m; }
      else         pos++;
    }
    Wj.push(cnt);
  }

  var chi2 = 0;
  for (var j = 0; j < N; j++) chi2 += Math.pow(Wj[j] - mu, 2) / sigma2;

  return { pValue: igamc(N / 2, chi2 / 2), chi2: chi2, mu: mu, sigma2: sigma2, Wj: Wj, N: N, M: M, m: m };
}
