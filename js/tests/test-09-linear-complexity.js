/**
 * tests/test-09-linear-complexity.js — NIST SP 800-22, Section 2.10
 * Test 9: Linear Complexity Test
 *
 * Purpose: Determines whether the sequence is complex enough to be random.
 * The LFSR length for each M-bit block is computed via the Berlekamp-Massey
 * algorithm and classified into 7 categories based on deviation from the
 * expected length μ for a truly random sequence.
 */

'use strict';

// Theoretical proportions for the 7 T-categories (NIST SP 800-22 Table 2.10)
var LINEAR_COMPLEXITY_PI = [0.010417, 0.031250, 0.125000, 0.500000, 0.250000, 0.062500, 0.020833];

/**
 * Berlekamp-Massey algorithm over GF(2) — iterative, no recursion.
 * Returns the shortest LFSR length that generates the given sequence.
 *
 * @param {number[]} seq  Array of 0/1 values.
 * @returns {number}  LFSR length L.
 */
function berlekampMassey(seq) {
  var n = seq.length;
  var C = new Int32Array(n + 1);  // current connection polynomial
  var B = new Int32Array(n + 1);  // saved polynomial at last L update
  C[0] = 1; B[0] = 1;
  var L = 0, x = 1;

  for (var N = 0; N < n; N++) {
    // Compute discrepancy d
    var d = seq[N] & 1;
    for (var i = 1; i <= L; i++) d ^= (C[i] & 1) & (seq[N - i] & 1);
    d &= 1;

    if (d === 0) {
      // No update needed — advance gap counter
      x++;
    } else {
      var T = C.slice(0, n + 1);
      // Update C: C(x) = C(x) + x^gap * B(x)  over GF(2)
      for (var i = x; i <= n; i++) C[i] ^= (B[i - x] & 1);
      if (2 * L <= N) {
        L = N + 1 - L;
        B = T;
        x = 1;
      } else {
        x++;
      }
    }
  }
  return L;
}

/**
 * Classify T_i value into one of 7 categories.
 * @param {number} Ti
 * @returns {number} index 0-6
 */
function classifyTi(Ti) {
  if      (Ti <= -2.5) return 0;
  else if (Ti <= -1.5) return 1;
  else if (Ti <= -0.5) return 2;
  else if (Ti <   0.5) return 3;
  else if (Ti <   1.5) return 4;
  else if (Ti <   2.5) return 5;
  else                 return 6;
}

/**
 * @param {number[]} bits  Array of 0/1 values.
 * @param {number}   M     Block size (NIST recommends 500 ≤ M ≤ 5000).
 * @returns {{ pValue:number, chi2:number, N:number, M:number, mu:number, v:number[] }|{pValue:null,note:string}}
 */
function testLinearComplexity(bits, M) {
  var n = bits.length;
  var N = Math.floor(n / M);
  if (N < 1) return { pValue: null, note: 'Too short for block size ' + M };

  // Expected LFSR length for a random sequence (NIST eq. 2.10.1)
  var mu = M / 2.0 + (9.0 + Math.pow(-1, M + 1)) / 36.0 - (M / 3.0 + 2.0 / 9.0) / Math.pow(2, M);

  var K = 6;
  var v = [0, 0, 0, 0, 0, 0, 0];

  for (var i = 0; i < N; i++) {
    var block = bits.slice(i * M, i * M + M);
    var Lv    = berlekampMassey(block);
    var Ti    = Math.pow(-1, M) * (Lv - mu) + 2.0 / 9.0;
    v[classifyTi(Ti)]++;
  }

  var chi2 = 0;
  for (var i = 0; i <= K; i++) chi2 += Math.pow(v[i] - N * LINEAR_COMPLEXITY_PI[i], 2) / (N * LINEAR_COMPLEXITY_PI[i]);

  return { pValue: igamc(K / 2, chi2 / 2), chi2: chi2, N: N, M: M, mu: mu, v: v };
}
