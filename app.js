// Memuat konten dari Supabase dan menerapkannya ke undangan. Tanpa config: tampil konten bawaan.
(function () {
  const C = window.SB || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const br = t => esc(t).replace(/\n/g, '<br>');
  const ready = !!(C.url && C.key && !/YOUR/.test(C.url) && window.supabase);
  const sb = ready ? supabase.createClient(C.url, C.key) : null;
  const rm = () => document.documentElement.classList.remove('loading');
  // tampilkan cover setelah font + gambar cover siap (maks 2,5 dtk), supaya tidak ada foto/nama yang muncul loncat
  const done = () => {
    const w = $$('#cover img').filter(i => !i.complete).map(i => new Promise(r => { i.onload = i.onerror = r; }));
    if (document.fonts && document.fonts.ready) w.push(document.fonts.ready);
    Promise.race([Promise.all(w), new Promise(r => setTimeout(r, 2500))]).then(rm);
  };
  setTimeout(rm, 4000);

  let CFG = {};            // data undangan
  let guests = 1, attend = 1;
  const maxGuests = () => Math.max(1, Math.min(20, +CFG.max_guests || 10));

  const dp = d => {
    const dt = new Date(d + 'T12:00:00+07:00');
    const f = o => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...o }).format(dt);
    return { wd: f({ weekday: 'long' }), day: +f({ day: 'numeric' }), mon: f({ month: 'long' }), year: f({ year: 'numeric' }) };
  };
  const bg = (el, u) => {
    if (!el || !u) return;
    el.style.background = '#ddd url("' + u + '") center/cover no-repeat';
    el.style.color = 'transparent';
    el.textContent = '';
  };

  /* ---------- video galeri: bersih, tanpa tampilan YouTube ---------- */
  const ytId = u => { const m = String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([\w-]{11})/); return m && m[1]; };
  const SND_ON = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>';
  const SND_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';

  function buildVideo(box, url) {
    const id = ytId(url);
    let muted = true, ctl;
    if (id) {
      const q = 'autoplay=1&mute=1&loop=1&playlist=' + id + '&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&rel=0&playsinline=1&cc_load_policy=0&enablejsapi=1';
      box.innerHTML = '<div class="vwrap"><iframe tabindex="-1" title="Video" src="https://www.youtube-nocookie.com/embed/' + id + '?' + q + '" allow="autoplay; encrypted-media"></iframe></div><div class="vshield"></div>';
      const fr = $('iframe', box);
      const cmd = f => { try { fr.contentWindow.postMessage(JSON.stringify({ event: 'command', func: f, args: '' }), '*'); } catch (e) {} };
      ctl = { play: () => cmd('playVideo'), pause: () => cmd('pauseVideo'), mute: m => cmd(m ? 'mute' : 'unMute') };
    } else {
      box.innerHTML = '<video src="' + esc(url) + '" autoplay muted loop playsinline preload="metadata" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback"></video><div class="vshield"></div>';
      const v = $('video', box);
      ctl = { play: () => v.play().catch(() => {}), pause: () => v.pause(), mute: m => { v.muted = m; } };
    }
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'vsnd'; b.setAttribute('aria-label', 'Suara video'); b.innerHTML = SND_OFF;
    b.onclick = e => {
      e.stopPropagation(); muted = !muted; ctl.mute(muted); b.innerHTML = muted ? SND_OFF : SND_ON;
      if (!muted && window.__bgm) window.__bgm.pause();
    };
    box.appendChild(b);
    new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? ctl.play() : ctl.pause()), { threshold: .4 }).observe(box);
  }

  /* ---------- terapkan data ---------- */
  function apply(d) {
    CFG = d;
    if (d.wedding_datetime) {
      const dd = d.wedding_datetime.slice(0, 10), p = dp(dd);
      d.hero_date = p.wd + ', ' + p.day + ' ' + p.mon + ' ' + p.year;
      target = new Date(d.wedding_datetime + ':00+07:00');
    }
    $$('[data-k]').forEach(el => { const v = d[el.dataset.k]; if (v != null && v !== '') el.innerHTML = br(v); });
    ['akad', 'resepsi'].forEach(k => {
      const v = d[k + '_date']; if (!v) return;
      const p = dp(v), q = x => $('[data-d="' + k + ':' + x + '"]');
      q('wd').textContent = p.wd; q('mon').textContent = p.mon; q('year').textContent = p.year;
      const n = q('day'); n.dataset.n = p.day; n.textContent = p.day;
    });
    $$('[data-link]').forEach(a => { const v = d[a.dataset.link]; if (v) { a.href = v; a.target = '_blank'; a.rel = 'noopener'; } });

    // foto: cover, hero, penutup, mempelai -> masing-masing bisa beda
    const pk = { cover: d.cover_photo || d.couple_photo, hero: d.hero_photo || d.couple_photo, closing: d.closing_photo || d.couple_photo, bride: d.bride_photo, groom: d.groom_photo };
    $$('.photo[data-photo]').forEach(ph => {
      const u = pk[ph.dataset.photo]; if (!u) return;
      ph.innerHTML = ph.closest('#cover')
        ? '<img class="hv l" src="' + esc(u) + '" alt=""><img class="hv r" src="' + esc(u) + '" alt="">'
        : '<img src="' + esc(u) + '" alt="">';
    });
    bg($('#live .img'), d.live_photo); bg($('#gift .img'), d.gift_photo);

    const tl = $$('#story .tl'), im = $$('#story .img');
    (d.story || []).forEach((it, i) => {
      if (!tl[i]) return;
      if (it.title) $('h4', tl[i]).textContent = it.title;
      if (it.text) $('p', tl[i]).textContent = it.text;
      bg(im[i], it.photo);
    });

    // rekening + logo bank
    if (d.banks && d.banks.length) {
      $('#banks').innerHTML = d.banks.map(b =>
        '<div class="bank">' + (b.logo ? '<img class="logo" src="' + esc(b.logo) + '" alt="' + esc(b.bank) + '">' : '<b>' + esc(b.bank) + '</b>') +
        '<p>Silahkan transfer ke rekening<br>a.n ' + esc(b.name) + '<br><span class="no">' + esc(b.number) + '</span></p>' +
        '<button class="btn" data-cp="' + esc(b.number) + '">&#10064; Copy No.Rek</button></div>').join('');
    }
    $$('[data-cp]').forEach(b => b.onclick = () => cp(b.dataset.cp, b));
    // QR / QRIS
    const qrs = (d.qrs || []).filter(q => q && q.photo);
    $('#qrs').innerHTML = qrs.map(q =>
      '<div class="qr"><img src="' + esc(q.photo) + '" alt="QR"><p>' + esc(q.label || 'Scan QR') + '</p>' +
      '<a class="btn" href="' + esc(q.photo) + '" target="_blank" rel="noopener" data-dl="' + esc(q.photo) + '">&#8681; Simpan QR</a></div>').join('');
    $$('[data-dl]').forEach(a => a.onclick = async e => {
      e.preventDefault();
      try {
        const r = await fetch(a.dataset.dl), bl = await r.blob(), u = URL.createObjectURL(bl), x = document.createElement('a');
        x.href = u; x.download = 'qr-hadiah.' + (bl.type.split('/')[1] || 'png'); document.body.appendChild(x); x.click(); x.remove();
        setTimeout(() => URL.revokeObjectURL(u), 3000);
      } catch (_) { window.open(a.dataset.dl, '_blank'); }
    });

    // galeri
    const g = $('#gallery .gal'), ph = d.gallery_photos || [];
    if (g && (d.gallery_video || ph.length)) {
      g.innerHTML = (d.gallery_video ? '<div class="img gi v" id="vid"></div>' : '') +
        ph.map(u => '<div class="img gi" style="background:#ddd url(\'' + esc(u) + '\') center/cover;color:transparent"></div>').join('');
      const v = $('#vid'); if (v) buildVideo(v, d.gallery_video);
    }
    if (d.couple) document.title = d.share_title || ("The Wedding of " + d.couple);

    // jumlah tamu dibatasi sesuai pengaturan
    if (guests > maxGuests()) { guests = maxGuests(); $('#gn').textContent = guests; }

    // musik
    if (d.music_url) {
      const a = new Audio(d.music_url); a.loop = true; window.__bgm = a;
      const dc = $('#disc');
      $('#openBtn').addEventListener('click', () => { a.play().then(() => dc.classList.remove('pause')).catch(() => {}); });
      dc.addEventListener('click', () => dc.classList.contains('pause') ? a.pause() : a.play().catch(() => {}));
    }
  }

  /* ---------- ucapan + RSVP (satu form) ---------- */
  const ago = t => {
    const s = (Date.now() - new Date(t)) / 1000;
    if (s < 60) return 'baru saja'; if (s < 3600) return Math.floor(s / 60) + ' menit lalu';
    if (s < 86400) return Math.floor(s / 3600) + ' jam lalu'; if (s < 604800) return Math.floor(s / 86400) + ' hari lalu';
    return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const wishHTML = w => '<div><b>' + esc(w.name) + '</b>' + esc(w.message) + '<small>' + ago(w.created_at || Date.now()) + '</small></div>';
  const empty = '<div class="none">Belum ada ucapan. Jadilah yang pertama &#10084;</div>';

  function bindForm() {
    const L = $('#list'), gn = $('#gn'), gst = $('#gst');
    const setG = n => { guests = Math.max(1, Math.min(maxGuests(), n)); gn.textContent = guests; };
    $('#gm').onclick = () => setG(guests - 1);
    $('#gp').onclick = () => setG(guests + 1);
    $$('#att .opt').forEach(b => b.onclick = () => {
      attend = +b.dataset.v;
      $$('#att .opt').forEach(x => x.classList.toggle('on', x === b));
      gst.classList.toggle('off', !attend);
    });
    const show = (name, hadir) => {
      $('#thxN').textContent = name;
      $('#thxT').textContent = hadir
        ? 'Ucapan dan konfirmasi kehadiran Anda telah kami terima. Sampai jumpa di hari bahagia kami.'
        : 'Ucapan dan doa Anda telah kami terima. Terima kasih sudah memberi kabar.';
      $('#thx').hidden = false; requestAnimationFrame(() => $('#thx').classList.add('on'));
    };
    const close = () => { $('#thx').classList.remove('on'); setTimeout(() => $('#thx').hidden = true, 350); };
    $('#thxX').onclick = close; $('#thx').onclick = e => { if (e.target.id === 'thx') close(); };

    $('#send').onclick = async () => {
      const btn = $('#send'), name = $('#who').value.trim(), msg = $('#msg').value.trim();
      if (!name) { $('#who').focus(); $('#who').classList.add('err'); setTimeout(() => $('#who').classList.remove('err'), 1200); return; }
      btn.disabled = true; const o = btn.innerHTML; btn.textContent = 'MENGIRIM...';
      try {
        if (sb) {
          const r = await sb.from('rsvp').insert({ name: name.slice(0, 80), guests: attend ? guests : 1, attending: !!attend });
          if (r.error) throw r.error;
          if (msg) { const w = await sb.from('wishes').insert({ name: name.slice(0, 80), message: msg.slice(0, 500) }); if (w.error) throw w.error; }
        }
        if (msg) { const h = $('.none', L); if (h) h.remove(); L.insertAdjacentHTML('afterbegin', wishHTML({ name, message: msg })); }
        $('#msg').value = ''; show(name, !!attend);
      } catch (e) { alert('Gagal mengirim. Coba lagi sebentar.'); console.warn(e); }
      btn.disabled = false; btn.innerHTML = o;
    };
  }

  async function wishes() {
    const L = $('#list');
    if (!sb) { L.innerHTML = empty; return; }
    const { data } = await sb.from('wishes').select('*').order('created_at', { ascending: false }).limit(60);
    L.innerHTML = data && data.length ? data.map(wishHTML).join('') : empty;
  }

  bindForm();
  window.cfgReady = (async () => {
    const pre = window.__INV && Object.keys(window.__INV).length ? window.__INV : null;
    if (pre) apply(pre);
    if (!sb) { $('#list').innerHTML = empty; return done(); }
    try {
      if (!pre) { const { data } = await sb.from('invitation').select('data').eq('id', 1).maybeSingle(); if (data && data.data) apply(data.data); }
      await wishes();
    } catch (e) { console.warn(e); }
    done();
  })();
})();
