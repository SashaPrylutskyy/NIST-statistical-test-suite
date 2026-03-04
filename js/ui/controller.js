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

/* ── File input & Drag-and-Drop ─────────────────────────────────────────────── */

function loadTextIntoBinInput(text, filename) {
  var raw = text.replace(/\s/g, '');
  var errEl  = document.getElementById('inputError');
  var infoEl = document.getElementById('inputInfo');
  errEl.textContent = '';

  if (!/^[01]+$/.test(raw)) {
    errEl.textContent = 'File "' + filename + '" contains characters other than 0 and 1.';
    _dropReset();
    return;
  }

  document.getElementById('binInput').value = raw;
  infoEl.textContent = 'Loaded "' + filename + '" — ' + raw.length + ' bits.';
  _dropOk();
}

function _dropReset() {
  var z = document.getElementById('dropZone');
  z.classList.remove('drag-over', 'drop-ok');
}

function _dropOk() {
  var z = document.getElementById('dropZone');
  z.classList.remove('drag-over');
  z.classList.add('drop-ok');
  setTimeout(function() { z.classList.remove('drop-ok'); }, 2000);
}

function _readFile(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) { loadTextIntoBinInput(e.target.result, file.name); };
  reader.onerror = function()  {
    document.getElementById('inputError').textContent = 'Could not read file.';
    _dropReset();
  };
  reader.readAsText(file);
}

document.addEventListener('DOMContentLoaded', function() {
  var zone   = document.getElementById('dropZone');
  var picker = document.getElementById('fileInput');

  /* File picker */
  picker.addEventListener('change', function() {
    if (picker.files && picker.files[0]) _readFile(picker.files[0]);
    picker.value = '';           // allow re-selecting same file
  });

  /* Prevent zone click from bubbling after file picker opens */
  zone.addEventListener('click', function(e) {
    if (e.target !== picker) picker.click();
  });

  /* DnD events */
  zone.addEventListener('dragenter', function(e) { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragover',  function(e) { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', function(e) {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', function(e) {
    e.preventDefault();
    zone.classList.remove('drag-over');
    var file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) _readFile(file);
  });

  /* Global drag-over guard — prevent browser from opening file */
  document.addEventListener('dragover',  function(e) { e.preventDefault(); });
  document.addEventListener('drop',      function(e) { e.preventDefault(); });
});