// The Speech models panel: what can be downloaded, what is on the TV, and any download under way.
// Rows are kept between polls, so that the focus stays put. Plain ES5, for webOS 5 and 6.
window.ModelView = (function () {
  'use strict';
  var POLL = 1000;
  var panel = document.getElementById('panel');
  var list = document.getElementById('list');
  var space = document.getElementById('space');
  var closeButton = document.getElementById('closePanel');
  var loading = document.getElementById('loading');
  var gauges = document.getElementById('gauges');
  var diskText = document.getElementById('diskText'), diskFill = document.getElementById('diskFill');
  var memText = document.getElementById('memText'), memFill = document.getElementById('memFill');
  var BUSY_LABELS = {get: 'Starting', cancel: 'Cancelling', use: 'Switching', delete: 'Deleting'};
  var LANGUAGES = {
    bg: 'Bulgarian', hr: 'Croatian', cs: 'Czech', da: 'Danish', nl: 'Dutch', en: 'English',
    et: 'Estonian', fi: 'Finnish', fr: 'French', de: 'German', el: 'Greek', hu: 'Hungarian',
    it: 'Italian', lv: 'Latvian', lt: 'Lithuanian', mt: 'Maltese', pl: 'Polish', pt: 'Portuguese',
    ro: 'Romanian', ru: 'Russian', sk: 'Slovak', sl: 'Slovenian', es: 'Spanish', sv: 'Swedish',
    uk: 'Ukrainian'
  };
  var ctl = null, onClose = null, timer = null, waiting = false, status = null, full = true, lastState = '';
  // The button pressed, shown as busy until a full read taken after its command has come back.
  // It keeps the focus, so it is ignored rather than disabled.
  var pressed = null, finished = 0, ticket = 0;
  var items = {};
  var dismissLanguages = null;

  function el(tag, className, parent) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    parent.appendChild(e);
    return e;
  }
  function mb(bytes) { return Math.round(bytes / 1000000); }
  function act(button, command) {
    if (pressed) return;
    pressed = button;
    button.className = 'ctl busy';
    button.innerHTML = BUSY_LABELS[command.split(' ')[0]] + '<span class="dots"><i>.</i><i>.</i><i>.</i></span>';
    ctl('models ' + command, function (a) {
      if (a && a.error) status.problem = a.error;
      full = true;
      finished = ++ticket;
      poll();
    });
  }
  function label(button, text) {
    if (button !== pressed) button.textContent = text;
  }
  function allow(button, on) {
    if (button !== pressed) button.disabled = !on;
  }
  function languageTag(m, header) {
    var codes = m.languages || [];
    if (!codes.length) return null;
    var wrap = el('div', 'languages', header);
    var button = el('button', 'language-tag', wrap);
    var names = el('ul', 'language-list', wrap);
    var count = codes.length + (codes.length === 1 ? ' language' : ' languages');
    var pinned = false;
    button.type = 'button';
    button.textContent = codes.length > 3 ? count : codes.join(', ').toUpperCase();
    button.setAttribute('aria-label', 'Supported languages for ' + m.name + ', ' + count);
    button.setAttribute('aria-controls', names.id = 'languages-' + m.id);
    names.setAttribute('aria-label', 'Supported languages');
    codes.forEach(function (code) { el('li', '', names).textContent = LANGUAGES[code] || code; });

    function hide() {
      pinned = false;
      names.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      if (dismissLanguages === hide) dismissLanguages = null;
    }
    function show() {
      if (dismissLanguages && dismissLanguages !== hide) dismissLanguages();
      dismissLanguages = hide;
      names.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      var below = list.parentNode.getBoundingClientRect().bottom - button.getBoundingClientRect().bottom;
      names.className = 'language-list' + (below < names.getBoundingClientRect().height ? ' above' : '');
    }
    hide();
    wrap.addEventListener('mouseenter', show);
    wrap.addEventListener('mouseleave', function () { if (!pinned) hide(); });
    button.addEventListener('click', function () {
      if (pinned) return hide();
      button.focus();
      pinned = true;
      show();
    });
    wrap.addEventListener('focusout', function (e) { if (!wrap.contains(e.relatedTarget)) hide(); });
    button.addEventListener('keydown', function (e) {
      if (names.hidden) return;
      if (e.keyCode === 27 || e.keyCode === 461) hide();
      else if (pinned && (e.keyCode === 38 || e.keyCode === 40) && names.scrollHeight > names.clientHeight) {
        names.scrollTop += e.keyCode === 38 ? -30 : 30;
      } else return;
      e.preventDefault();
      e.stopPropagation();
    });
    return button;
  }
  function item(m) {
    if (items[m.id]) return items[m.id];
    var row = el('div', 'model', list), it = {row: row};
    var header = el('div', 'model-heading', row);
    var title = el('h2', '', header);
    title.textContent = m.name;
    if (m.recommended) el('span', 'tag', title).textContent = 'Recommended';
    it.language = languageTag(m, header);
    var memory = m.headroomMB ? m.memoryMB + ' MiB memory budget' : 'about ' + m.memoryMB + ' MiB of memory';
    el('p', 'facts', row).textContent = mb(m.bytes) + ' MB download, ' + m.diskMB + ' MiB on disk, ' + memory +
      (m.speed ? ', ' + m.speed : '');
    if (m.description) el('p', 'model-description', row).textContent = m.description;
    el('p', 'url', row).textContent = m.url;
    it.bar = el('div', 'bar', row);
    it.fill = el('i', '', it.bar);
    it.message = el('p', 'progress', row);
    var buttons = el('div', 'row', row);
    it.primary = el('button', 'ctl', buttons);
    it.remove = el('button', 'ctl', buttons);
    it.primary.addEventListener('click', function () { act(it.primary, it.action); });
    it.remove.addEventListener('click', function () { act(it.remove, 'delete ' + m.id); });
    items[m.id] = it;
    return it;
  }
  function fill(bar, share) {
    var t = 'scaleX(' + Math.max(0, Math.min(1, share)).toFixed(3) + ')';
    bar.style.webkitTransform = t;
    bar.style.transform = t;
  }
  function used(text, bar, usedMB, totalMB, extra) {
    text.textContent = usedMB + ' of ' + totalMB + ' MB used (' + Math.round(usedMB * 100 / totalMB) + '%)' + (extra || '');
    fill(bar, usedMB / totalMB);
  }
  // The disk models go on and the TV's memory, once the state has been read.
  function drawGauges(s) {
    if (!s.disk_total || !s.mem_total) return;
    gauges.style.display = 'flex';
    used(diskText, diskFill, s.disk_used, s.disk_total, ', ' + s.free + ' MB free');
    var lv = (s.engine_mb || 0) + (s.loading_mb || 0);
    used(memText, memFill, s.mem_total - s.mem_free, s.mem_total, lv ? ', voice ' + lv + ' MB' : '');
  }
  function draw(s) {
    loading.style.display = 'none';
    drawGauges(s);
    var j = s.job;
    var busy = !!j && (j.state === 'downloading' || j.state === 'checking' || j.state === 'unpacking');
    space.textContent = 'Each model is checked against a pinned checksum.';
    s.models.forEach(function (m) {
      m.room = s.free >= m.needMB;
      var it = item(m), mine = !!j && j.id === m.id;
      var use = m.installed && s.chosen !== m.id;
      var text = '', bad = false, share = -1, wait = false;
      allow(it.primary, true);
      it.remove.style.display = m.installed ? '' : 'none';
      label(it.remove, 'Delete');
      allow(it.remove, !(mine && busy));
      if (mine && busy) {
        label(it.primary, 'Cancel');
        it.action = 'cancel';
      } else if (s.chosen === m.id) {
        label(it.primary, s.running === m.id ? 'In use' : 'Loading…');
        allow(it.primary, false);
      } else if (use) {
        label(it.primary, 'Use');
        it.action = 'use ' + m.id;
      } else {
        label(it.primary, 'Download');
        it.action = 'get ' + m.id;
        allow(it.primary, !busy && m.room);
        if (!m.room) {
          text = 'Needs ' + m.needMB + ' MB of free space';
          bad = true;
        }
      }
      if (mine && j.state === 'downloading') {
        share = j.done / j.total;
        text = 'Downloading ' + Math.round(share * 100) + '%: ' + mb(j.done) + ' of ' + mb(j.total) + ' MB' +
          (j.done ? ' at ' + (j.rate / 1000000).toFixed(1) + ' MB/s' : ', connecting…');
      } else if (mine && j.state === 'checking') {
        wait = true;
        text = 'Checking the file…';
      } else if (mine && j.state === 'unpacking') {
        share = j.total ? Math.min(1, j.done / j.total) : 0;
        text = 'Unpacking ' + Math.round(share * 100) + '%: ' + Math.round(j.done / 1048576) + ' of ' + Math.round(j.total / 1048576) + ' MB';
      } else if (mine && j.state === 'failed') {
        text = j.error + '.';
        bad = true;
      } else if (mine && j.state === 'cancelled') {
        text = 'Download cancelled.';
      } else if (s.chosen === m.id && s.running !== m.id) {
        // Loading: the engine's memory grows towards what the model needs.
        if (s.loading_mb) {
          share = Math.min(0.99, s.loading_mb / m.memoryMB);
          text = 'Loading into memory ' + Math.round(share * 100) + '%: ' + s.loading_mb + ' of about ' + m.memoryMB + ' MB';
        } else {
          wait = true;
          text = 'Loading…';
        }
      }
      // A model that would not fit in the memory free now, counting what the one in use would give back.
      var spare = (s.mem_free || 0) + (s.running && s.running !== m.id ? s.engine_mb || 0 : 0);
      var needed = m.memoryMB + (m.headroomMB || 0);
      if (!text && s.mem_total && s.chosen !== m.id && needed > spare) {
        text = 'Needs about ' + needed + ' MB of free memory, and ' + spare + ' MB is free now. Close an app before using it.';
        bad = true;
      }
      it.bar.style.display = share >= 0 || wait ? '' : 'none';
      it.bar.className = wait ? 'bar wait' : 'bar';
      if (share >= 0) fill(it.fill, share);
      it.message.textContent = text;
      it.message.className = bad ? 'progress error' : 'progress';
    });
    var rows = focusRows();
    var has = rows.some(function (r) { return r.indexOf(document.activeElement) >= 0; });
    if (!has) rows[0][0].focus();
  }
  function usable(b) { return !b.disabled && b.style.display !== 'none'; }
  function focusRows() {
    var rows = [];
    Object.keys(items).forEach(function (id) {
      var it = items[id];
      var r = [it.primary, it.remove].filter(usable);
      if (it.language) r.push(it.language);
      if (r.length) rows.push(r);
    });
    rows.push([closeButton]);
    return rows;
  }
  function poll() {
    if (waiting) return;
    waiting = true;
    // The list needs node, which is slow to start, so between changes only the state is read.
    var whole = full || !status.models, taken = ticket;
    ctl(whole ? 'models status' : 'modelstate', function (a) {
      waiting = false;
      if (!a) return;
      if (pressed && whole && finished && taken >= finished) {
        pressed.className = 'ctl';
        pressed = null;
        finished = 0;
      }
      var problem = status.problem;
      if (whole) full = false;
      Object.keys(a).forEach(function (k) { status[k] = a[k]; });
      delete status.problem;
      var now = a.job ? a.job.id + a.job.state : '';
      if (now !== lastState) {
        lastState = now;
        full = true;
      }
      if (status.models) draw(status);
      else drawGauges(status);
      if (problem) space.textContent = problem + '.';
    });
  }
  function close() {
    if (dismissLanguages) dismissLanguages();
    clearInterval(timer);
    timer = null;
    panel.style.display = 'none';
    document.getElementById('main').style.display = '';
    if (onClose) onClose();
  }
  function open(run, closed) {
    ctl = run;
    onClose = closed;
    document.getElementById('main').style.display = 'none';
    panel.style.display = 'flex';
    closeButton.focus();
    status = status || {};
    if (!status.models) loading.style.display = 'flex';
    full = true;
    poll();
    timer = setInterval(poll, POLL);
  }
  closeButton.addEventListener('click', close);
  return {open: open, close: close, rows: focusRows, isOpen: function () { return !!timer; }};
})();
