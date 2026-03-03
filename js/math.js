/**
 * math.js — NIST SP 800-22 numerical utilities
 * SRP: pure mathematical functions only, no side-effects, no DOM interaction.
 *
 * References:
 *   Abramowitz & Stegun, "Handbook of Mathematical Functions", 1964
 *   W.H. Press et al., "Numerical Recipes in C", 2nd ed.
 */

'use strict';

// ── erfc ─────────────────────────────────────────────────────────────────────
// Complementary error function via Horner's method (A&S 7.1.26).
// Accuracy: |error| < 1.5e-7 for all real x.
function erfc(x) {
  var t = 1.0 / (1.0 + 0.3275911 * Math.abs(x));
  var p = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 +
              t * (-1.453152027 + t * 1.061405429))));
  var r = p * Math.exp(-x * x);
  return x >= 0 ? r : 2.0 - r;
}

// ── norm_cdf ─────────────────────────────────────────────────────────────────
// Standard normal CDF: Φ(x) = (1 - erfc(x/√2)) / 2
function norm_cdf(x) {
  return 0.5 * erfc(-x / Math.SQRT2);
}

// ── lgamma ───────────────────────────────────────────────────────────────────
// Natural log of Γ(x) via Lanczos approximation (g=5, n=6).
// Accurate to ~15 significant digits for x > 0.
function lgamma(x) {
  var c = [
    76.18009172947146, -86.50532032941677,
    24.01409824083091,  -1.231739572450155,
     0.1208650973866179e-2, -0.5395239384953e-5
  ];
  var y = x, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  var ser = 1.000000000190015;
  for (var j = 0; j < 6; j++) { y++; ser += c[j] / y; }
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}

// ── lgammaInt ────────────────────────────────────────────────────────────────
// log Γ(n) = log((n-1)!) for positive integer n.
// Used internally by igamc for small integer arguments.
function lgammaInt(n) {
  var r = 0;
  for (var i = 2; i < n; i++) r += Math.log(i);
  return r;
}

// ── igam_series ──────────────────────────────────────────────────────────────
// Regularised lower incomplete gamma P(a,x) via series expansion.
// Converges for x < a+1.
function igam_series(a, x) {
  var ap = a, del = 1.0 / a, sum = 1.0 / a;
  for (var i = 0; i < 600; i++) {
    ap  += 1.0;
    del *= x / ap;
    sum += del;
    if (Math.abs(del) < Math.abs(sum) * 1e-15) break;
  }
  return sum * Math.exp(-x + a * Math.log(x) - lgamma(a));
}

// ── igam_cf ──────────────────────────────────────────────────────────────────
// Regularised upper incomplete gamma Q(a,x) via Lentz continued fraction.
// Converges for x >= a+1.
function igam_cf(a, x) {
  var b = x + 1.0 - a, c = 1e300, d = 1.0 / b, h = d;
  for (var i = 1; i <= 600; i++) {
    var an = -i * (i - a);
    b += 2.0;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1.0 / d;
    var delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1.0) < 1e-15) break;
  }
  return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h;
}

// ── igamc ─────────────────────────────────────────────────────────────────────
// Regularised upper incomplete gamma function Q(a,x) = 1 - P(a,x).
// This is the primary p-value function used across all NIST chi-square tests.
function igamc(a, x) {
  if (x <= 0 || a <= 0) return 1.0;
  if (x < a + 1.0)      return 1.0 - igam_series(a, x);
  return igam_cf(a, x);
}