/**
 * ui/card.js — Result card DOM factory
 * SRP: responsible only for constructing and appending result cards to the DOM.
 * ISP: exposes only the two functions consumers actually need (makeCard, row).
 */

'use strict';

/**
 * Build a single stat row HTML fragment.
 * @param {string} label
 * @param {string|number} val
 * @returns {string}  HTML string.
 */
function row(label, val) {
  return '<div class="stat-row">'
       + '<span>' + label + '</span>'
       + '<span class="stat-val">' + val + '</span>'
       + '</div>';
}

/**
 * Create and append a result card to #results.
 *
 * @param {number}       num        Test number (1–14).
 * @param {string}       title      Short test name.
 * @param {string}       sub        Subtitle / description.
 * @param {Object|null}  r          Test result object. Must have .pValue or null.
 * @param {string}       statsHTML  Pre-built HTML of stat rows.
 * @param {string}       canvasId   Canvas element id for the chart (empty string = no chart).
 */
function makeCard(num, title, sub, r, statsHTML, canvasId) {
  var container = document.getElementById('results');
  var card = document.createElement('div');
  card.className = 'card';

  var badge = '', note = '';
  if (!r || r.pValue === null || r.pValue === undefined) {
    badge = '<span class="badge warn">N/A</span>';
    note  = '<div class="error">' + ((r && r.note) || 'Not applicable') + '</div>';
  } else {
    var pass = r.pValue >= 0.01;
    badge = '<span class="badge ' + (pass ? 'pass' : 'fail') + '">' + (pass ? 'PASS' : 'FAIL') + '</span>';
  }

  var pvRow = (r && r.pValue !== null && r.pValue !== undefined)
    ? row('p-value', r.pValue.toFixed(8))
    : '';

  card.innerHTML = '<h2>Test ' + num + ': ' + title + '</h2>'
    + '<div class="sub">' + sub + '</div>'
    + note + badge + pvRow + statsHTML
    + (canvasId ? '<canvas id="' + canvasId + '"></canvas>' : '');

  container.appendChild(card);
}