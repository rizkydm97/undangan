// Menyajikan undangan dengan meta tag (judul, deskripsi, gambar) dari data admin,
// supaya preview link di WhatsApp/Instagram ikut berubah. Juga menyisipkan data awal
// agar tidak ada nama bawaan yang sempat terlihat.
const fs = require('fs'), path = require('path');
const E = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

module.exports = async (req, res) => {
  const root = process.cwd();
  let html = fs.readFileSync(path.join(root, 'template.html'), 'utf8');
  let d = {};
  try {
    const cfg = fs.readFileSync(path.join(root, 'config.js'), 'utf8');
    const url = (cfg.match(/url:\s*'([^']+)'/) || [])[1], key = (cfg.match(/key:\s*'([^']+)'/) || [])[1];
    const r = await fetch(url + '/rest/v1/invitation?id=eq.1&select=data', { headers: { apikey: key, Authorization: 'Bearer ' + key } });
    const j = await r.json();
    d = (j && j[0] && j[0].data) || {};
  } catch (e) { d = {}; }

  const host = req.headers['x-forwarded-host'] || req.headers.host || '';
  const origin = 'https://' + host;
  const couple = d.couple || '';
  const title = d.share_title || (couple ? 'The Wedding of ' + couple : 'Undangan Pernikahan');
  const desc = d.share_desc || d.hero_text || 'Kami mengundang Anda untuk hadir di hari bahagia kami.';
  const img = d.share_image || d.cover_photo || d.couple_photo || d.hero_photo || '';

  const meta = [
    `<meta name="description" content="${E(desc)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${E(couple || title)}">`,
    `<meta property="og:title" content="${E(title)}">`,
    `<meta property="og:description" content="${E(desc)}">`,
    `<meta property="og:url" content="${E(origin + '/')}">`,
    img ? `<meta property="og:image" content="${E(img)}">` : '',
    img && d.share_image ? '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">' : '',
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${E(title)}">`,
    `<meta name="twitter:description" content="${E(desc)}">`,
    img ? `<meta name="twitter:image" content="${E(img)}">` : ''
  ].join('\n');
  const inv = '<script>window.__INV=' + JSON.stringify(d).replace(/</g, '\\u003c') + ';</script>';

  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + E(title) + '</title>' + '\n' + meta + '\n' + inv);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
};
