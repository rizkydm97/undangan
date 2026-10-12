const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=t=>String(t==null?'':t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sb=supabase.createClient(SB.url,SB.key);let D={},tab='c';
const toast=t=>{const m=$('#msg');m.textContent=t;m.style.display='block';clearTimeout(m._t);m._t=setTimeout(()=>m.style.display='none',2600)};
const get=(o,p)=>p.split('.').reduce((a,k)=>a==null?a:a[k],o);
const set=(o,p,v)=>{const ks=p.split('.');let a=o;ks.slice(0,-1).forEach((k,i)=>{if(a[k]==null)a[k]=/^\d+$/.test(ks[i+1])?[]:{};a=a[k]});a[ks[ks.length-1]]=v};
const P=(w,n)=>[['Pasangan',[['couple','Nama pasangan (cover, hero, footer)','text'],['couple_photo','Foto pasangan (cover, hero, penutup)','img'],['groom_name','Nama mempelai pria','text'],['groom_ig','Instagram pria','text'],['groom_parents','Orang tua pria','text'],['groom_photo','Foto mempelai pria','img'],['bride_name','Nama mempelai wanita','text'],['bride_ig','Instagram wanita','text'],['bride_parents','Orang tua wanita','text'],['bride_photo','Foto mempelai wanita','img']]]];
const S=[...P(),
['Waktu & Tempat',[['wedding_datetime','Tanggal & jam hitung mundur (WIB)','datetime-local'],['hero_text','Kalimat di bawah nama (hero)','area'],['event_intro','Kalimat pengantar acara','area'],
 ['akad_date','Tanggal Akad Nikah','date'],['akad_time','Jam Akad (contoh: 07.00 WIB)','text'],['akad_place','Lokasi Akad','area'],['akad_map','Link Google Maps Akad','url'],
 ['resepsi_date','Tanggal Resepsi','date'],['resepsi_time','Jam Resepsi (contoh: 15.00 - 17.00 WIB)','text'],['resepsi_place','Lokasi Resepsi','area'],['resepsi_map','Link Google Maps Resepsi','url']]],
['Ayat & Sambutan',[['verse_title','Judul ayat','text'],['verse_ar','Teks Arab','area'],['verse_id','Terjemahan','area'],['salam_open','Salam pembuka','text'],['opening_text','Teks pembuka','area'],['closing_text','Teks penutup','area'],['closing_salam','Salam penutup','text']]],
['Live Streaming',[['live_text','Teks','area'],['live_link','Link live streaming','url'],['live_photo','Foto','img']]],
['Our Story',[['story','Perjalanan cinta','list',[['title','Judul','text'],['text','Cerita','area'],['photo','Foto','img']],'Cerita']]],
['Galeri',[['gallery_video','Link video galeri (YouTube atau .mp4) - otomatis diputar','url'],['gallery_photos','Foto galeri','imgs']]],
['Hadiah',[['gift_text','Teks hadiah','area'],['gift_photo','Foto','img'],['banks','Rekening','list',[['bank','Nama bank','text'],['name','Atas nama','text'],['number','Nomor rekening','text']],'Rekening']]],
['Musik',[['music_url','Musik latar (.mp3)','aud']]]];
function fld(p,l,t){const v=get(D,p)||'';
 if(t==='img')return `<div class="f"><label>${l}</label><div class="im">${v?`<img src="${esc(v)}">`:'<i>Belum ada foto</i>'}<button type="button" data-up="${p}">Unggah foto</button>${v?`<button type="button" class="g" data-clr="${p}">Hapus</button>`:''}</div></div>`;
 if(t==='aud')return `<div class="f"><label>${l}</label><input data-p="${p}" value="${esc(v)}" placeholder="https://... atau unggah"><div class="im" style="margin-top:6px"><button type="button" data-upa="${p}">Unggah file musik</button></div></div>`;
 if(t==='area')return `<div class="f"><label>${l}</label><textarea data-p="${p}" rows="3">${esc(v)}</textarea></div>`;
 return `<div class="f"><label>${l}</label><input type="${t}" data-p="${p}" value="${esc(v)}"></div>`}
function sec([title,fs]){return `<div class="box"><h2>${title}</h2>${fs.map(([p,l,t,sub,nm])=>{
 if(t==='list')return `<div class="f"><label>${l}</label>${(get(D,p)||[]).map((it,i)=>`<div class="it"><b>${nm} ${i+1}</b><button type="button" class="g" data-del="${p}.${i}">Hapus</button>${sub.map(([k,lb,tt])=>fld(`${p}.${i}.${k}`,lb,tt)).join('')}</div>`).join('')}<button type="button" class="g" data-add="${p}">+ Tambah ${nm}</button></div>`;
 if(t==='imgs')return `<div class="f"><label>${l}</label><div class="gl">${(get(D,p)||[]).map((u,i)=>`<div><img src="${esc(u)}"><button type="button" class="g" data-del="${p}.${i}">×</button></div>`).join('')}</div><button type="button" data-upm="${p}">+ Unggah foto (boleh banyak)</button></div>`;
 return fld(p,l,t)}).join('')}</div>`}
const NEW={story:{title:'',text:'',photo:''},banks:{bank:'',name:'',number:''}};
function pick(multi,acc){return new Promise(r=>{const i=document.createElement('input');i.type='file';i.accept=acc;i.multiple=multi;i.onchange=()=>r([...i.files]);i.click()})}
function rs(f){return new Promise(r=>{if(!f.type.startsWith('image/')||f.type==='image/gif')return r({blob:f,type:f.type,ext:(f.name.split('.').pop()||'bin').toLowerCase()});const i=new Image();i.onload=()=>{const k=Math.min(1,1600/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);c.toBlob(b=>r({blob:b,type:'image/jpeg',ext:'jpg'}),'image/jpeg',.85)};i.src=URL.createObjectURL(f)})}
async function up(f){const x=await rs(f),n='u/'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.'+x.ext;const {error}=await sb.storage.from('media').upload(n,x.blob,{contentType:x.type,cacheControl:'31536000'});if(error)throw error;return sb.storage.from('media').getPublicUrl(n).data.publicUrl}
function draw(){const v=$('#view');if(tab==='c'){const y=scrollY;v.innerHTML=S.map(sec).join('');scrollTo(0,y);bind()}else if(tab==='w')wishes();else rsvp()}
function bind(){const v=$('#view');
 $$('[data-p]',v).forEach(e=>e.oninput=()=>set(D,e.dataset.p,e.value));
 $$('[data-up]',v).forEach(b=>b.onclick=async()=>{const [f]=await pick(false,'image/*');if(!f)return;toast('Mengunggah...');try{set(D,b.dataset.up,await up(f));draw();toast('Terunggah. Klik Simpan.')}catch(e){toast('Gagal: '+e.message)}});
 $$('[data-upa]',v).forEach(b=>b.onclick=async()=>{const [f]=await pick(false,'audio/*');if(!f)return;toast('Mengunggah...');try{set(D,b.dataset.upa,await up(f));draw();toast('Terunggah. Klik Simpan.')}catch(e){toast('Gagal: '+e.message)}});
 $$('[data-upm]',v).forEach(b=>b.onclick=async()=>{const fs=await pick(true,'image/*');if(!fs.length)return;toast('Mengunggah '+fs.length+' foto...');try{const a=get(D,b.dataset.upm)||[];for(const f of fs)a.push(await up(f));set(D,b.dataset.upm,a);draw();toast('Terunggah. Klik Simpan.')}catch(e){toast('Gagal: '+e.message)}});
 $$('[data-clr]',v).forEach(b=>b.onclick=()=>{set(D,b.dataset.clr,'');draw()});
 $$('[data-del]',v).forEach(b=>b.onclick=()=>{const ks=b.dataset.del.split('.'),i=+ks.pop();get(D,ks.join('.')).splice(i,1);draw()});
 $$('[data-add]',v).forEach(b=>b.onclick=()=>{const p=b.dataset.add;(D[p]=D[p]||[]).push({...NEW[p]});draw()})}
async function wishes(){const {data,error}=await sb.from('wishes').select('*').order('created_at',{ascending:false});
 $('#view').innerHTML=`<div class="box"><h2>Ucapan (${(data||[]).length})</h2><table>${(data||[]).map(w=>`<tr><td><b>${esc(w.name)}</b><br>${esc(w.message)}<br><small>${new Date(w.created_at).toLocaleString('id-ID')}</small></td><td><button class="g" data-w="${w.id}">Hapus</button></td></tr>`).join('')||'<tr><td>Belum ada ucapan</td></tr>'}</table></div>`;
 $$('[data-w]').forEach(b=>b.onclick=async()=>{if(!confirm('Hapus ucapan ini?'))return;await sb.from('wishes').delete().eq('id',b.dataset.w);wishes()})}
async function rsvp(){const {data}=await sb.from('rsvp').select('*').order('created_at',{ascending:false}),a=(data||[]).filter(x=>x.attending);
 $('#view').innerHTML=`<div class="box"><h2>RSVP: ${a.length} hadir (${a.reduce((s,x)=>s+x.guests,0)} orang), ${(data||[]).length-a.length} tidak hadir</h2><table><tr><th>Nama</th><th>Tamu</th><th>Status</th><th></th></tr>${(data||[]).map(r=>`<tr><td>${esc(r.name)}</td><td>${r.guests}</td><td>${r.attending?'Hadir':'Tidak hadir'}</td><td><button class="g" data-r="${r.id}">×</button></td></tr>`).join('')}</table></div>`;
 $$('[data-r]').forEach(b=>b.onclick=async()=>{await sb.from('rsvp').delete().eq('id',b.dataset.r);rsvp()})}
async function load(){const {data}=await sb.from('invitation').select('data').eq('id',1).maybeSingle();D={...DEF,...((data&&data.data)||{})};draw()}
async function show(sess){$('#login').hidden=!!sess;$('#app').hidden=!sess;if(sess)load()}
$('#go').onclick=async()=>{const {error}=await sb.auth.signInWithPassword({email:$('#em').value.trim(),password:$('#pw').value});$('#lerr').textContent=error?'Email atau password salah':''};
$('#pw').onkeydown=e=>{if(e.key==='Enter')$('#go').click()};
$('#out').onclick=()=>sb.auth.signOut();
$('#save').onclick=async()=>{const {error}=await sb.from('invitation').upsert({id:1,data:D,updated_at:new Date().toISOString()});toast(error?'Gagal menyimpan: '+error.message:'Tersimpan ✓ - undangan sudah diperbarui')};
$$('.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;$$('.tabs button').forEach(x=>x.classList.toggle('on',x===b));draw()});
sb.auth.onAuthStateChange((_e,s)=>show(s));sb.auth.getSession().then(({data})=>show(data.session));
