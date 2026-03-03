/**
 * tests/test-11-approx-entropy.js — NIST SP 800-22, Section 2.12
 * Test 11: Approximate Entropy Test
 *
 * Purpose: Compares the frequency of overlapping m-bit and (m+1)-bit
 * patterns. A large difference (low ApEn) suggests non-randomness.
 *
 * Reference: Pincus, S.M. (1991). "Approximate entropy as a measure of
 * system complexity." PNAS, 88(6), 2297–2301.
 */

'use strict';

/**
 * Compute φ(m): the mean log-frequency of all overlapping m-bit patterns
 * using a circular (wrap-around) extension of the sequence.
 *
 * @param {number[]} bits
 * @param {number}   m     Pattern length.
 * @returns {number}  φ(m) value.
 */
function approxEntPhi(bits, m) {
  var n = bits.length;
  var cnt = {};

  for (var i = 0; i < n; i++) {
    var key = '';
    for (var j = 0; j < m; j++) key += (bits[(i + j) % n] ? '1' : '0');
    cnt[key] = (cnt[key] || 0) + 1;
  }

  var phi = 0;
  for (var k in cnt) {
    var p = cnt[k] / n;
    phi += p * Math.log(p);
  }
  return phi;
}

/**
 * @param {number[]} bits  Array of 0/1 values.
 * @returns {{ pValue:number, chi2:number, ApEn:number, phi_m:number, phi_m1:number, m:number, n:number }}
 */
function testApproxEntropy(bits) {
  var m = 2;  // m=2 is the NIST recommended default for general use

  var phi_m  = approxEntPhi(bits, m);
  var phi_m1 = approxEntPhi(bits, m + 1);
  var ApEn   = phi_m - phi_m1;
  var chi2   = 2.0 * bits.length * (Math.log(2) - ApEn);

  return {
    pValue: igamc(Math.pow(2, m - 1), chi2 / 2),
    chi2: chi2, ApEn: ApEn, phi_m: phi_m, phi_m1: phi_m1, m: m, n: bits.length
  };
}
