/**
 * tests/test-02-block-frequency.js — NIST SP 800-22, Section 2.2
 * Test 2: Frequency Test within a Block
 *
 * Purpose: Determines whether the proportion of 1s in each M-bit block
 * is approximately M/2 as expected for a random sequence.
 */

'use strict';

/**
 * @param {number[]} bits  Array of 0/1 values.
 * @param {number}   M     Block size (recommended: M >= 20, M > 0.01n, N >= 100).
 * @returns {{ pValue:number, chi2:number, N:number, M:number, props:number[] }|null}
 *          Returns null when there is insufficient data for the given M.
 */
function testBlockFrequency(bits, M) {
  var n = bits.length;
  var N = Math.floor(n / M);
  if (N < 1) return null;

  var chi2  = 0;
  var props = [];

  for (var i = 0; i < N; i++) {
    var ones = 0;
    for (var j = 0; j < M; j++) if (bits[i * M + j]) ones++;
    var pi = ones / M;
    props.push(pi);
    chi2 += Math.pow(pi - 0.5, 2);
  }
  chi2 *= 4 * M;

  return { pValue: igamc(N / 2, chi2 / 2), chi2: chi2, N: N, M: M, props: props };
}
