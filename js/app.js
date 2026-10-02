/* =====================================================================
   app.js — Chef d'orchestre : navigation, modales, formulaires,
   initialisation et câblage de tous les modules.
   ===================================================================== */
'use strict';

/* ------------------ Navigation ------------------ */
const App = {
  go: function (view) {
    const target = el('view-' + view);
    if (!target) return;
    qsa('.view').forEach(function (v) { v.classList.remove('is-active'); });
    target.classList.add('is-active');
    State.view = view;
    document.body.className = document.body.className.replace(/view-\S+/g, '').trim() + ' view-' + view;

    qsa('.navbtn').forEach(function (b) { b.classList.toggle('is-active', b.dataset.view === view); });
    qsa('.tabbar__btn').forEach(function (b) { b.classList.toggle('is-active', b.dataset.view === view); });

    const url = new URL(window.location.href);
    url.searchParams.set('vue', view);
    history.replaceState(null, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });

    /* Chargements paresseux par vue */
    if (view === 'news' && !News.liveLoaded) News.loadLive();
    if (view === 'cultures') { Culture.renderCatalog(); Culture.renderPlots(); Culture.renderJournal(); }
    if (view === 'videos') VideoView.renderGrid();
    if (view === 'advice') Agri.evaluate();
  }
};

/* ------------------ Modales ------------------ */
function openModal(id) {
  const m = el(id);
  if (!m) return;
  m.hidden = false;
  document.body.style.overflow = 'hidden';
  const focusable = qs('input,select,textarea,button', qs('.modal__body', m) || m);
  if (focusable && window.innerWidth > 700) setTimeout(function () { focusable.focus(); }, 60);
}
function closeModal(m) {
  if (typeof m === 'string') m = el(m);
  if (!m) return;
  m.hidden = true;
  const chatOpen = el('chat-panel') && !el('chat-panel').hidden;
  if (!qsa('.modal:not([hidden])').length && !chatOpen) document.body.style.overflow = '';
}
function closeAllModals() {
  qsa('.modal').forEach(function (m) { m.hidden = true; });
  document.body.style.overflow = '';
}

function setupMenuToggle() {
  const burger = el('menu-toggle');
  const sidebar = el('sidebar');
  if (!burger || !sidebar) return;

  qsa('.navbtn, .tabbar__btn').forEach(function (button) {
    button.addEventListener('click', function () { App.go(button.dataset.view); });
  });

  function setOpen(open) {
    sidebar.classList.toggle('is-open', open);
    sidebar.classList.toggle('is-closed', !open);
    document.body.classList.toggle('sidebar-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  }

  const desktopLayout = window.matchMedia('(min-width: 1024px)');
  setOpen(desktopLayout.matches);
  let desktop = desktopLayout.matches;
  function syncSidebarToLayout() {
    const nextDesktop = desktopLayout.matches;
    if (nextDesktop === desktop) return;
    desktop = nextDesktop;
    setOpen(nextDesktop);
  }
  desktopLayout.addEventListener('change', syncSidebarToLayout);
  window.addEventListener('resize', syncSidebarToLayout);
  burger.addEventListener('click', function () {
    setOpen(!sidebar.classList.contains('is-open'));
  });
  sidebar.addEventListener('click', function (e) {
    if (e.target.closest('.navbtn')) setOpen(false);
  });
  document.addEventListener('click', function (e) {
    if (sidebar.classList.contains('is-open') && !e.target.closest('#sidebar, #menu-toggle')) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sidebar.classList.contains('is-open')) setOpen(false);
  });
}

/* ------------------ Démarrage ------------------ */
async function boot() {
  setupMenuToggle();
  Charts.defaults();

  /* Restauration locale immédiate (rendu instantané) */
  ['cities', 'plots', 'journal', 'alertRules', 'customCrops', 'newsLocal'].forEach(function (k) {
    if (State[k] && !State[k].length) {
      const ls = lsGet(k, null);
      if (ls && ls.length) State[k] = ls;
    }
  });

  try {
    await loadAll();
  } catch (e) {
    console.warn('Chargement des tables:', e.message);
    State.localOnly = true;
  }

  applyBodyPrefs();
  renderCityStrip();
  Culture.fillFilters();
  Culture.fillPlotSelects();
  Agri.fillAlertCitySelect();
  Agri.renderRules();
  Culture.renderCustomCrops();
  VideoView.init();
  News.render();
  Chatbot.init();

  if (!State.cities.length) {
    await seedDefaultCities();
  }

  const w = await loadActiveWeather();
  if (w) renderAllWeather();

  wireEvents();
  Culture.renderCatalog();
  Culture.renderPlots();
  Culture.renderJournal();

  const params = new URLSearchParams(location.search);
  const vue = params.get('vue') || (location.hash ? location.hash.replace('#', '') : '');
  if (vue && el('view-' + vue)) App.go(vue);

  /* Rafraîchissement automatique toutes les 15 minutes */
  setInterval(function () {
    Weather.load(State.activeCityId, { force: true }).then(function (x) { if (x) renderAllWeather(); }).catch(function () {});
  }, 15 * 60 * 1000);

  refreshCitySummaries();
  if (location.search) { /* évite un état incohérent */ }
}

async function seedDefaultCities() {
  /* Réseau de secours : villes du golfe de Guinée afin que l'utilisateur voie
     immédiatement quelque chose même si les tables n'existent pas encore. */
  const defaults = [
    { id: 'city-cotonou', name: 'Cotonou', country: 'Bénin', admin1: 'Littoral', latitude: 6.3654, longitude: 2.4183, timezone: 'Africa/Porto-Novo', is_primary: true, sort_order: 1, label: 'Siège principal' },
    { id: 'city-abomey-calavi', name: 'Abomey-Calavi', country: 'Bénin', admin1: 'Atlantique', latitude: 6.4489, longitude: 2.3556, timezone: 'Africa/Porto-Novo', is_primary: false, sort_order: 2, label: 'Maraîchage' },
    { id: 'city-parakou', name: 'Parakou', country: 'Bénin', admin1: 'Borgou', latitude: 9.3372, longitude: 2.6303, timezone: 'Africa/Porto-Novo', is_primary: false, sort_order: 3, label: 'Zone cotonnière' }
  ];
  for (const c of defaults) {
    try { await saveRow('cities', 'cities', c); } catch (e) { State.cities.push(c); }
  }
  State.cities.sort(function (a, b) { return (a.sort_order || 99) - (b.sort_order || 99); });
  State.activeCityId = State.activeCityId || defaults[0].id;
  lsSet('citiesSeed', defaults);
  renderCityStrip();
}

async function loadActiveWeather() {
  const city = activeCity();
  if (!city) { toast('Aucune ville', 'Ajoutez une ville pour afficher la météo.', 'warn'); return null; }
  const refreshBtn = el('btn-refresh');
  if (refreshBtn) refreshBtn.classList.add('is-spin');
  try {
    const w = await Weather.load(city.id, { force: true });
    return w;
  } catch (e) {
    toast('Météo indisponible', 'Les données d\'Open-Meteo ne répondent pas : ' + e.message + '. Vérifiez la connexion et réessayez.', 'risk', 8000);
    return null;
  } finally {
    if (refreshBtn) refreshBtn.classList.remove('is-spin');
  }
}

function applyBodyPrefs() {
  document.body.classList.toggle('compact', !!State.prefs.compact);
  applyTheme(State.weather);
  const sf = el('settings-form');
  if (sf) {
    sf.theme_mode.value = State.prefs.theme_mode || 'auto';
    sf.units.value = State.prefs.units || 'metric';
    sf.voice_reply.checked = !!State.prefs.voice_reply;
    sf.compact.checked = !!State.prefs.compact;
  }
}

/* ------------------ Câblage des événements ------------------ */
function wireEvents() {
  /* Thème */
  el('btn-theme').addEventListener('click', function () {
    savePref('theme_mode', decideAutoTheme(State.weather) === 'night' ? 'day' : 'night');
    applyBodyPrefs();
    applyTheme(State.weather);
    toast('Thème', 'Mode ' + (State.prefs.theme_mode === 'night' ? 'nuit' : 'jour') + ' appliqué. Retrouvez « Automatique » dans les Réglages.', 'info');
  });

  /* Actualiser */
  el('btn-refresh').addEventListener('click', async function () {
    Weather.cache = {};
    const w = await loadActiveWeather();
    if (w) renderAllWeather();
    toast('Données actualisées', 'Prévisions et conseils ont été recalculés.', 'ok');
  });

  /* Sélecteur de ville */
  el('open-citypicker').addEventListener('click', function () {
    renderCityManager();
    openModal('modal-citypicker');
  });
  const geoForm = qs('#modal-citypicker .field--inline');
  geoForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const q = el('geo-search').value.trim();
    if (q.length < 2) { toast('Recherche trop courte', 'Saisissez au moins 2 caractères.', 'warn'); return; }
    const box = el('geo-results');
    box.innerHTML = '<div class="skeleton" style="height:40px;"></div><div class="skeleton" style="height:40px;margin-top:.3rem;"></div>';
    try {
      const res = await geocode(q);
      if (!res.length) { box.innerHTML = '<p class="muted">Aucune ville trouvée pour « ' + esc(q) + ' ».</p>'; return; }
      box.innerHTML = res.map(function (c, i) {
        return '<button type="button" data-geo="' + i + '">' + esc(c.name) +
          '<span>' + esc((c.admin1 ? c.admin1 + ', ' : '') + c.country) + '</span></button>';
      }).join('');
      qsa('button', box).forEach(function (b) {
        b.addEventListener('click', async function () {
          const c = res[Number(b.dataset.geo)];
          await addCity(c);
          box.innerHTML = '';
          el('geo-search').value = '';
          closeModal('modal-citypicker');
          await selectCity(c.id);
        });
      });
    } catch (err) {
      box.innerHTML = '<p class="muted">La recherche de villes est indisponible (' + esc(err.message) + '). Réessayez dans un instant.</p>';
    }
  });
  el('geo-locate').addEventListener('click', function () {
    if (!navigator.geolocation) { toast('Non disponible', 'Votre navigateur ne propose pas la géolocalisation.', 'warn'); return; }
    toast('Localisation', 'Recherche de votre position…', 'info');
    navigator.geolocation.getCurrentPosition(async function (pos) {
      const c = {
        id: uid('city'), name: 'Ma position', country: '', admin1: 'Position GPS',
        latitude: Math.round(pos.coords.latitude * 10000) / 10000,
        longitude: Math.round(pos.coords.longitude * 10000) / 10000,
        timezone: 'auto', label: 'GPS'
      };
      await addCity(c);
      closeModal('modal-citypicker');
      await selectCity(c.id);
    }, function () {
      toast('Localisation refusée', 'Autorisez la géolocalisation dans votre navigateur, ou recherchez votre ville par son nom.', 'warn');
    }, { enableHighAccuracy: false, timeout: 9000 });
  });
  el('city-manager').addEventListener('click', async function (e) {
    const li = e.target.closest('li[data-city]');
    if (!li) return;
    const id = li.dataset.city;
    const act = e.target.closest('button');
    if (!act) return;
    if (act.dataset.act === 'del') { await removeCity(id); return; }
    if (act.dataset.act === 'primary') {
      State.cities.forEach(function (c) { c.is_primary = c.id === id; });
      for (const c of State.cities) { try { await apiUpdate('cities', c.id, c); } catch (err) {} }
      renderCityStrip(); renderCityManager();
      toast('Ville principale', 'La ville principale a été mise à jour.', 'ok');
    }
  });

  /* Alertes */
  el('open-alerts').addEventListener('click', function () {
    Agri.fillAlertCitySelect();
    Agri.renderRules();
    openModal('modal-alerts');
  });
  el('alert-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const f = e.target;
    const rule = {
      id: uid('rule'), name: f.name.value.trim(), city_id: f.city_id.value,
      metric: f.metric.value, operator: f.operator.value,
      threshold: Number(f.threshold.value), window_hours: Number(f.window_hours.value),
      message: f.message.value.trim(), active: true, notify_browser: f.notify_browser.checked
    };
    if (!rule.name) { toast('Nom requis', 'Donnez un nom à votre règle.', 'warn'); return; }
    await saveRow('alert_rules', 'alertRules', rule);
    f.reset();
    f.threshold.value = 30;
    f.window_hours.value = 24;
    Agri.renderRules();
    Agri.evaluate();
    toast('Règle créée', '« ' + rule.name + ' » sera évaluée à chaque actualisation.', 'ok');
  });
  el('alert-rules').addEventListener('click', async function (e) {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.ruleDel) {
      await removeRow('alert_rules', 'alertRules', t.dataset.ruleDel);
      Agri.renderRules(); Agri.evaluate();
      toast('Règle supprimée', 'La règle a été retirée.', 'info');
    }
    if (t.dataset.ruleToggle) {
      const r = State.alertRules.filter(function (x) { return x.id === t.dataset.ruleToggle; })[0];
      if (!r) return;
      r.active = r.active === false;
      await saveRow('alert_rules', 'alertRules', r);
      Agri.renderRules(); Agri.evaluate();
    }
  });
  el('btn-enable-notif').addEventListener('click', async function () {
    if (typeof Notification === 'undefined') { toast('Non disponible', 'Ce navigateur ne supporte pas les notifications.', 'warn'); return; }
    const p = await Notification.requestPermission();
    if (p === 'granted') {
      toast('Notifications activées', 'Vous recevrez les alertes même lorsque l\'onglet est en arrière-plan.', 'ok');
      savePref('notify_permission', 'granted');
    } else {
      toast('Notifications refusées', 'Vous pouvez les autoriser plus tard dans les réglages du navigateur.', 'warn');
    }
  });

  /* Parcelles */
  el('btn-new-plot').addEventListener('click', function () { Culture.openPlot(null); });
  el('btn-new-plot-2').addEventListener('click', function () { Culture.openPlot(null); });
  el('plot-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const f = e.target;
    const cropSel = el('plot-crop');
    const cropId = f.crop_id.value;
    const crop = cropById(cropId);
    const row = {
      id: f.id.value || undefined,
      name: f.name.value.trim(),
      city_id: f.city_id.value,
      crop_id: cropId,
      crop_name: crop ? crop.name : '',
      surface: Number(f.surface.value) || 0,
      soil: f.soil.value,
      irrigation: f.irrigation.value,
      planting_date: f.planting_date.value || null,
      stage: f.stage.value.trim(),
      notes: f.notes.value.trim()
    };
    if (!row.name) { toast('Nom requis', 'Nommez votre parcelle.', 'warn'); return; }
    await saveRow('plots', 'plots', row);
    closeModal('modal-plot');
    Culture.renderPlots(); Culture.renderJournal(); Agri.evaluate();
    toast('Parcelle enregistrée', '« ' + row.name + ' » est maintenant suivie avec ' + (crop ? crop.name : 'sa culture') + '.', 'ok');
  });

  /* Journal */
  el('btn-new-entry').addEventListener('click', function () {
    if (!State.plots.length) { toast('Aucune parcelle', 'Créez d\'abord une parcelle.', 'warn'); App.go('cultures'); return; }
    Culture.openJournal(null, null);
  });
  el('journal-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const f = e.target;
    const row = {
      id: f.id.value || undefined,
      plot_id: f.plot_id.value,
      date: f.date.value,
      kind: f.kind.value,
      title: f.title.value.trim(),
      detail: f.detail.value.trim(),
      cost: Number(f.cost.value) || 0,
      rain_mm: Number(f.rain_mm.value) || 0
    };
    if (!row.plot_id) { toast('Parcelle requise', 'Sélectionnez une parcelle.', 'warn'); return; }
    await saveRow('journal', 'journal', row);
    closeModal('modal-journal');
    Culture.renderJournal();
    toast('Entrée enregistrée', row.title + ' — ' + shortDate(row.date), 'ok');
  });
  el('journal-plot').addEventListener('change', function () { Culture.renderJournal(); });

  /* Délégation globale pour les boutons de cartes */
  document.addEventListener('click', function (e) {
    const t = e.target;
    const nav = t.closest('[data-chat-nav]');
    if (nav) { e.preventDefault(); App.go(nav.dataset.chatNav); return; }

    const plotEdit = t.closest('[data-plot-edit]');
    if (plotEdit) { Culture.openPlot(plotEdit.dataset.plotEdit); return; }
    const plotDel = t.closest('[data-plot-del]');
    if (plotDel) {
      const p = State.plots.filter(function (x) { return x.id === plotDel.dataset.plotDel; })[0];
      if (p && confirm('Supprimer la parcelle « ' + p.name + ' » ? Le journal associé restera enregistré.')) {
        removeRow('plots', 'plots', p.id).then(function () {
          Culture.renderPlots(); Culture.renderJournal(); Agri.evaluate();
          toast('Parcelle supprimée', p.name + ' a été retirée.', 'info');
        });
      }
      return;
    }
    const pj = t.closest('[data-plot-journal]');
    if (pj) { Culture.openJournal(null, pj.dataset.plotJournal); return; }
    const pc = t.closest('[data-plot-crop]');
    if (pc) { Culture.openCrop(pc.dataset.plotCrop); return; }

    const jEdit = t.closest('[data-journal-edit]');
    if (jEdit) { Culture.openJournal(jEdit.dataset.journalEdit); return; }
    const jDel = t.closest('[data-journal-del]');
    if (jDel) {
      removeRow('journal', 'journal', jDel.dataset.journalDel).then(function () {
        Culture.renderJournal(); toast('Entrée supprimée', 'L\'entrée a été retirée du journal.', 'info');
      });
      return;
    }

    const cropCard = t.closest('[data-crop]');
    if (cropCard && !t.closest('button') && !t.closest('a') && !t.closest('select')) { Culture.openCrop(cropCard.dataset.crop); return; }
    const cropPlot = t.closest('[data-crop-plot]');
    if (cropPlot) { closeModal('modal-crop'); Culture.openPlot(null); const s = el('plot-crop'); if (s) s.value = cropPlot.dataset.cropPlot; return; }
    const cropVideo = t.closest('[data-crop-video]');
    if (cropVideo) { closeModal('modal-crop'); App.go('videos'); return; }
    const cropDel = t.closest('[data-crop-del]');
    if (cropDel) {
      const c = State.customCrops.filter(function (x) { return x.id === cropDel.dataset.cropDel; })[0];
      if (c && confirm('Supprimer votre fiche « ' + c.name + ' » ?')) {
        removeRow('custom_crops', 'customCrops', c.id).then(function () {
          Culture.renderCustomCrops(); Culture.renderCatalog();
          closeModal('modal-crop');
          toast('Fiche supprimée', c.name + ' a été retirée du catalogue.', 'info');
        });
      }
      return;
    }
    const customDel = t.closest('[data-custom-del]');
    if (customDel) {
      removeRow('custom_crops', 'customCrops', customDel.dataset.customDel).then(function () {
        Culture.renderCustomCrops(); Culture.renderCatalog();
        toast('Fiche supprimée', 'Votre culture personnalisée a été retirée.', 'info');
      });
      return;
    }
    const chatAct = t.closest('[data-chat-action]');
    if (chatAct) { Chatbot.handleAction(chatAct.dataset.chatAction); return; }
  });

  /* Fermeture des modales */
  document.addEventListener('click', function (e) {
    const closer = e.target.closest('[data-close]');
    if (closer) {
      const m = closer.closest('.modal');
      if (m) closeModal(m);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      const open = qsa('.modal:not([hidden])').slice(-1)[0];
      if (open) closeModal(open);
      else if (Chatbot.open) Chatbot.toggle(false);
    }
  });

  /* Filtres du catalogue */
  ['crop-search', 'crop-category', 'crop-water', 'crop-compat', 'crop-sort'].forEach(function (id) {
    const n = el(id);
    if (!n) return;
    const handler = function () { Culture.page = 1; Culture.renderCatalog(); };
    n.addEventListener('input', debounce(handler, 260));
    n.addEventListener('change', handler);
  });
  el('crop-pager').addEventListener('click', function (e) {
    const b = e.target.closest('button[data-page]');
    if (!b || b.disabled) return;
    Culture.page = Number(b.dataset.page);
    Culture.renderCatalog();
    el('crop-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  el('btn-add-crop').addEventListener('click', function () { Culture.openCustomCrop(); });
  el('crop-detail').addEventListener('submit', async function (e) {
    if (e.target.id !== 'custom-crop-form') return;
    e.preventDefault();
    const f = e.target;
    const calTxt = (f.calendar.value || '').replace(/[^0-9,]/g, '');
    const row = {
      id: uid('custom'),
      name: f.name.value.trim(),
      category: f.category.value,
      cycle_days: Number(f.cycle_days.value) || 90,
      temp_min: Number(f.temp_min.value), temp_max: Number(f.temp_max.value),
      temp_opt_min: Number(f.temp_opt_min.value), temp_opt_max: Number(f.temp_opt_max.value),
      rain_min: Number(f.rain_min.value), rain_max: Number(f.rain_max.value),
      water_need: f.water_need.value,
      ph_min: Number(f.ph_min.value), ph_max: Number(f.ph_max.value),
      spacing: f.spacing.value.trim(), seed_rate: '', yield_range: f.yield_range.value.trim(),
      calendar: calTxt ? calTxt.split(',').map(function (x) { return clamp(Number(x), 1, 12); }).filter(function (x) { return x >= 1; }) : [new Date().getMonth() + 1],
      soils: ['limono-sableux', 'limoneux'], zones: [],
      pests: [], notes: f.notes.value.trim()
    };
    if (!row.name) { toast('Nom requis', 'Indiquez le nom de la culture.', 'warn'); return; }
    await saveRow('custom_crops', 'customCrops', row);
    closeModal('modal-crop');
    Culture.renderCustomCrops(); Culture.renderCatalog(); Agri.evaluate();
    toast('Culture ajoutée', '« ' + row.name + ' » rejoint votre catalogue.', 'ok');
  });

  /* Réglages */
  el('open-settings').addEventListener('click', function () {
    applyBodyPrefs();
    Culture.fillFilters();
    Culture.renderCustomCrops();
    openModal('modal-settings');
  });
  el('settings-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const f = e.target;
    await savePref('theme_mode', f.theme_mode.value);
    await savePref('units', f.units.value);
    await savePref('voice_reply', f.voice_reply.checked);
    await savePref('compact', f.compact.checked);
    applyBodyPrefs();
    applyTheme(State.weather);
    renderAllWeather();
    closeModal('modal-settings');
    toast('Réglages enregistrés', 'Préférences appliquées immédiatement.', 'ok');
  });
  el('profile-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const f = e.target;
    await savePref('zone', f.zone.value);
    await savePref('main_crop', f.main_crop.value);
    Agri.evaluate();
    closeModal('modal-settings');
    toast('Profil enregistré', 'Vos conseils tiennent compte de votre zone et de votre culture principale.', 'ok');
  });
  el('btn-reset-demo').addEventListener('click', async function () {
    if (!confirm('Recharger les données de démonstration ? Vos parcelles et votre journal enregistrés ne seront pas effacés.')) return;
    Weather.cache = {};
    Weather.summaries = {};
    const w = await loadActiveWeather();
    if (w) renderAllWeather();
    Culture.renderCatalog(); Culture.renderPlots(); Culture.renderJournal();
    closeModal('modal-settings');
    toast('Données rechargées', 'Les prévisions et conseils ont été recalculés depuis les sources en ligne.', 'ok');
  });

  /* Vidéos */
  el('player-play').addEventListener('click', function () { VideoView.toggle(); });
  el('player-prev').addEventListener('click', function () { VideoView.goTo(VideoView.index - 1); });
  el('player-next').addEventListener('click', function () { VideoView.goTo(VideoView.index + 1); });
  el('player-scrub').addEventListener('input', function (e) {
    VideoView.elapsed = Number(e.target.value);
    VideoView.matchChapterToTime();
    VideoView.renderSlide();
    VideoView.updateProgress();
  });
  el('player-voice').addEventListener('click', function () {
    savePref('voice_reply', !State.prefs.voice_reply).then(function () { Chatbot.syncVoiceButton(); });
    const b = el('player-voice');
    b.setAttribute('aria-pressed', State.prefs.voice_reply ? 'true' : 'false');
    qs('i', b).className = 'fa-solid ' + (State.prefs.voice_reply ? 'fa-volume-high' : 'fa-volume-xmark');
    if (State.prefs.voice_reply && VideoView.current) VideoView.speakChapter();
    toast('Narration', State.prefs.voice_reply ? 'La narration vocale est activée.' : 'La narration vocale est désactivée.', 'info');
  });
  el('player-full').addEventListener('click', function () {
    const stage = el('player-stage');
    if (stage.requestFullscreen) stage.requestFullscreen();
    else if (stage.webkitRequestFullscreen) stage.webkitRequestFullscreen();
  });
  el('player-transcript').addEventListener('click', function () { VideoView.showTranscript(); });
  el('player-print').addEventListener('click', function () { VideoView.print(); });

  /* Actus */
  el('news-source').addEventListener('change', function () {
    if (el('news-source').value !== 'local' && !News.liveLoaded) News.loadLive();
    News.render();
  });
  el('news-search').addEventListener('input', debounce(function () { News.render(); }, 240));
  el('news-refresh').addEventListener('click', function () { News.loadLive(true).then(function () { News.render(); News.renderLiveFeed(); }); });

  /* Chatbot */
  el('chat-launcher').addEventListener('click', function () { Chatbot.toggle(); });
  el('chat-close').addEventListener('click', function () { Chatbot.toggle(false); });
  el('chat-clear').addEventListener('click', function () { Chatbot.clear(); });
  el('chat-voice-toggle').addEventListener('click', function () { Chatbot.toggleVoice(); });
  el('chat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    Chatbot.ask(el('chat-input').value);
  });
  const ci = el('chat-input');
  ci.addEventListener('input', function () {
    ci.style.height = 'auto';
    ci.style.height = Math.min(110, ci.scrollHeight) + 'px';
  });
  ci.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); Chatbot.ask(ci.value); }
  });

  /* Liste 10 jours : dépliage */
  el('daylist').addEventListener('click', function (e) {
    const row = e.target.closest('.dayrow');
    if (row) toggleDayRow(row);
  });
  el('daylist').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = e.target.closest('.dayrow');
    if (row) { e.preventDefault(); toggleDayRow(row); }
  });

  /* Graphique horaire : changement de métrique */
  el('hourly-toggle').addEventListener('click', function (e) {
    const b = e.target.closest('.segmented__btn');
    if (!b) return;
    qsa('.segmented__btn', el('hourly-toggle')).forEach(function (x) { x.classList.toggle('is-active', x === b); });
    hourlyMetric = b.dataset.metric;
    renderHourlyChart();
  });

  /* Reconnexion réseau */
  window.addEventListener('online', function () {
    toast('Connexion rétablie', 'Actualisation des prévisions…', 'ok');
    loadActiveWeather().then(function (w) { if (w) renderAllWeather(); });
  });
  window.addEventListener('offline', function () {
    toast('Hors ligne', 'Les dernières données chargées restent consultables, y compris la bibliothèque des cultures.', 'warn');
  });
}

/* ------------------ Lancement ------------------ */
document.addEventListener('DOMContentLoaded', function () {
  boot().catch(function (e) {
    console.error('Initialisation:', e);
    toast('Erreur d\'initialisation', e.message + ' — rechargez la page.', 'risk', 9000);
  });
});
