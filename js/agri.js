/* =====================================================================
   agri.js — Moteur d'aide à la décision agronomique
   Analyse la météo + les cultures + les parcelles et produit :
   recommandations classées, fenêtres d'action, diagnostic par parcelle,
   alertes (règles utilisateur + alertes agronomiques automatiques).
   ===================================================================== */
'use strict';

/* ------------------ Utilitaires ------------------ */
function maxOf(arr, fn) {
  let m = null;
  arr.forEach(function (x) { const v = fn(x); if (v !== null && v !== undefined && (m === null || v > m)) m = v; });
  return m;
}
function minOf(arr, fn) {
  let m = null;
  arr.forEach(function (x) { const v = fn(x); if (v !== null && v !== undefined && (m === null || v < m)) m = v; });
  return m;
}
function sumOf(arr, fn) {
  return arr.reduce(function (a, x) { const v = fn(x); return a + (v === null || v === undefined ? 0 : v); }, 0);
}
/* Regroupe les heures consécutives qui satisfont un prédicat */
function windowsOf(hours, predicate) {
  const out = [];
  let cur = null;
  hours.forEach(function (h) {
    if (predicate(h)) {
      if (!cur) cur = { start: h.time, end: h.time, hours: 1 };
      else { cur.end = h.time; cur.hours++; }
    } else if (cur) { out.push(cur); cur = null; }
  });
  if (cur) out.push(cur);
  return out;
}

/* ------------------ Compatibilité culture / météo ------------------ */
function cropCompatibility(crop, w) {
  if (!crop || !w) return null;
  const days = w.daily.slice(0, 10);
  const tmaxAvg = sumOf(days, function (d) { return d.tmax; }) / Math.max(1, days.length);
  const tminAvg = sumOf(days, function (d) { return d.tmin; }) / Math.max(1, days.length);
  const rainTotal = sumOf(days, function (d) { return d.rain; });
  const reasons = [];
  let score = 100;

  /* Température maximale vs tolérance haute */
  if (crop.temp_max) {
    const over = tmaxAvg - crop.temp_max;
    if (over > 6) { score -= 34; reasons.push({ lvl: 'risk', t: 'Chaleur excessive', d: 'Maximales moyennes de ' + round1(tmaxAvg) + ' °C pour une tolérance de ' + crop.temp_max + ' °C : risque de stérilité florale.' }); }
    else if (over > 0) { score -= 16; reasons.push({ lvl: 'warn', t: 'Chaleur au-dessus de l\'optimum', d: 'Les maximales dépassent la tolérance (' + crop.temp_max + ' °C) : ombrage et arrosage fractionné conseillés.' }); }
  }
  /* Température minimale */
  if (crop.temp_min !== undefined && crop.temp_min !== null && crop.temp_min > 0) {
    const low = crop.temp_min - tminAvg;
    if (low > 6) { score -= 34; reasons.push({ lvl: 'risk', t: 'Froid en dessous du seuil critique', d: 'Minimales moyennes de ' + round1(tminAvg) + ' °C pour un seuil de ' + crop.temp_min + ' °C : croissance bloquée.' }); }
    else if (low > 0) { score -= 16; reasons.push({ lvl: 'warn', t: 'Fraîcheur nocturne', d: 'Les nuits descendent sous le seuil (' + crop.temp_min + ' °C) : couvrez et paillez.' }); }
  }
  /* Pluie vs besoin */
  if (crop.water_need !== 'eleve' && crop.water_need !== 'tres_eleve' && crop.rain_max) {
    const excess = rainTotal - crop.rain_max;
    if (excess > crop.rain_max * 0.6) { score -= 24; reasons.push({ lvl: 'risk', t: 'Excès d\'eau', d: round1(rainTotal) + ' mm prévus sur 10 jours (au-delà de ' + crop.rain_max + ' mm) : risque d\'asphyxie et de maladies racinaires.' }); }
    else if (excess > 0) { score -= 10; reasons.push({ lvl: 'warn', t: 'Pluies supérieures au besoin', d: 'Prévoir un drainage et éviter les apports d\'azote avant les pluies.' }); }
  }
  if (crop.water_need === 'eleve' || crop.water_need === 'tres_eleve') {
    const deficit = (crop.rain_min || 0) - rainTotal;
    if (deficit > 40) { score -= 30; reasons.push({ lvl: 'risk', t: 'Déficit hydrique marqué', d: round1(rainTotal) + ' mm prévus contre un besoin minimal de ' + crop.rain_min + ' mm : irrigation indispensable.' }); }
    else if (deficit > 0) { score -= 14; reasons.push({ lvl: 'warn', t: 'Eau un peu juste', d: 'Prévoyez un arrosage d\'appoint régulier (goutte à goutte ou arrosoir).' }); }
  }
  /* Vent */
  const gust = maxOf(days, function (d) { return d.gustMax; });
  if (gust && gust > 60) { score -= 20; reasons.push({ lvl: 'risk', t: 'Rafales destructrices', d: 'Rafales jusqu\'à ' + Math.round(gust) + ' km/h : les cultures hautes, les bananiers et les jeunes arbres sont menacés.' }); }
  else if (gust && gust > 40) { score -= 10; reasons.push({ lvl: 'warn', t: 'Vent soutenu', d: 'Tuteurez les cultures hautes et reportez les traitements.' }); }

  score = clamp(score, 0, 100);
  const level = score >= 72 ? 'ok' : score >= 48 ? 'warn' : 'risk';
  if (!reasons.length) reasons.push({ lvl: 'ok', t: 'Conditions favorables', d: 'Températures et pluviométrie cohérentes avec les exigences de la culture sur les 10 prochains jours.' });
  return { score: score, level: level, reasons: reasons, tmaxAvg: tmaxAvg, tminAvg: tminAvg, rainTotal: rainTotal };
}

/* ------------------ Recommandations ------------------ */
function buildRecommendations(w) {
  const recos = [];
  const c = w.current;
  const d0 = w.daily[0] || {}, d1 = w.daily[1] || {}, d2 = w.daily[2] || {};
  const next24 = w.next48.slice(0, 25);
  const next72 = w.next48.slice(0, 73);
  const rainProb24 = maxOf(next24, function (h) { return h.rainProb; }) || 0;
  const rain3d = sumOf([d0, d1, d2], function (d) { return d.rain; });
  const gustMax = maxOf([d0, d1, d2], function (d) { return d.gustMax; }) || 0;
  const windMax = maxOf([d0, d1], function (d) { return d.windMax; }) || 0;
  const tmax = d0.tmax, tmin = d0.tmin, feelsMax = d0.feelsMax;
  const uvMax = d0.uvMax || 0;
  const humMean = d0.humidity;
  const bal = w.balance;

  /* 1. Pluie imminente */
  if (rainProb24 >= 70 || rain3d > 25) {
    recos.push({ lvl: 'high', icon: 'fa-cloud-showers-heavy', title: 'Pluie probable : reporter les opérations sensibles',
      body: 'Probabilité maximale de ' + rainProb24 + ' % sur 24 h et ' + round1(rain3d) + ' mm attendus sur 3 jours. Reportez les traitements phytosanitaires, suspendez l\'irrigation et rentrez les récoltes en cours de séchage. Vérifiez les rigoles de drainage.' });
  } else if (rainProb24 >= 40) {
    recos.push({ lvl: 'mid', icon: 'fa-cloud-rain', title: 'Averses possibles : prévoyez une protection',
      body: 'Jusqu\'à ' + rainProb24 + ' % de probabilité de pluie dans les 24 h. Pulvérisez uniquement si vous êtes dans la fenêtre sèche, et ayez une bâche propre à portée de main.' });
  } else {
    recos.push({ lvl: 'low', icon: 'fa-sun', title: 'Fenêtre sèche : profitez-en',
      body: 'Aucune pluie significative attendue (' + round1(rain3d) + ' mm sur 3 jours). Période idéale pour traiter, récolter, sécher et travailler le sol.' });
  }

  /* 2. Chaleur */
  if (feelsMax >= 38 || tmax >= 36) {
    recos.push({ lvl: 'high', icon: 'fa-temperature-high', title: 'Stress thermique sévère',
      body: 'Ressenti jusqu\'à ' + round1(feelsMax) + ' °C. Arrosez tôt le matin, ombrez les pépinières et les cultures sensibles, abreuvez les animaux plus souvent, ventilez les bâtiments la nuit et décalez les travaux lourds avant 11 h ou après 16 h.' });
  } else if (tmax >= 33) {
    recos.push({ lvl: 'mid', icon: 'fa-sun-plant-wilt', title: 'Chaleur notable',
      body: 'Maximales de ' + round1(tmax) + ' °C. Privilégiez l\'arrosage matinal, paillez le sol et surveillez l\'enroulement des feuilles sur les cultures en floraison.' });
  }

  /* 3. Froid */
  if (tmin <= 15) {
    recos.push({ lvl: 'high', icon: 'fa-snowflake', title: 'Nuits fraîches : protections nécessaires',
      body: 'Minimales de ' + round1(tmin) + ' °C. Couvrez les pépinières et les jeunes plants, épaississez la litière des animaux, brumisez avant l\'aube et évitez de repiquer en fin de journée.' });
  }

  /* 4. Vent */
  if (gustMax >= 60) {
    recos.push({ lvl: 'high', icon: 'fa-wind', title: 'Rafales violentes annoncées',
      body: 'Rafales jusqu\'à ' + Math.round(gustMax) + ' km/h. Tuteurez et haubanez, sécurisez bâches et toitures légères, rentrez le matériel, protégez les abris de volailles et éloignez les animaux des clôtures métalliques.' });
  } else if (windMax >= 35) {
    recos.push({ lvl: 'mid', icon: 'fa-wind', title: 'Vent soutenu : adaptez vos travaux',
      body: 'Vents de ' + Math.round(windMax) + ' km/h. Évitez toute pulvérisation (dérive), reportez les repiquages et vérifiez les attaches des serres et tuteurs.' });
  }

  /* 5. Fenêtre de traitement */
  const treatWindows = windowsOf(next72, function (h) {
    return h.wind !== null && h.wind >= 3 && h.wind <= 12 && (h.rainProb || 0) < 30 && (h.temp || 25) < 32 && h.isDay;
  }).filter(function (x) { return x.hours >= 2; });
  if (treatWindows.length) {
    const best = treatWindows[0];
    recos.push({ lvl: 'low', icon: 'fa-spray-can-sparkles', title: 'Fenêtre de pulvérisation : ' + hhmm(best.start) + ' – ' + hhmm(best.end),
      body: treatWindows.length + ' créneau(x) favorable(s) sur 72 h (vent 3-12 km/h, pluie < 30 %, moins de 32 °C). Rappel : équipement de protection complet et respect du délai avant récolte.' });
  } else {
    recos.push({ lvl: 'mid', icon: 'fa-ban', title: 'Aucune fenêtre de traitement idéale',
      body: 'Sur 72 h, le vent, la pluie ou la chaleur empêchent une bonne application. Si l\'intervention est urgente, choisissez un créneau matinal, réduisez la dérive et n\'utilisez pas de produit lessivable.' });
  }

  /* 6. Bilan hydrique */
  if (bal.balance < -25) {
    recos.push({ lvl: 'high', icon: 'fa-droplet', title: 'Déficit hydrique : irriguer d\'appoint',
      body: 'Bilan des 7 jours : ' + round1(bal.rain) + ' mm de pluie contre ' + round1(bal.et0) + ' mm d\'évapotranspiration, soit un déficit de ' + round1(Math.abs(bal.balance)) + ' mm. Apportez 20 à 25 mm localisés sur les cultures en floraison, puis paillez pour limiter les pertes.' });
  } else if (bal.balance > 45) {
    recos.push({ lvl: 'mid', icon: 'fa-water', title: 'Excès d\'eau : surveiller le drainage',
      body: 'Excédent de ' + round1(bal.balance) + ' mm sur 7 jours. Vérifiez les rigoles, évitez tout apport d\'engrais (lessivage) et inspectez les racines et le collet des plants.' });
  }

  /* 7. Risque fongique */
  const humidHours = next24.filter(function (h) { return (h.humidity || 0) >= 85; }).length;
  if (humidHours >= 8 || (humMean || 0) > 85) {
    recos.push({ lvl: 'high', icon: 'fa-bacteria', title: 'Risque fongique élevé',
      body: humidHours + ' heures à plus de 85 % d\'humidité sur 48 h. Inspectez le dessous des feuilles (mildiou, anthracnose, rouille) et déclenchez un traitement préventif sur tomate, oignon, pomme de terre, bananier, cacaoyer ou caféier.' });
  }
  /* 8. Rosée abondante */
  if (c.dew !== null && c.temp !== null && (c.temp - c.dew) < 2.5) {
    recos.push({ lvl: 'mid', icon: 'fa-tear', title: 'Rosée abondante ce matin',
      body: 'Température et point de rosée très proches (' + round1(c.dew) + ' °C) : le feuillage restera mouillé longtemps. Attendez que les feuilles sèchent avant tout traitement ou récolte.' });
  }
  /* 9. UV */
  if (uvMax >= 8) {
    recos.push({ lvl: 'mid', icon: 'fa-sun-plant-wilt', title: 'Indice UV très élevé (max ' + round1(uvMax) + ')',
      body: 'Ombrez les pépinières et jeunes plants, paillez le sol pour abaisser sa température, travaillez avant 9 h et après 16 h. Manches longues, chapeau et 2 litres d\'eau par personne.' });
  }
  /* 10. Visibilité / brouillard */
  if (c.vis !== null && c.vis < 2000) {
    recos.push({ lvl: 'mid', icon: 'fa-smog', title: 'Visibilité réduite',
      body: 'Brume ou brouillard : feuillage mouillé et dérive difficile à maîtriser. Reportez les traitements et soyez prudent sur les déplacements.' });
  }
  /* 11. Pression en chute */
  const p0 = c.pressure || 1013;
  const p48 = (w.next48[47] && w.next48[47].pressure) || p0;
  if (p0 - p48 > 6) {
    recos.push({ lvl: 'mid', icon: 'fa-gauge-high', title: 'Pression en baisse rapide',
      body: 'La pression perd ' + round1(p0 - p48) + ' hPa en 48 h : instabilité, risque d\'orage et de rafales. Anticipez la protection des serres et le report des travaux sensibles.' });
  }
  /* 12. Période de semis */
  const month = new Date().getMonth() + 1;
  const sowable = CropDB.all.concat(State.customCrops.map(CropDB.normalizeCustom)).filter(function (cr) {
    return (cr.calendar || []).indexOf(month) >= 0 && (cr.water_need !== 'tres_eleve' || rain3d > 15);
  }).slice(0, 6);
  if (sowable.length) {
    recos.push({ lvl: 'low', icon: 'fa-seedling', title: 'Période de semis : ' + sowable.length + ' cultures adaptées',
      body: 'Selon le calendrier et les pluies attendues, vous pouvez envisager : ' + sowable.map(function (s) { return s.name; }).join(', ') + '. Vérifiez la compatibilité météo de chaque culture dans l\'onglet Cultures.' });
  }
  /* 13. Cultures à risque */
  const riskyCrops = CropDB.all.map(function (cr) { return { crop: cr, comp: cropCompatibility(cr, w) }; })
    .filter(function (x) { return x.comp && x.comp.level === 'risk'; }).slice(0, 5);
  if (riskyCrops.length) {
    recos.push({ lvl: 'mid', icon: 'fa-triangle-exclamation', title: 'Cultures à surveiller en priorité',
      body: riskyCrops.map(function (x) { return x.crop.name + ' (score ' + x.comp.score + '/100)'; }).join(' · ') +
        '. Ces cultures rencontrent actuellement des conditions hors de leur plage de confort : adaptez irrigation, ombrage et protection.' });
  }
  /* 14. Pompage / irrigation nocturne */
  if (bal.balance < 0) {
    recos.push({ lvl: 'low', icon: 'fa-clock', title: 'Irriguer aux heures fraîches',
      body: 'Les pertes par évaporation atteignent 40 % entre 11 h et 16 h. Programmez vos pompes avant 9 h ou après 17 h ; la nuit réduit encore l\'évaporation mais favorise les maladies foliaires sur les cultures sensibles.' });
  }

  /* Tri par niveau */
  const order = { high: 0, mid: 1, low: 2 };
  recos.sort(function (a, b) { return order[a.lvl] - order[b.lvl]; });
  return recos;
}

/* ------------------ Score global ------------------ */
function computeScore(recos, w) {
  let s = 100;
  recos.forEach(function (r) {
    if (r.lvl === 'high') s -= 22;
    else if (r.lvl === 'mid') s -= 9;
  });
  const bal = w.balance.balance;
  if (bal < -40) s -= 12;
  else if (bal < -15) s -= 5;
  s = clamp(Math.round(s), 0, 100);
  return s;
}

/* ------------------ Fenêtres d'action ------------------ */
const ACTION_DEFS = [
  { id: 'treat', label: 'Pulvériser / traiter', icon: 'fa-spray-can-sparkles',
    eval: function (day, hours) {
      const hs = hours.filter(function (h) { return h.isDay; });
      const good = hs.filter(function (h) { return h.wind !== null && h.wind >= 3 && h.wind <= 12 && (h.rainProb || 0) < 30 && (h.temp || 25) < 32; });
      const ok = hs.filter(function (h) { return h.wind !== null && h.wind <= 18 && (h.rainProb || 0) < 50 && (h.temp || 25) < 34; });
      if (good.length >= 3) return { level: 'good', note: good.length + ' h favorables (' + hhmm(good[0].time) + '–' + hhmm(good[good.length - 1].time) + ') — vent 3-12 km/h' };
      if (ok.length >= 3) return { level: 'mid', note: ok.length + ' h possibles mais conditions limites (vent, pluie ou chaleur)' };
      if ((day.gustMax || 0) > 40) return { level: 'bad', note: 'Rafales ' + Math.round(day.gustMax) + ' km/h : dérive incontrôlable' };
      if ((day.rain || 0) > 8 || (day.rainProb || 0) > 70) return { level: 'bad', note: 'Pluie ' + round1(day.rain) + ' mm (' + (day.rainProb || 0) + ' %) : produit lessivé' };
      if ((day.tmax || 0) > 34) return { level: 'bad', note: 'Max ' + round1(day.tmax) + ' °C : risque de brûlure du feuillage' };
      return { level: 'mid', note: 'Fenêtre étroite : choisissez tôt le matin' };
    } },
  { id: 'sow', label: 'Semer / repiquer', icon: 'fa-seedling',
    eval: function (day, hours) {
      if ((day.rain || 0) >= 10 && (day.rainProb || 0) >= 40) return { level: 'good', note: 'Pluie utile ' + round1(day.rain) + ' mm : bon départ pour la levée' };
      if ((day.rain || 0) >= 3) return { level: 'mid', note: 'Pluie légère (' + round1(day.rain) + ' mm) : insuffisante seule, complétez par un arrosage d\'installation' };
      const nextRain = hours.slice(0, 40).reduce(function (a, h) { return a + (h.precip || 0); }, 0);
      if (nextRain >= 8) return { level: 'mid', note: 'Pluie annoncée à court terme (' + round1(nextRain) + ' mm) : attendez ou semez juste avant' };
      if ((day.tmax || 0) > 35) return { level: 'bad', note: 'Chaleur ' + round1(day.tmax) + ' °C : levée difficile, attendez' };
      return { level: 'bad', note: 'Sol sec : aucune pluie utile attendue' };
    } },
  { id: 'irrigate', label: 'Irriguer', icon: 'fa-droplet',
    eval: function (day, hours) {
      if ((day.rain || 0) > 15) return { level: 'bad', note: 'Pluie ' + round1(day.rain) + ' mm : inutile d\'irriguer' };
      if ((day.rain || 0) > 5) return { level: 'mid', note: 'Pluie partielle (' + round1(day.rain) + ' mm) : complétez si besoin' };
      if ((day.tmax || 0) > 33) return { level: 'good', note: 'Chaleur : irrigation indispensable, tôt le matin' };
      return { level: 'good', note: 'Journée sèche : arrosez selon le test du poing' };
    } },
  { id: 'harvest', label: 'Récolter / sécher', icon: 'fa-basket-shopping',
    eval: function (day) {
      if ((day.rainProb || 0) > 60 || (day.rain || 0) > 5) return { level: 'bad', note: 'Pluie probable (' + (day.rainProb || 0) + ' %, ' + round1(day.rain) + ' mm) : récolte et séchage compromis' };
      if ((day.humidity || 0) > 85) return { level: 'mid', note: 'Humidité moyenne ' + round1(day.humidity) + ' % : séchage lent, prévoyez un abri ventilé' };
      return { level: 'good', note: 'Temps sec : conditions idéales pour récolter et sécher' };
    } },
  { id: 'fertilize', label: 'Épandre un engrais', icon: 'fa-flask',
    eval: function (day) {
      if ((day.rain || 0) > 25) return { level: 'bad', note: 'Pluie ' + round1(day.rain) + ' mm : lessivage de l\'azote' };
      if ((day.rain || 0) >= 5) return { level: 'good', note: 'Pluie modérée (' + round1(day.rain) + ' mm) : incorporera l\'engrais sans le lessiver' };
      if ((day.tmax || 0) > 33) return { level: 'bad', note: 'Chaleur ' + round1(day.tmax) + ' °C : volatilisation de l\'urée' };
      return { level: 'mid', note: 'Sol sec : épandez puis enfouissez ou irriguez légèrement' };
    } }
];

function buildWindows(w) {
  const out = [];
  for (let i = 0; i < 3; i++) {
    const day = w.daily[i];
    if (!day) continue;
    const dayHours = w.hourly.filter(function (h) { return h.time.slice(0, 10) === day.date; });
    const hours = dayHours.length ? dayHours : w.next48.slice(i * 24, i * 24 + 24);
    ACTION_DEFS.forEach(function (a) {
      const r = a.eval(day, hours);
      out.push({ day: day, date: day.date, dayLabel: i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : dayName(day.date), action: a, level: r.level, note: r.note });
    });
  }
  return out;
}

/* ------------------ Diagnostic par parcelle ------------------ */
function plotDiagnostic(plot, w) {
  const crop = cropById(plot.crop_id);
  if (!crop) return null;
  const d0 = w.daily[0] || {}, d1 = w.daily[1] || {}, d2 = w.daily[2] || {};
  const rain3 = sumOf([d0, d1, d2], function (d) { return d.rain; });
  const tmax = d0.tmax, tmin = d0.tmin;
  const eta = sumOf([d0, d1, d2], function (d) { return et0Hargreaves(d.tmean, d.tmax, d.tmin, (cityById(plot.city_id) || {}).latitude || 6, 180); });
  const balance = rain3 - eta;
  const comp = cropCompatibility(crop, w);
  const notes = [];
  let level = comp ? comp.level : 'ok';

  /* Stade phénologique */
  let stage = null, stageIdx = -1;
  if (plot.planting_date && crop.growing_stages && crop.growing_stages.length) {
    const daysSince = Math.floor((Date.now() - new Date(plot.planting_date).getTime()) / 86400000);
    crop.growing_stages.forEach(function (s, i) {
      if (daysSince >= (s.days || 0) && (i === crop.growing_stages.length - 1 || daysSince < (crop.growing_stages[i + 1].days || 99999))) {
        stage = s; stageIdx = i;
      }
    });
    if (stage) notes.push({ lvl: 'low', t: 'Stade : ' + stage.name, d: 'Jour ' + daysSince + ' après mise en place. Besoins clés : ' + stage.key_needs });
  }

  /* Besoin en eau selon le stade */
  const kc = (stageIdx >= 0 && (stageIdx === 2 || stageIdx === 3)) ? 1.15 : 0.85; /* besoin maximal en floraison/fructification */
  const etc = eta * kc;
  const deficit = etc - rain3;

  if (deficit > 25) {
    level = 'risk';
    notes.push({ lvl: 'risk', t: 'Irrigation indispensable',
      d: 'Besoin estimé ' + round1(etc) + ' mm sur 3 jours (ET₀ × coefficient cultural) contre ' + round1(rain3) + ' mm de pluie : apportez environ ' + Math.round(deficit) + ' mm, soit ' + Math.round(deficit * 10) + ' m³/ha. Faites-le tôt le matin, en 1 ou 2 apports.' });
  } else if (deficit > 8) {
    if (level === 'ok') level = 'warn';
    notes.push({ lvl: 'warn', t: 'Arrosage d\'appoint conseillé',
      d: 'Déficit léger de ' + round1(deficit) + ' mm estimé sur 72 h. Un arrosage localisé de ' + Math.max(10, Math.round(deficit)) + ' mm suffira.' });
  } else if (balance > 40) {
    if (level === 'ok') level = 'warn';
    notes.push({ lvl: 'warn', t: 'Surveillance du drainage',
      d: 'Excédent hydrique de ' + round1(balance) + ' mm : vérifiez les rigoles et évitez tout apport d\'azote avant les pluies.' });
  } else {
    notes.push({ lvl: 'ok', t: 'Bilan hydrique équilibré', d: 'Pluie et évapotranspiration sont cohérentes sur les 3 prochains jours : pas d\'intervention urgente.' });
  }

  /* Traitement selon le mode d'irrigation et le sol */
  if (plot.irrigation === 'aspersion' && (crop.category === 'maraichage' || crop.category === 'fruit')) {
    notes.push({ lvl: 'mid', t: 'Cohérence : aspersion et maladies foliaires',
      d: 'L\'aspersion prolonge l\'humectation des feuilles. Favorisez la goutte à goutte ou arrosez au pied, et traitez préventivement.' });
  }
  if (plot.soil === 'sableux') {
    notes.push({ lvl: 'mid', t: 'Sol sableux : arrosages fractionnés',
      d: 'Faible réserve utile : arrosez plus souvent et en petites quantités, et apportez de la matière organique pour améliorer la rétention.' });
  } else if (plot.soil === 'argileux' || plot.soil === 'hydromorphe') {
    notes.push({ lvl: 'mid', t: 'Sol lourd : éviter l\'excès d\'eau',
      d: 'Sol argileux : cultivatez sur billons, ne travaillez jamais détrempé, et privilégiez le riz, le taro, le macabo, la canne ou la patate douce en parcelle humide.' });
  }
  if (plot.soil === 'ferralitique' || plot.soil === 'lateritique') {
    const ph = 5.2;
    if (crop.ph_min && ph < crop.ph_min) {
      notes.push({ lvl: 'mid', t: 'pH probablement trop acide',
      d: 'Sol ferrallitique ou latéritique (pH souvent 4,5-5,5) alors que ' + crop.name + ' demande un pH ' + crop.ph_min + '-' + crop.ph_max + '. Apportez du calcaire broyé ou de la cendre avant le semis.' });
    }
  }
  /* Protection selon la saison */
  const month = new Date().getMonth() + 1;
  if ((crop.calendar || []).indexOf(month) >= 0) {
    notes.push({ lvl: 'ok', t: 'Calendrier favorable', d: 'Ce mois fait partie de la fenêtre de semis recommandée pour ' + crop.name + '. Vérifiez l\'état du sol avant de semer.' });
  } else {
    notes.push({ lvl: 'mid', t: 'Hors fenêtre de semis habituelle', d: 'Le calendrier recommandé pour ' + crop.name + ' est ' + (crop.calendar || []).map(function (m) {
      const names = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
      return names[m - 1];
    }).join(', ') + '. Hors période, prévoyez irrigation et protection renforcées.' });
  }
  /* Attention fenêtre de traitement */
  const tw = windowsOf(w.next48.slice(0, 25), function (h) {
    return h.wind !== null && h.wind >= 3 && h.wind <= 12 && (h.rainProb || 0) < 30 && (h.temp || 25) < 32 && h.isDay;
  }).filter(function (x) { return x.hours >= 2; });
  if (tw.length) {
    notes.push({ lvl: 'ok', t: 'Fenêtre de traitement sur la parcelle', d: 'Créneau favorable ' + hhmm(tw[0].start) + ' – ' + hhmm(tw[0].end) + ' (vent 3-12 km/h, pluie < 30 %). Évitez les 100 m autour des ruches en pleine floraison.' });
  }

  return {
    plot: plot, crop: crop, level: level, comp: comp, notes: notes,
    stage: stage, rain3: rain3, et0: eta, deficit: deficit, balance: balance,
    irrigationMm: deficit > 8 ? Math.round(deficit) : 0
  };
}

/* ------------------ Alertes (règles utilisateur + automatiques) ------------------ */
const METRIC_LABELS = {
  temp_min: 'Température minimale', temp_max: 'Température maximale', rain_prob: 'Probabilité de pluie',
  rain_mm: 'Cumul de pluie', wind_kmh: 'Vent', humidity: 'Humidité', uv: 'Indice UV', pressure: 'Pression'
};

function ruleValue(rule, w) {
  const hours = w.next48.slice(0, clamp((rule.window_hours || 24) + 1, 2, 49));
  const days = w.daily.slice(0, Math.ceil((rule.window_hours || 24) / 24));
  switch (rule.metric) {
    case 'temp_min': return minOf(hours, function (h) { return h.temp; });
    case 'temp_max': return maxOf(hours, function (h) { return h.temp; });
    case 'rain_prob': return maxOf(hours, function (h) { return h.rainProb; });
    case 'rain_mm': return sumOf(hours, function (h) { return h.precip; });
    case 'wind_kmh': return maxOf(hours, function (h) { return h.gust !== null ? Math.max(h.gust, h.wind || 0) : h.wind; });
    case 'humidity': return maxOf(hours, function (h) { return h.humidity; });
    case 'uv': return maxOf(hours, function (h) { return h.uv; });
    case 'pressure': return minOf(hours, function (h) { return h.pressure; });
    default: return null;
  }
}
function ruleMatches(rule, w) {
  const v = ruleValue(rule, w);
  if (v === null || v === undefined) return null;
  const t = Number(rule.threshold);
  let hit = false;
  switch (rule.operator) {
    case '>': hit = v > t; break;
    case '>=': hit = v >= t; break;
    case '<': hit = v < t; break;
    case '<=': hit = v <= t; break;
    default: hit = false;
  }
  return { value: v, hit: hit };
}

function autoAlerts(w) {
  const out = [];
  const d0 = w.daily[0] || {}, d1 = w.daily[1] || {};
  const gust = maxOf([d0, d1], function (d) { return d.gustMax; }) || 0;
  const rainProb = maxOf(w.next48.slice(0, 25), function (h) { return h.rainProb; }) || 0;
  const rain3 = sumOf([d0, d1, w.daily[2] || {}], function (d) { return d.rain; });
  const feelsMax = d0.feelsMax;
  const tmin = d0.tmin;
  const uvMax = d0.uvMax || 0;
  const dryDays = w.daily.slice(0, 5).filter(function (d) { return (d.rain || 0) < 3; }).length;

  if (rainProb >= 70) out.push({ sev: 'risk', icon: 'fa-cloud-showers-heavy', title: 'Pluie très probable (' + rainProb + ' %)', body: 'Reportez traitements et irrigation, rentrez les récoltes en cours de séchage.', src: 'auto' });
  else if (rainProb >= 45) out.push({ sev: 'warn', icon: 'fa-cloud-rain', title: 'Averses possibles (' + rainProb + ' %)', body: 'Gardez une bâche à portée et évitez les interventions longues en extérieur.', src: 'auto' });

  if (feelsMax !== null && feelsMax >= 38) out.push({ sev: 'risk', icon: 'fa-temperature-high', title: 'Stress thermique : ressenti ' + round1(feelsMax) + ' °C', body: 'Arrosez tôt, ombrez, abreuvez le bétail plus souvent, ventilez les bâtiments la nuit.', src: 'auto' });
  if (tmin !== null && tmin <= 15) out.push({ sev: 'risk', icon: 'fa-snowflake', title: 'Nuit fraîche : ' + round1(tmin) + ' °C', body: 'Couvrez pépinières et jeunes plants, épaississez la litière des animaux.', src: 'auto' });
  if (gust >= 60) out.push({ sev: 'risk', icon: 'fa-wind', title: 'Rafales jusqu\'à ' + Math.round(gust) + ' km/h', body: 'Sécurisez bâches, toitures et abris ; tuteurez les cultures hautes.', src: 'auto' });
  else if (gust >= 40) out.push({ sev: 'warn', icon: 'fa-wind', title: 'Vent soutenu (' + Math.round(gust) + ' km/h)', body: 'Pas de pulvérisation (dérive) ni de repiquage dans ces conditions.', src: 'auto' });
  if (dryDays >= 4) out.push({ sev: 'warn', icon: 'fa-sun', title: 'Série sèche : ' + dryDays + ' jours sous 3 mm', body: 'Planifiez un arrosage d\'appoint de 20 à 25 mm sur les cultures en floraison.', src: 'auto' });
  if (rain3 >= 60) out.push({ sev: 'risk', icon: 'fa-water', title: 'Cumul important : ' + round1(rain3) + ' mm en 3 jours', body: 'Vérifiez le drainage et retenez les apports d\'engrais avant les pluies.', src: 'auto' });
  if (uvMax >= 9) out.push({ sev: 'warn', icon: 'fa-sun-plant-wilt', title: 'UV très élevé (max ' + round1(uvMax) + ')', body: 'Protection de la peau obligatoire et ombrage des cultures sensibles.', src: 'auto' });
  return out;
}

function evaluateRules(w) {
  const out = [];
  State.alertRules.filter(function (r) { return r.active !== false; }).forEach(function (r) {
    const city = cityById(r.city_id);
    if (r.city_id && r.city_id !== State.activeCityId) {
      /* évaluée sur la ville concernée plus tard ; on l'indique comme hors portée */
      return;
    }
    const res = ruleMatches(r, w);
    if (res && res.hit) {
      out.push({
        sev: r.metric === 'rain_mm' || r.metric === 'wind_kmh' ? 'risk' : 'warn',
        icon: 'fa-bell', title: r.name,
        body: (r.message || (METRIC_LABELS[r.metric] + ' ' + r.operator + ' ' + r.threshold)) +
          ' — valeur observée : ' + round1(res.value) + ' (horizon ' + (r.window_hours || 24) + ' h)',
        src: 'rule', id: r.id, cityName: city ? city.name : '',
        notify: r.notify_browser
      });
    }
  });
  return out;
}

/* ------------------ Rendu ------------------ */
const Agri = {
  lastNotified: {},

  evaluate: function () {
    const w = State.weather;
    if (!w) return;
    const recos = buildRecommendations(w);
    const score = computeScore(recos, w);
    this.renderScore(score, recos, w);
    this.renderAdvice(recos);
    this.renderWindows(buildWindows(w));
    this.renderDiagnostics(w);
    this.renderAlerts(w);
    if (typeof Culture !== 'undefined') Culture.renderPlots();
  },

  renderScore: function (score, recos, w) {
    const arc = el('score-arc');
    if (!arc) return;
    const circ = 327;
    arc.setAttribute('stroke-dashoffset', String(circ * (1 - score / 100)));
    const color = score >= 70 ? 'var(--ok)' : score >= 45 ? 'var(--warn)' : 'var(--risk)';
    arc.setAttribute('stroke', color);
    const val = el('score-val');
    val.textContent = score;
    val.style.color = color;

    const highs = recos.filter(function (r) { return r.lvl === 'high'; }).length;
    const mids = recos.filter(function (r) { return r.lvl === 'mid'; }).length;
    const title = score >= 80 ? 'Excellentes conditions de travail' :
      score >= 65 ? 'Bonnes conditions, quelques précautions' :
      score >= 45 ? 'Conditions moyennes : planifiez avec soin' :
      score >= 25 ? 'Conditions difficiles : interventions limitées' : 'Conditions très défavorables';
    el('score-title').textContent = title;
    el('score-summary').innerHTML = 'Sur la base de la météo de <strong>' + esc(w.city.name) + '</strong> (températures, pluie, vent, humidité) et de vos parcelles, ' +
      recos.length + ' points d\'attention ont été identifiés : ' + highs + ' prioritaire(s) et ' + mids + ' à surveiller. ' +
      'Bilan hydrique 7 jours : <strong>' + round1(w.balance.balance) + ' mm</strong>.';

    const chips = [];
    chips.push({ t: 'Max ' + tempShort((w.daily[0] || {}).tmax), c: '' });
    chips.push({ t: 'Min ' + tempShort((w.daily[0] || {}).tmin), c: '' });
    chips.push({ t: 'Pluie 3 j : ' + round1(sumOf(w.daily.slice(0, 3), function (d) { return d.rain; })) + ' mm', c: '' });
    chips.push({ t: 'Vent max ' + num(maxOf(w.daily.slice(0, 2), function (d) { return d.windMax; }), 0) + ' km/h', c: '' });
    chips.push({ t: 'Humidité ' + num((w.daily[0] || {}).humidity, 0) + ' %', c: '' });
    chips.push({ t: 'UV max ' + round1((w.daily[0] || {}).uvMax), c: '' });
    el('score-chips').innerHTML = chips.map(function (c) { return '<span class="pill">' + esc(c.t) + '</span>'; }).join('');
  },

  renderAdvice: function (recos) {
    const list = el('advice-list');
    if (!list) return;
    if (!recos.length) { list.innerHTML = '<li class="lvl-low">Aucune recommandation particulière : conditions neutres.</li>'; return; }
    list.innerHTML = recos.map(function (r) {
      const cls = r.lvl === 'high' ? 'lvl-high' : r.lvl === 'mid' ? 'lvl-mid' : 'lvl-low';
      return '<li class="' + cls + '"><div><strong><i class="fa-solid ' + r.icon + '" aria-hidden="true"></i> ' +
        esc(r.title) + '</strong>' + esc(r.body) + '</div></li>';
    }).join('');
  },

  renderWindows: function (windows) {
    const grid = el('window-grid');
    if (!grid) return;
    const byDay = {};
    windows.forEach(function (x) { (byDay[x.dayLabel] = byDay[x.dayLabel] || []).push(x); });
    grid.innerHTML = Object.keys(byDay).map(function (dl) {
      return byDay[dl].map(function (x) {
        const cls = x.level === 'good' ? 'windowcell--good' : x.level === 'mid' ? 'windowcell--mid' : 'windowcell--bad';
        const tag = x.level === 'good' ? 'Favorable' : x.level === 'mid' ? 'Limite' : 'Déconseillé';
        return '<article class="windowcell ' + cls + '">' +
          '<span class="windowcell__tag">' + tag + '</span>' +
          '<b><i class="fa-solid ' + x.action.icon + '" aria-hidden="true"></i> ' + esc(x.action.label) + '</b>' +
          '<small>' + esc(x.dayLabel) + ' ' + shortDate(x.date) + ' — ' + esc(x.note) + '</small>' +
          '</article>';
      }).join('');
    }).join('');
  },

  renderDiagnostics: function (w) {
    const box = el('parcel-diagnostic');
    if (!box) return;
    const plots = State.plots.slice();
    if (!plots.length) {
      box.innerHTML = '<div class="empty">Aucune parcelle enregistrée. Ajoutez votre première parcelle (onglet Cultures → Ajouter) : ' +
        'le diagnostic utilisera votre culture, votre sol et votre mode d\'irrigation pour produire des conseils dédiés.</div>';
      return;
    }
    box.innerHTML = plots.map(function (p) {
      const diag = plotDiagnostic(p, w);
      if (!diag) return '<article class="parcelcard"><p class="muted">Culture introuvable pour « ' + esc(p.name) + ' ».</p></article>';
      const city = cityById(p.city_id);
      const lvlTag = diag.level === 'ok' ? '<span class="pill pill--ok">Favorable</span>' :
        diag.level === 'warn' ? '<span class="pill pill--warn">Vigilance</span>' : '<span class="pill pill--risk">Intervention requise</span>';
      const irrig = diag.irrigationMm > 0 ? diag.irrigationMm + ' mm' : 'inutile';
      return '<article class="parcelcard">' +
        '<div class="parcelcard__head"><div><div class="parcelcard__name">' + esc(p.name) + '</div>' +
        '<div class="parcelcard__sub">' + esc(diag.crop.name) + ' · ' + num(p.surface, 2) + ' ha · ' + esc(SOIL_LABELS[p.soil] || p.soil || 'sol non précisé') +
        ' · ' + esc(IRRIGATION_LABELS[p.irrigation] || p.irrigation || '') + (city ? ' · ' + esc(city.name) : '') + '</div></div>' + lvlTag + '</div>' +
        '<div class="parcelcard__kpis">' +
        '<div><span>Bilan 3 j</span><b>' + round1(diag.balance) + ' mm</b></div>' +
        '<div><span>Besoin estimé</span><b>' + round1(diag.et0) + ' mm</b></div>' +
        '<div><span>Irrigation</span><b>' + irrig + '</b></div>' +
        '</div>' +
        (diag.comp ? '<div class="chiprow"><span class="chip">Compatibilité ' + diag.comp.score + '/100</span>' +
          diag.comp.reasons.slice(0, 2).map(function (r) {
            return '<span class="chip' + (r.lvl === 'risk' ? ' chip--risk' : '') + '">' + esc(r.t) + '</span>';
          }).join('') + '</div>' : '') +
        '<ul class="parcelcard__notes">' + diag.notes.map(function (n) {
          return '<li><i class="fa-solid ' + (n.lvl === 'risk' ? 'fa-circle-exclamation' : n.lvl === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-check') +
            '" aria-hidden="true"></i> <strong>' + esc(n.t) + '</strong><br>' + esc(n.d) + '</li>';
        }).join('') + '</ul>' +
        '<div class="parcelcard__actions">' +
        '<button class="btn btn--sm btn--ghost" type="button" data-plot-edit="' + attr(p.id) + '"><i class="fa-solid fa-pen" aria-hidden="true"></i> Modifier</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-plot-journal="' + attr(p.id) + '"><i class="fa-solid fa-clipboard-list" aria-hidden="true"></i> Journal</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-plot-crop="' + attr(p.crop_id) + '"><i class="fa-solid fa-book" aria-hidden="true"></i> Fiche culture</button>' +
        '</div></article>';
    }).join('');
  },

  renderAlerts: function (w) {
    const rules = evaluateRules(w);
    const autos = autoAlerts(w);
    State.triggered = autos.concat(rules);
    const list = el('triggered-alerts');
    if (list) {
      if (!State.triggered.length) {
        list.innerHTML = '<div class="alertitem alertitem--ok"><i class="fa-solid fa-circle-check" aria-hidden="true"></i>' +
          '<div><strong>Aucune alerte active</strong><small>Les conditions actuelles ne déclenchent ni vos règles ni les alertes agronomiques automatiques.</small></div></div>';
      } else {
        list.innerHTML = State.triggered.map(function (a) {
          return '<div class="alertitem alertitem--' + a.sev + '"><i class="fa-solid ' + a.icon + '" aria-hidden="true"></i>' +
            '<div><strong>' + esc(a.title) + '</strong><small>' + esc(a.body) + '</small>' +
            '<small>' + (a.src === 'rule' ? 'Règle personnalisée' : 'Alerte agronomique automatique') + '</small></div></div>';
        }).join('');
      }
    }
    const badge = el('alerts-badge');
    const count = State.triggered.filter(function (a) { return a.sev === 'risk'; }).length;
    if (badge) {
      badge.hidden = count === 0;
      badge.textContent = String(State.triggered.length);
    }
    this.maybeNotify(State.triggered);
  },

  /* Notifications navigateur (une fois par alerte et par 3 h) */
  maybeNotify: function (alerts) {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const now = Date.now();
    alerts.forEach(function (a) {
      if (!a.notify && a.src === 'rule' && a.notify !== true) return;
      const key = a.title;
      if (this.lastNotified[key] && (now - this.lastNotified[key]) < 3 * 3600 * 1000) return;
      this.lastNotified[key] = now;
      try {
        new Notification('AgriMétéo Pro — ' + (State.weather ? State.weather.city.name : ''), {
          body: a.title + ' : ' + a.body, tag: key, icon: undefined
        });
      } catch (e) { /* certains navigateurs exigent un service worker */ }
    }, this);
  },

  /* ------------------ Rendu des règles ------------------ */
  renderRules: function () {
    const list = el('alert-rules');
    if (!list) return;
    if (!State.alertRules.length) {
      list.innerHTML = '<li class="muted">Aucune règle personnalisée. Créez-en une ci-dessus.</li>';
      return;
    }
    list.innerHTML = State.alertRules.map(function (r) {
      const city = cityById(r.city_id);
      return '<li>' +
        '<div><span class="rname">' + esc(r.name) + (r.active === false ? ' <span class="pill pill--ghost">inactive</span>' : '') + '</span>' +
        '<small>' + esc(city ? city.name : 'toutes les villes') + ' · ' + esc(METRIC_LABELS[r.metric] || r.metric) + ' ' + esc(r.operator) + ' ' + esc(r.threshold) +
        ' sur ' + (r.window_hours || 24) + ' h' + (r.notify_browser ? ' · notification' : '') + '</small>' +
        (r.message ? '<small>' + esc(r.message) + '</small>' : '') + '</div>' +
        '<span class="ractions">' +
        '<button class="iconbtn" type="button" data-rule-toggle="' + attr(r.id) + '" aria-label="Activer ou désactiver la règle"><i class="fa-solid ' +
        (r.active === false ? 'fa-toggle-off' : 'fa-toggle-on') + '" aria-hidden="true"></i></button>' +
        '<button class="iconbtn" type="button" data-rule-del="' + attr(r.id) + '" aria-label="Supprimer la règle"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
        '</span></li>';
    }).join('');
  },

  fillAlertCitySelect: function () {
    const sel = el('alert-city');
    if (!sel) return;
    sel.innerHTML = State.cities.map(function (c) {
      return '<option value="' + attr(c.id) + '"' + (c.id === State.activeCityId ? ' selected' : '') + '>' + esc(c.name) + '</option>';
    }).join('');
  }
};
