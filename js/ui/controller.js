/**
 * ui/controller.js — Input validation, event handlers, file loading
 *
 * File processing pipeline:
 *   1. Binary file  → readAsArrayBuffer → Uint8Array → each byte → 8 bits (MSB first)
 *   2. Base64 text  → strip whitespace → atob() → Uint8Array → same byte→bit expansion
 *   3. Plain 0/1 text → strip whitespace → validate → use directly
 *
 * Rules:
 *   - Binary files are NEVER interpreted as UTF-8/ASCII text
 *   - Base64 is always decoded to raw bytes FIRST, never analysed as Base64 chars
 *   - Only plain 0/1 strings bypass byte expansion
 */

'use strict';

/* ── Constants ───────────────────────────────────────────────────────────────── */

var BASE64_RE = /^[A-Za-z0-9+/\r\n]+=*$/;

// File extensions that are always treated as raw binary (never as text)
var BINARY_EXTS = ['bin','rng','dat','raw','bits','rand','ent','img','bin64',
                   'exe','dll','so','dylib','jpg','jpeg','png','gif','pdf',
                   'zip','gz','bz2','xz','7z'];

/* ── Param helpers ───────────────────────────────────────────────────────────── */

function readParams() {
  return {
    M:   parseInt(document.getElementById('blockSize').value, 10) || 128,
    m:   parseInt(document.getElementById('tmplSize').value,  10) || 9,
    lcM: parseInt(document.getElementById('lcBlock').value,   10) || 500
  };
}

/* ── Core bit-string validation ──────────────────────────────────────────────── */

function validateInput(raw) {
  if (!raw)                    return { error: 'Please enter a binary sequence.' };
  if (!/^[01]+$/.test(raw))   return { error: 'Input must contain only 0s and 1s.' };
  if (raw.length < 100)        return { error: 'Minimum 100 bits required.' };
  return { bits: raw.split('').map(Number) };
}

/* ── Run button ──────────────────────────────────────────────────────────────── */

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

/* ── Random generator ────────────────────────────────────────────────────────── */

function generateRandom(len) {
  var bits = [];
  for (var i = 0; i < len; i++) bits.push(Math.random() < 0.5 ? 1 : 0);
  document.getElementById('binInput').value         = bits.join('');
  document.getElementById('inputError').textContent  = '';
  document.getElementById('inputInfo').textContent   = '';
}

/* ── Byte array → bit string ─────────────────────────────────────────────────── */

/**
 * Convert a Uint8Array to a string of '0'/'1' characters.
 * Each byte contributes 8 bits, MSB first (standard convention).
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function bytesToBitString(bytes) {
  var parts = new Array(bytes.length);
  for (var i = 0; i < bytes.length; i++) {
    var b = bytes[i];
    parts[i] = ((b >> 7) & 1) + '' +
               ((b >> 6) & 1) +
               ((b >> 5) & 1) +
               ((b >> 4) & 1) +
               ((b >> 3) & 1) +
               ((b >> 2) & 1) +
               ((b >> 1) & 1) +
               ( b       & 1);
  }
  return parts.join('');
}

/* ── Base64 detection & decoding ─────────────────────────────────────────────── */

/**
 * Try to interpret `text` as Base64.
 * Returns Uint8Array on success, null if the content is not valid Base64.
 * @param {string} text  Raw file text content.
 * @returns {Uint8Array|null}
 */
function tryDecodeBase64(text) {
  // Strip all whitespace (Base64 files often have line breaks)
  var stripped = text.replace(/\s/g, '');
  if (stripped.length === 0) return null;

  // Must match Base64 character set (including = padding)
  if (!BASE64_RE.test(stripped)) return null;

  // Length must be a multiple of 4 (possibly with padding)
  // atob handles padding, but we check the charset first
  try {
    var binary = atob(stripped);
    var bytes  = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (e) {
    return null;
  }
}

/* ── File extension helper ───────────────────────────────────────────────────── */

function getExt(filename) {
  var parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function isBinaryExt(filename) {
  return BINARY_EXTS.indexOf(getExt(filename)) !== -1;
}

/* ── Main file processor ─────────────────────────────────────────────────────── */

/**
 * Process a File object: detect format, decode to bit-string, load into UI.
 * @param {File} file
 */
function _readFile(file) {
  if (!file) return;

  var errEl  = document.getElementById('inputError');
  var infoEl = document.getElementById('inputInfo');
  errEl.textContent  = '';
  infoEl.textContent = '';

  var forcebin = isBinaryExt(file.name);

  if (forcebin) {
    // ── Path A: known binary extension → ArrayBuffer only, no text interpretation ──
    _readAsBinary(file);
  } else {
    // ── Path B: read as text first, then decide ───────────────────────────────────
    var textReader = new FileReader();
    textReader.onload = function(e) {
      var text = e.target.result;

      // Check 1: plain 0/1 sequence?
      var stripped = text.replace(/\s/g, '');
      if (/^[01]+$/.test(stripped)) {
        // Plain binary text — use directly
        _loadBitString(stripped, file.name, 'plain text');
        return;
      }

      // Check 2: Base64?
      var b64bytes = tryDecodeBase64(text);
      if (b64bytes !== null) {
        var bitStr = bytesToBitString(b64bytes);
        _loadBitString(bitStr, file.name, 'Base64 decoded (' + b64bytes.length + ' bytes → ' + bitStr.length + ' bits)');
        return;
      }

      // Check 3: fall back to raw binary read (file may be binary without known extension)
      _readAsBinary(file);
    };
    textReader.onerror = function() { _readAsBinary(file); };
    textReader.readAsText(file);
  }
}

/**
 * Read file as ArrayBuffer and expand bytes to bits.
 * @param {File} file
 */
function _readAsBinary(file) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var bytes  = new Uint8Array(e.target.result);
    var bitStr = bytesToBitString(bytes);
    _loadBitString(bitStr, file.name, 'binary (' + bytes.length + ' bytes → ' + bitStr.length + ' bits)');
  };
  reader.onerror = function() {
    document.getElementById('inputError').textContent = 'Could not read file "' + file.name + '".';
    _dropReset();
  };
  reader.readAsArrayBuffer(file);
}

/**
 * Put a validated bit-string into the textarea and update UI.
 * @param {string} bitStr
 * @param {string} filename
 * @param {string} modeLabel  Human-readable description of how the file was decoded.
 */
function _loadBitString(bitStr, filename, modeLabel) {
  var errEl  = document.getElementById('inputError');
  var infoEl = document.getElementById('inputInfo');

  if (bitStr.length < 100) {
    errEl.textContent = '"' + filename + '" decoded to only ' + bitStr.length + ' bits. Minimum is 100.';
    _dropReset();
    return;
  }

  document.getElementById('binInput').value = bitStr;
  infoEl.textContent = '\u2713 "' + filename + '" loaded as ' + modeLabel + ' — ' + bitStr.length + ' bits.';
  _dropOk();
}

/* ── Drop zone state helpers ─────────────────────────────────────────────────── */

function _dropReset() {
  var z = document.getElementById('dropZone');
  if (z) z.classList.remove('drag-over', 'drop-ok');
}

function _dropOk() {
  var z = document.getElementById('dropZone');
  if (!z) return;
  z.classList.remove('drag-over');
  z.classList.add('drop-ok');
  setTimeout(function() { z.classList.remove('drop-ok'); }, 2200);
}

/* ── DOM event wiring ────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
  var zone   = document.getElementById('dropZone');
  var picker = document.getElementById('fileInput');
  if (!zone || !picker) return;

  /* File picker */
  picker.addEventListener('change', function() {
    if (picker.files && picker.files[0]) _readFile(picker.files[0]);
    picker.value = ''; // allow re-selecting the same file
  });

  /* Zone click → open picker (guard against inner-element double-trigger) */
  zone.addEventListener('click', function(e) {
    if (e.target === picker) return;
    picker.click();
  });

  /* Drag-and-drop */
  zone.addEventListener('dragenter', function(e) { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragover',  function(e) { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', function(e) {
    if (!zone.contains(e.relatedTarget)) zone.classList.remove('drag-over');
  });
  zone.addEventListener('drop', function(e) {
    e.preventDefault();
    zone.classList.remove('drag-over');
    var file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) _readFile(file);
  });

  /* Global guard — stop browser from opening dropped files in a new tab */
  document.addEventListener('dragover', function(e) { e.preventDefault(); });
  document.addEventListener('drop',     function(e) { e.preventDefault(); });
});