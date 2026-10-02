/* =====================================================================
   chatbot.js — Assistant conversationnel AgriBot
   100 % côté client : moteur de règles + base de connaissances + contexte
   météo/cultures/vidéos du site. Réponses vocales via synthèse vocale.
   ===================================================================== */
'use strict';

const Chatbot = {
  open: false,
  voice: false,
  history: [],

  init: function () {
    const log = el('chat-log');
    if (log && !log.children.length) this.greet();
    this.voice = !!State.prefs.voice_reply;
    this.syncVoiceButton();
    this.refreshQuick();
  },

  toggle: function (force) {
    this.open = force === undefined ? !this.open : force;
    const panel = el('chat-panel'), launcher = el('chat-launcher');
    panel.hidden = !this.open;
    if (this.open) {
      launcher.style.transform = 'scale(.92)';
      setTimeout(function () { launcher.style.transform = ''; }, 180);
      const input = el('chat-input');
      if (input && window.innerWidth > 900) input.focus();
      this.scrollDown();
    }
  },

  greet: function () {
    const city = activeCity();
    const w = State.weather;
    let msg = '<p>Bonjour ! Je suis <strong>AgriBot</strong>, votre assistant météo-agricole. 🌾</p>';
    if (city && w) {
      msg += '<p>Vous suivez actuellement <strong>' + esc(city.name) + '</strong> : ' + tempShort(w.current.temp) + ', ' + esc(w.current.codeText) + '. ' +
        'Pluie max sur 24 h : <strong>' + Math.max.apply(null, w.next48.slice(0, 25).map(function (h) { return h.rainProb || 0; })) + ' %</strong>. ' +
        'Cumul attendu 3 jours : <strong>' + round1(sumOf(w.daily.slice(0, 3), function (d) { return d.rain; })) + ' mm</strong>.</p>';
    }
    msg += '<p>Je peux répondre à vos questions sur l\'usage du site, la météo, plus de 90 cultures, l\'élevage, la pisciculture, le sol et la protection des cultures. ' +
      'Dites-moi simplement ce dont vous avez besoin.</p>';
    this.push('bot', msg, [
      { label: 'Que faire aujourd\'hui ?', q: 'Que faire aujourd\'hui au champ ?' },
      { label: 'Comment ajouter une parcelle ?', q: 'Comment ajouter une parcelle ?' },
      { label: 'Puis-je traiter ?', q: 'Puis-je traiter demain matin ?' }
    ]);
  },

  push: function (who, html, actions) {
    const log = el('chat-log');
    if (!log) return;
    const wrap = make('div', 'msg msg--' + (who === 'user' ? 'user' : 'bot'));
    wrap.innerHTML = '<span class="msg__avatar" aria-hidden="true"><i class="fa-solid ' + (who === 'user' ? 'fa-user' : 'fa-robot') + '"></i></span>' +
      '<div class="msg__bubble">' + html + '</div>';
    if (actions && actions.length) {
      const bar = make('div', 'msg__actions');
      actions.forEach(function (a) {
        const b = make('button', '', esc(a.label));
        b.type = 'button';
        if (a.view) b.addEventListener('click', function () { App.go(a.view); });
        else if (a.q) b.addEventListener('click', function () { Chatbot.ask(a.q); });
        else if (a.action) b.addEventListener('click', function () { Chatbot.runAction(a.action); });
        bar.appendChild(b);
      });
      const bubble = qs('.msg__bubble', wrap);
      bubble.appendChild(bar);
    }
    log.appendChild(wrap);
    this.scrollDown();
    this.history.push({ who: who, text: html });
    if (this.history.length > 60) this.history.shift();
  },

  typing: function (on) {
    const log = el('chat-log');
    if (!log) return;
    let t = el('chat-typing');
    if (on) {
      if (t) return;
      t = make('div', 'msg msg--bot');
      t.id = 'chat-typing';
      t.innerHTML = '<span class="msg__avatar" aria-hidden="true"><i class="fa-solid fa-robot"></i></span>' +
        '<div class="msg__bubble"><span class="typing"><i></i><i></i><i></i></span></div>';
      log.appendChild(t);
      this.scrollDown();
    } else if (t) t.remove();
  },

  scrollDown: function () {
    const log = el('chat-log');
    if (log) log.scrollTop = log.scrollHeight;
  },

  clear: function () {
    const log = el('chat-log');
    if (log) log.innerHTML = '';
    this.greet();
  },

  say: function (html, actions) {
    this.push('bot', html, actions);
    if (this.voice) this.speak(html);
  },

  /* ------------------ Question ------------------ */
  ask: function (question) {
    question = String(question || '').trim();
    if (!question) return;
    this.push('user', esc(question));
    const input = el('chat-input');
    if (input) { input.value = ''; input.style.height = 'auto'; }
    this.typing(true);
    const self = this;
    setTimeout(function () {
      self.typing(false);
      self.answer(question);
    }, 420 + Math.random() * 380);
  },

  answer: function (question) {
    const q = normalizeText(question);

    /* 1. Intentions dynamiques */
    const intent = matchIntent(question);
    if (intent && intent.dynamic) {
      const res = this.dynamic(intent.dynamic, question);
      if (res) { this.say(res.html, res.actions); return; }
    }

    /* 2. Base de connaissances */
    const kb = matchKB(question);
    if (kb) {
      this.say(kb.entry.answer + '<p style="margin-top:.5rem;"><i class="fa-solid fa-lightbulb" aria-hidden="true"></i> <em>' + esc(kb.entry.tip) + '</em></p>',
        this.contextualActions(kb.entry));
      return;
    }

    /* 3. Recherche de culture nommée */
    const crop = this.findCrop(question);
    if (crop) { this.answerCrop(crop, question); return; }

    /* 4. Recherche de vidéo */
    const vid = this.findVideo(question);
    if (vid) {
      this.say('<p>J\'ai une <strong>fiche vidéo guidée</strong> exactement pour cette situation : « ' + esc(vid.title) + ' ».</p>' +
        '<p>' + esc(vid.summary) + '</p><p>Durée : ' + mmss(VideoDB.totalDuration(vid)) + ' · ' + vid.chapters.length + ' étapes.</p>',
        [{ label: 'Ouvrir la vidéo', view: 'videos' }, { label: 'Adapter à ma météo', q: 'Quelle vidéo pour la météo actuelle ?' }]);
      return;
    }

    /* 5. Intention simple sans contenu dynamique */
    if (intent && intent.reply) { this.say(intent.reply); return; }

    /* 6. Repli : suggestions */
    this.say('<p>Je n\'ai pas de réponse directe à « <strong>' + esc(question) + '</strong> », mais je couvre largement ces domaines :</p>' +
      '<ul><li><strong>Comment faire</strong> : consultez le <a href="#" data-chat-nav="videos">menu des vidéos guidées</a>.</li>' +
      '<li><strong>Quelle culture choisir</strong> : <a href="#" data-chat-nav="cultures">catalogue filtrable</a> avec compatibilité météo.</li>' +
      '<li><strong>Que faire aujourd\'hui</strong> : <a href="#" data-chat-nav="advice">aide à la décision</a> calculée sur vos parcelles.</li>' +
      '<li><strong>Une culture précise</strong> : cité son nom (« maïs », « tilapia », « coton ») et je détaille sa fiche.</li></ul>' +
      '<p>Essayez par exemple :</p>',
      SUGGESTED_QUESTIONS.slice(0, 4).map(function (s) { return { label: s, q: s }; }));
  },

  contextualActions: function (entry) {
    const acts = [];
    const map = {
      'site-demarrage': [{ label: 'Voir la météo', view: 'weather' }],
      'site-parcelle': [{ label: 'Ouvrir Cultures', view: 'cultures' }],
      'site-villes': [{ label: 'Choisir une ville', action: 'citypicker' }],
      'site-alertes': [{ label: 'Créer une alerte', action: 'alerts' }],
      'site-theme': [{ label: 'Ouvrir Réglages', action: 'settings' }],
      'eau-arroser': [{ label: 'Fenêtres d\'irrigation', view: 'advice' }],
      'phyto-maladies': [{ label: 'Voir les conseils', view: 'advice' }],
      'info-pluie': [{ label: 'Voir les prévisions de pluie', view: 'weather' }],
      'elevage-volaille': [{ label: 'Catalogue cultures', view: 'cultures' }],
      'elevage-pisciculture': [{ label: 'Fiche tilapia', q: 'tilapia' }]
    };
    (map[entry.id] || []).forEach(function (a) { acts.push(a); });
    acts.push({ label: 'Que faire aujourd\'hui ?', q: 'Que faire aujourd\'hui au champ ?' });
    return acts;
  },

  runAction: function (name) {
    if (name === 'citypicker') { renderCityManager(); openModal('modal-citypicker'); return; }
    if (name === 'alerts') { Agri.fillAlertCitySelect(); Agri.renderRules(); openModal('modal-alerts'); return; }
    if (name === 'settings') { openModal('modal-settings'); return; }
    this.handleAction(name);
  },

  /* ------------------ Réponses dynamiques ------------------ */
  dynamic: function (kind, question) {
    const w = State.weather;
    if (!w) return { html: '<p>Les données météo ne sont pas encore chargées. Réessayez dans quelques secondes, ou <a href="#" data-chat-nav="weather">ouvrez l\'onglet Météo</a>.</p>' };

    if (kind === 'currentWeather') {
      const c = w.current, d = w.daily[0] || {};
      return {
        html: '<p><strong>' + esc(w.city.name) + '</strong> — relevé de ' + hhmm(c.time) + ' :</p><ul>' +
          '<li>Température <strong>' + tempLabel(c.temp) + '</strong> (ressenti ' + tempShort(c.feels) + '), ' + esc(c.codeText) + '</li>' +
          '<li>Min / max du jour : ' + tempShort(d.tmin) + ' / ' + tempShort(d.tmax) + '</li>' +
          '<li>Humidité ' + num(c.humidity, 0) + ' % · point de rosée ' + tempShort(c.dew) + '</li>' +
          '<li>Vent ' + num(c.wind, 0) + ' km/h ' + windDir(c.windDir) + ' (rafales ' + num(c.gust, 0) + ' km/h)</li>' +
          '<li>Pression ' + num(c.pressure, 0) + ' hPa · nuages ' + num(c.cloud, 0) + ' %</li>' +
          '<li>Indice UV ' + round1(c.uv) + ' (' + uvLabel(c.uv).name + ') · visibilité ' + num((c.vis || 0) / 1000, 1) + ' km</li>' +
          '<li>Pluie des dernières 24 h : ' + round1(w.rain24h) + ' mm</li></ul>' +
          '<p>Sur les 3 prochains jours, ' + round1(sumOf(w.daily.slice(0, 3), function (x) { return x.rain; })) + ' mm de pluie sont attendus. ' +
          uvLabel(c.uv).advice + '</p>',
        actions: [{ label: 'Prévisions de pluie', view: 'weather' }, { label: 'Prévisions 10 jours', view: 'weather' }]
      };
    }

    if (kind === 'todayAdvice') {
      const recos = buildRecommendations(w);
      const top = recos.slice(0, 4);
      const plots = State.plots;
      let html = '<p><strong>Votre programme suggéré pour ' + esc(w.city.name) + '</strong> :</p><ol>';
      top.forEach(function (r) { html += '<li><strong>' + esc(r.title) + '</strong> — ' + esc(r.body) + '</li>'; });
      html += '</ol>';
      if (plots.length) {
        html += '<p>Sur vos parcelles :</p><ul>';
        plots.slice(0, 4).forEach(function (p) {
          const diag = plotDiagnostic(p, w);
          if (!diag) return;
          html += '<li><strong>' + esc(p.name) + '</strong> (' + esc(diag.crop.name) + ') : ' +
            (diag.irrigationMm > 0 ? 'irriguer environ ' + diag.irrigationMm + ' mm. ' : 'pas d\'irrigation urgente. ') +
            (diag.stage ? 'Stade ' + esc(diag.stage.name) + ' — ' + esc(diag.stage.key_needs) + '.' : '') + '</li>';
        });
        html += '</ul>';
      } else {
        html += '<p class="muted">Ajoutez vos parcelles pour que je personnalise ces conseils avec votre culture, votre sol et votre irrigation.</p>';
      }
      return {
        html: html,
        actions: [{ label: 'Aide à la décision', view: 'advice' }, plots.length ? { label: 'Mes parcelles', view: 'cultures' } : { label: 'Ajouter une parcelle', view: 'cultures' }]
      };
    }

    if (kind === 'videoSuggestion') {
      const sit = VideoDB.suggestSituation(w);
      const vids = VideoDB.bySituation(sit);
      const sitLabel = (VIDEO_SITUATIONS.filter(function (s) { return s.id === sit; })[0] || {}).label || sit;
      const first = vids[0];
      return {
        html: '<p>D\'après la météo actuelle à <strong>' + esc(w.city.name) + '</strong>, la situation dominante est : <strong>' + esc(sitLabel) + '</strong>.</p>' +
          (first ? '<p>Commencez par « <strong>' + esc(first.title) + '</strong> » — ' + esc(first.summary) + '</p>' : '') +
          '<p>' + vids.length + ' fiche(s) guidée(s) disponible(s) pour cette situation' +
          (vids.length > 1 ? ' : ' + vids.slice(0, 4).map(function (v) { return esc(v.title); }).join(' · ') : '') + '.</p>',
        actions: [{ label: 'Ouvrir les vidéos', view: 'videos' }]
      };
    }

    if (kind === 'cropSuggestion') {
      const month = new Date().getMonth() + 1;
      const rain10 = sumOf(w.daily, function (d) { return d.rain; });
      const all = CropDB.combined(State.customCrops);
      const sow = all.filter(function (c) { return (c.calendar || []).indexOf(month) >= 0; });
      const ok = sow.map(function (c) { return { c: c, comp: cropCompatibility(c, w) }; })
        .filter(function (x) { return x.comp.level === 'ok'; })
        .sort(function (a, b) { return b.comp.score - a.comp.score; });
      const names = ok.slice(0, 10).map(function (x) { return esc(x.c.name) + ' (' + x.comp.score + ')'; });
      const low = sow.map(function (c) { return { c: c, comp: cropCompatibility(c, w) }; })
        .filter(function (x) { return x.comp.level === 'risk'; })
        .slice(0, 5).map(function (x) { return esc(x.c.name); });
      let html = '<p>Avec ' + round1(rain10) + ' mm de pluie prévus sur 10 jours à <strong>' + esc(w.city.name) + '</strong> :</p>';
      html += names.length
        ? '<p><strong>Favorables ce mois (' + month + ')</strong> : ' + names.join(' · ') + '</p>'
        : '<p>Aucune culture du catalogue n\'a ce mois dans sa fenêtre de semis recommandée avec des conditions favorables.</p>';
      if (low.length) html += '<p><strong>À éviter maintenant</strong> (conditions hors plage de confort) : ' + low.join(' · ') + '.</p>';
      html += '<p>Rappel : n\'oubliez pas un cycle court de sécurité (niébé, ambérique, laitue, crincrin) et vérifiez la <em>pluie utile</em> de 30-40 mm avant de semer une céréale.</p>';
      return { html: html, actions: [{ label: 'Catalogue des cultures', view: 'cultures' }, { label: 'Semis : la vidéo', q: 'Comment réussir mes semis ?' }] };
    }

    return null;
  },

  /* ------------------ Recherche d'une culture ------------------ */
  findCrop: function (question) {
    const q = normalizeText(question);
    if (q.length < 3) return null;
    const all = CropDB.combined(State.customCrops);
    let best = null, bestLen = 0;
    all.forEach(function (c) {
      const n = normalizeText(c.name);
      const firstWord = n.split(' ')[0];
      if (firstWord.length >= 3 && q.indexOf(firstWord) >= 0 && firstWord.length > bestLen) { best = c; bestLen = firstWord.length; }
    });
    return best;
  },

  answerCrop: function (c, question) {
    const w = State.weather;
    const comp = w ? cropCompatibility(c, w) : null;
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    let html = '<p><strong>' + esc(c.name) + '</strong>' + (c.sci ? ' <em>(' + esc(c.sci) + ')</em>' : '') + ' — ' + esc(CATEGORY_LABELS[c.category] || c.category) + ' :</p><ul>' +
      '<li><strong>Cycle</strong> : ' + (c.cycle_days ? c.cycle_days + ' jours' : 'pérenne') + '</li>' +
      '<li><strong>Températures</strong> : supportées ' + (c.temp_min !== undefined && c.temp_min !== null ? c.temp_min + ' → ' + c.temp_max + ' °C' : '—') +
      (c.temp_opt_min !== undefined && c.temp_opt_min !== null ? ' · optimum ' + c.temp_opt_min + ' → ' + c.temp_opt_max + ' °C' : '') + '</li>' +
      '<li><strong>Eau</strong> : besoin ' + esc(WATER_LABELS[c.water_need] || '—') + ' · pluviométrie ' + round1(c.rain_min) + ' → ' + round1(c.rain_max) + ' mm/an</li>' +
      '<li><strong>Sol</strong> : ' + (c.soils || []).map(function (s) { return esc(SOIL_LABELS[s] || s); }).join(', ') + ' · pH ' + (c.ph_min !== undefined ? c.ph_min + ' → ' + c.ph_max : '—') + '</li>' +
      '<li><strong>Écartement</strong> : ' + esc(c.spacing || '—') + ' · <strong>semis</strong> : ' + esc(c.seed_rate || '—') + '</li>' +
      '<li><strong>Rendement attendu</strong> : ' + esc(c.yield_range || '—') + '</li>' +
      '<li><strong>Semis recommandés</strong> : ' + (c.calendar || []).map(function (m) { return months[m - 1]; }).join(', ') + '</li>' +
      '<li><strong>À surveiller</strong> : ' + ((c.pests || []).join(', ') || 'aucun ravageur majeur signalé') + '</li></ul>';
    if (c.notes) html += '<p>' + esc(c.notes) + '</p>';
    if (comp) {
      html += '<p><strong>Compatibilité avec la météo actuelle à ' + esc(w.city.name) + ' : ' + comp.score + '/100</strong>. ' +
        comp.reasons.map(function (r) { return esc(r.t) + ' — ' + esc(r.d); }).join(' ') + '</p>';
    }
    html += '<p><strong>Itinéraire en ' + (c.growing_stages || []).length + ' stades :</strong></p><ul>' +
      (c.growing_stages || []).map(function (s, i) { return '<li>' + (i + 1) + '. ' + esc(s.name) + (s.days ? ' (≈ j' + s.days + ')' : '') + ' : ' + esc(s.key_needs) + '</li>'; }).join('') + '</ul>';
    return this.say(html, [
      { label: 'Fiche complète', action: 'crop:' + c.id },
      { label: 'Créer une parcelle', action: 'plotcrop:' + c.id },
      { label: 'Filtres du catalogue', view: 'cultures' }
    ]);
  },

  findVideo: function (question) {
    const q = normalizeText(question);
    let best = null, bestScore = 0;
    VideoDB.all.forEach(function (v) {
      let s = 0;
      const hay = normalizeText(v.title + ' ' + v.summary + ' ' + (v.tags || []).join(' ') + ' ' + (v.chapters || []).map(function (c) { return c.title; }).join(' '));
      normalizeText(question).split(' ').filter(function (w) { return w.length > 3; }).forEach(function (w) {
        if (hay.indexOf(w) >= 0) s++;
      });
      if (s > bestScore) { bestScore = s; best = v; }
    });
    return bestScore >= 2 ? best : null;
  },

  /* ------------------ Voix ------------------ */
  syncVoiceButton: function () {
    const b = el('chat-voice-toggle');
    if (!b) return;
    b.setAttribute('aria-pressed', this.voice ? 'true' : 'false');
    qs('i', b).className = 'fa-solid ' + (this.voice ? 'fa-volume-high' : 'fa-volume-xmark');
  },
  toggleVoice: function () {
    this.voice = !this.voice;
    this.syncVoiceButton();
    savePref('voice_reply', this.voice);
    if (this.voice) {
      this.speak('Réponses vocales activées.');
      toast('Voix activée', 'AgriBot lira désormais ses réponses à voix haute.', 'ok');
    } else {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      toast('Voix désactivée', 'AgriBot répondra uniquement par écrit.', 'info');
    }
  },
  speak: function (html) {
    if (!window.speechSynthesis) return;
    const plain = String(html).replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ').trim();
    if (!plain) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(plain.slice(0, 900));
      u.lang = 'fr-FR';
      u.rate = 1.02;
      window.speechSynthesis.speak(u);
    } catch (e) { /* synthèse indisponible */ }
  },

  /* ------------------ Suggestions rapides ------------------ */
  refreshQuick: function () {
    const bar = el('chat-quick');
    if (!bar) return;
    const w = State.weather;
    const sit = w ? VideoDB.suggestSituation(w) : 'general';
    const sitLabel = (VIDEO_SITUATIONS.filter(function (s) { return s.id === sit; })[0] || {}).label || 'la météo du jour';
    const quick = [
      'Que faire aujourd\'hui ?',
      'Quelle vidéo pour ' + sitLabel + ' ?',
      'Puis-je traiter demain matin ?',
      'Que puis-je semer en ce moment ?',
      'Comment ajouter une parcelle ?'
    ];
    bar.innerHTML = quick.map(function (s) {
      return '<button type="button">' + esc(s) + '</button>';
    }).join('');
    qsa('button', bar).forEach(function (b) {
      b.addEventListener('click', function () { Chatbot.ask(b.textContent); });
    });
  },

  /* ------------------ Traitement des actions internes ------------------ */
  handleAction: function (action) {
    if (action.indexOf('crop:') === 0) { Culture.openCrop(action.slice(5)); return; }
    if (action.indexOf('plotcrop:') === 0) {
      Culture.openPlot(null);
      const sel = el('plot-crop');
      if (sel) sel.value = action.slice(9);
      return;
    }
  }
};
