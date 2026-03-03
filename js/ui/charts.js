/**
 * ui/charts.js — Chart.js abstraction layer
 * SRP: responsible only for creating and destroying Chart.js instances.
 * OCP: new chart types can be added without modifying existing functions.
 * DIP: depends on Chart.js abstraction (injected via global), not a concrete impl.
 */

'use strict';

var CHART_COLORS = {
  blue:   '#3b5bdb',
  orange: '#f59f00',
  green:  '#4caf50',
  purple: '#ae3ec9',
  cyan:   '#0dcaf0'
};

// Registry — tracks active Chart instances by canvas id
var _charts = {};

/**
 * Create (or replace) a chart on the given canvas element.
 * If a chart already exists for that id, it is destroyed first.
 *
 * @param {string} id   Canvas element id.
 * @param {Object} cfg  Chart.js configuration object.
 */
function mkChart(id, cfg) {
  if (_charts[id]) { _charts[id].destroy(); delete _charts[id]; }
  var el = document.getElementById(id);
  if (!el) return;
  _charts[id] = new Chart(el, cfg);
}

/**
 * Build a bar chart configuration.
 * @param {string[]} labels
 * @param {number[]} data
 * @param {string}   color   Hex color string from CHART_COLORS.
 * @param {string}   [xlabel]
 * @returns {Object}  Chart.js config.
 */
function barCfg(labels, data, color, xlabel) {
  return {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{ data: data, backgroundColor: color + '99', borderColor: color, borderWidth: 1 }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { ticks: { color: '#aaa' }, grid: { color: '#2e3248' } },
        x: {
          ticks: { color: '#aaa', maxTicksLimit: 12 },
          grid:  { color: '#2e3248' },
          title: { display: !!xlabel, text: xlabel || '', color: '#aaa' }
        }
      }
    }
  };
}

/**
 * Build a line chart configuration.
 * @param {number[]} labels
 * @param {Object[]} datasets  Chart.js dataset objects.
 * @returns {Object}  Chart.js config.
 */
function lineCfg(labels, datasets) {
  return {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: {
      plugins: { legend: { labels: { color: '#aaa', boxWidth: 10 } } },
      scales: {
        y: { ticks: { color: '#aaa' }, grid: { color: '#2e3248' } },
        x: { ticks: { color: '#aaa', maxTicksLimit: 12 }, grid: { color: '#2e3248' } }
      }
    }
  };
}