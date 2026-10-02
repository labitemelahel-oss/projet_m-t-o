/* =====================================================================
   config.js — constantes, utilitaires, accès aux APIs externes
   ===================================================================== */
'use strict';

/* ------------------ Endpoints externes (libres, sans clé) ------------------ */
const API = {
  forecast: 'https://api.open-meteo.com/v1/forecast',
  archive: 'https://archive-api.open-meteo.com/v1/archive',
  geocode: 'https://geocoding-api.open-meteo.com/v1/search',
  marine: 'https://marine-api.open-meteo.com/v1/marine',
  reliefweb: 'https://api.reliefweb.int/v1/reports'
};

/* ------------------ Tables (API REST relative) ------------------ */
const TABLES = {
  cities: 'tables/cities',
  plots: 'tables/plots',
  journal: 'tables/journal',
  alert_rules: 'tables/alert_rules',
  news: 'tables/news',
  videos: 'tables/videos',
  custom_crops: 'tables/custom_crops',
  prefs: 'tables/prefs'
};

/* ------------------ Référentiels métier ------------------ */
const CATEGORY_LABELS = {
  cereale: 'Céréale',
  legumineuse: 'Légumineuse',
  tubercule: 'Tubercule / racine',
  maraichage: 'Maraîchage',
  fruit: 'Fruitier',
  olagineux: 'Oléagineux',
  fibre: 'Fibre / industriel',
  epice: 'Épice / aromatique',
  fourrage: 'Fourrage',
  elevage: 'Élevage',
  pisciculture: 'Pisciculture',
  forestier: 'Forestier / agroforesterie'
};

const WATER_LABELS = { faible: 'Faible', moyen: 'Moyen', eleve: 'Élevé', tres_eleve: 'Très élevé' };
const WATER_ORDER = { tres_eleve: 4, eleve: 3, moyen: 2, faible: 1 };

const SOIL_LABELS = {
  'sableux': 'Sableux', 'limono-sableux': 'Limono-sableux', 'limoneux': 'Limoneux',
  'argileux': 'Argileux', 'ferralitique': 'Ferralitique', 'hydromorphe': 'Hydromorphe (bas-fond)',
  'lateritique': 'Latéritique caillouteux'
};

const IRRIGATION_LABELS = {
  pluviale: 'Pluviale', goutte: 'Goutte à goutte', aspersion: 'Aspersion',
  manuel: 'Arrosoir / motopompe', gravitaire: 'Gravitaire'
};

/* Zones agro-écologiques (adaptées à l'Afrique de l'Ouest, extensibles) */
const AGRO_ZONES = [
  { id: 'sahel', name: 'Zone sahélienne (200-600 mm)', rain: [200, 600] },
  { id: 'soudano-sahel', name: 'Zone soudano-sahélienne (600-900 mm)', rain: [600, 900] },
  { id: 'soudanienne', name: 'Zone soudanienne (900-1200 mm)', rain: [900, 1200] },
  { id: 'soudano-guineenne', name: 'Zone soudano-guinéenne (1200-1500 mm)', rain: [1200, 1500] },
  { id: 'guineenne', name: 'Zone guinéenne forestière (> 1500 mm)', rain: [1500, 4000] },
  { id: 'montagne', name: 'Zones d\'altitude / montagne', rain: [800, 1800] },
  { id: 'bas-fond', name: 'Bas-fonds et zones humides', rain: [600, 2000] },
  { id: 'cotiere', name: 'Zone côtière / lagunaire', rain: [900, 2000] },
  { id: 'irrigue', name: 'Périmètre irrigué (hors pluie)', rain: [0, 200] },
  { id: 'urbaine', name: 'Agriculture urbaine et péri-urbaine', rain: [600, 2000] }
];

const JOURNAL_KINDS = {
  semis: { label: 'Semis / plantation', icon: 'fa-seedling', color: 'var(--ok)' },
  intrant: { label: 'Intrant', icon: 'fa-flask', color: 'var(--info)' },
  arrosage: { label: 'Arrosage', icon: 'fa-droplet', color: 'var(--info)' },
  traitement: { label: 'Traitement', icon: 'fa-spray-can-sparkles', color: 'var(--warn)' },
  observation: { label: 'Observation', icon: 'fa-eye', color: 'var(--accent-2)' },
  recolte: { label: 'Récolte', icon: 'fa-basket-shopping', color: 'var(--ok)' },
  autre: { label: 'Autre', icon: 'fa-note-sticky', color: 'var(--muted)' }
};

const VIDEO_SITUATIONS = [
  { id: 'general', label: 'En général', icon: 'fa-compass' },
  { id: 'pluie', label: 'Fortes pluies', icon: 'fa-cloud-showers-heavy' },
  { id: 'secheresse', label: 'Sécheresse', icon: 'fa-sun' },
  { id: 'chaleur', label: 'Forte chaleur', icon: 'fa-temperature-high' },
  { id: 'froid', label: 'Froid / fraîcheur', icon: 'fa-snowflake' },
  { id: 'vent', label: 'Vent fort', icon: 'fa-wind' },
  { id: 'grele', label: 'Grêle / orage', icon: 'fa-cloud-bolt' },
  { id: 'humidite', label: 'Humidité & maladies', icon: 'fa-bacteria' },
  { id: 'uv', label: 'Indice UV élevé', icon: 'fa-sun-plant-wilt' }
];

/* ------------------ Code météo WMO → libellé + icône ------------------ */
const WMO = {
  0:  { t: 'Ciel dégagé', i: '☀️', n: '🌙', k: 'clear' },
  1:  { t: 'Peu nuageux', i: '🌤️', n: '🌙', k: 'clouds' },
  2:  { t: 'Nuages prédominants', i: '⛅', n: '☁️', k: 'clouds' },
  3:  { t: 'Couvert', i: '☁️', n: '☁️', k: 'clouds' },
  45: { t: 'Brouillard', i: '🌫️', n: '🌫️', k: 'fog' },
  48: { t: 'Brouillard givrant', i: '🌫️', n: '🌫️', k: 'fog' },
  51: { t: 'Bruine légère', i: '🌦️', n: '🌧️', k: 'rain' },
  53: { t: 'Bruine modérée', i: '🌦️', n: '🌧️', k: 'rain' },
  55: { t: 'Bruine dense', i: '🌧️', n: '🌧️', k: 'rain' },
  56: { t: 'Bruine verglaçante', i: '🌧️', n: '🌧️', k: 'rain' },
  57: { t: 'Bruine verglaçante forte', i: '🌧️', n: '🌧️', k: 'rain' },
  61: { t: 'Pluie faible', i: '🌦️', n: '🌧️', k: 'rain' },
  63: { t: 'Pluie modérée', i: '🌧️', n: '🌧️', k: 'rain' },
  65: { t: 'Pluie forte', i: '🌧️', n: '🌧️', k: 'storm' },
  66: { t: 'Pluie verglaçante', i: '🌨️', n: '🌨️', k: 'rain' },
  67: { t: 'Pluie verglaçante forte', i: '🌨️', n: '🌨️', k: 'storm' },
  71: { t: 'Neige faible', i: '🌨️', n: '🌨️', k: 'snow' },
  73: { t: 'Neige modérée', i: '❄️', n: '❄️', k: 'snow' },
  75: { t: 'Neige forte', i: '❄️', n: '❄️', k: 'snow' },
  77: { t: 'Grains de neige', i: '🌨️', n: '🌨️', k: 'snow' },
  80: { t: 'Averses faibles', i: '🌦️', n: '🌧️', k: 'rain' },
  81: { t: 'Averses modérées', i: '🌧️', n: '🌧️', k: 'rain' },
  82: { t: 'Averses violentes', i: '⛈️', n: '⛈️', k: 'storm' },
  85: { t: 'Averses de neige', i: '🌨️', n: '🌨️', k: 'snow' },
  86: { t: 'Fortes averses de neige', i: '❄️', n: '❄️', k: 'snow' },
  95: { t: 'Orage', i: '⛈️', n: '⛈️', k: 'storm' },
  96: { t: 'Orage avec grêle', i: '⛈️', n: '⛈️', k: 'storm' },
  99: { t: 'Orage violent avec grêle', i: '🌩️', n: '🌩️', k: 'storm' }
};

/* ------------------ Utilitaires DOM ------------------ */
function el(id) { return document.getElementById(id); }
function qs(sel, root) { return (root || document).querySelector(sel); }
function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
function make(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined && html !== null) n.innerHTML = html;
  return n;
}
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function attr(v) { return esc(v).replace(/"/g, '&quot;'); }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function debounce(fn, ms) {
  let t;
  return function () {
    const args = arguments, self = this;
    clearTimeout(t);
    t = setTimeout(function () { fn.apply(self, args); }, ms || 250);
  };
}
function uid(prefix) {
  return (prefix || 'id') + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

/* ------------------ Formatage ------------------ */
function num(v, digits) {
  if (v === null || v === undefined || isNaN(v)) return '--';
  return Number(v).toFixed(digits === undefined ? 0 : digits).replace('.', ',');
}
function round1(v) { return v === null || v === undefined || isNaN(v) ? '--' : (Math.round(v * 10) / 10).toString().replace('.', ','); }
function dayName(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long' });
}
function shortDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
function isoDate(d) {
  const x = d instanceof Date ? d : new Date(d);
  return x.toISOString().slice(0, 10);
}
function dateTimeFR(ts) {
  if (!ts) return '—';
  const d = new Date(typeof ts === 'number' ? ts : ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) + ' · ' +
         d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function hhmm(iso) {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso).slice(11, 16);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}
function mmss(sec) {
  const s = Math.max(0, Math.round(sec));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function windDir(deg) {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  if (deg === null || deg === undefined || isNaN(deg)) return '—';
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}
function tempUnit(c) {
  return State.prefs.units === 'imperial' ? Math.round(c * 9 / 5 + 32) : Math.round(c);
}
function tempLabel(c) {
  return tempUnit(c) + '°' + (State.prefs.units === 'imperial' ? 'F' : 'C');
}
function tempShort(c) { return tempUnit(c) + '°'; }

/* ------------------ Calculs agronomiques ------------------ */
/* Point de rosée (formule de Magnus) */
function dewPoint(t, rh) {
  if (t === null || rh === null || t === undefined || rh === undefined) return null;
  const a = 17.27, b = 237.7;
  const al = (a * t) / (b + t) + Math.log(clamp(rh, 1, 100) / 100);
  return (b * al) / (a - al);
}
/* Température ressentie (heat index simplifié, Robinson/Steadman) */
function feelsLike(t, rh, windKmh) {
  if (t === null) return null;
  const w = windKmh || 0;
  if (t >= 27 && rh !== null && rh !== undefined) {
    const T = t * 9 / 5 + 32, R = rh;
    let hi = -42.379 + 2.04901523 * T + 10.14333127 * R
      - 0.22475541 * T * R - 0.00683783 * T * T - 0.05481717 * R * R
      + 0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
    return (hi - 32) * 5 / 9;
  }
  if (t <= 12 && w > 4) {
    const v = Math.pow(w, 0.16);
    return 13.12 + 0.6215 * t - 11.37 * v + 0.3965 * t * v;
  }
  return t - Math.max(0, w - 8) * 0.05;
}
/* Évapotranspiration de référence (Hargreaves, données journalières) */
function et0Hargreaves(tmean, tmax, tmin, lat, doy) {
  if (tmean === null || tmax === null || tmin === null) return null;
  const phi = (lat || 6) * Math.PI / 180;
  const dr = 1 + 0.033 * Math.cos(2 * Math.PI * doy / 365);
  const dec = 0.409 * Math.sin(2 * Math.PI * doy / 365 - 1.39);
  const xx = clamp(-Math.tan(phi) * Math.tan(dec), -1, 1);
  const ws = Math.acos(xx);
  const Ra = (24 * 60 / Math.PI) * 0.082 * dr * (ws * Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.sin(ws));
  const et0 = 0.0023 * (tmean + 17.8) * Math.sqrt(Math.max(0.1, tmax - tmin)) * Ra;
  return Math.max(0, et0);
}
/* Bilan hydrique simplifié sur N jours */
function waterBalance(daily, lat) {
  let rain = 0, et0 = 0, i;
  for (i = 0; i < daily.length; i++) {
    const d = daily[i];
    rain += (d.rain || 0);
    const doy = Math.ceil((new Date(d.date + 'T12:00:00') - new Date(new Date(d.date + 'T12:00:00').getFullYear(), 0, 0)) / 864e5);
    const e = et0Hargreaves(d.tmean, d.tmax, d.tmin, lat, doy);
    et0 += (e === null ? 0 : e);
  }
  return { rain: rain, et0: et0, balance: rain - et0 };
}

/* ------------------ Distance géographique (km) ------------------ */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return 2 * R * Math.asin(Math.sqrt(a));
}

/* ------------------ Toasts ------------------ */
function toast(title, message, kind, ms) {
  const wrap = el('toast-wrap');
  if (!wrap) return;
  const icons = { ok: 'fa-circle-check', warn: 'fa-triangle-exclamation', risk: 'fa-circle-exclamation', info: 'fa-circle-info' };
  const k = kind || 'info';
  const node = make('div', 'toast toast--' + k,
    '<i class="fa-solid ' + (icons[k] || icons.info) + '" aria-hidden="true"></i>' +
    '<div><strong>' + esc(title) + '</strong>' + (message ? '<small>' + esc(message) + '</small>' : '') + '</div>');
  wrap.appendChild(node);
  setTimeout(function () {
    node.style.transition = 'opacity .3s, transform .3s';
    node.style.opacity = '0';
    node.style.transform = 'translateY(10px)';
    setTimeout(function () { node.remove(); }, 320);
  }, ms || 4600);
}

/* ------------------ Accès API REST tables ------------------ */
async function apiList(table, params) {
  const q = new URLSearchParams(Object.assign({ limit: 500 }, params || {}));
  const r = await fetch(TABLES[table] + '?' + q.toString());
  if (!r.ok) throw new Error('GET ' + table + ' → ' + r.status);
  const j = await r.json();
  return j.data || [];
}
async function apiCreate(table, data) {
  const r = await fetch(TABLES[table], {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error('POST ' + table + ' → ' + r.status);
  return r.json();
}
async function apiUpdate(table, id, data) {
  const r = await fetch(TABLES[table] + '/' + encodeURIComponent(id), {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
  });
  if (!r.ok) throw new Error('PUT ' + table + ' → ' + r.status);
  return r.json();
}
async function apiDelete(table, id) {
  const r = await fetch(TABLES[table] + '/' + encodeURIComponent(id), { method: 'DELETE' });
  if (!r.ok && r.status !== 404) throw new Error('DELETE ' + table + ' → ' + r.status);
  return true;
}

/* ------------------ Récupération JSON résiliente ------------------ */
async function getJSON(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(function () { ctrl.abort(); }, timeoutMs || 14000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}
