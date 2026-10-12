// Memuat konten dari Supabase dan menerapkannya ke undangan. Tanpa config: tampil konten bawaan.
(function(){
const C=window.SB||{},$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const br=t=>esc(t).replace(/\n/g,'<br>');
const ready=!!(C.url&&C.key&&!/YOUR/.test(C.url)&&window.supabase);
const sb=ready?supabase.createClient(C.url,C.key):null;
const done=()=>document.documentElement.classList.remove('loading');
setTimeout(done,3500);
const dp=d=>{const dt=new Date(d+'T12:00:00+07:00'),f=o=>new Intl.DateTimeFormat('id-ID',{timeZone:'Asia/Jakarta',...o}).format(dt);return{wd:f({weekday:'long'}),day:+f({day:'numeric'}),mon:f({month:'long'}),year:f({year:'numeric'})}};
const bg=(el,u)=>{if(!el||!u)return;el.style.background='#ddd url("'+u+'") center/cover no-repeat';el.style.color='transparent';el.textContent=''};
const ytId=u=>{const m=String(u).match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);return m&&m[1]};
const vidHTML=u=>{const id=ytId(u);return id?'<iframe src="https://www.youtube.com/embed/'+id+'?autoplay=1&mute=1&loop=1&playlist='+id+'&playsinline=1&rel=0&modestbranding=1" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>':'<video src="'+esc(u)+'" autoplay muted loop playsinline controls></video>'};
function apply(d){
  if(d.wedding_datetime){const dd=d.wedding_datetime.slice(0,10),p=dp(dd);d.hero_date=p.wd+', '+p.day+' '+p.mon+' '+p.year;target=new Date(d.wedding_datetime+':00+07:00')}
  $$('[data-k]').forEach(el=>{const v=d[el.dataset.k];if(v!=null&&v!=='')el.innerHTML=br(v)});
  ['akad','resepsi'].forEach(k=>{const v=d[k+'_date'];if(!v)return;const p=dp(v),q=x=>$('[data-d="'+k+':'+x+'"]');
    q('wd').textContent=p.wd;q('mon').textContent=p.mon;q('year').textContent=p.year;const n=q('day');n.dataset.n=p.day;n.textContent=p.day});
  $$('[data-link]').forEach(a=>{const v=d[a.dataset.link];if(v){a.href=v;a.target='_blank';a.rel='noopener'}});
  $$('.photo[data-photo]').forEach(ph=>{const u=d[ph.dataset.photo+'_photo'];if(!u)return;
    ph.innerHTML=ph.closest('#cover')?'<img class="hv l" src="'+esc(u)+'" alt=""><img class="hv r" src="'+esc(u)+'" alt="">':'<img src="'+esc(u)+'" alt="">'});
  bg($('#live .img'),d.live_photo);bg($('#gift .img'),d.gift_photo);
  const tl=$$('#story .tl'),im=$$('#story .img');
  (d.story||[]).forEach((it,i)=>{if(!tl[i])return;if(it.title)$('h4',tl[i]).textContent=it.title;if(it.text)$('p',tl[i]).textContent=it.text;bg(im[i],it.photo)});
  if(d.banks&&d.banks.length)$('#banks').innerHTML=d.banks.map(b=>'<div class="bank"><b>'+esc(b.bank)+'</b><p>Silahkan transfer ke rekening<br>a.n '+esc(b.name)+'<br>'+esc(b.number)+'</p><button class="btn" data-cp="'+esc(b.number)+'">&#10064; Copy No.Rek</button></div>').join('');
  $$('[data-cp]').forEach(b=>b.onclick=()=>cp(b.dataset.cp,b));
  const g=$('#gallery .gal'),ph=d.gallery_photos||[];
  if(g&&(d.gallery_video||ph.length)){
    g.innerHTML=(d.gallery_video?'<div class="img rv v" id="vid"><span class="play"></span>Video</div>':'')+ph.map(u=>'<div class="img rv" style="background:#ddd url(\''+esc(u)+'\') center/cover;color:transparent"></div>').join('');
    const v=$('#vid');if(v)new IntersectionObserver(es=>es.forEach(e=>{v.innerHTML=e.isIntersecting?vidHTML(d.gallery_video):'<span class="play"></span>Video'}),{threshold:.5}).observe(v)}
  document.title='The Wedding of '+(d.couple||'');
  if(d.music_url){const a=new Audio(d.music_url);a.loop=true;const dc=$('#disc');
    $('#openBtn').addEventListener('click',()=>{a.play().then(()=>dc.classList.remove('pause')).catch(()=>{})});
    dc.addEventListener('click',()=>dc.classList.contains('pause')?a.pause():a.play().catch(()=>{}))}
}
async function wishes(){
  const {data}=await sb.from('wishes').select('*').order('created_at',{ascending:false}).limit(60);
  const L=$('#list');if(!data)return;L.innerHTML=data.map(w=>'<div><b>'+esc(w.name)+'</b>'+esc(w.message)+'</div>').join('');
  $('#send').onclick=async()=>{const n=$('#who').value.trim()||'Tamu',m=$('#msg').value.trim();if(!m)return;
    const {error}=await sb.from('wishes').insert({name:n.slice(0,80),message:m.slice(0,500)});if(error)return alert('Gagal mengirim ucapan');
    const x=document.createElement('div');x.innerHTML='<b></b>';x.firstChild.textContent=n;x.append(m);L.prepend(x);$('#msg').value=''};
  $('#rsvpSend').onclick=async()=>{const f=$$('#rsvp .form')[0],ins=$$('input',f),r=$$('input[name=k]',f),i=r.findIndex(x=>x.checked);
    const name=ins[0].value.trim();if(!name||i<0)return alert('Isi nama dan konfirmasi kehadiran');
    const {error}=await sb.from('rsvp').insert({name:name.slice(0,80),guests:Math.min(20,Math.max(1,+ins[1].value||1)),attending:i===0});
    $('#rsvpSend').textContent=error?'Gagal':'Terkirim ✓'}
}
window.cfgReady=(async()=>{
  if(!sb)return done();
  try{const {data}=await sb.from('invitation').select('data').eq('id',1).maybeSingle();if(data&&data.data)apply(data.data);await wishes()}catch(e){console.warn(e)}
  done()
})();
})();
