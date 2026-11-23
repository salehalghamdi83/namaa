// =====================================================================
// منصة نماء المستقلة: Supabase + قدرات المتصفح (ميكروفون، صوت، إشعارات)
// =====================================================================
const CFG=window.NAMAA_CONFIG||{};
let sb=null,myDev=null,fid=null,rtChan=null;
const DEVKEY='namaa-dev';
function sbInit(){if(sb)return sb;if(!window.supabase||!CFG.url||!CFG.anonKey||/xxxx/.test(CFG.url))return null;
 sb=window.supabase.createClient(CFG.url,CFG.anonKey,{auth:{persistSession:true,autoRefreshToken:true,storageKey:'namaa-auth'}});return sb}
async function ensureSession(){const g=await sb.auth.getSession();if(g.data&&g.data.session)return g.data.session;const r=await sb.auth.signInAnonymously();if(r.error)throw r.error;return r.data.session}
function setDev(d){myDev=d?{family_id:d.family_id,member_id:d.member_id,role:d.role,code:d.code,family_name:d.family_name}:null;
 fid=myDev?myDev.family_id:null;me=myDev?myDev.member_id:null;isOwner=!!myDev&&myDev.role==='father';
 try{if(myDev)localStorage.setItem(DEVKEY,JSON.stringify(myDev));else localStorage.removeItem(DEVKEY)}catch(e){}
 try{if(myDev)localStorage.setItem('namaa-lastcode',myDev.code)}catch(e){}saveLocal()}
function loadDevLocal(){try{const d=JSON.parse(localStorage.getItem(DEVKEY)||'null');if(d)setDev(d)}catch(e){}}
const errAr=e=>({bad_code:'رمز العائلة غير صحيح',bad_member:'هذا الاسم غير موجود',bad_secret:'الرمز السري غير صحيح',locked:'محاولات كثيرة خاطئة. انتظر 15 دقيقة ثم حاول',no_secret:'لم يحدد الأب رمزًا سريًا لهذا الحساب بعد',weak_password:'كلمة المرور قصيرة (6 أحرف على الأقل)',already_linked:'هذا الجهاز مسجّل في عائلة بالفعل',forbidden:'هذه العملية للأب فقط',weak_secret:'الرمز السري قصير (4 أرقام على الأقل)'}[e]||'حدث خطأ، تحقق من الاتصال وحاول مرة أخرى');
const rpcErr=err=>{const m=String(err&&err.message||'');for(const k of['bad_code','bad_member','bad_secret','locked','weak_password','already_linked','forbidden','weak_secret','no_secret'])if(m.includes(k))return k;return 'net'};

// ---------- طبقة البيانات (نفس واجهة db السابقة) ----------
const REM={},SNAP={};let remLoaded=false;
const snapOf=p=>({exists:Object.prototype.hasOwnProperty.call(REM,p),data:()=>REM[p],metadata:{fromCache:!remLoaded,hasPendingWrites:false}});
function dispatch(p){(SNAP[p]||[]).forEach(cb=>{try{cb(snapOf(p))}catch(e){}})}
const netErr=e=>{const m=String(e&&(e.message||e.code)||'');return /row-level|42501|permission/i.test(m)?{code:'invalid_argument'}:{code:'unavailable'}};
function makeDB(){return{doc:path=>({
 async get(){if(remLoaded)return snapOf(path);const r=await sb.from('docs').select('data').eq('family_id',fid).eq('path',path).maybeSingle();if(r.error)throw netErr(r.error);if(r.data)REM[path]=r.data.data;return snapOf(path)},
 async set(data){const r=await sb.from('docs').upsert({family_id:fid,path,data,updated_at:new Date().toISOString()});if(r.error)throw netErr(r.error);REM[path]=data},
 async delete(){const r=await sb.from('docs').delete().eq('family_id',fid).eq('path',path);if(r.error)throw netErr(r.error);delete REM[path]},
 onSnapshot(cb){(SNAP[path]=SNAP[path]||[]).push(cb);if(remLoaded)setTimeout(()=>cb(snapOf(path)),0);return()=>{SNAP[path]=(SNAP[path]||[]).filter(f=>f!==cb)}}
})}}
async function loadAll(){const r=await sb.from('docs').select('path,data').eq('family_id',fid);if(r.error)throw r.error;
 for(const k of Object.keys(REM))delete REM[k];for(const row of r.data||[])REM[row.path]=row.data;remLoaded=true;Object.keys(SNAP).forEach(dispatch);
 // مستندات لم تُسجَّل عليها متابعة بعد (مثل أبناء أُضيفوا للتو)
 for(const p of Object.keys(REM))if(!C[p]&&!dirty[p]){C[p]=clone(REM[p])}saveLocal();queueRender()}
function startRealtime(){if(rtChan||!sb||!fid)return;
 rtChan=sb.channel('fam-'+fid).on('postgres_changes',{event:'*',schema:'public',table:'docs',filter:'family_id=eq.'+fid},pl=>{
  if(pl.eventType==='DELETE'){const p=pl.old&&pl.old.path;if(p){delete REM[p];dispatch(p)}return}
  const row=pl.new;if(!row||!row.path)return;REM[row.path]=row.data;
  if(!SNAP[row.path]&&!dirty[row.path]){C[row.path]=clone(row.data);saveLocal();queueRender()}
  dispatch(row.path)}).subscribe(st=>{if(st==='SUBSCRIBED'&&remLoaded)loadAll().catch(()=>{})});
}
const resync=()=>{if(sb&&fid&&online())loadAll().then(()=>flush()).catch(()=>{})};
document.addEventListener('visibilitychange',()=>{if(!document.hidden)resync()});
window.addEventListener('online',resync);

// ---------- الذكاء الاصطناعي عبر الخادم ----------
async function aiCall(input,opts={}){
 const r=await sb.functions.invoke('ai',{body:{input,json:!!opts.json,tier:opts.modelTier||'default'}});
 if(r.error){let code='unavailable';try{const b=await r.error.context.json();if(b&&b.error==='limit')code='rate_limited'}catch(e){}throw{code}}
 return r.data;
}
function makeSample(){const f=async(input,opts={})=>{const d=await aiCall(input,opts);const text=(d&&d.text)||'';if(opts.onText)opts.onText({text,delta:text});return{text,truncated:false}};
 f.json=async(input)=>{const d=await aiCall(input,{json:true});const t=(d&&d.text)||'';const a=t.search(/[\[{]/),b=Math.max(t.lastIndexOf('}'),t.lastIndexOf(']'));if(a<0||b<a)throw{code:'invalid_json'};return JSON.parse(t.slice(a,b+1))};
 return f}

// ---------- الإملاء الصوتي (ميكروفون المتصفح مباشرة) ----------
function makeDictation(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR)return null;
 let rec=null;const H={p:[],f:[],s:[]};const emit=(k,v)=>H[k].forEach(fn=>{try{fn(v)}catch(e){}});
 const D={lang:'ar-SA',onPartial:fn=>H.p.push(fn),onFinal:fn=>H.f.push(fn),onState:fn=>H.s.push(fn),
  start(){return new Promise((res,rej)=>{try{rec=new SR();rec.lang=D.lang;rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
   rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const r=e.results[i];if(r.isFinal)emit('f',{text:r[0].transcript});else interim+=r[0].transcript}if(interim)emit('p',{text:interim})};
   rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed')rej({code:'not_granted'})};
   rec.onstart=()=>{emit('s',{state:'listening'});res()};rec.onend=()=>{rec=null;emit('s',{state:'idle',reason:'stopped'})};rec.start()}catch(e){rej({code:'failed'})}})},
  stop(){return new Promise(r=>{if(!rec)return r();try{rec.stop()}catch(e){}setTimeout(r,400)})}};
 return D}

// ---------- القراءة الصوتية (من الجهاز) ----------
function makeTTS(){const ss=window.speechSynthesis;if(!ss)return null;const H=[];
 const pick=l=>{const vs=ss.getVoices();return vs.find(v=>v.lang&&v.lang.toLowerCase().replace('_','-').startsWith(l.toLowerCase()))||vs.find(v=>v.lang&&v.lang.toLowerCase().startsWith(l.slice(0,2)))};
 return{onState:fn=>H.push(fn),stop(){ss.cancel()},speak(text,o={}){return new Promise((res,rej)=>{const lang={ar:'ar-SA',en:'en-US',fr:'fr-FR',es:'es-ES',de:'de-DE',tr:'tr-TR',it:'it-IT',zh:'zh-CN',ja:'ja-JP',ko:'ko-KR',ru:'ru-RU',ur:'ur-PK'}[o.language||'ar']||o.language;
  ss.cancel();const u=new SpeechSynthesisUtterance(String(text));u.lang=lang;const v=pick(lang);if(v)u.voice=v;u.rate=o.rate||.95;
  u.onstart=()=>H.forEach(f=>f({state:'speaking'}));u.onend=()=>{H.forEach(f=>f({state:'idle',reason:'completed'}));res()};u.onerror=()=>{H.forEach(f=>f({state:'idle'}));res()};ss.speak(u)})}}}

// ---------- تخزين التسجيلات ----------
function makeAssets(){return{
 async upload(blob){const ext=(blob.type.split('/')[1]||'webm').split(';')[0];const path=fid+'/'+rid()+'.'+ext;const r=await sb.storage.from('audio').upload(path,blob,{contentType:blob.type||'audio/webm',upsert:false});if(r.error)throw r.error;return{id:path,url:null}},
 async delete(id){await sb.storage.from('audio').remove([id])}}}
const PLATFORM_CAPS={sample:()=>sb?makeSample():null,dictation:()=>makeDictation(),tts:()=>makeTTS(),assets:()=>sb?makeAssets():null,db:()=>null,user:()=>null};

// ---------- المسجّل المباشر (MediaRecorder) ----------
let recCur=null;
function setRec(key,blob){RECS[key]=blob;const box=document.getElementById('rp_'+key);
 if(box)box.innerHTML=`<audio controls src="${URL.createObjectURL(blob)}" style="width:100%;margin-top:10px"></audio><p class="mut">تسجيلك جاهز (${Math.round(blob.size/1024)} ك.ب) — استمع له ثم أرسله، أو سجّل من جديد.</p>`;
 const go=document.querySelector(`[data-needs="${key}"]`);if(go)go.disabled=false}
const fmtSec=s=>Math.floor(s/60)+':'+pad(s%60);
A.recToggle=async el=>{const key=el.dataset.key;
 if(recCur){if(recCur.key===key)recCur.mr.stop();else toast('أوقف التسجيل الحالي أولًا');return}
 if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia||!window.MediaRecorder){const fi=el.parentElement.querySelector('input[type=file]');if(fi)fi.click();return}
 let stream;try{stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}})}
 catch(e){modal(`<h2>اسمح باستخدام الميكروفون</h2><p>رفض المتصفح الوصول إلى الميكروفون. اضغط على رمز القفل بجانب عنوان الموقع في الأعلى، ثم اختر «الأذونات» وفعّل «الميكروفون»، ثم أعد المحاولة.</p><button class="btn pri" data-a="close" style="margin-top:12px">حسنًا</button>`);return}
 const type=['audio/webm;codecs=opus','audio/mp4','audio/webm','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
 const mr=new MediaRecorder(stream,type?{mimeType:type,audioBitsPerSecond:32000}:undefined);const chunks=[],t0=Date.now();
 mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
 const lab=el.querySelector('.rl'),tm=el.querySelector('.rt');
 const timer=setInterval(()=>{const s=Math.floor((Date.now()-t0)/1000);if(tm)tm.textContent=fmtSec(s);if(s>=900)mr.stop()},500);
 mr.onstop=()=>{clearInterval(timer);stream.getTracks().forEach(t=>t.stop());recCur=null;el.classList.remove('on');if(lab)lab.textContent='سجّل من جديد';
  const blob=new Blob(chunks,{type:(mr.mimeType||type||'audio/webm').split(';')[0]});if(blob.size<1500){toast('التسجيل قصير جدًا');return}setRec(key,blob)};
 mr.start(1000);recCur={key,mr};el.classList.add('on');if(lab)lab.textContent='إيقاف التسجيل';if(tm)tm.textContent='0:00'};
function stopRecording(){if(recCur)try{recCur.mr.stop()}catch(e){}}

// ---------- الإشعارات ----------
let ntfQ={},ntfT=null;
function notifyParents(k,label){if(!sb||PM()||!myDev)return;(ntfQ[k]=ntfQ[k]||[]).push(label);clearTimeout(ntfT);ntfT=setTimeout(sendNtf,12000)}
async function sendNtf(){const q=ntfQ;ntfQ={};for(const k in q){const L=q[k],n=L.length,m=M(k);if(!m)continue;
 try{await sb.functions.invoke('notify',{body:{to:'parents',title:`${m.name}: ${n===1?'إنجاز':n+' إنجازات'} بانتظار تأكيدك`,body:L.slice(0,4).join('، ')+(n>4?` و${n-4} غيرها`:'')}})}catch(e){}}}
const b64u=s=>{const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(b,c=>c.charCodeAt(0))};
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone=()=>window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
async function enablePush(){
 if(isIOS()&&!isStandalone()){modal(`<h2>على آيفون: ثبّت الموقع أولًا</h2><ol><li>اضغط زر المشاركة في Safari.</li><li>اختر «إضافة إلى الشاشة الرئيسية».</li><li>افتح نماء من أيقونته، ثم فعّل الإشعارات من هنا.</li></ol><button class="btn pri" data-a="close">حسنًا</button>`);return}
 if(!('serviceWorker' in navigator)||!('PushManager' in window)||!window.Notification){toast('هذا المتصفح لا يدعم الإشعارات');return}
 if(!CFG.vapidPublic){toast('مفتاح الإشعارات غير مضبوط في config.js');return}
 const perm=await Notification.requestPermission();if(perm!=='granted'){toast('لم يُسمح بالإشعارات — فعّلها من إعدادات المتصفح');return}
 try{const reg=await navigator.serviceWorker.ready;let s=await reg.pushManager.getSubscription();if(!s)s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(CFG.vapidPublic)});
  const j=s.toJSON();const r=await sb.rpc('save_push',{p_endpoint:j.endpoint,p_sub:j});if(r.error)throw r.error;localStorage.setItem('namaa-push','1');toast('تم تفعيل الإشعارات على هذا الجهاز');queueRender()}
 catch(e){toast('تعذّر تفعيل الإشعارات')}}
A.enablePush=()=>enablePush();
const pushOn=()=>{try{return window.Notification&&Notification.permission==='granted'&&localStorage.getItem('namaa-push')==='1'}catch(e){return false}};

// ---------- شاشات الدخول ----------
function welcomeView(){
 if(!sb)return topLite()+`<div class="wrap"><div class="card" style="margin-top:30px"><h2>الموقع غير مضبوط بعد</h2><p>املأ ملف <b>config.js</b> بعنوان مشروع Supabase ومفتاحه كما في دليل التشغيل.</p></div></div>`;
 const st=T.join||{};let last='';try{last=localStorage.getItem('namaa-lastcode')||''}catch(e){}
 if(st.step==='members')return topLite()+`<section class="hero"><div class="in"><div><h1>${esc(st.fname||'عائلتك')}</h1><p>اختر اسمك</p></div></div></section><div class="wrap"><div class="grid2" style="margin-top:-40px">
  ${st.members.map(m=>`<button class="btn" style="justify-content:flex-start;min-height:72px;background:var(--card)" data-a="joinPick" data-id="${esc(m.member_id)}"><span class="rank" style="background:${esc(m.color||'#0d5345')};color:#fff">${esc((m.name||'؟')[0])}</span><span><b>${esc(m.name)}</b><br><span class="mut">${{father:'الأب',mother:'الأم',child:'ابن / ابنة'}[m.role]}${m.has_secret?'':' · لم يُحدَّد رمز'}</span></span></button>`).join('')}</div>
  <button class="btn ghost" style="margin-top:14px" data-a="joinBack">${ic('back')} رمز عائلة آخر</button></div>`;
 return topLite()+`<section class="hero"><div class="in"><div><h1>أهلًا بك في نماء</h1><p>متابعة نمو الأبناء يومًا بيوم: الدراسة، الشخصية، اللغات، القرآن، الصلاة، المال، الوقت، الترفيه والمكافآت.</p></div></div></section>
 <div class="wrap"><form class="card" data-f="joinCode" style="margin-top:-40px"><h2>الدخول إلى عائلتك</h2><label>رمز العائلة</label><input name="c" required dir="ltr" placeholder="NAMAA-123456" value="${esc(last)}" autocapitalize="characters" style="font-size:20px;letter-spacing:1px"><button class="btn pri" style="margin-top:12px;width:100%">متابعة</button>${st.err?`<p style="color:var(--co)">${esc(st.err)}</p>`:''}</form>
 <div class="card"><h2>أنا الأب: أريد إنشاء عائلة جديدة</h2><p class="mut">مرة واحدة فقط. ستحصل على رمز العائلة لتسجيل دخول الأم والأبناء.</p><button class="btn acc" data-a="newFamily" style="margin-top:8px">${ic('plus')} إنشاء عائلة</button></div></div>`;
}
F.joinCode=async(f,d)=>{T.join={busy:1};try{await ensureSession();const r=await sb.rpc('family_members',{p_code:d.c});if(r.error)throw r.error;
 if(!r.data||!r.data.length){T.join={err:'رمز العائلة غير صحيح'};render(true);return}
 T.join={step:'members',code:d.c.trim().toUpperCase(),members:r.data,fname:''};render(true)}catch(e){T.join={err:online()?'تعذّر الاتصال بالخادم':'لا يوجد اتصال بالإنترنت'};render(true)}};
A.joinBack=()=>{T.join={};render(true)};
A.joinPick=el=>{const m=T.join.members.find(x=>x.member_id===el.dataset.id);const parent=m.role!=='child';
 modal(`<form data-f="joinSecret" data-id="${esc(m.member_id)}"><h2>${esc(m.name)}</h2><label>${parent?'كلمة المرور':'رمزك السري'}</label><input name="p" type="password" ${parent?'':'inputmode="numeric"'} autocomplete="current-password" required style="font-size:22px;letter-spacing:4px;text-align:center"><div class="row" style="margin-top:12px"><button class="btn pri">دخول</button><button type="button" class="btn" data-a="close">إلغاء</button></div><p id="jerr" style="color:var(--co)"></p></form>`);
 setTimeout(()=>{const i=$('.modal input');i&&i.focus()},50)};
F.joinSecret=async(f,d)=>{const e=$('#jerr');try{await ensureSession();
 const r=await sb.rpc('join_family',{p_code:T.join.code,p_member_id:f.dataset.id,p_secret:d.p,p_label:deviceLabel()});
 if(r.error)throw r.error;const j=r.data||{};if(!j.ok){if(e)e.textContent=errAr(j.error)+(j.left!=null&&j.left>=0?` (متبقٍ ${j.left} محاولات)`:'');return}
 C={};dirty={};setDev(j);closeModal();T.join=null;await afterLogin();go({n:'home'});toast('أهلًا '+(M(me)?.name||''))}
 catch(x){if(e)e.textContent=errAr(rpcErr(x))}};
const deviceLabel=()=>{const u=navigator.userAgent;return(/iPhone/.test(u)?'آيفون':/iPad/.test(u)?'آيباد':/Android/.test(u)?'أندرويد':/Windows/.test(u)?'ويندوز':/Mac/.test(u)?'ماك':'جهاز')+' · '+new Date().toLocaleDateString('ar-SA-u-nu-latn')};
A.newFamily=()=>{T.newFam=true;render(true)};

// تسجيل خروج هذا الجهاز
async function deviceLogout(){try{if(sb&&online())await sb.rpc('leave_device')}catch(e){}
 try{const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();const s=reg&&await reg.pushManager.getSubscription();if(s)await s.unsubscribe()}catch(e){}
 try{localStorage.removeItem('namaa-push')}catch(e){}
 if(rtChan){try{sb.removeChannel(rtChan)}catch(e){}rtChan=null}
 C={};dirty={};for(const k of Object.keys(REM))delete REM[k];remLoaded=false;setDev(null);saveLocal();T={};go({n:'home'})}

// بعد الدخول/الإنشاء
async function afterLogin(){db=makeDB();startRealtime();try{await loadAll()}catch(e){}cfgSeen=true;ensureSubs();flush();queueRender()}

// ---------- إدارة الأجهزة والاستيراد (للأب) ----------
A.devList=async()=>{try{const r=await sb.rpc('list_devices');if(r.error)throw r.error;T.devs=r.data||[];render(true)}catch(e){toast('تعذّر جلب الأجهزة')}};
A.devRevoke=el=>ask('سحب الدخول من هذا الجهاز؟',async()=>{const r=await sb.rpc('revoke_device',{p_user_id:el.dataset.id});if(r.error)toast('تعذّر');else{toast('سُحب الدخول');A.devList()}});
A.showCode=()=>modal(`<h2>رمز العائلة</h2><p class="big-n" dir="ltr" style="text-align:center;margin:14px 0">${esc(myDev.code)}</p><p>على جهاز كل فرد: افتح الموقع ← أدخل هذا الرمز ← اختر الاسم ← أدخل الرمز السري. يبقى الجهاز مسجّلًا بعدها.</p><div class="row" style="margin-top:12px"><button class="btn pri" data-a="copyCode">نسخ الرمز</button><button class="btn" data-a="close">إغلاق</button></div>`);
A.copyCode=()=>{try{navigator.clipboard.writeText(myDev.code);toast('نُسخ الرمز')}catch(e){toast(myDev.code)}};
// ---------- استيراد بيانات نماء السابق ----------
function parseImport(txt){const j=JSON.parse(String(txt).trim());const docs=j.docs||j;if(!docs||typeof docs!=='object'||!docs['fam/config'])throw 0;return docs}
async function importDocs(docs){
 const cfgD=docs['fam/config'];const pins={};
 for(const m of cfgD.members||[]){if(m.pin)pins[m.id]=String(m.pin);delete m.pin}
 if(cfgD.settings)cfgD.settings.parentPin='';
 for(const[p,v]of Object.entries(docs)){if(!/^(fam|plans|kids|logs)\//.test(p)||!v||typeof v!=='object')continue;
  if(p.startsWith('logs/'))for(const d of Object.values(v.days||{}))if(d&&d.ev)for(const k of Object.keys(d.ev))if(d.ev[k]&&d.ev[k].a==='db')delete d.ev[k];
  if(p.startsWith('kids/')&&v.quran&&v.quran.log)for(const l of v.quran.log)if(l.audio&&l.audio.a==='db')l.audio=null;
  C[p]=v;dirty[p]=++rev}
 saveLocal();ensureSubs();await flush();
 let noPin=[];
 for(const m of cfgD.members||[]){
  if(m.role==='father'){await sb.rpc('set_member',{p_member_id:'father',p_name:m.name,p_role:'father',p_color:null,p_secret:null});continue}
  const sec=pins[m.id]&&pins[m.id].length>=4?pins[m.id]:null;if(!sec)noPin.push(m.name);
  const r=await sb.rpc('set_member',{p_member_id:m.id,p_name:m.name,p_role:m.role,p_color:m.color||null,p_secret:sec});if(r.error)throw r.error}
 return noPin}
F.setupImport=async(f,d)=>{let docs;try{docs=parseImport(d.imp)}catch(e){toast('البيانات الملصقة غير صالحة — انسخها من زر «تصدير كل البيانات» في نماء السابق');return}
 const btn=f.querySelector('button.pri');if(btn){btn.disabled=true;btn.textContent='جارٍ النقل…'}
 try{await ensureSession();const fname=(docs['fam/config'].members||[]).find(m=>m.role==='father');const nm=d.fn.trim()||fname&&fname.name||'الأب';
  if(!myDev){const r=await sb.rpc('create_family',{p_family_name:'عائلة '+nm,p_father_name:nm,p_password:d.pw});if(r.error)throw r.error;
   const row=r.data[0];setDev({family_id:row.family_id,member_id:'father',role:'father',code:row.code,family_name:'عائلة '+nm});db=makeDB();startRealtime();remLoaded=true;cfgSeen=true}
  const fm=(docs['fam/config'].members||[]).find(m=>m.role==='father');if(fm)fm.name=nm;
  const noPin=await importDocs(docs);T.newFam=false;go({n:'home'});A.showCode();
  toast(noPin.length?`نُقلت البيانات. حدّد رمزًا سريًا لـ: ${noPin.join('، ')}`:'نُقلت كل البيانات، والأبناء يدخلون برموزهم السابقة نفسها')}
 catch(e){toast(errAr(rpcErr(e)));if(btn){btn.disabled=false;btn.textContent='إنشاء العائلة ونقل البيانات'}}};
document.addEventListener('change',async e=>{const i=e.target;if(!i.files||!i.files[0])return;
 if(i.id==='impFileSetup'){const ta=document.querySelector('textarea[name=imp]');if(ta)ta.value=await i.files[0].text();return}
 if(i.id!=='importFile')return;
 try{const docs=parseImport(await i.files[0].text());const noPin=await importDocs(docs);toast(noPin.length?`استُوردت البيانات. حدّد رمزًا لـ: ${noPin.join('، ')}`:'استُوردت كل البيانات');render(true)}
 catch(x){toast('ملف غير صالح')}});

// ---------- إعدادات إضافية + تقييم حضوري ----------
const _setP=F.settings;
F.settings=(f,d)=>{const st=S();const q=Math.round(num(d.qp));st.quranPass=q>0&&q<=100?q:80;_setP(f,d);
 if(d.fpw){if(d.fpw.length<6){toast('كلمة المرور 6 أحرف على الأقل');return}
  sb.rpc('set_member',{p_member_id:'father',p_name:(M('father')||{}).name||'الأب',p_role:'father',p_color:null,p_secret:d.fpw}).then(r=>toast(r.error?errAr(rpcErr(r.error)):'تم تغيير كلمة مرور الأب'))}};
A.qApprove=el=>{const k=el.dataset.k,p=quranPortion(k);
 modal(`<form data-f="qLive" data-k="${k}"><h2>تقييم حضوري</h2><p>سورة ${p.s.n}: ${p.from}–${p.to}</p><label>الدرجة من 100 (النجاح ${S().quranPass||80})</label><input name="s" type="number" min="0" max="100" required inputmode="numeric" style="font-size:22px"><label>ملاحظة (اختياري)</label><input name="n"><div class="row" style="margin-top:12px"><button class="btn pri">اعتماد</button><button type="button" class="btn" data-a="close">إلغاء</button></div></form>`)};
F.qLive=(f,d)=>{const k=f.dataset.k,q=kidS(k).quran,p=quranPortion(k),sc=clamp(Math.round(num(d.s)),0,100),pass=sc>=(+S().quranPass||80);
 q.log.push({at:stamp(),what:`سورة ${p.s.n} ${p.from}–${p.to} (حضوري)`,surah:q.surah,from:p.from,st:pass?'ok':'retry',score:sc,note:d.n||'',by:me});
 if(pass){quranAdvance(k);markAuto(k,'q:hifz',Math.max(1,Math.round(2*(+S().pts||10)*sc/100)))}touchKid(k);closeModal();toast(pass?'اعتُمد التسميع':'يحتاج إعادة')};
