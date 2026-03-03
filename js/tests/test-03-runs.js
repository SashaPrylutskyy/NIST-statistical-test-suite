/**
 * tests/test-03-runs.js — NIST SP 800-22, Section 2.3
 * Test 3: Runs Test
 *
 * Purpose: Determines whether the number of runs of consecutive identical bits
 * (both 0-runs and 1-runs) is consistent with a random sequence.
 * Includes a mandatory pre-test on the proportion of 1s.
 */

'use strict';

/**
 * @param {number[]} bits  Array of 0/1 values.
 * @returns {{
 *   pValue: number,
 *   failed_pretest: boolean,
 *   Vn: number,
 *   pi: number,
 *   ones: number,
 *   n: number,
 *   runLengths: number[],
 *   maxRun: number
 * }}
 */
function testRuns(bits) {
  var n = bits.length;
  var ones = 0;
  for (var i = 0; i < n; i++) if (bits[i]) ones++;
  var pi = ones / n;

  // NIST pre-condition: |π - 0.5| must be < 2/√n
  if (Math.abs(pi - 0.5) >= 2.0 / Math.sqrt(n)) {
    return {
      pValue: 0, failed_pretest: true,
      pi: pi, ones: ones, n: n, Vn: 0, runLengths: [], maxRun: 0
    };
  }

  // Count runs and collect run lengths iteratively (avoids call-stack overflow)
  var Vn = 1, cur = 1, maxRun = 1, rl = [];
  for (var i = 1; i < n; i++) {
    if (bits[i] !== bits[i - 1]) {
      Vn++;
      rl.push(cur);
      if (cur > maxRun) maxRun = cur;
      cur = 1;
    } else {
      cur++;
    }
  }
  rl.push(cur);
  if (cur > maxRun) maxRun = cur;

  var num    = Math.abs(Vn - 2.0 * n * pi * (1.0 - pi));
  var den    = 2.0 * Math.sqrt(2.0 * n) * pi * (1.0 - pi);
  var pValue = erfc(num / den);

  return {
    pValue: pValue, failed_pretest: false,
    Vn: Vn, pi: pi, ones: ones, n: n, runLengths: rl, maxRun: maxRun
  };
}
