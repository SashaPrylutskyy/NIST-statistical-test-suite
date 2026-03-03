/**
 * tests/test-10-serial.js — NIST SP 800-22, Section 2.11
 * Test 10: Serial Test
 *
 * Purpose: Determines whether all possible overlapping m-bit patterns
 * appear with approximately equal frequency. Two p-values are produced
 * (based on first and second differences of ψ²_m).
 */

'use strict';

/**
 * Compute ψ²_m: frequency statistic for all overlapping m-bit patterns.
 * The sequence is treated as circular (wrap-around for the last m-1 bits).
 *
 * @param {number[]} bits
 * @param {number}   m     Pattern length (m ≥ 1).
 * @returns {number}  ψ²_m value.
 */
function serialPsi2(bits, m) {
  if (m <= 0) return 0;
  var n = bits.length;
  var cnt = {};

  for (var i = 0; i < n; i++) {
    var key = '';
    for (var j = 0; j < m; j++) key += (bits[(i + j) % n] ? '1' : '0');
    cnt[key] = (cnt[key] || 0) + 1;
  }

  var sum = 0;
  for (var k in cnt) sum += cnt[k] * cnt[k];
  return sum * Math.pow(2, m) / n - n;
}

/**
 * @param {number[]} bits  Array of 0/1 values.
 * @returns {{ pValue:number, pv1:number, pv2:number, dPsi2:number, d2Psi2:number, m:number }}
 */
function testSerial(bits) {
  var m = 3;  // m=3 produces K=4 and K=2 degrees of freedom — standard NIST choice

  var pm  = serialPsi2(bits, m);
  var pm1 = serialPsi2(bits, m - 1);
  var pm2 = serialPsi2(bits, m - 2);

  var dPsi  = pm - pm1;                 // first difference
  var d2Psi = pm - 2 * pm1 + pm2;      // second difference

  var pv1 = igamc(Math.pow(2, m - 2), dPsi  / 2);
  var pv2 = igamc(Math.pow(2, m - 3), d2Psi / 2);

  return {
    pValue: Math.min(pv1, pv2),
    pv1: pv1, pv2: pv2,
    dPsi2: dPsi, d2Psi2: d2Psi,
    m: m
  };
}
