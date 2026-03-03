/**
 * tests/loader.js — Source module loader for Node.js test environment
 *
 * The source files use browser-global function declarations (no module.exports).
 * This loader evaluates them in sequence inside a shared context object,
 * simulating the browser's global scope without polluting process.global.
 *
 * Load order mirrors index.html's <script> tag order, enforcing the
 * same dependency graph: math → tests → ui (ui is not needed for unit tests).
 */

'use strict';

var fs   = require('fs');
var path = require('path');
var vm   = require('vm');

var ROOT = path.join(__dirname, '..');

/**
 * Read and evaluate a source file inside the shared sandbox context.
 * @param {Object} ctx   vm sandbox context.
 * @param {string} rel   Relative path from project root.
 */
function load(ctx, rel) {
  var fullPath = path.join(ROOT, rel);
  var src      = fs.readFileSync(fullPath, 'utf8');
  // Strip 'use strict' — vm context handles strict mode independently
  src = src.replace(/^['"]use strict['"];?\s*/m, '');
  vm.runInContext(src, ctx);
}

/**
 * Build and return a sandboxed context with all statistical functions loaded.
 * @returns {Object}  The vm context — access functions as ctx.testFrequency etc.
 */
function createNistContext() {
  var ctx = vm.createContext({
    Math:       Math,
    Array:      Array,
    Int32Array: Int32Array,
    Uint8Array: Uint8Array,
    Infinity:   Infinity,
    console:    console
  });

  // Layer 1 — math utilities
  load(ctx, 'js/math.js');

  // Layer 2 — statistical tests (each depends only on math.js globals)
  load(ctx, 'js/tests/test-01-frequency.js');
  load(ctx, 'js/tests/test-02-block-frequency.js');
  load(ctx, 'js/tests/test-03-runs.js');
  load(ctx, 'js/tests/test-04-longest-run.js');
  load(ctx, 'js/tests/test-05-matrix-rank.js');
  load(ctx, 'js/tests/test-06-non-overlapping.js');
  load(ctx, 'js/tests/test-07-overlapping.js');
  load(ctx, 'js/tests/test-08-maurer.js');
  load(ctx, 'js/tests/test-09-linear-complexity.js');
  load(ctx, 'js/tests/test-10-serial.js');
  load(ctx, 'js/tests/test-11-approx-entropy.js');
  load(ctx, 'js/tests/test-12-cusum.js');
  load(ctx, 'js/tests/test-13-random-excursions.js');
  load(ctx, 'js/tests/test-14-random-excursions-variant.js');

  return ctx;
}

module.exports = { createNistContext: createNistContext };
