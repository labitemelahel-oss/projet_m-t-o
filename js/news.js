/* =====================================================================
   news.js — Actualités locales (base projet) et veille internationale
   en direct (API publique ReliefWeb / OCHA, sans clé, CORS activé)
   ===================================================================== */
'use strict';

const News = {
  liveLoaded: false,
  loading: false,

  /* ------------------ Veille internationale ------------------ */
  async loadLive(force) {
    if (this.loading) return;
    if (this.liveLoaded && !force) return;
    this.loading = true;
    const grid = el('news-grid');
    if (force) toast('Veille', 'Interrogation de la plateforme ReliefWeb (OCHA)…', 'info');

    const country = (activeCity() || {}).country || 'Bénin';
    const q = country + ' flood OR drought OR rainfall OR agriculture OR harvest OR locust OR "food security"';
    const url = API.reliefweb + '?appname=agrimeteo-pro&profile=list&limit=24&sort%5B%5D=date.created%3Adesc' +
      '&query%5Bvalue%5D=' + encodeURIComponent(q) +
      '&fields%5Binclude%5D%5B%5D=title&fields%5Binclude%5D%5B%5D=date.created&fields%5Binclude%5D%5B%5D=url' +
      '&fields%5Binclude%5D%5B%5D=source.shortname&fields%5Binclude%5D%5B%5D=body&fields%5Binclude%5D%5B%5D=country.name' +
      '&fields%5Binclude%5D%5B%5D=disaster-type.name';

    try {
      const j = await getJSON(url, 18000);
      State.newsLive = (j.data || []).map(function (r) {
        const f = r.fields || {};
        return {
          id: 'live-' + r.id,
          title: f.title || 'Sans titre',
          summary: this.stripHtml((f.body || '').slice(0, 320)),
          body: f.body || '',
          source_name: (f.source && f.source[0] && (f.source[0].shortname || f.source[0].name)) || 'ReliefWeb',
          source_url: f.url || '',
          published_at: (f.date && f.date.created) || null,
          category: (f['disaster-type'] && f['disaster-type'][0] && f['disaster-type'][0].name) || 'Veille climatique',
          country: (f.country && f.country[0] && f.country[0].name) || '',
          live: true
        };
      }, this);
      this.liveLoaded = true;
      this.render();
      this.renderLiveFeed();
    } catch (e) {
      State.newsLive = [];
      this.liveLoaded = false;
      const sourceSel = el('news-source');
      if (sourceSel && sourceSel.value === 'reliefweb') {
        if (grid) grid.innerHTML = '<div class="empty">La veille internationale n\'est pas joignable depuis votre réseau (API publique OCHA/ReliefWeb). ' +
          'Les actualités locales restent disponibles ; réessayez avec « Rafraîchir ».</div>';
      }
    } finally {
      this.loading = false;
    }
  },

  stripHtml: function (s) {
    return String(s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  },

  /* ------------------ Rendu ------------------ */
  render: function () {
    const grid = el('news-grid');
    if (!grid) return;
    const source = el('news-source') ? el('news-source').value : 'all';
    const q = normalizeText(el('news-search') ? el('news-search').value : '');

    const local = State.newsLocal.map(function (n) { return Object.assign({}, n, { live: false }); });
    let all = source === 'local' ? local : source === 'reliefweb' ? State.newsLive : local.concat(State.newsLive);

    all.sort(function (a, b) {
      if (a.pinned && !b.pinned) return -1;
      if (b.pinned && !a.pinned) return 1;
      return String(b.published_at || '').localeCompare(String(a.published_at || ''));
    });

    if (q) {
      all = all.filter(function (n) {
        return normalizeText(n.title + ' ' + (n.summary || '') + ' ' + (n.category || '') + ' ' + (n.source_name || '')).indexOf(q) >= 0;
      });
    }

    if (!all.length) {
      grid.innerHTML = '<div class="empty">Aucune actualité pour ce filtre.' +
        (source === 'reliefweb' && !this.liveLoaded ? ' La veille internationale n\'a pas encore chargé : utilisez « Rafraîchir ».' : '') + '</div>';
      return;
    }

    grid.innerHTML = all.slice(0, 45).map(function (n) {
      const img = n.image_url ? '<img class="newscard__img" src="' + attr(n.image_url) + '" alt="" loading="lazy">' : '';
      const date = n.published_at ? dateTimeFR(n.published_at) : 'date inconnue';
      const sev = /inondation|flood|sécheresse|drought|orage|storm|cyclone|locust|criquet/i.test(n.title + ' ' + n.category)
        ? 'pill--risk' : /pluie|rain|récolte|harvest|agriculture/i.test(n.title + ' ' + n.category) ? 'pill--warn' : '';
      return '<article class="newscard"' + (n.pinned ? ' style="border-color:var(--accent-2);"' : '') + '>' +
        img +
        '<div class="newscard__body">' +
        '<div class="newscard__meta">' +
        '<span class="pill ' + sev + '">' + esc(n.category || 'Info') + '</span>' +
        (n.live ? '<span class="pill pill--ghost"><i class="fa-solid fa-tower-broadcast" aria-hidden="true"></i> direct</span>' : '<span class="pill pill--ghost">rédaction</span>') +
        '<span>' + esc(date) + '</span>' +
        '</div>' +
        '<h3 class="newscard__title">' + esc(n.title) + '</h3>' +
        '<p class="newscard__sum">' + esc((n.summary || this.stripHtml(n.body || '')).slice(0, 260)) + ((n.summary || n.body || '').length > 260 ? '…' : '') + '</p>' +
        '<div class="newscard__foot">' +
        '<span class="muted">' + esc(n.source_name || 'Source') + (n.country ? ' · ' + esc(n.country) : '') + '</span>' +
        (n.source_url ? '<a class="btn btn--sm btn--ghost" href="' + attr(n.source_url) + '" target="_blank" rel="noopener noreferrer">Lire <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i></a>' : '') +
        '</div></div></article>';
    }, this).join('');
  },

  renderLiveFeed: function () {
    const feed = el('live-feed');
    if (!feed) return;
    const events = State.newsLive.slice(0, 12);
    const autos = State.triggered || [];
    let html = autos.slice(0, 5).map(function (a) {
      return '<li><span class="livefeed__dot"></span><div><div class="livefeed__title">' + esc(a.title) + '</div>' +
        '<div class="livefeed__meta">Surveillance agro-climatique · ' + esc(a.body) + '</div></div></li>';
    }).join('');
    html += events.map(function (e) {
      const sev = /inondation|flood|sécheresse|drought|cyclone|storm/i.test(e.title + ' ' + e.category);
      return '<li><span class="livefeed__dot" style="' + (sev ? '' : 'background:var(--accent-2);animation:none;') + '"></span>' +
        '<div><div class="livefeed__title">' + esc(e.title) + '</div>' +
        '<div class="livefeed__meta">' + esc(e.country || 'International') + ' · ' + esc(e.category) + ' · ' + esc(e.source_name) +
        (e.source_url ? ' · <a href="' + attr(e.source_url) + '" target="_blank" rel="noopener noreferrer">source</a>' : '') + '</div></div></li>';
    }).join('');
    if (!html) html = '<li><span class="livefeed__dot" style="background:var(--accent-2);animation:none;"></span><div><div class="livefeed__title">Aucun événement en cours</div><div class="livefeed__meta">La veille se met à jour automatiquement à l\'ouverture de cet onglet.</div></div></li>';
    feed.innerHTML = html;
  }
};
