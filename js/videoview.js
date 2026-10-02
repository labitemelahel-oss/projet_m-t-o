/* =====================================================================
  videoview.js — Clips agricoles animés, générés à partir des chapitres.
   ===================================================================== */
'use strict';

const VideoView = {
  situation: 'all',
  current: null,
  index: 0,
  playing: false,
  elapsed: 0,
  timer: null,
  startTs: 0,

  init: function () {
    this.renderSituations();
    this.renderGrid();
    this.renderStoryboard();
  },

  renderSituations: function () {
    const bar = el('situationbar');
    if (!bar) return;
    const w = State.weather;
    const suggested = w ? VideoDB.suggestSituation(w) : 'general';
    const items = [{ id: 'all', label: 'Toutes', icon: 'fa-layer-group' }].concat(VIDEO_SITUATIONS);
    bar.innerHTML = items.map(function (s) {
      const count = s.id === 'all' ? VideoDB.all.length : VideoDB.bySituation(s.id).length;
      const isSug = s.id === suggested;
      return '<button class="sitbtn' + (VideoView.situation === s.id ? ' is-active' : '') + '" type="button" role="tab"' +
        ' data-situation="' + attr(s.id) + '" aria-selected="' + (VideoView.situation === s.id) + '">' +
        '<i class="fa-solid ' + s.icon + '" aria-hidden="true"></i> ' + esc(s.label) +
        (isSug ? ' ⚡' : '') + ' <span class="pill pill--ghost" style="padding:.05rem .3rem;">' + count + '</span></button>';
    }).join('');
    qsa('.sitbtn', bar).forEach(function (b) {
      b.addEventListener('click', function () {
        VideoView.situation = b.dataset.situation;
        VideoView.renderSituations();
        VideoView.renderGrid();
      });
    });
  },

  list: function () {
    return VideoDB.bySituation(this.situation === 'all' ? null : this.situation);
  },

  renderGrid: function () {
    const grid = el('video-grid');
    if (!grid) return;
    const vids = this.list();
    if (!vids.length) { grid.innerHTML = '<div class="empty">Aucune fiche pour cette situation.</div>'; return; }
    const w = State.weather;
    const suggested = w ? VideoDB.suggestSituation(w) : 'general';
    grid.innerHTML = vids.map(function (v) {
      const sit = VIDEO_SITUATIONS.filter(function (s) { return s.id === v.situation; })[0] || { label: v.situation, icon: 'fa-circle' };
      const isActive = VideoView.current && VideoView.current.slug === v.slug;
      return '<article class="videocard' + (isActive ? ' is-active' : '') + '" data-video="' + attr(v.slug) + '" tabindex="0" role="button" aria-label="Lire la fiche : ' + attr(v.title) + '">' +
        '<div class="videocard__thumb videocard__thumb--' + attr(v.situation) + '">' +
        '<span class="videocard__art" aria-hidden="true"><i class="fa-solid ' + (v.chapters[0].icon || sit.icon) + '"></i></span>' +
        '<span class="videocard__situation"><i class="fa-solid ' + sit.icon + '" aria-hidden="true"></i> ' + esc(sit.label) + (v.situation === suggested ? ' · recommandée' : '') + '</span>' +
        '<span class="videocard__play" aria-hidden="true"><i class="fa-solid fa-circle-play"></i></span>' +
        '</div>' +
        '<div class="videocard__body">' +
        '<span class="videocard__title">' + esc(v.title) + '</span>' +
        '<span class="videocard__meta"><span><i class="fa-solid fa-clock" aria-hidden="true"></i> ' + mmss(VideoDB.totalDuration(v)) + '</span>' +
        '<span><i class="fa-solid fa-list-ol" aria-hidden="true"></i> ' + v.chapters.length + ' étapes</span>' +
        '</span>' +
        '</div></article>';
    }).join('');
    qsa('.videocard', grid).forEach(function (card) {
      const open = function () { VideoView.load(card.dataset.video, true); };
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    });
  },

  load: function (slug, autoplay) {
    const v = VideoDB.bySlug(slug);
    if (!v) return;
    this.pause();
    this.current = v;
    this.index = 0;
    this.elapsed = 0;
    this.total = VideoDB.totalDuration(v);
    this.renderGrid();
    this.renderPlayer();
    this.renderStoryboard();
    if (autoplay) this.play();
    else this.updateProgress();
  },

  renderPlayer: function () {
    const v = this.current;
    const stage = el('player-stage');
    if (!v) return;
    GeneratedVideo.destroy();
    stage.innerHTML = '<canvas class="generated-video__canvas" id="generated-video-canvas" role="img" aria-label="Animation 3D générée : ' + attr(v.title) + '"></canvas>' +
      '<div class="player__slide" id="player-slide" aria-live="polite"></div>' +
      '<div class="player__caption" id="player-caption" hidden>' +
      '<span class="player__chapter" id="player-chapter"></span>' +
      '<span class="player__chaptername" id="player-chaptername"></span></div>';
    GeneratedVideo.mount(stage, v, this.index);
    this.renderSlide();

    el('player-title').textContent = v.title;
    el('player-summary').textContent = v.summary;
    el('player-time').textContent = mmss(0) + ' / ' + mmss(this.total);
    const scr = el('player-scrub');
    scr.max = String(Math.round(this.total));
    scr.value = '0';
  },

  renderSlide: function () {
    const v = this.current;
    const slide = el('player-slide');
    if (!v || !slide) return;
    const ch = v.chapters[this.index] || v.chapters[0];
    const sit = VIDEO_SITUATIONS.filter(function (s) { return s.id === v.situation; })[0] || { icon: 'fa-circle', label: '' };
    GeneratedVideo.setChapter(v, this.index);
    slide.innerHTML = '<div class="slidevisual">' +
      '<span class="slidevisual__icon" aria-hidden="true"><i class="fa-solid ' + (ch.icon || sit.icon) + '"></i></span>' +
      '<span class="slidevisual__text">' + esc(ch.visual || ch.title) + '</span>' +
      (ch.dos && ch.dos.length ? '<span class="slidevisual__steps">' +
        ch.dos.map(function (d) { return '<span>✔ ' + esc(d) + '</span>'; }).join('') +
        (ch.dont ? ch.dont.map(function (d) { return '<span>✘ ' + esc(d) + '</span>'; }).join('') : '') +
        '</span>' : '') +
      '</div>';
    const cap = el('player-caption');
    if (cap) {
      cap.hidden = false;
      el('player-chapter').textContent = 'Étape ' + (this.index + 1) + ' / ' + v.chapters.length;
      el('player-chaptername').textContent = ch.title;
    }
  },

  renderStoryboard: function () {
    const box = el('player-storyboard');
    if (!box) return;
    const v = this.current;
    if (!v) { box.innerHTML = ''; return; }
    box.innerHTML = v.chapters.map(function (c, i) {
      return '<button type="button" data-chapter="' + i + '" class="' + (i === VideoView.index ? 'is-current' : '') + '">' +
        '<b>' + mmss(c.at) + '</b><span>' + esc(c.title) + '</span></button>';
    }).join('');
    qsa('button', box).forEach(function (b) {
      b.addEventListener('click', function () {
        VideoView.goTo(Number(b.dataset.chapter));
      });
    });
  },

  goTo: function (i) {
    const v = this.current;
    if (!v) return;
    this.index = clamp(i, 0, v.chapters.length - 1);
    this.elapsed = v.chapters[this.index].at;
    this.renderSlide();
    this.updateProgress();
    this.renderStoryboard();
    if (this.playing) this.speakChapter();
  },

  play: function () {
    if (!this.current) return;
    this.playing = true;
    const btn = el('player-play');
    if (btn) qs('i', btn).className = 'fa-solid fa-pause';
    GeneratedVideo.play();
    this.startTs = Date.now() - this.elapsed * 1000;
    clearInterval(this.timer);
    this.timer = setInterval(function () { VideoView.tick(); }, 220);
    this.speakChapter();
  },

  pause: function () {
    this.playing = false;
    const btn = el('player-play');
    if (btn) qs('i', btn).className = 'fa-solid fa-play';
    clearInterval(this.timer);
    GeneratedVideo.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  },

  toggle: function () { this.playing ? this.pause() : this.play(); },

  tick: function () {
    this.elapsed = (Date.now() - this.startTs) / 1000;
    this.updateProgress();
    const ch = this.current.chapters[this.index];
    const nextCh = this.current.chapters[this.index + 1];
    const endOfChapter = ch.at + ch.dur;
    /* Narration calée sur la durée du chapitre */
    if (nextCh && this.elapsed >= nextCh.at) {
      this.index++;
      this.renderSlide();
      this.renderStoryboard();
      this.speakChapter();
    } else if (!nextCh && this.elapsed >= endOfChapter) {
      this.elapsed = this.current.chapters[this.current.chapters.length - 1].at + this.current.chapters[this.current.chapters.length - 1].dur;
      this.updateProgress();
      this.pause();
      toast('Fiche terminée', 'Vous avez parcouru toutes les étapes de « ' + this.current.title + ' ».', 'ok');
    }
  },

  speakChapter: function () {
    if (!this.voiceOn()) return;
    const ch = this.current.chapters[this.index];
    if (!ch) return;
    Chatbot.speak(ch.narration || ch.visual || ch.title);
  },

  voiceOn: function () { return State.prefs.voice_reply === true; },

  updateProgress: function () {
    const scr = el('player-scrub');
    const t = el('player-time');
    if (scr) scr.value = String(Math.round(this.elapsed));
    if (t) t.textContent = mmss(this.elapsed) + ' / ' + mmss(this.total || 0);
  },

  matchChapterToTime: function () {
    if (!this.current) return;
    const s = this.elapsed;
    let idx = 0;
    this.current.chapters.forEach(function (c, i) { if (s >= c.at) idx = i; });
    if (idx !== this.index) {
      this.index = idx;
      this.renderStoryboard();
    }
  },

  /* ------------------ Transcription / fiche terrain ------------------ */
  transcriptHtml: function () {
    const v = this.current;
    if (!v) return '';
    const sit = VIDEO_SITUATIONS.filter(function (s) { return s.id === v.situation; })[0] || { label: '' };
    return '<h3>' + esc(v.title) + '</h3>' +
      '<p class="muted">Situation : ' + esc(sit.label) + ' · Durée ' + mmss(VideoDB.totalDuration(v)) + ' · ' + v.chapters.length + ' étapes</p>' +
      '<p>' + esc(v.summary) + '</p>' +
      v.chapters.map(function (c, i) {
        return '<div style="margin-top:.7rem;"><strong>' + (i + 1) + '. ' + esc(c.title) + ' (' + mmss(c.at) + ')</strong>' +
          '<p>' + esc(c.narration) + '</p>' +
          (c.dos && c.dos.length ? '<p><strong>À faire :</strong> ' + c.dos.map(function (d) { return esc(d); }).join(' · ') + '</p>' : '') +
          (c.dont && c.dont.length ? '<p><strong>À éviter :</strong> ' + c.dont.map(function (d) { return esc(d); }).join(' · ') + '</p>' : '') +
          '</div>';
      }).join('');
  },

  showTranscript: function () {
    if (!this.current) { toast('Aucune fiche', 'Sélectionnez d\'abord une fiche vidéo.', 'warn'); return; }
    const stage = el('player-stage');
    this.pause();
    GeneratedVideo.destroy();
    stage.innerHTML = '<div class="player__slide"><div class="transcript">' + this.transcriptHtml() + '</div></div>';
    toast('Transcription affichée', 'Le contenu complet de la fiche est visible dans le lecteur.', 'info');
    this.playing = false;
    const btn = el('player-play');
    if (btn) qs('i', btn).className = 'fa-solid fa-play';
  },

  print: function () {
    if (!this.current) { toast('Aucune fiche', 'Sélectionnez d\'abord une fiche vidéo.', 'warn'); return; }
    this.pause();
    GeneratedVideo.destroy();
    const box = el('player-stage');
    box.innerHTML = '<div class="player__slide"><div class="transcript">' + this.transcriptHtml() + '</div></div>';
    setTimeout(function () {
      window.print();
      setTimeout(function () { VideoView.renderPlayer(); VideoView.renderSlide(); }, 400);
    }, 120);
  },
};
