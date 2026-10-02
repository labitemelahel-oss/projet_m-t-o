/* =====================================================================
   weather.js — Intégration Open-Meteo, villes, graphiques, indicateurs
   ===================================================================== */
'use strict';

/* ------------------ Gestion des graphiques Chart.js ------------------ */
const Charts = {
  instances: {},
  defaults: function () {
    Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
    Chart.defaults.font.size = 11;
    Chart.defaults.color = getComputedStyle(document.body).getPropertyValue('--muted').trim() || '#91a0bd';
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
    Chart.defaults.plugins.legend.labels.usePointStyle = true;
  },
  grid: function () {
    return { color: 'rgba(255,255,255,.07)', drawTicks: false };
  },
  make: function (id, cfg) {
    if (this.instances[id]) { this.instances[id].destroy(); }
    const canvas = el(id);
    if (!canvas) return null;
    this.instances[id] = new Chart(canvas.getContext('2d'), cfg);
    return this.instances[id];
  },
  destroyAll: function () {
    const self = this;
    Object.keys(this.instances).forEach(function (k) { try { self.instances[k].destroy(); } catch (e) {} });
    this.instances = {};
  }
};

/* ------------------ Thème dynamique ------------------ */
function decideAutoTheme(w) {
  const mode = State.prefs.theme_mode || 'auto';
  if (mode !== 'auto') return mode;
  const h = new Date().getHours();
  const c = (w && w.current) || null;
  if (c) {
    if (c.code >= 95) return 'rain';
    if (c.temp >= 34) return 'heat';
    if (!c.isDay || h < 6 || h >= 19) return 'night';
    if (c.code >= 51) return 'rain';
    if (h < 9 || h >= 17) return 'dawn';
    if (c.cloud >= 75) return 'rain';
    return 'day';
  }
  if (h < 6 || h >= 19) return 'night';
  if (h < 9) return 'dawn';
  return 'day';
}
function applyTheme(w) {
  const t = decideAutoTheme(w);
  document.body.setAttribute('data-theme', t);
  const icon = qs('#btn-theme i');
  if (icon) {
    icon.className = 'fa-solid ' + (t === 'night' ? 'fa-moon' : t === 'rain' ? 'fa-cloud-rain' : t === 'heat' ? 'fa-fire' : 'fa-sun');
  }
}

/* ------------------ Lune ------------------ */
const MOON_PHASES = [
  { max: 0.03, name: 'Nouvelle lune', icon: '🌑' },
  { max: 0.22, name: 'Premier croissant', icon: '🌒' },
  { max: 0.28, name: 'Premier quartier', icon: '🌓' },
  { max: 0.47, name: 'Gibbeuse croissante', icon: '🌔' },
  { max: 0.53, name: 'Pleine lune', icon: '🌕' },
  { max: 0.72, name: 'Gibbeuse décroissante', icon: '🌖' },
  { max: 0.78, name: 'Dernier quartier', icon: '🌗' },
  { max: 0.97, name: 'Dernier croissant', icon: '🌘' },
  { max: 1.01, name: 'Nouvelle lune', icon: '🌑' }
];
function moonInfo(date) {
  const synodic = 29.530588853;
  const known = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - known) / 86400000;
  let phase = (days % synodic) / synodic;
  if (phase < 0) phase += 1;
  const illum = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const p = MOON_PHASES.filter(function (m) { return phase <= m.max; })[0] || MOON_PHASES[8];
  /* Transit lunaire approximatif : midi solaire + décalage de phase */
  const transitH = (12 + phase * 24) % 24;
  const riseH = (transitH - 6 + 24) % 24;
  const setH = (transitH + 6) % 24;
  const fmt = function (h) {
    const hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  };
  return { phase: phase, illum: Math.round(illum * 100), name: p.name, icon: p.icon, rise: fmt(riseH), set: fmt(setH) };
}

/* ------------------ Géocodage ------------------ */
async function geocode(query) {
  const url = API.geocode + '?name=' + encodeURIComponent(query) + '&count=8&language=fr&format=json';
  const j = await getJSON(url, 12000);
  return (j.results || []).map(function (r) {
    return {
      id: 'city-' + (r.id || uid('geo')),
      name: r.name,
      country: r.country || '',
      admin1: r.admin1 || r.admin2 || '',
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone || 'auto'
    };
  });
}

/* ------------------ Construction de la requête Open-Meteo ------------------ */
function forecastUrl(city) {
  const p = new URLSearchParams({
    latitude: city.latitude,
    longitude: city.longitude,
    timezone: 'auto',
    past_days: '2',
    forecast_days: '10',
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
      'precipitation', 'rain', 'showers', 'weather_code', 'cloud_cover',
      'pressure_msl', 'surface_pressure', 'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'
    ].join(','),
    hourly: [
      'temperature_2m', 'relative_humidity_2m', 'dew_point_2m', 'apparent_temperature',
      'precipitation_probability', 'precipitation', 'rain', 'showers', 'weather_code',
      'pressure_msl', 'cloud_cover', 'visibility', 'wind_speed_10m', 'wind_direction_10m',
      'wind_gusts_10m', 'uv_index', 'is_day'
    ].join(','),
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_max',
      'apparent_temperature_min', 'sunrise', 'sunset', 'daylight_duration', 'uv_index_max',
      'precipitation_sum', 'rain_sum', 'showers_sum', 'precipitation_hours',
      'precipitation_probability_max', 'wind_speed_10m_max', 'wind_gusts_10m_max',
      'wind_direction_10m_dominant', 'relative_humidity_2m_mean'
    ].join(',')
  });
  return API.forecast + '?' + p.toString();
}

/* ------------------ Normalisation des données ------------------ */
function describeCode(code, isDay) {
  const w = WMO[code] || { t: 'Conditions inconnues', i: '🌡️', n: '🌡️', k: 'clouds' };
  return { text: w.t, icon: (isDay === false ? w.n : w.i), kind: w.k };
}

function normalizeWeather(j, city) {
  const nowMs = Date.now();
  const H = j.hourly || {};
  const hourly = [];
  let nowIdx = -1, best = Infinity;
  (H.time || []).forEach(function (t, i) {
    const d = new Date(t);
    const diff = Math.abs(d.getTime() - nowMs);
    if (diff < best) { best = diff; nowIdx = i; }
  });
  if (nowIdx < 0) nowIdx = 0;

  (H.time || []).forEach(function (t, i) {
    hourly.push({
      time: t,
      temp: H.temperature_2m ? H.temperature_2m[i] : null,
      humidity: H.relative_humidity_2m ? H.relative_humidity_2m[i] : null,
      dew: H.dew_point_2m ? H.dew_point_2m[i] : null,
      feels: H.apparent_temperature ? H.apparent_temperature[i] : null,
      rainProb: H.precipitation_probability ? H.precipitation_probability[i] : 0,
      precip: H.precipitation ? H.precipitation[i] : 0,
      rain: H.rain ? H.rain[i] : 0,
      showers: H.showers ? H.showers[i] : 0,
      code: H.weather_code ? H.weather_code[i] : 0,
      pressure: H.pressure_msl ? H.pressure_msl[i] : null,
      cloud: H.cloud_cover ? H.cloud_cover[i] : null,
      vis: H.visibility ? H.visibility[i] : null,
      wind: H.wind_speed_10m ? H.wind_speed_10m[i] : null,
      windDir: H.wind_direction_10m ? H.wind_direction_10m[i] : null,
      gust: H.wind_gusts_10m ? H.wind_gusts_10m[i] : null,
      uv: H.uv_index ? H.uv_index[i] : null,
      isDay: H.is_day ? H.is_day[i] === 1 : true
    });
  });

  const cur = j.current || {};
  const cCode = cur.weather_code === undefined ? 0 : cur.weather_code;
  const isDay = cur.is_day === undefined ? true : cur.is_day === 1;
  const cInfo = describeCode(cCode, isDay);
  const humidity = cur.relative_humidity_2m === undefined ? null : cur.relative_humidity_2m;
  const wind = cur.wind_speed_10m === undefined ? null : cur.wind_speed_10m;

  const current = {
    time: cur.time,
    temp: cur.temperature_2m,
    code: cCode, codeText: cInfo.text, icon: cInfo.icon, kind: cInfo.kind,
    isDay: isDay,
    humidity: humidity,
    feels: cur.apparent_temperature !== undefined ? cur.apparent_temperature : feelsLike(cur.temperature_2m, humidity, wind),
    precip: cur.precipitation || 0,
    rain: cur.rain || 0,
    showers: cur.showers || 0,
    cloud: cur.cloud_cover,
    pressure: cur.pressure_msl,
    surfacePressure: cur.surface_pressure,
    wind: wind,
    windDir: cur.wind_direction_10m,
    gust: cur.wind_gusts_10m,
    uv: (hourly[nowIdx] && hourly[nowIdx].uv) || null,
    vis: (hourly[nowIdx] && hourly[nowIdx].vis) || null,
    dew: (hourly[nowIdx] && hourly[nowIdx].dew) || dewPoint(cur.temperature_2m, humidity)
  };

  /* Pluie des dernières 24 h (mesurée) */
  let rain24 = 0;
  for (let k = Math.max(0, nowIdx - 24); k < nowIdx; k++) rain24 += (hourly[k].precip || 0);

  /* Prévisions 48 h à partir de maintenant */
  const next48 = hourly.slice(nowIdx, nowIdx + 49);

  /* Jours */
  const D = j.daily || {};
  const todayISO = isoDate(new Date());
  const daily = [];
  (D.time || []).forEach(function (t, i) {
    if (t < todayISO) return;
    const info = describeCode(D.weather_code ? D.weather_code[i] : 0, true);
    daily.push({
      date: t,
      code: D.weather_code ? D.weather_code[i] : 0,
      codeText: info.text, icon: info.icon, kind: info.kind,
      tmax: D.temperature_2m_max ? D.temperature_2m_max[i] : null,
      tmin: D.temperature_2m_min ? D.temperature_2m_min[i] : null,
      feelsMax: D.apparent_temperature_max ? D.apparent_temperature_max[i] : null,
      feelsMin: D.apparent_temperature_min ? D.apparent_temperature_min[i] : null,
      rain: D.precipitation_sum ? D.precipitation_sum[i] : 0,
      rainHours: D.precipitation_hours ? D.precipitation_hours[i] : 0,
      rainProb: D.precipitation_probability_max ? D.precipitation_probability_max[i] : 0,
      windMax: D.wind_speed_10m_max ? D.wind_speed_10m_max[i] : null,
      gustMax: D.wind_gusts_10m_max ? D.wind_gusts_10m_max[i] : null,
      windDir: D.wind_direction_10m_dominant ? D.wind_direction_10m_dominant[i] : null,
      uvMax: D.uv_index_max ? D.uv_index_max[i] : null,
      humidity: D.relative_humidity_2m_mean ? D.relative_humidity_2m_mean[i] : null,
      sunrise: D.sunrise ? D.sunrise[i] : null,
      sunset: D.sunset ? D.sunset[i] : null,
      daylight: D.daylight_duration ? D.daylight_duration[i] : null,
      tmean: ((D.temperature_2m_max ? D.temperature_2m_max[i] : 0) + (D.temperature_2m_min ? D.temperature_2m_min[i] : 0)) / 2
    });
  });

  /* Bilan hydrique 7 jours */
  const wb = waterBalance(daily.slice(0, 7), city.latitude);

  return {
    city: city,
    fetchedAt: Date.now(),
    current: current,
    hourly: hourly,
    nowIndex: nowIdx,
    next48: next48,
    daily: daily,
    rain24h: rain24,
    balance: wb,
    sun: daily[0] || null,
    moon: moonInfo(new Date())
  };
}

/* ------------------ Chargement ------------------ */
const Weather = {
  cache: {},
  async load(cityId, opts) {
    opts = opts || {};
    const city = cityById(cityId);
    if (!city) return null;
    const cached = this.cache[cityId];
    if (!opts.force && cached && (Date.now() - cached.fetchedAt) < 10 * 60 * 1000) {
      if (cityId === State.activeCityId) State.weather = cached;
      return cached;
    }
    const j = await getJSON(forecastUrl(city), 16000);
    const w = normalizeWeather(j, city);
    this.cache[cityId] = w;
    if (cityId === State.activeCityId) State.weather = w;
    return w;
  },
  /* Version légère pour la bande de villes (temps actuel seulement) */
  async loadSummary(city) {
    const p = new URLSearchParams({
      latitude: city.latitude, longitude: city.longitude, timezone: 'auto', forecast_days: '1',
      current: 'temperature_2m,weather_code,is_day,apparent_temperature',
      daily: 'temperature_2m_max,temperature_2m_min'
    });
    try {
      const j = await getJSON(API.forecast + '?' + p.toString(), 12000);
      const isDay = j.current.is_day !== 0;
      const info = describeCode(j.current.weather_code, isDay);
      return {
        temp: j.current.temperature_2m,
        feels: j.current.apparent_temperature,
        code: j.current.weather_code,
        text: info.text, icon: info.icon,
        tmax: j.daily.temperature_2m_max[0],
        tmin: j.daily.temperature_2m_min[0]
      };
    } catch (e) {
      return null;
    }
  }
};

/* =====================================================================
   RENDU — Ville active
   ===================================================================== */
function renderCityStrip() {
  const wrap = el('citystrip');
  if (!wrap) return;
  wrap.innerHTML = '';
  State.cities.forEach(function (c) {
    const cached = Weather.cache[c.id];
    const isActive = c.id === State.activeCityId;
    const btn = make('button', 'citycard' + (isActive ? ' is-active' : ''));
    btn.type = 'button';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    btn.setAttribute('aria-label', 'Afficher la météo de ' + c.name);
    btn.innerHTML =
      '<span class="citycard__top"><span class="citycard__name">' + esc(c.name) + '</span>' +
      '<span class="citycard__flag">' + esc((c.country || '').slice(0, 12)) + '</span></span>' +
      '<span class="citycard__temp" data-temp="' + esc(c.id) + '">' + (cached ? tempShort(cached.current.temp) : '—') + '</span>' +
      '<span class="citycard__cond" data-cond="' + esc(c.id) + '">' + (cached ? esc(cached.current.codeText) : 'Chargement…') + '</span>' +
      '<span class="citycard__range">' +
      '<span><i class="fa-solid fa-caret-up" aria-hidden="true"></i> ' + (cached && cached.daily[0] ? tempShort(cached.daily[0].tmax) : '—') + '</span>' +
      '<span><i class="fa-solid fa-caret-down" aria-hidden="true"></i> ' + (cached && cached.daily[0] ? tempShort(cached.daily[0].tmin) : '—') + '</span>' +
      '</span>';
    btn.addEventListener('click', function () { selectCity(c.id); });
    wrap.appendChild(btn);
  });
  const add = make('button', 'citycard', '<span class="citycard__top"><span class="citycard__name">Ajouter une ville</span></span>' +
    '<span class="citycard__temp" style="font-size:1.4rem;"><i class="fa-solid fa-plus" aria-hidden="true"></i></span>' +
    '<span class="citycard__cond">Rechercher, GPS</span><span class="citycard__range"></span>');
  add.type = 'button';
  add.addEventListener('click', function () { openModal('modal-citypicker'); el('geo-search').focus(); });
  wrap.appendChild(add);
}

async function refreshCitySummaries() {
  const results = await Promise.all(State.cities.map(function (c) {
    return Weather.loadSummary(c).then(function (s) { if (s) Weather.summaries[c.id] = s; return c.id; });
  }));
  results.forEach(function (id) {
    const s = Weather.summaries[id];
    if (!s) return;
    const t = qs('[data-temp="' + id + '"]'), d = qs('[data-cond="' + id + '"]');
    if (t) t.textContent = tempShort(s.temp);
    if (d) d.textContent = s.text;
  });
}
Weather.summaries = {};

/* ------------------ Rendu du héros ------------------ */
function renderHero() {
  const w = State.weather;
  if (!w) return;
  const c = w.current, city = w.city, d = w.daily[0] || {};
  applyTheme(w);

  const card = el('hero-card');
  card.classList.remove('is-rain', 'is-hot', 'is-night', 'is-wind');
  if (!c.isDay) card.classList.add('is-night');
  if (c.kind === 'rain' || c.kind === 'storm') card.classList.add('is-rain');
  if (c.temp >= 34) card.classList.add('is-hot');
  if ((c.gust || 0) > 40) card.classList.add('is-wind');

  el('hero-eyebrow').innerHTML = esc(city.admin1 ? city.admin1 + ', ' + city.country : city.country) +
    ' <span id="hero-updated">mis à jour à ' + hhmm(c.time) + '</span>';
  el('hero-city').textContent = city.name;
  el('hero-region').textContent = (city.label ? city.label + ' · ' : '') +
    (c.isDay ? 'Jour' : 'Nuit') + ' · ' + (city.admin1 || city.country || '');
  el('hero-icon').textContent = c.icon;
  el('hero-temp').textContent = tempUnit(c.temp) + '°';
  el('hero-cond').textContent = c.codeText;
  el('hero-max').textContent = tempShort(d.tmax);
  el('hero-min').textContent = tempShort(d.tmin);
  el('hero-feels').textContent = tempShort(c.feels);

  const facts = [
    ['Pluie 24 h écoulées', round1(w.rain24h) + ' mm'],
    ['Probabilité pluie 12 h', Math.max.apply(null, w.next48.slice(0, 13).map(function (h) { return h.rainProb || 0; })) + ' %'],
    ['Humidité', (c.humidity === null || c.humidity === undefined ? '--' : Math.round(c.humidity)) + ' %'],
    ['Vent', num(c.wind, 0) + ' km/h ' + windDir(c.windDir) + ' (rafales ' + num(c.gust, 0) + ')'],
    ['Pression', num(c.pressure, 0) + ' hPa'],
    ['Indice UV', round1(c.uv) + ' — ' + uvLabel(c.uv).name],
    ['Visibilité', num((c.vis || 0) / 1000, 1) + ' km'],
    ['Point de rosée', tempShort(c.dew)]
  ];
  el('hero-facts').innerHTML = facts.map(function (f) {
    return '<li><span class="f-label">' + esc(f[0]) + '</span><span class="f-value">' + esc(f[1]) + '</span></li>';
  }).join('');

  el('topbar-city').textContent = city.name;
  el('topbar-country').textContent = city.country || '';
  el('chat-context').textContent = 'Contexte : ' + city.name + ' · ' + tempShort(c.temp) + ' ' + c.codeText;
}

/* ------------------ Interprétations ------------------ */
function uvLabel(uv) {
  const v = uv === null || uv === undefined ? 0 : uv;
  if (v < 3) return { name: 'Faible', cls: 'ok', advice: 'Aucune protection nécessaire. Vous pouvez travailler normalement.' };
  if (v < 6) return { name: 'Modéré', cls: 'ok', advice: 'Protection conseillée : chapeau et lunettes de soleil. Ici, les pépinières apprécient un voile léger.' };
  if (v < 8) return { name: 'Élevé', cls: 'warn', advice: 'Ombre entre 11 h et 16 h. Les jeunes plants et les cultures feuilles peuvent souffrir du rayonnement.' };
  if (v < 11) return { name: 'Très élevé', cls: 'risk', advice: 'Évitez le travail en plein soleil. Ombrez pépinières et cultures sensibles, paillez le sol.' };
  return { name: 'Extrême', cls: 'risk', advice: 'Restez à l\'ombre aux heures centrales. Risque de brûlure pour vous et d\'échaudage pour les fruits.' };
}
function humidityLabel(h) {
  const v = h === null || h === undefined ? 0 : h;
  if (v < 30) return { name: 'Très sec', cls: 'warn', advice: 'L\'air sec accélère la transpiration des cultures : surveillez le sol et arrosez plus tôt.' };
  if (v < 50) return { name: 'Sec', cls: 'ok', advice: 'Conditions peu favorables aux maladies fongiques, mais surveillez le stress hydrique.' };
  if (v < 70) return { name: 'Confortable', cls: 'ok', advice: 'Zone idéale : les cultures transpirent normalement et le risque fongique reste modéré.' };
  if (v < 85) return { name: 'Humide', cls: 'warn', advice: 'Attention aux maladies foliaires : bien aérer les cultures et éviter les arrosages du soir.' };
  return { name: 'Très humide', cls: 'risk', advice: 'Conditions à haut risque de mildiou, anthracnose et pourriture. Inspectez le dessous des feuilles.' };
}
function windLabel(kmh) {
  const v = kmh || 0;
  if (v < 3) return { name: 'Calme', cls: 'warn', advice: 'Air trop stable pour pulvériser (risque de stagnation et d\'inversion). Attendez une brise légère.' };
  if (v < 12) return { name: 'Bonne brise', cls: 'ok', advice: 'Fenêtre idéale pour les traitements phytosanitaires : dérive maîtrisée.' };
  if (v < 25) return { name: 'Modéré', cls: 'ok', advice: 'Bon pour l\'aération et la pollinisation. Traitements encore possibles si les rafales restent sous 15 km/h.' };
  if (v < 40) return { name: 'Assez fort', cls: 'warn', advice: 'Évitez les traitements et les repiquages. Tuteurez les cultures hautes.' };
  return { name: 'Fort', cls: 'risk', advice: 'Risque de verse et de dégâts matériels. Protégez serres, bâches et petits abris.' };
}
function pressureLabel(hpa) {
  const v = hpa || 1013;
  if (v < 1000) return { name: 'Basse', cls: 'warn', advice: 'Basse pression = temps instable, probabilité de pluie ou d\'orage plus élevée.' };
  if (v < 1013) return { name: 'Un peu basse', cls: 'ok', advice: 'Temps relativement humide et instable, restez attentif aux averses.' };
  if (v < 1025) return { name: 'Normale', cls: 'ok', advice: 'Régime de beau temps stable : bonne période pour les travaux de sol et les récoltes.' };
  return { name: 'Élevée', cls: 'warn', advice: 'Temps très stable et souvent sec : surveillez le déficit hydrique et l\'humidité de l\'air.' };
}
function visLabel(km) {
  const v = km || 0;
  if (v < 1) return { name: 'Très faible', cls: 'risk', advice: 'Brouillard dense : prudence en circulation, et humidité foliaire prolongée favorable aux maladies.' };
  if (v < 5) return { name: 'Réduite', cls: 'warn', advice: 'Brume : rosée abondante le matin, évitez les traitements tant que le feuillage est mouillé.' };
  if (v < 15) return { name: 'Correcte', cls: 'ok', advice: 'Visibilité satisfaisante pour les pulvérisations et les travaux extérieurs.' };
  return { name: 'Excellente', cls: 'ok', advice: 'Air limpide et sec : excellentes conditions d\'application et de récolte.' };
}
function cloudLabel(pct) {
  const v = pct === null || pct === undefined ? 0 : pct;
  if (v < 25) return { name: 'Ciel dégagé', advice: 'Fort rayonnement : les cultures transpirent, pensez au paillage. Bonne journée pour le séchage.' };
  if (v < 60) return { name: 'Partiellement nuageux', advice: 'Conditions idéales : températures modérées, bon compromis pour la transpiration et le rendement.' };
  if (v < 90) return { name: 'Nuageux', advice: 'Peu d\'évaporation : réduisez l\'arrosage. Surveillez le risque fongique si l\'humidité monte.' };
  return { name: 'Couvert', advice: 'Journée grise : transpiration faible, risque de maladies accru par temps humide persistant.' };
}
function rainProbLabel(pct) {
  const v = pct || 0;
  if (v < 20) return { name: 'Peu probable', advice: 'Vous pouvez planifier les traitements et les opérations au champ.' };
  if (v < 50) return { name: 'Possible', advice: 'Prévoyez une protection si vous laissez quelque chose sécher dehors.' };
  if (v < 75) return { name: 'Probable', advice: 'Reportez les traitements et l\'arrosage. Rentrez les récoltes en séchage.' };
  return { name: 'Très probable', advice: 'Pluie quasi certaine : ne traitez pas, ne semez pas, et sécurisez tout ce qui craint l\'eau.' };
}

/* ------------------ Rendu horaire ------------------ */
let hourlyMetric = 'temp';
function renderHourlyChart() {
  const w = State.weather;
  if (!w) return;
  const data = w.next48.slice(0, 25);
  const labels = data.map(function (h) { return hhmm(h.time); });
  const unit = State.prefs.units === 'imperial';
  const conv = function (t) { return t === null ? null : (unit ? t * 9 / 5 + 32 : t); };
  const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim();
  const accent2 = getComputedStyle(document.body).getPropertyValue('--accent-2').trim();
  const warn = getComputedStyle(document.body).getPropertyValue('--warn').trim();
  const info = getComputedStyle(document.body).getPropertyValue('--info').trim();

  let datasets, scales;
  if (hourlyMetric === 'temp') {
    datasets = [
      { label: 'Température (°' + (unit ? 'F' : 'C') + ')', data: data.map(function (h) { return h.temp === null ? null : Math.round(conv(h.temp) * 10) / 10; }),
        borderColor: accent, backgroundColor: 'transparent', tension: .38, pointRadius: 0, borderWidth: 2.5, yAxisID: 'y' },
      { label: 'Point de rosée', data: data.map(function (h) { return h.dew === null ? null : Math.round(conv(h.dew) * 10) / 10; }),
        borderColor: info, borderDash: [5, 4], tension: .35, pointRadius: 0, borderWidth: 1.8, yAxisID: 'y' },
      { label: 'Température ressentie', data: data.map(function (h) { return h.feels === null ? null : Math.round(conv(h.feels) * 10) / 10; }),
        borderColor: warn, tension: .35, pointRadius: 0, borderWidth: 1.8, borderDash: [2, 3], yAxisID: 'y' }
    ];
    scales = { y: { beginAtZero: false, grid: Charts.grid(), ticks: { callback: function (v) { return v + '°'; } } } };
  } else if (hourlyMetric === 'rain') {
    datasets = [
      { type: 'bar', label: 'Probabilité de pluie (%)', data: data.map(function (h) { return h.rainProb; }),
        backgroundColor: 'rgba(88,184,255,.35)', borderColor: info, borderWidth: 1, yAxisID: 'y' },
      { type: 'line', label: 'Pluie attendue (mm)', data: data.map(function (h) { return Math.round((h.precip || 0) * 10) / 10; }),
        borderColor: accent2, tension: .35, pointRadius: 0, borderWidth: 2.5, yAxisID: 'y1' }
    ];
    scales = {
      y: { beginAtZero: true, max: 100, grid: Charts.grid(), ticks: { callback: function (v) { return v + '%'; } } },
      y1: { beginAtZero: true, position: 'right', grid: { display: false }, ticks: { callback: function (v) { return v + ' mm'; } } }
    };
  } else {
    datasets = [
      { type: 'line', label: 'Couverture nuageuse (%)', data: data.map(function (h) { return h.cloud; }),
        borderColor: accent, backgroundColor: 'rgba(120,150,200,.22)', fill: true, tension: .35, pointRadius: 0, borderWidth: 2, yAxisID: 'y' },
      { type: 'line', label: 'Humidité relative (%)', data: data.map(function (h) { return h.humidity; }),
        borderColor: accent2, tension: .35, pointRadius: 0, borderWidth: 2, yAxisID: 'y' }
    ];
    scales = { y: { beginAtZero: true, max: 100, grid: Charts.grid(), ticks: { callback: function (v) { return v + '%'; } } } };
  }

  Charts.make('canvas-hourly', {
    type: 'line',
    data: { labels: labels, datasets: datasets },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'bottom' },
        tooltip: {
          callbacks: {
            title: function (items) { return 'À ' + items[0].label; }
          }
        }
      },
      scales: Object.assign({ x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 14 } } }, scales)
    }
  });
}

function renderHourStrip() {
  const w = State.weather;
  if (!w) return;
  const hours = w.next48.slice(0, 13).filter(function (h, i) { return i % 2 === 0; });
  el('hourstrip').innerHTML = hours.map(function (h) {
    const info = describeCode(h.code, h.isDay);
    return '<article class="hourcard">' +
      '<span class="hourcard__h">' + (h === hours[0] ? 'Maint.' : hhmm(h.time)) + '</span>' +
      '<span class="hourcard__i" aria-hidden="true">' + info.icon + '</span>' +
      '<span class="hourcard__t">' + tempUnit(h.temp) + '°</span>' +
      '<span class="hourcard__r"><i class="fa-solid fa-droplet" aria-hidden="true"></i> ' + (h.rainProb || 0) + '%</span>' +
      '</article>';
  }).join('');
}

/* ------------------ Rendu 10 jours ------------------ */
function renderDayList() {
  const w = State.weather;
  if (!w) return;
  const days = w.daily.slice(0, 10);
  const lo = Math.min.apply(null, days.map(function (d) { return d.tmin; }));
  const hi = Math.max.apply(null, days.map(function (d) { return d.tmax; }));
  const span = Math.max(1, hi - lo);
  el('daily-range').textContent = tempShort(lo) + ' → ' + tempShort(hi) + ' sur 10 jours';

  el('daylist').innerHTML = days.map(function (d, i) {
    const left = ((d.tmin - lo) / span) * 100;
    const width = Math.max(6, ((d.tmax - d.tmin) / span) * 100);
    const label = i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : dayName(d.date);
    return '<li class="dayrow" data-day="' + d.date + '" tabindex="0" role="button" aria-expanded="false">' +
      '<span class="dayrow__day">' + esc(label) + '<small>' + shortDate(d.date) + '</small></span>' +
      '<span class="dayrow__icon" aria-hidden="true">' + d.icon + '</span>' +
      '<span class="dayrow__bar">' +
      '<span class="dayrow__min">' + tempShort(d.tmin) + '</span>' +
      '<span class="dayrow__track"><span class="dayrow__fill" style="left:' + left.toFixed(1) + '%;width:' + width.toFixed(1) + '%"></span></span>' +
      '<span class="dayrow__max">' + tempShort(d.tmax) + '</span>' +
      '</span>' +
      '<span class="dayrow__meta">' +
      '<span class="dayrow__rain">' + (d.rainProb || 0) + '% · ' + round1(d.rain) + ' mm</span>' +
      '<span class="dayrow__extra">' + esc(d.codeText) + '</span>' +
      '</span>' +
      '<div class="daydetail" hidden>' +
      '<div><span>Vent max</span>' + num(d.windMax, 0) + ' km/h ' + windDir(d.windDir) + '</div>' +
      '<div><span>Rafales</span>' + num(d.gustMax, 0) + ' km/h</div>' +
      '<div><span>UV max</span>' + round1(d.uvMax) + ' — ' + uvLabel(d.uvMax).name + '</div>' +
      '<div><span>Humidité moy.</span>' + num(d.humidity, 0) + ' %</div>' +
      '<div><span>Heures de pluie</span>' + num(d.rainHours, 0) + ' h</div>' +
      '<div><span>Ressenti</span>' + tempShort(d.feelsMin) + ' → ' + tempShort(d.feelsMax) + '</div>' +
      '<div><span>Lever</span>' + hhmm(d.sunrise) + '</div>' +
      '<div><span>Coucher</span>' + hhmm(d.sunset) + '</div>' +
      '</div>' +
      '</li>';
  }).join('');
}

function toggleDayRow(row) {
  const detail = qs('.daydetail', row);
  const open = detail.hidden;
  detail.hidden = !open;
  row.classList.toggle('is-expanded', open);
  row.setAttribute('aria-expanded', open ? 'true' : 'false');
}

/* ------------------ Rendu soleil / lune ------------------ */
function renderSunMoon() {
  const w = State.weather;
  if (!w) return;
  const d = w.daily[0] || {};
  el('sun-rise').textContent = hhmm(d.sunrise);
  el('sun-set').textContent = hhmm(d.sunset);
  const durH = (d.daylight || 0) / 3600;
  el('sun-length').textContent = Math.floor(durH) + 'h ' + Math.round((durH % 1) * 60) + 'min';

  /* Progression du soleil dans l'arc */
  const now = new Date();
  const rise = d.sunrise ? new Date(d.sunrise) : null;
  const set = d.sunset ? new Date(d.sunset) : null;
  let p = 0;
  if (rise && set && set > rise) p = clamp((now - rise) / (set - rise), 0, 1);
  const arc = el('sun-arc-progress');
  let len = 283;
  try { if (arc.getTotalLength) len = arc.getTotalLength(); } catch (e) { /* SVG non mesurable */ }
  arc.setAttribute('stroke-dasharray', len.toFixed(1));
  arc.setAttribute('stroke-dashoffset', (len * (1 - p)).toFixed(1));
  const ang = Math.PI * p;
  const cx = 100 - 90 * Math.cos(ang);
  const cy = 100 - 90 * Math.sin(ang);
  const dot = el('sun-dot');
  dot.setAttribute('cx', cx.toFixed(1));
  dot.setAttribute('cy', cy.toFixed(1));
  dot.setAttribute('fill', p > 0 && p < 1 ? '#ffd66b' : 'rgba(255,255,255,.35)');

  /* Lune */
  const m = w.moon;
  el('moon-phase').textContent = m.icon + ' ' + m.name;
  el('moon-illum').textContent = m.illum + ' %';
  el('moon-rise-set').textContent = '≈ ' + m.rise + ' / ' + m.set;
  const shadow = el('moon-shadow');
  /* Décalage du masque : 0 = pleine lune (masque à droite), 50 % = nouvelle (masque centré) */
  const shift = (1 - m.illum / 100) * 200 - 100;
  shadow.style.transform = 'translateX(' + shift.toFixed(0) + '%)';
}

/* ------------------ Rendu des indicateurs ------------------ */
function renderIndicators() {
  const w = State.weather;
  if (!w) return;
  const c = w.current, d = w.daily[0] || {};
  const grid = el('indicator-grid');

  const um = uvLabel(c.uv);
  const hm = humidityLabel(c.humidity);
  const wm = windLabel(c.wind);
  const pm = pressureLabel(c.pressure);
  const vm = visLabel(c.vis ? c.vis / 1000 : null);
  const cm = cloudLabel(c.cloud);
  const rainMaxProb = Math.max.apply(null, w.next48.slice(0, 24).map(function (h) { return h.rainProb || 0; }));
  const rp = rainProbLabel(rainMaxProb);
  const rainNext48 = w.daily.slice(0, 2).reduce(function (a, x) { return a + (x.rain || 0); }, 0);
  const dew = c.dew;

  const cards = [
    { i: 'fa-wind', k: 'Vent', v: num(c.wind, 0), u: 'km/h', sub: windDir(c.windDir) + ' · rafales ' + num(c.gust, 0) + ' km/h',
      meter: clamp((c.wind || 0) / 60 * 100, 0, 100), cls: wm.cls, hint: wm.advice },
    { i: 'fa-gauge-high', k: 'Pression atmosphérique', v: num(c.pressure, 0), u: 'hPa', sub: pm.name,
      meter: clamp(((c.pressure || 1013) - 990) / 45 * 100, 0, 100), cls: pm.cls, hint: pm.advice },
    { i: 'fa-droplet', k: 'Humidité relative', v: num(c.humidity, 0), u: '%', sub: 'Point de rosée ' + tempShort(dew),
      meter: clamp(c.humidity || 0, 0, 100), cls: hm.cls, hint: hm.advice },
    { i: 'fa-temperature-three-quarters', k: 'Température ressentie', v: num(c.feels, 1), u: '°C',
      sub: 'Réelle ' + num(c.temp, 1) + ' °C · écart ' + (c.feels !== null && c.temp !== null ? (c.feels - c.temp >= 0 ? '+' : '') + num(c.feels - c.temp, 1) : '--') + ' °C',
      meter: clamp(((c.feels || 25) - 10) / 35 * 100, 0, 100),
      cls: (c.feels || 0) >= 38 ? 'risk' : (c.feels || 0) >= 33 ? 'warn' : 'ok',
      hint: (c.feels || 0) >= 38 ? 'Ressenti très élevé : évitez tout travail lourd, abreuvez le bétail plus souvent et ventilez les bâtiments.' :
        (c.feels || 0) >= 33 ? 'Ressenti chaud : travaillez avant 11 h et après 16 h, arrosez tôt le matin.' :
        (c.feels || 0) <= 15 ? 'Ressenti frais : les cultures tropicales ralentissent. Couvrez les pépinières la nuit.' :
        'Ressenti confortable : bonnes conditions de travail et de croissance.' },
    { i: 'fa-sun', k: 'Indice UV', v: round1(c.uv), u: '', sub: um.name + ' · max du jour ' + round1(d.uvMax),
      meter: clamp((c.uv || 0) / 12 * 100, 0, 100), cls: um.cls, hint: um.advice },
    { i: 'fa-eye', k: 'Visibilité', v: num((c.vis || 0) / 1000, 1), u: 'km', sub: vm.name,
      meter: clamp((c.vis || 0) / 20000 * 100, 0, 100), cls: vm.cls, hint: vm.advice },
    { i: 'fa-cloud', k: 'Couverture nuageuse', v: num(c.cloud, 0), u: '%', sub: cm.name,
      meter: clamp(c.cloud || 0, 0, 100), cls: 'ok', hint: cm.advice },
    { i: 'fa-cloud-showers-heavy', k: 'Précipitations', v: round1(w.rain24h), u: 'mm /24 h',
      sub: '48 h à venir : ' + round1(rainNext48) + ' mm · proba max ' + rainMaxProb + ' %',
      meter: clamp((rainNext48 || 0) / 60 * 100, 0, 100), cls: rp.cls === 'risk' ? 'warn' : rp.cls, hint: rp.advice },
    { i: 'fa-scale-unbalanced', k: 'Bilan hydrique 7 j', v: round1(w.balance.balance), u: 'mm',
      sub: 'Pluie ' + round1(w.balance.rain) + ' mm − ET₀ ' + round1(w.balance.et0) + ' mm',
      meter: clamp(((w.balance.balance + 40) / 120) * 100, 0, 100),
      cls: w.balance.balance < -20 ? 'risk' : w.balance.balance < 0 ? 'warn' : 'ok',
      hint: w.balance.balance < -20 ? 'Déficit hydrique marqué : arrosez d\'appoint 20 à 25 mm sur les cultures en floraison, et paillez immédiatement.' :
        w.balance.balance < 0 ? 'Léger déficit : surveillez les cultures sensibles et privilégiez un arrosage localisé.' :
        'Excédent hydrique : attention au lessivage de l\'azote et aux maladies des racines. Vérifiez le drainage.' },
    { i: 'fa-temperature-arrow-up', k: 'Amplitude thermique', v: round1((d.tmax || 0) - (d.tmin || 0)), u: '°C',
      sub: 'Min ' + tempShort(d.tmin) + ' → max ' + tempShort(d.tmax),
      meter: clamp(((d.tmax - d.tmin) || 0) / 22 * 100, 0, 100), cls: (d.tmax - d.tmin) > 16 ? 'warn' : 'ok',
      hint: (d.tmax - d.tmin) > 16 ? 'Grande amplitude : la nuit fraîche peut ralentir la croissance, tandis que l\'après-midi exige un arrosage adapté.' :
        'Amplitude modérée : conditions thermiques régulières, favorables à une croissance continue.' },
    { i: 'fa-clock', k: 'Durée du jour', v: (d.daylight ? Math.floor(d.daylight / 3600) : '--'), u: 'h',
      sub: 'Lever ' + hhmm(d.sunrise) + ' · coucher ' + hhmm(d.sunset),
      meter: clamp((d.daylight || 0) / 46800 * 100, 0, 100), cls: 'ok',
      hint: 'La durée du jour conditionne la photosynthèse : comparez avec la date de semis de vos cultures pour évaluer leur stade.' }
  ];

  grid.innerHTML = cards.map(function (cd) {
    return '<article class="indcard indcard--' + cd.cls + '">' +
      '<span class="indcard__badge">' + esc(cd.k === 'Indice UV' ? cd.sub.split(' · ')[0] : '') + '</span>' +
      '<header class="indcard__head"><span class="indcard__icon"><i class="fa-solid ' + cd.i + '" aria-hidden="true"></i></span>' +
      '<span class="indcard__label">' + esc(cd.k) + '</span></header>' +
      '<p class="indcard__value">' + esc(cd.v) + '<small>' + esc(cd.u) + '</small></p>' +
      '<p class="indcard__hint">' + esc(cd.sub) + '</p>' +
      '<div class="indcard__meter"><i style="width:' + cd.meter.toFixed(0) + '%"></i></div>' +
      '<p class="indcard__hint">' + esc(cd.hint) + '</p>' +
      '</article>';
  }).join('');

  renderFeelsChart();
  renderWindRose();
}

function renderFeelsChart() {
  const w = State.weather;
  if (!w) return;
  const data = w.next48.slice(0, 25);
  const labels = data.map(function (h) { return hhmm(h.time); });
  const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim();
  const warn = getComputedStyle(document.body).getPropertyValue('--warn').trim();
  const info = getComputedStyle(document.body).getPropertyValue('--info').trim();
  Charts.make('canvas-feels', {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Température réelle', data: data.map(function (h) { return h.temp === null ? null : Math.round(h.temp * 10) / 10; }),
          borderColor: accent, tension: .35, pointRadius: 0, borderWidth: 2.5 },
        { label: 'Température ressentie', data: data.map(function (h) { return h.feels === null ? null : Math.round(h.feels * 10) / 10; }),
          borderColor: warn, borderDash: [6, 4], tension: .35, pointRadius: 0, borderWidth: 2 },
        { label: 'Point de rosée', data: data.map(function (h) { return h.dew === null ? null : Math.round(h.dew * 10) / 10; }),
          borderColor: info, borderDash: [2, 3], tension: .35, pointRadius: 0, borderWidth: 1.8 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
      plugins: { legend: { position: 'bottom' } },
      scales: {
        x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 14 } },
        y: { grid: Charts.grid(), ticks: { callback: function (v) { return v + ' °C'; } } }
      }
    }
  });
}

function renderWindRose() {
  const w = State.weather;
  if (!w) return;
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
  const sums = new Array(16).fill(0), counts = new Array(16).fill(0);
  w.next48.forEach(function (h) {
    if (h.windDir === null || h.wind === null) return;
    const idx = Math.round(h.windDir / 22.5) % 16;
    sums[idx] += h.wind; counts[idx] += 1;
  });
  const avg = sums.map(function (s, i) { return counts[i] ? Math.round(s / counts[i] * 10) / 10 : 0; });
  const maxAvg = Math.max.apply(null, avg);
  const domIdx = avg.indexOf(maxAvg);
  const accent = getComputedStyle(document.body).getPropertyValue('--accent-2').trim();

  Charts.make('canvas-wind', {
    type: 'radar',
    data: {
      labels: dirs,
      datasets: [{
        label: 'Vitesse moyenne (km/h)', data: avg,
        borderColor: accent, backgroundColor: 'rgba(72,224,192,.18)', borderWidth: 2,
        pointBackgroundColor: accent, pointRadius: 3
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: true, position: 'bottom' } },
      scales: {
        r: {
          beginAtZero: true,
          grid: { color: 'rgba(255,255,255,.1)' },
          angleLines: { color: 'rgba(255,255,255,.08)' },
          pointLabels: { color: getComputedStyle(document.body).getPropertyValue('--muted').trim(), font: { size: 10 } },
          ticks: { display: false }
        }
      }
    }
  });

  const detail = el('wind-detail');
  const gusts = w.next48.map(function (h) { return h.gust; }).filter(function (g) { return g !== null; });
  const speeds = w.next48.map(function (h) { return h.wind; }).filter(function (g) { return g !== null; });
  const avgSpeed = speeds.length ? speeds.reduce(function (a, b) { return a + b; }, 0) / speeds.length : null;
  const maxGust = gusts.length ? Math.max.apply(null, gusts) : null;
  detail.innerHTML =
    '<div><dt>Direction dominante 48 h</dt><dd>' + windDir(domIdx * 22.5) + ' (' + Math.round(domIdx * 22.5) + '°)</dd></div>' +
    '<div><dt>Vitesse moyenne</dt><dd>' + num(avgSpeed, 1) + ' km/h — ' + windLabel(avgSpeed).name + '</dd></div>' +
    '<div><dt>Rafale maximale</dt><dd>' + num(maxGust, 0) + ' km/h</dd></div>' +
    '<div><dt>Heures propices au traitement</dt><dd>' + windTreatmentWindows() + '</dd></div>';
}

function windTreatmentWindows() {
  const w = State.weather;
  if (!w) return '—';
  const good = [];
  w.next48.slice(0, 25).forEach(function (h) {
    const rain = h.rainProb || 0;
    if (h.wind !== null && h.wind >= 3 && h.wind <= 12 && rain < 30 && (h.temp || 25) < 32) {
      good.push(hhmm(h.time));
    }
  });
  if (!good.length) return 'Aucune fenêtre idéale sur 24 h';
  return good.slice(0, 6).join(', ') + (good.length > 6 ? '…' : '');
}

/* =====================================================================
   Gestion des villes
   ===================================================================== */
async function selectCity(id) {
  State.activeCityId = id;
  savePref('active_city', id);
  renderCityStrip();
  qsa('.citycard').forEach(function (b) { b.classList.toggle('is-active', b.dataset.temp === id); });
  try {
    await Weather.load(id, { force: false });
    renderAllWeather();
  } catch (e) {
    toast('Météo indisponible', 'Impossible de charger les données pour cette ville (' + e.message + ').', 'risk');
  }
}

function renderAllWeather() {
  renderHero();
  renderHourStrip();
  renderHourlyChart();
  renderDayList();
  renderSunMoon();
  renderIndicators();
  if (typeof Agri !== 'undefined') Agri.evaluate();
  if (typeof Chatbot !== 'undefined') Chatbot.refreshQuick();
}

function renderCityManager() {
  const list = el('city-manager');
  if (!list) return;
  list.innerHTML = State.cities.map(function (c) {
    return '<li data-city="' + attr(c.id) + '">' +
      '<button class="iconbtn" type="button" data-act="primary" aria-label="Définir ' + attr(c.name) + ' comme ville principale" title="Ville principale">' +
      '<i class="fa-' + (c.is_primary ? 'solid' : 'regular') + ' fa-star" aria-hidden="true"></i></button>' +
      '<span>' + esc(c.name) + ' <small class="muted">' + esc(c.admin1 || c.country || '') + '</small></span>' +
      '<button class="iconbtn" type="button" data-act="del" aria-label="Retirer ' + attr(c.name) + '" title="Retirer">' +
      '<i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
      '</li>';
  }).join('') + (State.cities.length ? '' : '<li class="muted">Aucune ville enregistrée.</li>');
}

async function addCity(city) {
  const exists = State.cities.filter(function (c) {
    return Math.abs(c.latitude - city.latitude) < 0.02 && Math.abs(c.longitude - city.longitude) < 0.02;
  })[0];
  if (exists) { toast('Déjà suivie', city.name + ' est déjà dans votre liste.', 'warn'); return exists; }
  city.sort_order = State.cities.length + 1;
  city.is_primary = State.cities.length === 0;
  const saved = await saveRow('cities', 'cities', city);
  State.cities.sort(function (a, b) { return (a.sort_order || 99) - (b.sort_order || 99); });
  renderCityStrip();
  renderCityManager();
  toast('Ville ajoutée', city.name + ' suit maintenant la météo locale.', 'ok');
  refreshCitySummaries();
  return saved;
}

async function removeCity(id) {
  const c = cityById(id);
  if (!c) return;
  const plots = plotsOfCity(id);
  if (plots.length) {
    toast('Ville conservée', plots.length + ' parcelle(s) utilisent cette ville. Supprimez d\'abord les parcelles concernées.', 'warn');
    return;
  }
  if (State.cities.length <= 1) {
    toast('Impossible', 'Gardez au moins une ville enregistrée.', 'warn');
    return;
  }
  await removeRow('cities', 'cities', id);
  if (State.activeCityId === id) {
    State.activeCityId = (State.cities[0] || {}).id;
    await savePref('active_city', State.activeCityId);
    const w = await Weather.load(State.activeCityId, { force: true });
    if (w) renderAllWeather();
  }
  renderCityStrip();
  renderCityManager();
  toast('Ville retirée', c.name + ' a été retirée de votre liste.', 'info');
}
