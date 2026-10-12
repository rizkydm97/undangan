/* Admin undangan: tab terpisah, input lebih enak, kehadiran + cetak PDF */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sb = supabase.createClient(SB.url, SB.key);
let D = {}, tab = 'umum', dirty = false;

const toast = t => { const m = $('#msg'); m.textContent = t; m.style.display = 'block'; clearTimeout(m._t); m._t = setTimeout(() => m.style.display = 'none', 3000); };
const get = (o, p) => p.split('.').reduce((a, k) => a == null ? a : a[k], o);
const set = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach((k, i) => { if (a[k] == null) a[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[k]; }); a[ks[ks.length - 1]] = v; };
const setDirty = v => { dirty = v; const s = $('#st'); s.textContent = v ? '● Ada perubahan belum disimpan' : ''; s.classList.toggle('dirty', v); };
window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- definisi tab ---------- */
// field: [path, label, type, hint, full?]
const TABS = [
  { id: 'umum', label: 'Umum', title: 'Pengaturan Umum', desc: 'Nama, tanggal hitung mundur, dan foto sampul', secs: [
    { t: 'Pasangan & Tanggal', f: [
      ['couple', 'Nama pasangan (cover, hero, footer)', 'text', 'Contoh: Ikky & Nomes'],
      ['wedding_datetime', 'Tanggal & jam hitung mundur (WIB)', 'datetime-local'],
      ['hero_text', 'Kalimat di bawah nama (hero)', 'area', '', 1],
      ['max_guests', 'Maksimal jumlah tamu per konfirmasi', 'number', 'Tamu memilih jumlah dengan tombol + / −']] },
    { t: 'Tampilan Link (WhatsApp / Sosmed)', sub: 'Ini yang muncul saat link dikirim lewat WhatsApp, Instagram, dsb. Kosongkan untuk otomatis: judul "The Wedding of [nama pasangan]", deskripsi dari kalimat hero, gambar dari foto cover. Perubahan terlihat dalam ±1 menit; WhatsApp menyimpan preview lama, jadi kirim ulang dengan link baru (mis. tambahkan ?v=2) untuk mengetes.', f: [
      ['share_title', 'Judul link', 'text', 'Contoh: Undangan Pernikahan Ikky & Nomes', 1],
      ['share_desc', 'Deskripsi link', 'area', 'Contoh: Kami mengundang Anda di hari bahagia kami, 24 November 2026', 1],
      ['share_image', 'Gambar preview (otomatis dipotong 1200×630)', 'og', '', 1]] },
    { t: 'Foto Utama', sub: 'Setiap bagian memakai foto sendiri, jadi bisa berbeda.', f: [
      ['cover_photo', 'Foto Cover (layar "Buka Undangan")', 'img'],
      ['hero_photo', 'Foto Hero (halaman utama)', 'img'],
      ['closing_photo', 'Foto Penutup (bagian bawah)', 'img']] }] },
  { id: 'mempelai', label: 'Mempelai', title: 'Mempelai', desc: 'Data dan foto kedua mempelai', secs: [
    { t: 'Mempelai Wanita', f: [['bride_name', 'Nama lengkap', 'text'], ['bride_ig', 'Instagram', 'text'], ['bride_parents', 'Orang tua', 'text', '', 1], ['bride_photo', 'Foto', 'img']] },
    { t: 'Mempelai Pria', f: [['groom_name', 'Nama lengkap', 'text'], ['groom_ig', 'Instagram', 'text'], ['groom_parents', 'Orang tua', 'text', '', 1], ['groom_photo', 'Foto', 'img']] }] },
  { id: 'acara', label: 'Acara', title: 'Acara', desc: 'Akad, resepsi, dan live streaming', secs: [
    { t: 'Pengantar', f: [['event_intro', 'Kalimat pengantar acara', 'area', '', 1]] },
    { t: 'Akad Nikah', f: [['akad_date', 'Tanggal', 'date'], ['akad_time', 'Jam (contoh: 07.00 WIB)', 'text'], ['akad_place', 'Lokasi', 'area', '', 1], ['akad_map', 'Link Google Maps', 'url', '', 1]] },
    { t: 'Resepsi', f: [['resepsi_date', 'Tanggal', 'date'], ['resepsi_time', 'Jam (contoh: 15.00 - 17.00 WIB)', 'text'], ['resepsi_place', 'Lokasi', 'area', '', 1], ['resepsi_map', 'Link Google Maps', 'url', '', 1]] },
    { t: 'Live Streaming', f: [['live_text', 'Teks', 'area', '', 1], ['live_link', 'Link live streaming', 'url'], ['live_photo', 'Foto', 'img']] }] },
  { id: 'ayat', label: 'Ayat & Sambutan', title: 'Ayat & Sambutan', desc: 'Ayat, salam, kalimat pembuka dan penutup', secs: [
    { t: 'Ayat', f: [['verse_title', 'Judul ayat', 'text', '', 1], ['verse_ar', 'Teks Arab', 'area', '', 1], ['verse_id', 'Terjemahan', 'area', '', 1]] },
    { t: 'Sambutan', f: [['salam_open', 'Salam pembuka', 'text'], ['closing_salam', 'Salam penutup', 'text'], ['opening_text', 'Teks pembuka', 'area', '', 1], ['closing_text', 'Teks penutup', 'area', '', 1]] }] },
  { id: 'cerita', label: 'Cerita', title: 'Our Story', desc: 'Perjalanan cinta (maksimal 4 cerita tampil di undangan)', secs: [
    { t: 'Perjalanan Cinta', list: ['story', 'Cerita', [['title', 'Judul', 'text'], ['text', 'Cerita', 'area'], ['photo', 'Foto', 'img']]] }] },
  { id: 'galeri', label: 'Galeri', title: 'Galeri', desc: 'Video & foto galeri', secs: [
    { t: 'Video', sub: 'Otomatis diputar tanpa tampilan YouTube. Paling bersih: unggah file .mp4 sendiri (maks 50 MB di paket gratis Supabase). Link YouTube juga bisa.', f: [['gallery_video', 'Video galeri (link YouTube / .mp4)', 'vid', '', 1]] },
    { t: 'Foto', f: [['gallery_photos', 'Foto galeri', 'imgs', '', 1]] }] },
  { id: 'hadiah', label: 'Hadiah', title: 'Kirim Hadiah', desc: 'Rekening bank (dengan logo) dan QR', secs: [
    { t: 'Tampilan', f: [['gift_text', 'Teks hadiah', 'area', '', 1], ['gift_photo', 'Foto', 'img']] },
    { t: 'Rekening Bank', sub: 'Unggah logo bank (PNG transparan paling bagus). Jika tidak ada logo, nama bank ditampilkan sebagai teks.', list: ['banks', 'Rekening', [['bank', 'Nama bank', 'text'], ['logo', 'Logo bank', 'logo'], ['name', 'Atas nama', 'text'], ['number', 'Nomor rekening', 'text']]] },
    { t: 'QR Code / QRIS', sub: 'Tambah satu atau lebih QR. Tamu bisa menyimpan gambarnya.', list: ['qrs', 'QR', [['label', 'Keterangan (contoh: QRIS a.n Putri)', 'text'], ['photo', 'Foto QR', 'qr']]] }] },
  { id: 'media', label: 'Media', title: 'Media', desc: 'Musik latar', secs: [{ t: 'Musik', f: [['music_url', 'Musik latar (.mp3)', 'aud', '', 1]] }] },
  { id: 'hadir', label: 'Kehadiran', special: 'rsvp' },
  { id: 'ucapan', label: 'Ucapan & Doa', special: 'wishes' }
];
const NEW = { story: { title: '', text: '', photo: '' }, banks: { bank: '', logo: '', name: '', number: '' }, qrs: { label: '', photo: '' } };

/* ---------- render field ---------- */
function fld(p, l, t, hint) {
  const v = get(D, p) || '', h = hint ? `<div class="hint">${hint}</div>` : '';
  if (t === 'img' || t === 'logo' || t === 'qr' || t === 'og')
    return `<div class="f"><label>${l}</label><div class="ph"><div class="pv ${t}" style="${v ? `background-image:url('${esc(v)}')` : ''}">${v ? '' : 'Belum ada'}</div><div class="bt"><button type="button" class="g" data-up="${p}" data-m="${t}">${v ? 'Ganti' : 'Unggah'}</button>${v ? `<button type="button" class="d" data-clr="${p}">Hapus</button>` : ''}</div></div>${h}</div>`;
  if (t === 'aud') return `<div class="f"><label>${l}</label><input data-p="${p}" value="${esc(v)}" placeholder="https://... atau unggah"><div style="margin-top:8px"><button type="button" class="g" data-upa="${p}" data-k="audio/*">Unggah file musik</button></div>${h}</div>`;
  if (t === 'vid') return `<div class="f"><label>${l}</label><input data-p="${p}" value="${esc(v)}" placeholder="https://youtu.be/... atau https://.../video.mp4"><div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="g" data-upa="${p}" data-k="video/mp4,video/webm">Unggah video .mp4</button>${v ? `<button type="button" class="d" data-clr="${p}">Hapus video</button>` : ''}</div>${h}</div>`;
  if (t === 'area') return `<div class="f"><label>${l}</label><textarea data-p="${p}" rows="3">${esc(v)}</textarea>${h}</div>`;
  return `<div class="f"><label>${l}</label><input type="${t}" data-p="${p}" value="${esc(v)}" ${t === 'number' ? 'min="1" max="20"' : ''}>${h}</div>`;
}
function listBox(sec) {
  const [p, nm, sub] = sec.list, items = get(D, p) || [];
  return items.map((it, i) => `<div class="it"><div class="it-h"><b>${nm} ${i + 1}</b><button type="button" class="d" data-del="${p}.${i}">Hapus</button></div><div class="grid">${sub.map(([k, lb, tt]) => `<div class="${tt === 'area' ? 'full' : ''}">${fld(`${p}.${i}.${k}`, lb, tt)}</div>`).join('')}</div></div>`).join('')
    + `<button type="button" class="g" data-add="${p}">+ Tambah ${nm}</button>`;
}
function secHTML(sec) {
  let body;
  if (sec.list) body = listBox(sec);
  else body = `<div class="grid">${sec.f.map(([p, l, t, h, full]) => {
    const w = t === 'imgs';
    if (w) return `<div class="full"><div class="f"><label>${l}</label><div class="gl">${(get(D, p) || []).map((u, i) => `<div><img src="${esc(u)}" loading="lazy"><button type="button" data-del="${p}.${i}">×</button></div>`).join('')}</div><button type="button" class="g" data-upm="${p}">+ Unggah foto (boleh banyak)</button></div></div>`;
    return `<div class="${full ? 'full' : ''}">${fld(p, l, t, h)}</div>`;
  }).join('')}</div>`;
  return `<div class="box"><h3>${sec.t}</h3>${sec.sub ? `<p class="sub">${sec.sub}</p>` : '<div style="height:10px"></div>'}${body}</div>`;
}

/* ---------- upload ---------- */
function pick(multi, acc) { return new Promise(r => { const i = document.createElement('input'); i.type = 'file'; i.accept = acc; i.multiple = multi; i.onchange = () => r([...i.files]); i.click(); }); }
function rs(f, mode) {
  return new Promise(r => {
    const raw = () => r({ blob: f, type: f.type, ext: (f.name.split('.').pop() || 'bin').toLowerCase() });
    if (!f.type.startsWith('image/') || f.type === 'image/gif' || f.type === 'image/svg+xml') return raw();
    if (mode === 'og') {
      const i = new Image();
      i.onload = () => { const W = 1200, H = 630, k = Math.max(W / i.width, H / i.height), c = document.createElement('canvas'); c.width = W; c.height = H;
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, W, H); x.drawImage(i, (W - i.width * k) / 2, (H - i.height * k) / 2, i.width * k, i.height * k);
        c.toBlob(b => r({ blob: b, type: 'image/jpeg', ext: 'jpg' }), 'image/jpeg', .8); };
      i.onerror = raw; i.src = URL.createObjectURL(f); return;
    }
    const png = mode === 'logo' || mode === 'qr', max = mode === 'logo' ? 600 : mode === 'qr' ? 1000 : 1600;
    const i = new Image();
    i.onload = () => {
      const k = Math.min(1, max / Math.max(i.width, i.height)), c = document.createElement('canvas');
      c.width = Math.round(i.width * k); c.height = Math.round(i.height * k);
      const x = c.getContext('2d'); if (!png) { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
      x.drawImage(i, 0, 0, c.width, c.height);
      c.toBlob(b => r({ blob: b, type: png ? 'image/png' : 'image/jpeg', ext: png ? 'png' : 'jpg' }), png ? 'image/png' : 'image/jpeg', .86);
    };
    i.onerror = raw; i.src = URL.createObjectURL(f);
  });
}
async function up(f, mode) {
  const x = await rs(f, mode), n = 'u/' + Date.now() + '-' + Math.random().toString(36).slice(2, 7) + '.' + x.ext;
  const { error } = await sb.storage.from('media').upload(n, x.blob, { contentType: x.type, cacheControl: '31536000' });
  if (error) throw error;
  return sb.storage.from('media').getPublicUrl(n).data.publicUrl;
}

/* ---------- gambar halaman ---------- */
function draw() {
  const t = TABS.find(x => x.id === tab), v = $('#view'), y = scrollY;
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  $('#bar').style.display = t.special ? 'none' : '';
  document.body.style.paddingBottom = t.special ? '24px' : '96px';
  if (t.special === 'rsvp') return rsvp();
  if (t.special === 'wishes') return wishes();
  v.innerHTML = `<div class="page-h"><h2>${t.title}</h2><p>${t.desc}</p></div>` + t.secs.map(secHTML).join('');
  scrollTo(0, y); bind();
}
function bind() {
  const v = $('#view');
  $$('[data-p]', v).forEach(e => e.oninput = () => { set(D, e.dataset.p, e.type === 'number' ? +e.value : e.value); setDirty(true); });
  $$('[data-up]', v).forEach(b => b.onclick = async () => {
    const [f] = await pick(false, 'image/*'); if (!f) return;
    toast('Mengunggah...'); try { set(D, b.dataset.up, await up(f, b.dataset.m)); setDirty(true); draw(); toast('Terunggah. Jangan lupa Simpan.'); } catch (e) { toast('Gagal: ' + e.message); }
  });
  $$('[data-upa]', v).forEach(b => b.onclick = async () => {
    const [f] = await pick(false, b.dataset.k); if (!f) return;
    if (f.size > 50 * 1024 * 1024) return toast('File lebih dari 50 MB. Kecilkan dulu atau pakai link.');
    toast('Mengunggah ' + (f.size / 1048576).toFixed(1) + ' MB...'); try { set(D, b.dataset.upa, await up(f)); setDirty(true); draw(); toast('Terunggah. Jangan lupa Simpan.'); } catch (e) { toast('Gagal: ' + e.message); }
  });
  $$('[data-upm]', v).forEach(b => b.onclick = async () => {
    const fs = await pick(true, 'image/*'); if (!fs.length) return;
    toast('Mengunggah ' + fs.length + ' foto...'); try { const a = get(D, b.dataset.upm) || []; for (const f of fs) a.push(await up(f)); set(D, b.dataset.upm, a); setDirty(true); draw(); toast('Terunggah. Jangan lupa Simpan.'); } catch (e) { toast('Gagal: ' + e.message); }
  });
  $$('[data-clr]', v).forEach(b => b.onclick = () => { set(D, b.dataset.clr, ''); setDirty(true); draw(); });
  $$('[data-del]', v).forEach(b => b.onclick = () => { const ks = b.dataset.del.split('.'), i = +ks.pop(); get(D, ks.join('.')).splice(i, 1); setDirty(true); draw(); });
  $$('[data-add]', v).forEach(b => b.onclick = () => { const p = b.dataset.add; (D[p] = D[p] || []).push({ ...NEW[p] }); setDirty(true); draw(); });
}

/* ---------- kehadiran ---------- */
let RS = [];
const fmt = t => new Date(t).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
async function rsvp() {
  const v = $('#view'); v.innerHTML = '<div class="empty">Memuat...</div>';
  const { data, error } = await sb.from('rsvp').select('*').order('created_at', { ascending: false });
  if (error) { v.innerHTML = `<div class="empty">Gagal memuat: ${esc(error.message)}</div>`; return; }
  RS = data || [];
  const yes = RS.filter(x => x.attending), no = RS.filter(x => !x.attending), tot = yes.reduce((s, x) => s + x.guests, 0);
  const row = (r, i) => `<div class="row"><span class="no">${i + 1}</span><div><b>${esc(r.name)}</b><br><small>${r.attending ? r.guests + ' orang · ' : ''}${fmt(r.created_at)}</small></div><button class="d" data-r="${r.id}">Hapus</button></div>`;
  v.innerHTML = `<div class="page-h" style="display:flex;gap:10px;align-items:flex-end"><div style="flex:1"><h2>Konfirmasi Kehadiran</h2><p>Terpisah dari ucapan & doa</p></div><div class="acts"><button class="o" id="rf">Refresh</button><button id="pdf">Cetak PDF</button></div></div>
  <div class="tot"><small>Total tamu yang akan datang</small><b>${tot}</b><span>orang</span></div>
  <div class="stats"><div><small>Respons</small><b>${RS.length}</b></div><div><small>Hadir</small><b style="color:var(--ok)">${yes.length}</b></div><div><small>Berhalangan</small><b style="color:var(--bad)">${no.length}</b></div></div>
  <div class="lst y"><h4>Akan hadir — ${yes.length} konfirmasi · ${tot} orang</h4>${yes.map(row).join('') || '<div class="empty">Belum ada</div>'}</div>
  <div class="lst n"><h4>Berhalangan — ${no.length} konfirmasi</h4>${no.map(row).join('') || '<div class="empty">Belum ada</div>'}</div>`;
  $('#rf').onclick = rsvp; $('#pdf').onclick = () => printPDF(yes, no, tot);
  $$('[data-r]', v).forEach(b => b.onclick = async () => { if (!confirm('Hapus konfirmasi ini?')) return; await sb.from('rsvp').delete().eq('id', b.dataset.r); rsvp(); });
}
function printPDF(yes, no, tot) {
  const rows = (a, h) => `<h3>${h}</h3><table><tr><th>No</th><th>Nama</th><th>Jumlah</th><th>Waktu konfirmasi</th></tr>${a.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r.name)}</td><td>${r.attending ? r.guests : '-'}</td><td>${fmt(r.created_at)}</td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#888">Belum ada</td></tr>'}</table>`;
  const html = `<!doctype html><meta charset="utf-8"><title>Konfirmasi Kehadiran - ${esc(D.couple || '')}</title><style>
  body{font:13px/1.5 Arial,sans-serif;color:#222;margin:28px}h1{margin:0;font-size:22px}p{margin:2px 0 14px;color:#666}
  .sum{display:flex;gap:12px;margin:12px 0 18px}.sum div{flex:1;border:1px solid #ccc;border-radius:8px;padding:10px;text-align:center}.sum b{display:block;font-size:24px}
  h3{margin:18px 0 6px;font-size:15px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f1ece3}
  td:first-child,th:first-child{width:40px;text-align:center}td:nth-child(3){text-align:center;width:70px}@page{margin:14mm}</style>
  <h1>Konfirmasi Kehadiran</h1><p>${esc(D.couple || '')} · dicetak ${new Date().toLocaleString('id-ID')}</p>
  <div class="sum"><div><b>${tot}</b>Total tamu hadir</div><div><b>${yes.length + no.length}</b>Respons</div><div><b>${yes.length}</b>Hadir</div><div><b>${no.length}</b>Berhalangan</div></div>
  ${rows(yes, 'Akan hadir — ' + yes.length + ' konfirmasi · ' + tot + ' orang')}${rows(no, 'Berhalangan — ' + no.length + ' konfirmasi')}`;
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(f); f.contentDocument.open(); f.contentDocument.write(html); f.contentDocument.close();
  setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 2000); }, 300);
}

/* ---------- ucapan ---------- */
async function wishes() {
  const v = $('#view'); v.innerHTML = '<div class="empty">Memuat...</div>';
  const { data } = await sb.from('wishes').select('*').order('created_at', { ascending: false });
  const a = data || [];
  v.innerHTML = `<div class="page-h"><h2>Ucapan & Doa</h2><p>${a.length} ucapan dari tamu</p></div><div class="box">${a.map(w => `<div class="wi"><div><b>${esc(w.name)}</b><p>${esc(w.message)}</p><small>${fmt(w.created_at)}</small></div><button class="d" data-w="${w.id}">Hapus</button></div>`).join('') || '<div class="empty">Belum ada ucapan</div>'}</div>`;
  $$('[data-w]').forEach(b => b.onclick = async () => { if (!confirm('Hapus ucapan ini?')) return; await sb.from('wishes').delete().eq('id', b.dataset.w); wishes(); });
}

/* ---------- muat / simpan / login ---------- */
async function load() {
  const { data } = await sb.from('invitation').select('data').eq('id', 1).maybeSingle();
  D = { ...DEF, ...((data && data.data) || {}) };
  // migrasi: foto pasangan lama -> foto cover / hero / penutup
  if (D.couple_photo) ['cover_photo', 'hero_photo', 'closing_photo'].forEach(k => { if (!D[k]) D[k] = D.couple_photo; });
  (D.banks || []).forEach(b => { if (b.logo == null) b.logo = ''; });
  if (!Array.isArray(D.qrs)) D.qrs = [];
  setDirty(false); draw();
}
async function show(sess) { $('#login').hidden = !!sess; $('#app').hidden = !sess; if (sess) { buildTabs(); load(); } }
function buildTabs() {
  $('#tabs').innerHTML = TABS.map(t => `<button data-t="${t.id}">${t.label}</button>`).join('');
  $$('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; location.hash = tab; draw(); scrollTo(0, 0); });
  const h = location.hash.slice(1); if (TABS.some(t => t.id === h)) tab = h;
}
$('#go').onclick = async () => {
  const u = $('#em').value.trim().toLowerCase(), e = $('#lerr'), b = $('#go');
  if (!window.SB || !/https:\/\/[^/]+\.supabase\.co/.test(window.SB.url) || /YOUR/i.test(window.SB.key || '')) { e.textContent = 'Konfigurasi Supabase belum benar. Periksa config.js'; return; }
  if (!u || !$('#pw').value) { e.textContent = 'Masukkan username dan password.'; return; }
  b.disabled = true; b.textContent = 'Memproses...'; e.textContent = '';
  try {
    const { error } = await sb.auth.signInWithPassword({ email: u.includes('@') ? u : u + '@admin.com', password: $('#pw').value });
    e.textContent = error ? (error.message === 'Invalid login credentials' ? 'Username atau password salah' : error.message) : '';
  } catch (err) { e.textContent = 'Gagal terhubung: ' + (err.message || 'periksa koneksi'); }
  b.disabled = false; b.textContent = 'Masuk';
};
$('#pw').onkeydown = e => { if (e.key === 'Enter') $('#go').click(); };
$('#out').onclick = () => sb.auth.signOut();
$('#view-inv').onclick = () => window.open('/', '_blank');
$('#reset').onclick = () => { if (!dirty || confirm('Buang semua perubahan yang belum disimpan?')) load(); };
$('#save').onclick = async () => {
  const b = $('#save'); b.disabled = true;
  const { error } = await sb.from('invitation').upsert({ id: 1, data: D, updated_at: new Date().toISOString() });
  b.disabled = false;
  if (error) return toast('Gagal menyimpan: ' + error.message);
  setDirty(false); toast('Tersimpan ✓ undangan sudah diperbarui');
};
sb.auth.onAuthStateChange((_e, s) => show(s));
sb.auth.getSession().then(({ data }) => show(data.session));
