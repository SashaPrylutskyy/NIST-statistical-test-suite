/**
 * tests/test-05-matrix-rank.js — NIST SP 800-22, Section 2.5
 * Test 5: Binary Matrix Rank Test
 *
 * Purpose: Checks for linear dependence among fixed-length substrings
 * by computing the GF(2) rank of 32×32 binary matrices.
 */

'use strict';

/**
 * Gaussian elimination over GF(2) on a flat bit array.
 * @param {number[]} flat  1D array of length rows×cols.
 * @param {number}   rows
 * @param {number}   cols
 * @returns {number}  Rank of the matrix.
 */
function matrixRankGF2(flat, rows, cols) {
  // Build mutable row arrays
  var m = [];
  for (var i = 0; i < rows; i++) {
    var row = new Uint8Array(cols);
    for (var j = 0; j < cols; j++) row[j] = flat[i * cols + j];
    m.push(row);
  }

  var rank = 0;
  for (var col = 0; col < cols && rank < rows; col++) {
    // Find pivot row
    var pivot = -1;
    for (var r = rank; r < rows; r++) { if (m[r][col]) { pivot = r; break; } }
    if (pivot === -1) continue;

    // Swap into position
    var tmp = m[rank]; m[rank] = m[pivot]; m[pivot] = tmp;

    // Eliminate all other rows in this column
    for (var r = 0; r < rows; r++) {
      if (r !== rank && m[r][col])
        for (var c = 0; c < cols; c++) m[r][c] ^= m[rank][c];
    }
    rank++;
  }
  return rank;
}

/**
 * @param {number[]} bits  Array of 0/1 values (minimum 1024 bits required).
 * @returns {{ pValue:number, chi2:number, N:number, FM:number, FM1:number, rest:number }|{pValue:null,note:string}}
 */
function testMatrixRank(bits) {
  var ROWS = 32, COLS = 32, BLOCK = ROWS * COLS;
  var N = Math.floor(bits.length / BLOCK);
  if (N < 1) return { pValue: null, note: 'Need at least ' + BLOCK + ' bits' };

  var FM = 0, FM1 = 0, rest = 0;
  for (var i = 0; i < N; i++) {
    var flat = bits.slice(i * BLOCK, i * BLOCK + BLOCK);
    var rk   = matrixRankGF2(flat, ROWS, COLS);
    if      (rk === ROWS)     FM++;
    else if (rk === ROWS - 1) FM1++;
    else                      rest++;
  }

  // Theoretical probabilities for 32×32 matrices (NIST SP 800-22, Section 2.5)
  var p32   = 0.28879084, p31 = 0.57760166, pRest = 0.13360750;
  var chi2  = Math.pow(FM   - p32   * N, 2) / (p32   * N)
            + Math.pow(FM1  - p31   * N, 2) / (p31   * N)
            + Math.pow(rest - pRest * N, 2) / (pRest * N);

  // Chi-square with 2 degrees of freedom → igamc(1, chi2/2)
  return { pValue: igamc(1, chi2 / 2), chi2: chi2, N: N, FM: FM, FM1: FM1, rest: rest };
}
