/* =====================================================================
   cultures.js — Catalogue des cultures, fiches détaillées,
   parcelles et journal de culture
   ===================================================================== */
'use strict';

/* Classement par cycle : les cycles nuls ou non renseignés (cultures pérennes
   et systèmes) sont placés en fin de liste, sans confondre 0 et « absent ». */
function cycleRank(c) {
  const d = Number(c.cycle_days);
  return (isFinite(d) && d > 0) ? d : 9999;
}

const Culture = {
  page: 1,
  perPage: 24,
  filtered: [],

  /* ------------------ Catalogue ------------------ */
  allCrops: function () {
    return CropDB.combined(State.customCrops);
  },

  fillFilters: function () {
    const catSel = el('crop-category');
    if (catSel && (!catSel.options || catSel.options.length <= 1)) {
      Object.keys(CATEGORY_LABELS).forEach(function (k) {
        const o = document.createElement('option');
        o.value = k; o.textContent = CATEGORY_LABELS[k];
        catSel.appendChild(o);
      });
    }
    const zoneSel = el('profile-zone');
    if (zoneSel && (!zoneSel.options || zoneSel.options.length === 0)) {
      AGRO_ZONES.forEach(function (z) {
        const o = document.createElement('option');
        o.value = z.id; o.textContent = z.name;
        zoneSel.appendChild(o);
      });
      zoneSel.value = State.prefs.zone || 'soudano-guineenne';
    }
    const profileCrop = el('profile-crop');
    if (profileCrop && (!profileCrop.options || profileCrop.options.length === 0)) {
      const o0 = document.createElement('option');
      o0.value = ''; o0.textContent = '— Non précisée —';
      profileCrop.appendChild(o0);
      this.allCrops().forEach(function (c) {
        const o = document.createElement('option');
        o.value = c.id; o.textContent = c.name;
        profileCrop.appendChild(o);
      });
      profileCrop.value = State.prefs.main_crop || '';
    }
  },

  applyFilters: function () {
    const q = normalizeText(el('crop-search') ? el('crop-search').value : '');
    const cat = el('crop-category') ? el('crop-category').value : '';
    const water = el('crop-water') ? el('crop-water').value : '';
    const compat = el('crop-compat') ? el('crop-compat').value : '';
    const sort = el('crop-sort') ? el('crop-sort').value : 'name';
    const w = State.weather;

    let arr = this.allCrops().filter(function (c) {
      if (cat && c.category !== cat) return false;
      if (water && c.water_need !== water) return false;
      if (q) {
        const hay = normalizeText(c.name + ' ' + (c.sci || '') + ' ' + CATEGORY_LABELS[c.category] + ' ' + (c.notes || '') + ' ' + (c.pests || []).join(' '));
        if (hay.indexOf(q) < 0) return false;
      }
      return true;
    });

    if (compat && w) {
      arr = arr.filter(function (c) {
        const comp = cropCompatibility(c, w);
        return comp && comp.level === compat;
      });
    }

    if (sort === 'name') arr.sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); });
    else if (sort === 'cycle') arr.sort(function (a, b) { return cycleRank(a) - cycleRank(b); });
    else if (sort === 'rain') arr.sort(function (a, b) { return CropDB.waterRank(b.water_need) - CropDB.waterRank(a.water_need) || a.name.localeCompare(b.name, 'fr'); });

    this.filtered = arr;
    const totalPages = Math.max(1, Math.ceil(arr.length / this.perPage));
    if (this.page > totalPages) this.page = totalPages;
    return arr;
  },

  renderCatalog: function () {
    this.fillFilters();
    const arr = this.applyFilters();
    const grid = el('crop-grid');
    const countEl = el('crop-count');
    if (countEl) countEl.textContent = arr.length + ' fiche' + (arr.length > 1 ? 's' : '') +
      (State.customCrops.length ? ' (dont ' + State.customCrops.length + ' personnalisée' + (State.customCrops.length > 1 ? 's' : '') + ')' : '');

    const totalPages = Math.max(1, Math.ceil(arr.length / this.perPage));
    const start = (this.page - 1) * this.perPage;
    const page = arr.slice(start, start + this.perPage);
    const w = State.weather;

    if (!page.length) {
      grid.innerHTML = '<div class="empty">Aucune culture ne correspond à ces filtres. Essayez d\'élargir la recherche ou de changer de catégorie.</div>';
    } else {
      grid.innerHTML = page.map(function (c) {
        const comp = w ? cropCompatibility(c, w) : null;
        const badge = comp ? '<span class="pill pill--' + (comp.level === 'ok' ? 'ok' : comp.level === 'warn' ? 'warn' : 'risk') + '">Météo ' + comp.score + '/100</span>' : '';
        return '<article class="cropcard" data-crop="' + attr(c.id) + '" tabindex="0" role="button" aria-label="Ouvrir la fiche de ' + attr(c.name) + '">' +
          '<div class="cropcard__head"><div><div class="cropcard__name">' + esc(c.name) + '</div>' +
          '<div class="cropcard__sci">' + esc(c.sci || '') + '</div></div>' +
          '<span class="cropcard__cat">' + esc(CATEGORY_LABELS[c.category] || c.category) + '</span></div>' +
          '<div class="cropcard__metrics">' +
          '<div><span>Cycle</span><b>' + (c.cycle_days ? c.cycle_days + ' j' : '—') + '</b></div>' +
          '<div><span>Eau</span><b>' + esc(WATER_LABELS[c.water_need] || '—') + '</b></div>' +
          '<div><span>T° opt.</span><b>' + (c.temp_opt_min !== undefined && c.temp_opt_min !== null ? Math.round(c.temp_opt_min) + '-' + Math.round(c.temp_opt_max) + '°' : '—') + '</b></div>' +
          '</div>' +
          '<div class="cropcard__foot">' +
          '<span class="muted" style="font-size:.68rem;">' + round1(c.rain_min || 0) + '-' + round1(c.rain_max || 0) + ' mm · pH ' + (c.ph_min !== undefined ? c.ph_min + '-' + c.ph_max : '—') + '</span>' +
          badge +
          '</div>' +
          '<div class="cropcard__cal" aria-hidden="true">' +
          Array.from({ length: 12 }, function (_, i) {
            return '<i class="' + ((c.calendar || []).indexOf(i + 1) >= 0 ? 'on' : '') + '"></i>';
          }).join('') +
          '</div>' +
          '</article>';
      }).join('');
    }
    this.renderPager(totalPages);
  },

  renderPager: function (totalPages) {
    const pager = el('crop-pager');
    if (!pager) return;
    if (totalPages <= 1) { pager.innerHTML = ''; return; }
    let html = '<button type="button" data-page="' + (this.page - 1) + '"' + (this.page === 1 ? ' disabled' : '') + ' aria-label="Page précédente">‹</button>';
    const maxButtons = 7;
    let from = Math.max(1, this.page - 3), to = Math.min(totalPages, from + maxButtons - 1);
    if (to - from < maxButtons - 1) from = Math.max(1, to - maxButtons + 1);
    for (let i = from; i <= to; i++) {
      html += '<button type="button" data-page="' + i + '"' + (i === this.page ? ' class="is-active" aria-current="page"' : '') + '>' + i + '</button>';
    }
    html += '<button type="button" data-page="' + (this.page + 1) + '"' + (this.page === totalPages ? ' disabled' : '') + ' aria-label="Page suivante">›</button>';
    pager.innerHTML = html;
  },

  /* ------------------ Fiche détaillée ------------------ */
  openCrop: function (id) {
    const c = cropById(id);
    if (!c) return;
    const w = State.weather;
    const comp = w ? cropCompatibility(c, w) : null;
    const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const monthNow = new Date().getMonth() + 1;

    const box = el('crop-detail');
    box.innerHTML =
      '<div class="cropdetail__hero">' +
        '<div style="flex:1 1 280px;">' +
          '<h3 style="font-size:1.3rem;">' + esc(c.name) + (c.custom ? ' <span class="pill">personnalisée</span>' : '') + '</h3>' +
          '<p class="muted" style="font-style:italic;">' + esc(c.sci || '') + ' · ' + esc(CATEGORY_LABELS[c.category] || c.category) + '</p>' +
          '<p style="margin-top:.6rem;font-size:.88rem;line-height:1.65;">' + esc(c.notes || '') + '</p>' +
        '</div>' +
        (comp ? '<div style="flex:0 0 200px;background:var(--bg-3);border:1px solid var(--line);border-radius:var(--radius);padding:.8rem;">' +
          '<div class="indcard__label">Compatibilité météo actuelle</div>' +
          '<p style="font-size:2rem;font-weight:800;margin:.2rem 0;">' + comp.score + '<small style="font-size:.9rem;font-weight:500;color:var(--muted);">/100</small></p>' +
          '<p class="muted" style="font-size:.76rem;">Max. moy. ' + round1(comp.tmaxAvg) + ' °C · min. moy. ' + round1(comp.tminAvg) + ' °C · pluie 10 j ' + round1(comp.rainTotal) + ' mm</p>' +
          '<ul style="margin-top:.5rem;font-size:.76rem;line-height:1.5;">' + comp.reasons.map(function (r) {
            return '<li><i class="fa-solid ' + (r.lvl === 'risk' ? 'fa-circle-exclamation' : r.lvl === 'warn' ? 'fa-triangle-exclamation' : 'fa-circle-check') + '" aria-hidden="true"></i> ' + esc(r.t) + '</li>';
          }).join('') + '</ul>' +
        '</div>' : '') +
      '</div>' +

      '<dl class="cropdetail__grid">' +
        '<div><dt>Cycle</dt><dd>' + (c.cycle_days ? c.cycle_days + ' jours' : 'Pérenne / long') + '</dd></div>' +
        '<div><dt>Température supportée</dt><dd>' + (c.temp_min !== undefined && c.temp_min !== null ? c.temp_min + ' → ' + c.temp_max + ' °C' : '—') + '</dd></div>' +
        '<div><dt>Optimum thermique</dt><dd>' + (c.temp_opt_min !== undefined && c.temp_opt_min !== null ? c.temp_opt_min + ' → ' + c.temp_opt_max + ' °C' : '—') + '</dd></div>' +
        '<div><dt>Pluviométrie</dt><dd>' + round1(c.rain_min) + ' → ' + round1(c.rain_max) + ' mm/an</dd></div>' +
        '<div><dt>Besoin en eau</dt><dd>' + esc(WATER_LABELS[c.water_need] || '—') + '</dd></div>' +
        '<div><dt>pH du sol</dt><dd>' + (c.ph_min !== undefined && c.ph_min !== null ? c.ph_min + ' → ' + c.ph_max : '—') + '</dd></div>' +
        '<div><dt>Écartement</dt><dd>' + esc(c.spacing || '—') + '</dd></div>' +
        '<div><dt>Densité / semis</dt><dd>' + esc(c.seed_rate || '—') + '</dd></div>' +
        '<div><dt>Rendement attendu</dt><dd>' + esc(c.yield_range || '—') + '</dd></div>' +
        '<div><dt>Source</dt><dd style="font-weight:500;font-size:.76rem;">' + esc(c.source || '—') + '</dd></div>' +
      '</dl>' +

      '<h3 style="margin-top:1rem;"><i class="fa-solid fa-arrows-rotate" aria-hidden="true"></i> Calendrier de semis</h3>' +
      '<div class="chiprow">' + months.map(function (m, i) {
        const on = (c.calendar || []).indexOf(i + 1) >= 0;
        const now = (i + 1) === monthNow;
        return '<span class="chip' + (on ? '' : '') + '" style="' + (on ? 'background:var(--accent-soft);color:var(--accent-2);border-color:transparent;' : '') +
          (now ? 'outline:1px solid var(--accent-2);' : '') + '">' + m + '</span>';
      }).join('') + '</div>' +

      '<h3 style="margin-top:1rem;"><i class="fa-solid fa-seedling" aria-hidden="true"></i> Itinéraire technique (stades)</h3>' +
      '<div class="stagechain">' + (c.growing_stages || []).map(function (s, i) {
        return '<article class="stage"><b>' + (i + 1) + '. ' + esc(s.name) + '</b>' +
          '<small>' + (s.days ? '≈ jour ' + s.days : 'à l\'installation') + '</small>' +
          '<span><i class="fa-solid fa-circle-info" aria-hidden="true"></i> ' + esc(s.key_needs || '') + '</span></article>';
      }).join('') + '</div>' +

      '<h3 style="margin-top:1rem;"><i class="fa-solid fa-bug" aria-hidden="true"></i> Ravageurs et maladies à surveiller</h3>' +
      '<div class="chiprow">' + ((c.pests || []).length ? (c.pests || []).map(function (p) {
        return '<span class="chip chip--risk">' + esc(p) + '</span>';
      }).join('') : '<span class="chip">Aucun ravageur majeur signalé</span>') + '</div>' +

      '<h3 style="margin-top:1rem;"><i class="fa-solid fa-mountain-sun" aria-hidden="true"></i> Sols et zones recommandés</h3>' +
      '<div class="chiprow">' + (c.soils || []).map(function (s) {
        return '<span class="chip"><i class="fa-solid fa-layer-group" aria-hidden="true"></i> ' + esc(SOIL_LABELS[s] || s) + '</span>';
      }).join('') + (c.zones || []).map(function (z) {
        const zone = AGRO_ZONES.filter(function (a) { return a.id === z; })[0];
        return '<span class="chip"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ' + esc(zone ? zone.name : z) + '</span>';
      }).join('') + '</div>' +

      '<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin-top:1.1rem;">' +
        '<button class="btn btn--primary btn--sm" type="button" data-crop-plot="' + attr(c.id) + '"><i class="fa-solid fa-plus" aria-hidden="true"></i> Créer une parcelle avec cette culture</button>' +
        '<button class="btn btn--ghost btn--sm" type="button" data-crop-video="' + attr(c.category) + '"><i class="fa-solid fa-circle-play" aria-hidden="true"></i> Vidéos liées à la météo</button>' +
        (c.custom ? '<button class="btn btn--ghost btn--sm" type="button" data-crop-del="' + attr(c.id) + '"><i class="fa-solid fa-trash" aria-hidden="true"></i> Supprimer ma fiche</button>' : '') +
        '<button class="btn btn--ghost btn--sm" type="button" data-close><i class="fa-solid fa-xmark" aria-hidden="true"></i> Fermer</button>' +
      '</div>';
    openModal('modal-crop');
  },

  /* ------------------ Parcelles ------------------ */
  fillPlotSelects: function () {
    const plotCity = el('plot-city');
    if (plotCity) {
      plotCity.innerHTML = State.cities.map(function (c) {
        return '<option value="' + attr(c.id) + '"' + (c.id === State.activeCityId ? ' selected' : '') + '>' + esc(c.name) + '</option>';
      }).join('');
    }
    const plotCrop = el('plot-crop');
    if (plotCrop) {
      const crops = this.allCrops().sort(function (a, b) { return a.name.localeCompare(b.name, 'fr'); });
      const grouped = {};
      crops.forEach(function (c) { (grouped[c.category] = grouped[c.category] || []).push(c); });
      plotCrop.innerHTML = Object.keys(CATEGORY_LABELS).filter(function (k) { return grouped[k]; }).map(function (k) {
        return '<optgroup label="' + attr(CATEGORY_LABELS[k]) + '">' + grouped[k].map(function (c) {
          return '<option value="' + attr(c.id) + '">' + esc(c.name) + '</option>';
        }).join('') + '</optgroup>';
      }).join('');
    }
    const jsel = el('journal-plot-select');
    if (jsel) {
      jsel.innerHTML = State.plots.length
        ? State.plots.map(function (p) { return '<option value="' + attr(p.id) + '">' + esc(p.name) + '</option>'; }).join('')
        : '<option value="">Aucune parcelle</option>';
    }
    const jfilter = el('journal-plot');
    if (jfilter) {
      const cur = jfilter.value;
      jfilter.innerHTML = '<option value="">Toutes les parcelles</option>' + State.plots.map(function (p) {
        return '<option value="' + attr(p.id) + '">' + esc(p.name) + '</option>';
      }).join('');
      jfilter.value = cur;
    }
  },

  openPlot: function (id) {
    const form = el('plot-form');
    form.reset();
    const p = id ? State.plots.filter(function (x) { return x.id === id; })[0] : null;
    this.fillPlotSelects();
    if (p) {
      form.id.value = p.id;
      form.name.value = p.name || '';
      if (p.city_id) form.city_id.value = p.city_id;
      if (p.crop_id) form.crop_id.value = p.crop_id;
      form.surface.value = p.surface || 0;
      if (p.soil) form.soil.value = p.soil;
      if (p.irrigation) form.irrigation.value = p.irrigation;
      if (p.planting_date) form.planting_date.value = String(p.planting_date).slice(0, 10);
      form.stage.value = p.stage || '';
      form.notes.value = p.notes || '';
      el('mp-title').innerHTML = '<i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> Modifier la parcelle';
    } else {
      form.id.value = '';
      form.planting_date.value = isoDate(new Date());
      el('mp-title').innerHTML = '<i class="fa-solid fa-map-location-dot" aria-hidden="true"></i> Nouvelle parcelle';
    }
    openModal('modal-plot');
  },

  renderPlots: function () {
    const grid = el('plot-grid');
    if (!grid) return;
    this.fillPlotSelects();
    if (!State.plots.length) {
      grid.innerHTML = '<div class="empty">Aucune parcelle. Ajoutez votre première parcelle pour obtenir des conseils calculés sur votre culture, votre sol et votre irrigation.</div>';
      return;
    }
    const w = State.weather;
    grid.innerHTML = State.plots.map(function (p) {
      const crop = cropById(p.crop_id);
      const city = cityById(p.city_id);
      const diag = w && crop ? plotDiagnostic(p, w) : null;
      const lvl = diag ? diag.level : 'ok';
      return '<article class="plotcard">' +
        '<div class="plotcard__head"><div><div class="plotcard__name">' + esc(p.name) + '</div>' +
        '<div class="parcelcard__sub">' + esc(crop ? crop.name : 'culture inconnue') + '</div></div>' +
        '<span class="pill pill--' + (lvl === 'ok' ? 'ok' : lvl === 'warn' ? 'warn' : 'risk') + '">' +
        (lvl === 'ok' ? 'OK' : lvl === 'warn' ? 'Vigilance' : 'Action') + '</span></div>' +
        '<div class="plotcard__tags">' +
        '<span class="tag">' + num(p.surface, 2) + ' ha</span>' +
        '<span class="tag">' + esc(SOIL_LABELS[p.soil] || 'sol ?') + '</span>' +
        '<span class="tag">' + esc(IRRIGATION_LABELS[p.irrigation] || 'pluvial') + '</span>' +
        (city ? '<span class="tag">' + esc(city.name) + '</span>' : '') +
        (p.planting_date ? '<span class="tag">semis ' + shortDate(String(p.planting_date).slice(0, 10)) + '</span>' : '') +
        '</div>' +
        (p.stage ? '<p class="muted" style="font-size:.76rem;">Stade déclaré : ' + esc(p.stage) + '</p>' : '') +
        (diag && diag.irrigationMm > 0 ? '<p class="muted" style="font-size:.78rem;color:var(--warn);"><i class="fa-solid fa-droplet" aria-hidden="true"></i> Irrigation conseillée : ' + diag.irrigationMm + ' mm</p>' : '') +
        (p.notes ? '<p class="muted" style="font-size:.76rem;">' + esc(p.notes) + '</p>' : '') +
        '<div class="parcelcard__actions">' +
        '<button class="btn btn--sm btn--ghost" type="button" data-plot-edit="' + attr(p.id) + '"><i class="fa-solid fa-pen" aria-hidden="true"></i> Modifier</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-plot-journal="' + attr(p.id) + '"><i class="fa-solid fa-plus" aria-hidden="true"></i> Journal</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-plot-crop="' + attr(p.crop_id) + '"><i class="fa-solid fa-book" aria-hidden="true"></i> Fiche</button>' +
        '<button class="btn btn--sm btn--ghost" type="button" data-plot-del="' + attr(p.id) + '" aria-label="Supprimer la parcelle"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
        '</div></article>';
    }).join('');
  },

  /* ------------------ Journal ------------------ */
  openJournal: function (id, plotId) {
    const form = el('journal-form');
    form.reset();
    this.fillPlotSelects();
    const e = id ? State.journal.filter(function (x) { return x.id === id; })[0] : null;
    form.date.value = isoDate(new Date());
    if (e) {
      form.id.value = e.id;
      form.plot_id.value = e.plot_id;
      form.date.value = String(e.date || '').slice(0, 10);
      form.kind.value = e.kind || 'observation';
      form.title.value = e.title || '';
      form.detail.value = e.detail || '';
      form.cost.value = e.cost || 0;
      form.rain_mm.value = e.rain_mm || 0;
    } else {
      form.id.value = '';
      if (plotId) form.plot_id.value = plotId;
    }
    openModal('modal-journal');
  },

  renderJournal: function () {
    const list = el('journal-list');
    const statsEl = el('journal-stats');
    if (!list) return;
    this.fillPlotSelects();
    const filter = el('journal-plot') ? el('journal-plot').value : '';
    let entries = State.journal.slice().filter(function (e) { return !filter || e.plot_id === filter; });
    entries.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });

    if (!entries.length) {
      list.innerHTML = '<li><div><span class="timeline__title">Journal vide</span>' +
        '<p class="timeline__body">Notez chaque opération (semis, intrant, arrosage, traitement, observation, récolte). En fin de campagne, vous connaîtrez votre coût de production réel et l\'effet de chaque pratique.</p></div></li>';
    } else {
      list.innerHTML = entries.slice(0, 120).map(function (e) {
        const p = State.plots.filter(function (x) { return x.id === e.plot_id; })[0];
        const k = JOURNAL_KINDS[e.kind] || JOURNAL_KINDS.autre;
        const detail = [];
        if (e.cost) detail.push(num(e.cost, 0) + ' FCFA');
        if (e.rain_mm) detail.push(round1(e.rain_mm) + ' mm de pluie');
        return '<li>' +
          '<div class="timeline__head">' +
          '<span class="timeline__title"><i class="fa-solid ' + k.icon + '" style="color:' + k.color + ';" aria-hidden="true"></i> ' + esc(e.title || k.label) + '</span>' +
          '<span class="timeline__date">' + shortDate(String(e.date).slice(0, 10)) + ' · ' + esc(k.label) + '</span>' +
          '</div>' +
          '<p class="timeline__body">' + esc(p ? p.name : 'Parcelle supprimée') + (detail.length ? ' · ' + detail.join(' · ') : '') + '</p>' +
          (e.detail ? '<p class="timeline__body">' + esc(e.detail) + '</p>' : '') +
          '<div class="timeline__foot">' +
          '<button class="btn btn--sm btn--ghost" type="button" data-journal-edit="' + attr(e.id) + '"><i class="fa-solid fa-pen" aria-hidden="true"></i> Modifier</button>' +
          '<button class="btn btn--sm btn--ghost" type="button" data-journal-del="' + attr(e.id) + '"><i class="fa-solid fa-trash" aria-hidden="true"></i></button>' +
          '</div></li>';
      }).join('');
    }

    const totalCost = entries.reduce(function (a, e) { return a + (Number(e.cost) || 0); }, 0);
    const totalRain = entries.reduce(function (a, e) { return a + (Number(e.rain_mm) || 0); }, 0);
    const counts = {};
    entries.forEach(function (e) { counts[e.kind] = (counts[e.kind] || 0) + 1; });
    statsEl.innerHTML =
      '<div class="stat"><b>' + entries.length + '</b><span>opérations</span></div>' +
      '<div class="stat"><b>' + State.plots.length + '</b><span>parcelles suivies</span></div>' +
      '<div class="stat"><b>' + num(totalCost, 0) + '</b><span>FCFA engagés</span></div>' +
      '<div class="stat"><b>' + round1(totalRain) + ' mm</b><span>pluie relevée</span></div>' +
      (counts.arrosage ? '<div class="stat"><b>' + counts.arrosage + '</b><span>arrosages</span></div>' : '') +
      (counts.traitement ? '<div class="stat"><b>' + counts.traitement + '</b><span>traitements</span></div>' : '') +
      (counts.recolte ? '<div class="stat"><b>' + counts.recolte + '</b><span>récoltes</span></div>' : '');
  },

  /* ------------------ Culture personnalisée ------------------ */
  openCustomCrop: function () {
    const box = el('crop-detail');
    box.innerHTML =
      '<p class="muted">Ajoutez une culture, un élevage ou un système que vous pratiquez : elle sera intégrée au catalogue, au filtrage et aux calculs de compatibilité météo.</p>' +
      '<form class="formgrid" id="custom-crop-form">' +
      '<label class="field"><span>Nom de la culture</span><input type="text" name="name" required placeholder="Ex : Aloe vera, Anacarde greffé…"></label>' +
      '<label class="field"><span>Catégorie</span><select name="category">' +
      Object.keys(CATEGORY_LABELS).map(function (k) { return '<option value="' + k + '">' + CATEGORY_LABELS[k] + '</option>'; }).join('') +
      '</select></label>' +
      '<label class="field"><span>Cycle (jours)</span><input type="number" name="cycle_days" min="1" value="90"></label>' +
      '<label class="field"><span>Température min. supportée (°C)</span><input type="number" name="temp_min" step="1" value="12"></label>' +
      '<label class="field"><span>Température max. supportée (°C)</span><input type="number" name="temp_max" step="1" value="36"></label>' +
      '<label class="field"><span>Optimum thermique min. (°C)</span><input type="number" name="temp_opt_min" step="1" value="20"></label>' +
      '<label class="field"><span>Optimum thermique max. (°C)</span><input type="number" name="temp_opt_max" step="1" value="30"></label>' +
      '<label class="field"><span>Pluviométrie min. (mm/an)</span><input type="number" name="rain_min" step="10" value="400"></label>' +
      '<label class="field"><span>Pluviométrie max. (mm/an)</span><input type="number" name="rain_max" step="10" value="1200"></label>' +
      '<label class="field"><span>Besoin en eau</span><select name="water_need">' +
      Object.keys(WATER_LABELS).map(function (k) { return '<option value="' + k + '">' + WATER_LABELS[k] + '</option>'; }).join('') +
      '</select></label>' +
      '<label class="field"><span>pH min.</span><input type="number" name="ph_min" step="0.1" value="5.5"></label>' +
      '<label class="field"><span>pH max.</span><input type="number" name="ph_max" step="0.1" value="7.5"></label>' +
      '<label class="field"><span>Écartement / densité</span><input type="text" name="spacing" placeholder="Ex : 80 x 40 cm"></label>' +
      '<label class="field"><span>Rendement attendu</span><input type="text" name="yield_range" placeholder="Ex : 2-4 t/ha"></label>' +
      '<label class="field field--full"><span>Mois de semis recommandés</span><input type="text" name="calendar" placeholder="Ex : 5,6,7 (numéros de mois)"></label>' +
      '<label class="field field--full"><span>Notes / itinéraire</span><textarea name="notes" rows="3" placeholder="Pratiques, intrants, ravageurs…"></textarea></label>' +
      '<button class="btn btn--primary field--full" type="submit"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Ajouter au catalogue</button>' +
      '</form>';
    openModal('modal-crop');
  },

  renderCustomCrops: function () {
    const list = el('custom-crop-list');
    if (!list) return;
    if (!State.customCrops.length) {
      list.innerHTML = '<li class="muted">Aucune culture personnalisée pour l\'instant.</li>';
      return;
    }
    list.innerHTML = State.customCrops.map(function (c) {
      return '<li><div><span class="rname">' + esc(c.name) + '</span>' +
        '<small>' + esc(CATEGORY_LABELS[c.category] || c.category) + ' · cycle ' + (c.cycle_days || '—') + ' j · eau ' + esc(WATER_LABELS[c.water_need] || '—') + '</small></div>' +
        '<span class="ractions"><button class="iconbtn" type="button" data-custom-del="' + attr(c.id) + '" aria-label="Supprimer"><i class="fa-solid fa-trash" aria-hidden="true"></i></button></span></li>';
    }).join('');
  }
};
