/**
 * ui/controller.js — UI event handling and input validation
 * SRP: responsible only for reading user input, validating it, and
 *      delegating to the runner. Knows nothing about test logic or charts.
 * DIP: calls runAllTests() — depends on runner abstraction, not test implementations.
 */

'use strict';

/**
 * Validate the raw input string.
 * @param {string} raw
 * @returns {{ error: string }|{ bits: number[] }}
 */
function validateInput(raw) {
  if (!raw)                    return { error: 'Please enter a binary sequence.' };
  if (!/^[01]+$/.test(raw))   return { error: 'Input must contain only 0s and 1s.' };
  if (raw.length < 100)        return { error: 'Minimum 100 bits required.' };
  return { bits: raw.split('').map(Number) };
}

/**
 * Read and sanitise numeric parameters from the DOM.
 * @returns {{ M:number, m:number, lcM:number }}
 */
function readParams() {
  return {
    M:   parseInt(document.getElementById('blockSize').value, 10) || 128,
    m:   parseInt(document.getElementById('tmplSize').value,  10) || 9,
    lcM: parseInt(document.getElementById('lcBlock').value,   10) || 500
  };
}

/**
 * Handler for the "Run All Tests" button.
 * Validates input, shows a spinner, then delegates to runAllTests().
 */
function runAll() {
  var raw    = document.getElementById('binInput').value.replace(/\s/g, '');
  var errEl  = document.getElementById('inputError');
  var infoEl = document.getElementById('inputInfo');
  errEl.textContent  = '';
  infoEl.textContent = '';

  var validation = validateInput(raw);
  if (validation.error) {
    errEl.textContent = validation.error;
    return;
  }

  var bits   = validation.bits;
  var params = readParams();

  infoEl.textContent = 'Analysing ' + bits.length + ' bits…';
  document.getElementById('results').innerHTML = '<div class="spinner">Computing…</div>';
  document.getElementById('summary').style.display = 'none';

  // Yield to the browser to render the spinner before heavy computation
  setTimeout(function() {
    runAllTests(bits, params);
    infoEl.textContent = 'Done. ' + bits.length + ' bits analysed.';
  }, 30);
}

/**
 * Generate a cryptographically-uniform random binary sequence
 * using Math.random() and populate the textarea.
 *
 * @param {number} len  Number of bits to generate.
 */
function generateRandom(len) {
  var bits = [];
  for (var i = 0; i < len; i++) bits.push(Math.random() < 0.5 ? 1 : 0);
  document.getElementById('binInput').value         = bits.join('');
  document.getElementById('inputError').textContent  = '';
  document.getElementById('inputInfo').textContent   = '';
  document.getElementById('results').innerHTML       = '';
  document.getElementById('summary').style.display  = 'none';
}