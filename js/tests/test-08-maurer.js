/**
 * tests/test-08-maurer.js — NIST SP 800-22, Section 2.9
 * Test 8: Maurer's "Universal Statistical" Test
 *
 * Purpose: Measures the compressibility of the sequence.
 * A significantly compressible sequence is considered non-random.
 * L-bit blocks are used; the algorithm tracks the distance between
 * consecutive occurrences of the same L-bit pattern.
 *
 * Reference: Maurer, U.M. (1992). "A universal statistical test for random
 * bit generators." Journal of Cryptology, 5(2), 89–105.
 */

'use strict';

// NIST SP 800-22 Table 2.9 — parameter selection by sequence length
var MAURER_PARAMS = [
  { L:  6, Q:  640, minN:     904960 },
  { L:  7, Q: 1280, minN:    2068480 },
  { L:  8, Q: 1280, minN:    4654080 },
  { L:  9, Q: 1280, minN:   10342400 },
  { L: 10, Q: 1280, minN:   22753280 },
  { L: 11, Q: 1280, minN:   49643520 },
  { L: 12, Q: 1280, minN:  107560960 },
  { L: 13, Q: 1280, minN:  231669760 },
  { L: 14, Q: 1280, minN:  496435200 },
  { L: 15, Q: 1280, minN: 1059061760 },
  { L: 16, Q: 1280, minN: Infinity   }
];

// Expected values E[f_n] from NIST SP 800-22 Table 2.9
// Index = L (block length). Entries for L < 6 are unused (params start at L=6).
// NIST source: expected_value[6]=5.2177052, expected_value[7]=6.1962507, ...
var MAURER_EV  = [0, 0, 0, 0, 0, 0,
                  5.2177052, 6.1962507, 7.1836656, 8.1764248, 9.1723243,
                  10.170032, 11.168765, 12.168070, 13.167693, 14.167488, 15.167379, 16.167257];
// Variance values from NIST SP 800-22 Table 2.9 (same indexing as EV)
var MAURER_VAR = [0, 0, 0, 0, 0, 0,
                  2.1539, 2.2062, 2.2382, 2.2517, 2.2628,
                  2.2656, 2.2659, 2.2656, 2.2654, 2.2647, 2.2645, 2.2640];

/**
 * Select the largest valid L parameter for the given sequence length.
 * @param {number} n
 * @returns {{ L:number, Q:number }}
 */
function selectMaurerParams(n) {
  var L = 6, Q = 640;
  for (var i = 0; i < MAURER_PARAMS.length; i++) {
    if (n >= MAURER_PARAMS[i].minN) { L = MAURER_PARAMS[i].L; Q = MAURER_PARAMS[i].Q; }
    else break;
  }
  return { L: L, Q: Q };
}

/**
 * @param {number[]} bits  Array of 0/1 values.
 * @returns {{ pValue:number, fn:number, EL:number, sigma:number, L:number, Q:number, K:number }|{pValue:null,note:string}}
 */
function testMaurer(bits) {
  var n = bits.length;
  var p = selectMaurerParams(n);
  var L = p.L, Q = p.Q;

  var Kc = Math.floor(n / L) - Q;
  if (Kc < 1) return {
    pValue: null,
    note: 'Need at least ' + (Q + 1) + ' L-bit blocks (L=' + L + '). Use longer sequence.'
  };

  var EL   = (L < MAURER_EV.length)  ? MAURER_EV[L]  : L - 0.5;
  var varL = (L < MAURER_VAR.length) ? MAURER_VAR[L] : 2.8;

  // Initialisation phase: fill lookup table T[pattern] = last block index seen
  var size = 1 << L;
  var T = new Array(size).fill(0);
  for (var i = 1; i <= Q; i++) {
    var idx = 0;
    for (var j = 0; j < L; j++) idx = (idx << 1) | (bits[(i - 1) * L + j] || 0);
    T[idx] = i;
  }

  // Test phase: accumulate log2(distance) over Kc test blocks
  var sum = 0.0;
  for (var i = Q + 1; i <= Q + Kc; i++) {
    var base = (i - 1) * L;
    if (base + L > n) break;
    var idx = 0;
    for (var j = 0; j < L; j++) idx = (idx << 1) | (bits[base + j] || 0);
    sum += Math.log2(i - T[idx]);
    T[idx] = i;
  }

  var fn    = sum / Kc;
  var c     = 0.7 - (0.8 / L) + (4.0 + (32.0 / L)) * Math.pow(Kc, -3.0 / L) / 15.0;
  var sigma = c * Math.sqrt(varL / Kc);

  return {
    pValue: erfc(Math.abs(fn - EL) / (Math.SQRT2 * sigma)),
    fn: fn, EL: EL, sigma: sigma, L: L, Q: Q, K: Kc
  };
}