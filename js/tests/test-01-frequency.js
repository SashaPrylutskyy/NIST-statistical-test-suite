/**
 * tests/test-01-frequency.js — NIST SP 800-22, Section 2.1
 * Test 1: Frequency (Monobit) Test
 *
 * Purpose: Determines whether the number of 1s and 0s in the sequence
 * is approximately equal, as expected for a truly random sequence.
 *
 * SRP: Contains only the statistical logic for this single test.
 * OCP: Can be added to any test runner without modifying existing code.
 */

'use strict';

/**
 * @param {number[]} bits  Array of 0/1 values.
 * @returns {{ pValue:number, sObs:number, ones:number, zeros:number, n:number }}
 */
function testFrequency(bits) {
  var n = bits.length;
  var s = 0;
  for (var i = 0; i < n; i++) s += bits[i] ? 1 : -1;

  var sObs   = Math.abs(s) / Math.sqrt(n);
  var pValue = erfc(sObs / Math.SQRT2);

  var ones = 0;
  for (var i = 0; i < n; i++) if (bits[i]) ones++;

  return { pValue: pValue, sObs: sObs, ones: ones, zeros: n - ones, n: n };
}
