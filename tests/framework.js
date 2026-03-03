/**
 * runner.test.js — Minimal test framework (no external dependencies)
 *
 * Implements a TAP-compatible runner with:
 *   describe(name, fn)   — test suite grouping
 *   it(name, fn)         — individual test case
 *   expect(val)          — assertion builder
 *
 * Exit code = number of failed tests (0 = all pass).
 */

'use strict';

// ── Assertion library ─────────────────────────────────────────────────────────

function AssertionError(message) {
  this.message = message;
  this.name    = 'AssertionError';
}

function expect(received) {
  return {
    // Numeric proximity — essential for floating-point statistical tests
    toBeCloseTo: function(expected, precision) {
      var digits = precision !== undefined ? precision : 5;
      var tol    = Math.pow(10, -digits) / 2;
      var diff   = Math.abs(received - expected);
      if (diff >= tol) {
        throw new AssertionError(
          'Expected ' + received + ' to be close to ' + expected +
          ' (±' + tol + '), diff = ' + diff
        );
      }
    },
    toBe: function(expected) {
      if (received !== expected) {
        throw new AssertionError('Expected ' + JSON.stringify(received) + ' to be ' + JSON.stringify(expected));
      }
    },
    toEqual: function(expected) {
      var a = JSON.stringify(received), b = JSON.stringify(expected);
      if (a !== b) {
        throw new AssertionError('Expected ' + a + ' to equal ' + b);
      }
    },
    toBeNull: function() {
      if (received !== null) {
        throw new AssertionError('Expected null, got ' + JSON.stringify(received));
      }
    },
    toBeDefined: function() {
      if (received === undefined) {
        throw new AssertionError('Expected a defined value');
      }
    },
    toBeGreaterThan: function(expected) {
      if (received <= expected) {
        throw new AssertionError('Expected ' + received + ' > ' + expected);
      }
    },
    toBeLessThan: function(expected) {
      if (received >= expected) {
        throw new AssertionError('Expected ' + received + ' < ' + expected);
      }
    },
    toBeGreaterThanOrEqual: function(expected) {
      if (received < expected) {
        throw new AssertionError('Expected ' + received + ' >= ' + expected);
      }
    },
    toBeLessThanOrEqual: function(expected) {
      if (received > expected) {
        throw new AssertionError('Expected ' + received + ' <= ' + expected);
      }
    },
    toBeTruthy: function() {
      if (!received) {
        throw new AssertionError('Expected truthy, got ' + JSON.stringify(received));
      }
    },
    toBeFalsy: function() {
      if (received) {
        throw new AssertionError('Expected falsy, got ' + JSON.stringify(received));
      }
    },
    toContain: function(item) {
      if (!Array.isArray(received) || received.indexOf(item) === -1) {
        throw new AssertionError('Expected ' + JSON.stringify(received) + ' to contain ' + item);
      }
    }
  };
}

// ── Runner state ──────────────────────────────────────────────────────────────

var _passed  = 0;
var _failed  = 0;
var _total   = 0;
var _suite   = '';
var _results = [];

function describe(name, fn) {
  _suite = name;
  fn();
  _suite = '';
}

function it(name, fn) {
  _total++;
  var label = _suite ? _suite + ' › ' + name : name;
  try {
    fn();
    _passed++;
    _results.push({ ok: true,  label: label });
  } catch(e) {
    _failed++;
    _results.push({ ok: false, label: label, reason: e.message || String(e) });
  }
}

// ── Reporter ──────────────────────────────────────────────────────────────────

function report() {
  var GREEN  = '\x1b[32m';
  var RED    = '\x1b[31m';
  var YELLOW = '\x1b[33m';
  var BOLD   = '\x1b[1m';
  var RESET  = '\x1b[0m';
  var DIM    = '\x1b[2m';

  console.log('\n' + BOLD + '─────────────────────────────────────────────────' + RESET);
  console.log(BOLD + ' NIST SP 800-22  Unit Test Results' + RESET);
  console.log(BOLD + '─────────────────────────────────────────────────' + RESET + '\n');

  var lastSuite = '';
  for (var i = 0; i < _results.length; i++) {
    var r      = _results[i];
    var parts  = r.label.split(' › ');
    var suite  = parts.length > 1 ? parts[0] : '';
    var test   = parts.length > 1 ? parts[1] : parts[0];

    if (suite && suite !== lastSuite) {
      console.log(BOLD + DIM + '  ' + suite + RESET);
      lastSuite = suite;
    }

    if (r.ok) {
      console.log(GREEN + '  ✓ ' + RESET + DIM + test + RESET);
    } else {
      console.log(RED   + '  ✗ ' + RESET + BOLD + test + RESET);
      console.log(RED   + '      → ' + r.reason + RESET);
    }
  }

  console.log('\n' + BOLD + '─────────────────────────────────────────────────' + RESET);
  var summary = _passed + ' passed';
  if (_failed > 0) summary += RED + ',  ' + _failed + ' FAILED' + RESET;
  summary += '  (' + _total + ' total)';
  console.log('  ' + BOLD + summary + RESET);
  console.log(BOLD + '─────────────────────────────────────────────────' + RESET + '\n');

  process.exit(_failed);
}

module.exports = { describe: describe, it: it, expect: expect, report: report };
