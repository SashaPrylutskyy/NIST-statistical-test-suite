# NIST SP 800-22 — Randomness Test Suite

A complete, client-side browser implementation of the **NIST SP 800-22 Rev 1a** statistical test suite for evaluating the randomness of binary sequences. All 14 tests run entirely in your browser — no server, no data upload, no external dependencies beyond Chart.js.

---

## What Is This?

[NIST SP 800-22](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-22r1a.pdf) is the de-facto standard battery of statistical tests for evaluating random and pseudorandom number generators (RNGs and PRNGs) used in cryptographic applications. It was published by the National Institute of Standards and Technology in 2010 and defines 15 tests (this suite implements all 14 that apply to a single binary sequence).

This tool is useful for:

- **Security researchers and engineers** validating hardware TRNGs and software PRNGs before deployment
- **Students and educators** in cryptography, information theory, or statistics
- **Developers** performing acceptance testing on entropy sources
- **Anyone curious** about whether a bit sequence is statistically random

---

## Features

| Feature | Detail |
|---|---|
| **All 14 NIST tests** | Tests 1–14 per NIST SP 800-22 Rev 1a, verified against Appendix B reference vectors |
| **Apple-style UI** | Sidebar + animated carousel panel, dark/light mode |
| **File loading** | Drag-and-drop or file picker; accepts binary, Base64-encoded, or plain 0/1 text |
| **Base64 pipeline** | Decodes Base64 → raw bytes → bits (MSB first); Base64 chars are never analysed directly as bits |
| **Configurable parameters** | Block size (M), template length (m), LC block size — all adjustable |
| **Privacy by design** | All computation is local; your data never leaves the browser |
| **Unit tested** | 182 automated tests (123 NIST + 59 pipeline) — zero external test libraries |
| **SOLID architecture** | 22 source files across 4 dependency layers; one file per test |

---

## Supported Input Formats

The file-loading pipeline detects format automatically:

```
File dropped / selected
    │
    ├─ Known binary extension (.bin, .exe, .jpg, .pdf, .gz, …)?
    │       └─► readAsArrayBuffer → each byte → 8 bits (MSB first)
    │
    └─ Other extension → read as text, then:
            │
            ├─ Content is only '0' and '1'?
            │       └─► Plain text — use directly
            │
            ├─ Content matches Base64 charset [A-Za-z0-9+/=]?
            │       └─► atob() → Uint8Array → bytes → bits
            │              (Base64 chars are NEVER used as bits directly)
            │
            └─ Other → readAsArrayBuffer → bytes → bits
```

**Byte-to-bit convention:** MSB first — byte `0xAB` (10101011) produces `10101011`. This matches the NIST SP 800-22 convention used in all 14 tests.

---

## The 14 Tests

| # | Name | Detects | Min bits |
|---|---|---|---|
| 1 | Frequency (Monobit) | Imbalance between 0s and 1s | 100 |
| 2 | Block Frequency | Imbalance of 1s in M-bit blocks | M |
| 3 | Runs | Too many or too few bit transitions | 100 |
| 4 | Longest Run of Ones | Unusually long runs of 1s in blocks | 128 |
| 5 | Binary Matrix Rank | Linear dependence via GF(2) rank | 1 024 |
| 6 | Non-Overlapping Template | Excess occurrences of aperiodic pattern | 8×m |
| 7 | Overlapping Template | Excess overlapping all-ones pattern | 1 032 |
| 8 | Maurer's Universal | Compressibility of the sequence | ~3 850 |
| 9 | Linear Complexity | LFSR length per block (Berlekamp–Massey) | LC block |
| 10 | Serial | Unequal frequency of 3-bit patterns | 100 |
| 11 | Approximate Entropy | m-bit vs (m+1)-bit pattern frequency difference | 100 |
| 12 | Cumulative Sums | Deviation of partial-sum walk from zero | 100 |
| 13 | Random Excursions | Visits to states ±1…±4 per cycle | ~10 000 |
| 14 | Random Excursions Variant | Total visits to states ±1…±9 | ~10 000 |

---

## Project Structure

```
nist/
├── index.html                    # Main entry point (navigation, layout)
├── css/
│   └── styles.css                # Apple-style dark/light theme (CSS variables)
├── js/
│   ├── math.js                   # Pure math: erfc, igamc, lgamma, norm_cdf
│   ├── runner.js                 # Orchestration: run all tests, update summary
│   ├── tests/
│   │   ├── test-01-frequency.js
│   │   ├── test-02-block-frequency.js
│   │   ├── test-03-runs.js
│   │   ├── test-04-longest-run.js
│   │   ├── test-05-matrix-rank.js
│   │   ├── test-06-non-overlapping.js
│   │   ├── test-07-overlapping.js
│   │   ├── test-08-maurer.js
│   │   ├── test-09-linear-complexity.js
│   │   ├── test-10-serial.js
│   │   ├── test-11-approx-entropy.js
│   │   ├── test-12-cusum.js
│   │   ├── test-13-random-excursions.js
│   │   └── test-14-random-excursions-variant.js
│   └── ui/
│       ├── carousel.js           # Apple-style sidebar + animated panels
│       ├── card.js               # Card factory (legacy, used by old renderers)
│       ├── charts.js             # Chart.js configuration helpers
│       ├── controller.js         # Input validation, file loading pipeline
│       └── renderers.js          # Per-test stat renderers
└── tests/
    ├── framework.js              # Zero-dependency TAP-compatible test runner
    ├── loader.js                 # VM-based module loader for Node.js testing
    ├── nist.test.js              # 123 unit tests: all 14 NIST tests + math utils
    └── pipeline.test.js          # 59 unit tests: file loading pipeline (binary/Base64)
```

### Dependency layers

```
math.js          ← Layer 1: pure numerical utilities (no dependencies)
tests/test-*.js  ← Layer 2: one file per NIST test, depends on math.js
ui/charts.js     ← Layer 3a: Chart.js abstraction
ui/card.js       ← Layer 3b: card DOM factory
ui/renderers.js  ← Layer 3c: per-test renderers
runner.js        ← Layer 4: orchestration (depends on all tests + carousel)
ui/controller.js ← Layer 4: event handling, file pipeline
ui/carousel.js   ← Layer 4: Apple-style sidebar + panel carousel
```

---

## Running Tests

Requires Node.js v14+. No `npm install` needed — zero external dependencies.

```bash
# NIST statistical tests (123 tests)
node tests/nist.test.js

# File loading pipeline (59 tests)
node tests/pipeline.test.js
```

Expected output for each:
```
─────────────────────────────────────────────────
 NIST SP 800-22  Unit Test Results
─────────────────────────────────────────────────

  Frequency (Monobit)
  ✓ NIST Appendix B reference p-value
  ✓ ...

─────────────────────────────────────────────────
  N passed  (N total)
─────────────────────────────────────────────────
```

Exit code = number of failures (0 = all passed). Suitable for CI integration:
```bash
node tests/nist.test.js && node tests/pipeline.test.js && echo "All OK"
```

---

## Mathematical Notes

### p-values and significance threshold

Each test computes a p-value: the probability that a truly random sequence produces a statistic at least as extreme as observed. The threshold is **α = 0.01** (1%).

- **p ≥ 0.01** → PASS — no statistical evidence of non-randomness
- **p < 0.01** → FAIL — evidence of a detectable pattern
- **N/A** → sequence too short for this test

For any truly random sequence, ~1% of tests fail by chance at α = 0.01. An isolated failure is not conclusive.

### Math implementation

All p-values use either:
- `erfc(x)` — complementary error function (Abramowitz & Stegun 7.1.26, accuracy < 1.5×10⁻⁷)
- `Q(a, x)` — regularised upper incomplete gamma function (series expansion for x < a+1, Lentz continued fraction otherwise)

### Berlekamp–Massey algorithm (Test 9)

The correct theorem (Massey 1969): for any binary sequence of length n, the LFSR complexity L satisfies **L ≤ n**. The expected value for a random sequence is **μ_L ≈ n/2 + (4+r)/18** where r = n mod 2, with standard deviation **σ ≈ √(11n/180)**.

Note: the naive claim "L ≤ ceil(n/2)" is **false** for individual sequences. For example, [1,1,1,0] of length 4 yields L = 3 > ceil(4/2) = 2.

---

## Known Limitations

- **Tests 13 & 14** need ≥ 10 000 bits to accumulate J ≥ 500 excursion cycles (required for a valid result).
- **Test 8** (Maurer Universal) needs ≥ 904 960 bits for the minimum L = 6 parameter level.
- This tool analyses a **single sequence**. NIST SP 800-22 Section 4 recommends testing ≥ 55 sequences of 1 000 000 bits each for a formal generator evaluation.
- The **Generate** buttons use `Math.random()` — not a cryptographically secure RNG. Use for demonstration only.

---

## Reference

Rukhin, A., Soto, J., Nechvatal, J., Smid, M., Barker, E., Leigh, S., Levenson, M., Vangel, M., Banks, D., Heckert, A., Dray, J., and Vo, S. (2010). *A Statistical Test Suite for Random and Pseudorandom Number Generators for Cryptographic Applications.* NIST Special Publication 800-22 Revision 1a. National Institute of Standards and Technology.

---

## Authorship

This project was designed and written entirely by **Claude** (claude-sonnet-4-6), an AI assistant made by [Anthropic](https://www.anthropic.com). The architecture, algorithms, UI, unit tests, and documentation were produced through an iterative conversation-driven development process.

The implementation follows the NIST SP 800-22 Rev 1a specification precisely, with all algorithms verified against the official Appendix B reference vectors. A critical bug in the Maurer Universal test (Test 8) was discovered and corrected during unit testing: the EV/VAR lookup table had an off-by-one indexing error that caused all p-values to be computed against wrong expected values.

---

*No external libraries were used beyond Chart.js for visualisation.*
