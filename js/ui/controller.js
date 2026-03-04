/**
 * ui/controller.js — Input validation and event handlers
 */
'use strict';

function validateInput(raw) {
  if (!raw)               return { error: 'Please enter a binary sequence.' };
  if (!/^[01]+$/.test(raw)) return { error: 'Input must contain only 0s and 1s.' };
  if (raw.length < 100)   return { error: 'Minimum 100 bits required.' };
  return { bits: raw.split('').map(Number) };
}

function readParams() {
  return {
    M:   parseInt(document.getElementById('blockSize').value, 10) || 128,
    m:   parseInt(document.getElementById('tmplSize').value,  10) || 9,
    lcM: parseInt(document.getElementById('lcBlock').value,   10) || 500
  };
}

function runAll() {
  var raw    = document.getElementById('binInput').value.replace(/\s/g, '');
  var errEl  = document.getElementById('inputError');
  var infoEl = document.getElementById('inputInfo');
  errEl.textContent  = '';
  infoEl.textContent = '';

  var validation = validateInput(raw);
  if (validation.error) { errEl.textContent = validation.error; return; }

  var bits   = validation.bits;
  var params = readParams();

  infoEl.textContent = 'Analysing ' + bits.length + ' bits…';

  setTimeout(function() {
    runAllTests(bits, params);
    infoEl.textContent = bits.length + ' bits analysed.';
  }, 30);
}

function generateRandom(len) {
  var bits = [];
  for (var i = 0; i < len; i++) bits.push(Math.random() < 0.5 ? 1 : 0);
  document.getElementById('binInput').value        = bits.join('');
  document.getElementById('inputError').textContent = '';
  document.getElementById('inputInfo').textContent  = '';
}