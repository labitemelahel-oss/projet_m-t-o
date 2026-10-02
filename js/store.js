/* =====================================================================
   store.js — état global, persistance (API tables + localStorage en secours)
   ===================================================================== */
'use strict';

const State = {
  cities: [],
  activeCityId: null,
  prefs: { theme_mode: 'auto', units: 'metric', voice_reply: false, compact: false, zone: 'soudano-guineenne', main_crop: '' },
  weather: null,        /* données consolidées de la ville active */
  weatherByCity: {},    /* cache court par ville */
  plots: [],
  journal: [],
  alertRules: [],
  triggered: [],
  customCrops: [],
  newsLocal: [],
  newsLive: [],
  videoLinks: {},
  view: 'weather',
  localOnly: false
};

/* ------------------ Persistance locale (filet de sécurité) ------------------ */
const LSK = 'agrimeteo.v1.';
function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(LSK + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) { return fallback; }
}
function lsSet(key, val) {
  try { localStorage.setItem(LSK + key, JSON.stringify(val)); } catch (e) { /* quota */ }
}

async function mergeCachedRows(table, remoteRows, cachedRows) {
  const rows = Array.isArray(remoteRows) ? remoteRows.slice() : [];
  const ids = new Set(rows.map(function (row) { return row.id; }));
  for (const row of cachedRows) {
    if (!row || !row.id || ids.has(row.id)) continue;
    try { await apiCreate(table, row); } catch (e) { /* le cache local reste disponible */ }
    rows.push(row);
    ids.add(row.id);
  }
  return rows;
}

/* ------------------ Chargement initial ------------------ */
async function loadAll() {
  const tasks = [
    ['cities', 'cities', function (rows) { State.cities = rows; }],
    ['plots', 'plots', function (rows) { State.plots = rows; }],
    ['journal', 'journal', function (rows) { State.journal = rows; }],
    ['alertRules', 'alert_rules', function (rows) { State.alertRules = rows; }],
    ['customCrops', 'custom_crops', function (rows) { State.customCrops = rows; }],
    ['newsLocal', 'news', function (rows) { State.newsLocal = rows; }]
  ];
  let failures = 0;
  await Promise.all(tasks.map(function (t) {
    return apiList(t[1]).then(async function (rows) {
      const cached = lsGet(t[0], []);
      const merged = await mergeCachedRows(t[1], rows, Array.isArray(cached) ? cached : []);
      t[2](merged);
      lsSet(t[0], merged);
    }).catch(function () {
      failures++;
      t[2](lsGet(t[0], []));
    });
  }));

  /* Préférences */
  try {
    const prefs = await apiList('prefs');
    const remoteKeys = new Set(prefs.map(function (p) { return p.key; }));
    prefs.forEach(function (p) { applyPref(p.key, p.value); });
    const cachedPrefs = lsGet('prefs', null);
    if (cachedPrefs && typeof cachedPrefs === 'object') {
      for (const key of Object.keys(cachedPrefs)) {
        if (remoteKeys.has(key)) continue;
        const value = cachedPrefs[key];
        applyPref(key, value);
        try { await apiCreate('prefs', { id: 'pref-' + key, key: key, value: String(value) }); } catch (e) { /* préférence conservée localement */ }
      }
    }
  } catch (e) {
    const p = lsGet('prefs', null);
    if (p) Object.keys(p).forEach(function (k) { applyPref(k, p[k]); });
  }
  if (failures === tasks.length) {
    State.localOnly = true;
    toast('Mode local', 'Les tables distantes sont injoignables : vos données sont conservées dans ce navigateur.', 'warn');
  }

  if (!State.cities.length) State.cities = lsGet('citiesSeed', []);
  State.cities.sort(function (a, b) { return (a.sort_order || 99) - (b.sort_order || 99); });
  if (!State.cities.some(function (c) { return c.id === State.activeCityId; })) {
    const primary = State.cities.filter(function (c) { return c.is_primary; })[0];
    State.activeCityId = (primary || State.cities[0] || {}).id || null;
  }
}

function applyPref(key, value) {
  if (key === 'active_city') { State.activeCityId = value; return; }
  if (key === 'voice_reply') { State.prefs.voice_reply = value === true || value === 'on' || value === 'true'; return; }
  if (key === 'compact') { State.prefs.compact = value === true || value === 'on' || value === 'true'; return; }
  State.prefs[key] = value;
}
function prefValue(key) {
  if (key === 'active_city') return State.activeCityId;
  return State.prefs[key];
}
async function savePref(key, value) {
  applyPref(key, value);
  lsSet('prefs', State.prefs);
  try {
    const rows = await apiList('prefs', { search: key });
    const hit = rows.filter(function (r) { return r.key === key; })[0];
    if (hit) await apiUpdate('prefs', hit.id, { key: key, value: String(value) });
    else await apiCreate('prefs', { key: key, value: String(value) });
  } catch (e) { /* la préférence reste locale */ }
}

/* ------------------ CRUD génériques ------------------ */
async function saveRow(table, collection, row) {
  const isNew = !row.id;
  if (isNew) row.id = uid(collection);
  try {
    if (isNew) await apiCreate(table, row); else await apiUpdate(table, row.id, row);
  } catch (e) {
    if (!State.localOnly) console.warn('Sauvegarde distante impossible, conservation locale', table, e.message);
  }
  const arr = State[collection];
  const idx = arr.findIndex(function (r) { return r.id === row.id; });
  if (idx >= 0) arr[idx] = Object.assign({}, arr[idx], row);
  else arr.push(row);
  lsSet(collection, arr);
  return row;
}
async function removeRow(table, collection, id) {
  try { await apiDelete(table, id); } catch (e) { /* ignore */ }
  State[collection] = State[collection].filter(function (r) { return r.id !== id; });
  lsSet(collection, State[collection]);
}

/* ------------------ Sélecteurs ------------------ */
function activeCity() {
  return State.cities.filter(function (c) { return c.id === State.activeCityId; })[0] || State.cities[0] || null;
}
function cityById(id) {
  return State.cities.filter(function (c) { return c.id === id; })[0] || null;
}
function plotsOfCity(cityId) {
  return State.plots.filter(function (p) { return p.city_id === cityId; });
}
function cropById(id) {
  return CropDB.byId(id) || State.customCrops.filter(function (c) { return c.id === id; })[0] || null;
}
