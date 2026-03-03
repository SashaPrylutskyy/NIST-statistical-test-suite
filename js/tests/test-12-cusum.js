/**
 * tests/test-12-cusum.js — NIST SP 800-22, Section 2.13
 * Test 12: Cumulative Sums (Cusum) Test
 *
 * Purpose: Determines whether the cumulative sum of the ±1-transformed
 * sequence is too large or too small relative to the expected behaviour
 * of a random walk. Both forward and backward passes are performed.
 */

'use strict';

/**
 * Compute the Cusum p-value using the NIST closed-form formula
 * (SP 800-22 eq. 2.13.4 / 2.13.5).
 *
 * @param {number} n  Sequence length.
 * @param {number} z  Maximum absolute partial sum.
 * @returns {number}  p-value.
 */
function cusumPValue(n, z) {
  var sqn = Math.sqrt(n);
  var sum1 = 0, sum2 = 0;

  var kLo = Math.ceil((-n / z + 1) / 4);
  var kHi = Math.floor((n / z - 1) / 4);
  for (var k = kLo; k <= kHi; k++)
    sum1 += norm_cdf((4 * k + 1) * z / sqn) - norm_cdf((4 * k - 1) * z / sqn);

  kLo = Math.ceil((-n / z - 3) / 4);
  kHi = Math.floor((n / z - 1) / 4);
  for (var k = kLo; k <= kHi; k++)
    sum2 += norm_cdf((4 * k + 3) * z / sqn) - norm_cdf((4 * k + 1) * z / sqn);

  return 1.0 - sum1 + sum2;
}

/**
 * @param {number[]} bits  Array of 0/1 values.
 * @returns {{ pValue:number, pv_fwd:number, pv_bwd:number, maxF:number, maxB:number, fwd:number[], n:number }}
 */
function testCusum(bits) {
  var n = bits.length;
  var S = 0, maxF = 0;
  var fwd = [0];

  // Forward pass
  for (var i = 0; i < n; i++) {
    S += bits[i] ? 1 : -1;
    fwd.push(S);
    if (Math.abs(S) > maxF) maxF = Math.abs(S);
  }

  // Backward pass
  S = 0;
  var maxB = 0;
  for (var i = n - 1; i >= 0; i--) {
    S += bits[i] ? 1 : -1;
    if (Math.abs(S) > maxB) maxB = Math.abs(S);
  }

  var pvF = cusumPValue(n, maxF);
  var pvB = cusumPValue(n, maxB);

  return {
    pValue: Math.min(pvF, pvB),
    pv_fwd: pvF, pv_bwd: pvB,
    maxF: maxF, maxB: maxB,
    fwd: fwd, n: n
  };
}
