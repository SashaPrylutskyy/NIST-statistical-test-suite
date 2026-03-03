/**
 * tests/test-14-random-excursions-variant.js — NIST SP 800-22, Section 2.15
 * Test 14: Random Excursions Variant Test
 *
 * Purpose: Detects deviations from the expected number of times a specific
 * state is visited across the total random walk. Evaluated for 18 states:
 * x ∈ {-9,…,-1, 1,…,9}.
 * Requires at least 500 zero crossings (J ≥ 500).
 */

'use strict';

var VARIANT_STATES = [-9,-8,-7,-6,-5,-4,-3,-2,-1, 1,2,3,4,5,6,7,8,9];

/**
 * @param {number[]} bits  Array of 0/1 values (recommended: ≥ 10 000 bits).
 * @returns {{
 *   pValue: number, J: number,
 *   results: Object.<number, {pValue:number, cnt:number}>,
 *   states: number[]
 * }|{pValue:null, note:string}}
 */
function testRandomExcursionsVariant(bits) {
  var n = bits.length;

  // Build partial sums with appended 0 to close the final cycle
  var S = new Int32Array(n + 2); S[0] = 0;
  for (var i = 0; i < n; i++) S[i + 1] = S[i] + (bits[i] ? 1 : -1);
  S[n + 1] = 0;

  // Count zero crossings J (every position where S returns to 0)
  var J = 0;
  for (var i = 1; i <= n + 1; i++) if (S[i] === 0) J++;

  if (J < 500) return { pValue: null, note: 'Too few zero crossings (J=' + J + '). Use >= 10 000 bits.' };

  var results = {};

  for (var si = 0; si < VARIANT_STATES.length; si++) {
    var xs  = VARIANT_STATES[si];
    var cnt = 0;
    for (var i = 1; i <= n; i++) if (S[i] === xs) cnt++;

    // NIST SP 800-22 eq. 2.15.4
    var num = Math.abs(cnt - J);
    var den = Math.sqrt(2.0 * J * (4.0 * Math.abs(xs) - 2.0));
    results[xs] = { pValue: den > 0 ? erfc(num / den) : 0, cnt: cnt };
  }

  // Conservative overall p-value: minimum across all states
  var minPv = 1;
  for (var si = 0; si < VARIANT_STATES.length; si++)
    if (results[VARIANT_STATES[si]].pValue < minPv) minPv = results[VARIANT_STATES[si]].pValue;

  return { pValue: minPv, J: J, results: results, states: VARIANT_STATES };
}
