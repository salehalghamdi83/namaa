function bindMe(){}
// ================= اعتماد الوالدين =================
const NOVER=['mentor','fun','rewards'];
const needsVer=sec=>!NOVER.includes(sec)&&!(S().verifyOff||[]).includes(sec);
const verOf=(k,d,id)=>((peekDay(k,d)||{}).ver||{})[id];
function verAuto(k,id,date=TODAY()){const L=dayLog(k,date);L.ver||={};if(PM())L.ver[id]={s:'ok',by:me,at:stamp(),auto:1};else{delete L.ver[id];const t=todayTasks(k,date).find(x=>x.id===id);if(t&&needsVer(t.sec)&&id!=='mentor:checkin')notifyParents(k,t.label.replace(/^(واجب|درس [^:]*): /,''))}}
function markVer(k,d,id,s,extra){const L=dayLog(k,d);L.ver||={};L.ver[id]=Object.assign({s,by:me,at:stamp()},extra||{});touchLog(k,d)}
function verTag(k,t,date=TODAY()){
 if(!needsVer(t.sec)||t.kind==='mission'||t.id==='mentor:checkin')return'';const v=verOf(k,date,t.id);
 if(t.done){if(!v)return' <span class="tag mid">بانتظار تأكيد والدك</span>';if(v.s==='ok'&&!v.auto)return' <span class="tag good">أكّده '+esc(M(v.by)?.name||'والدك')+(v.score!=null?' · '+v.score+'%':'')+'</span>';return''}
 return v&&v.s==='no'?' <span class="tag bad">لم يؤكده والدك</span>':'';
}
function doneAt(k,d,t){const L=peekDay(k,d)||{},ks=kidS(k);
 if(t.kind==='pr')return(L.pr||{})[t.id.slice(2)]?.at;if(t.kind==='az')return(L.az||{})[t.id.slice(2)]?.at;
 if(t.kind==='once')return ks.onceDone[t.id];if(t.kind==='hw')return ks.homework.find(h=>h.id===t.ref)?.doneAt;if(t.kind==='ls')return ks.lessonsDone[t.ref];
 return(L.done||{})[t.id]}
function pendingFor(k){const out=[],created=kidS(k).created||'0';
 for(let i=0;i<3;i++){const d=addDays(TODAY(),-i);if(d<created)break;if(!peekDay(k,d))continue;
  for(const t of todayTasks(k,d)){if(!t.done||t.kind==='mission'||t.id==='mentor:checkin'||!needsVer(t.sec))continue;if(verOf(k,d,t.id))continue;out.push({k,d,t})}}
 return out}
const pendingQuran=k=>kidS(k).quran.log.map((l,i)=>({l,i})).filter(x=>x.l.st==='pending');
const prPts=st=>{const b=+S().pts||10;return st==='ontime'?b:st==='late'?Math.round(b/2):Math.round(b/4)};
function rejectTask(k,d,t){const L=dayLog(k,d),ks=kidS(k),b=+S().pts||10;let pts=t.pts;
 if(t.kind==='once')delete ks.onceDone[t.id];
 else if(t.kind==='hw'){const h=ks.homework.find(x=>x.id===t.ref);if(h){h.done=false;h.doneAt=null}}
 else if(t.kind==='ls')delete ks.lessonsDone[t.ref];
 else if(t.kind==='pr'){const p=t.id.slice(2);pts=prPts(L.pr[p]?.st);delete L.pr[p]}
 else if(t.kind==='az'){const x=t.id.slice(2);pts=L.az[x]?.st==='self'?Math.round(b/2):b;delete L.az[x]}
 else if(t.kind==='water')L.water=0;
 else delete L.done[t.id];
 addPts(k,-pts);dropEv(k,d,t.id);markVer(k,d,t.id,'no');sumUp(k,d);touchKid(k)}
function dropEv(k,d,id){const L=dayLog(k,d);if(L.ev&&L.ev[id]){dropAudio(L.ev[id]);delete L.ev[id];touchLog(k,d)}}
const findT=(k,d,id)=>todayTasks(k,d).find(t=>t.id===id);
A.vOk=el=>{const{k,d,id}=el.dataset;markVer(k,d,id,'ok');dropEv(k,d,id);toast('تم التأكيد')};
A.vNo=el=>{const{k,d,id}=el.dataset,t=findT(k,d,id);if(t){rejectTask(k,d,t);toast('سُجّل أنه لم يُنجز، وخُصمت نقاطه')}};
A.vPr=el=>{const{k,d,id,st}=el.dataset,t=findT(k,d,id);if(!t)return;if(st==='none'){rejectTask(k,d,t);return}
 const L=dayLog(k,d),p=id.slice(2),r=L.pr[p];if(r&&r.st!==st){addPts(k,prPts(st)-prPts(r.st));r.st=st}markVer(k,d,id,'ok',{fix:r&&r.st});toast('تم')};
A.vAll=el=>{const k=el.dataset.k;for(const x of pendingFor(k)){markVer(k,x.d,x.t.id,'ok');dropEv(k,x.d,x.t.id)}toast('تم تأكيد الكل')};
A.vQ=el=>{const k=el.dataset.k,q=kidS(k).quran,l=q.log[+el.dataset.i];if(!l)return;
 if(el.dataset.ok==='1'){l.st='ok';const p=quranPortion(k);if(!l.surah||(l.surah===q.surah&&l.from===p.from))quranAdvance(k);markAuto(k,'q:hifz',2*(+S().pts||10));toast('اعتُمد التسميع')}
 else{l.st='retry';toast('طُلب منه إعادة التسميع')}
 if(l.audio){dropAudio(l.audio);l.audio=null}l.by=me;touchKid(k)};
const dayName=d=>d===TODAY()?'اليوم':d===addDays(TODAY(),-1)?'أمس':d.slice(5).replace('-','/');
function approvalsCard(){
 const groups=kids().map(m=>({m,items:pendingFor(m.id),q:pendingQuran(m.id)})).filter(g=>g.items.length||g.q.length);
 if(!groups.length)return`<div class="card"><div class="row sp"><h2>الاعتمادات</h2><span class="tag good">لا شيء بانتظارك</span></div></div>`;
 const n=groups.reduce((a,g)=>a+g.items.length+g.q.length,0);
 return `<div class="card" style="border-color:var(--sa)"><h2>بانتظار تأكيدك (${n})</h2><p class="mut">ما سجّله الأبناء خلال آخر 3 أيام. أكّد، أو صحّح، أو انفِ — والرفض يلغي المهمة ويخصم نقاطها.</p>
 ${groups.map(g=>`<div style="margin-top:12px"><div class="row sp"><h3 style="color:${g.m.color}">${esc(g.m.name)}</h3>${g.items.length>1?`<button class="btn sm" data-a="vAll" data-k="${g.m.id}">تأكيد الكل (${g.items.length})</button>`:''}</div>
 <ul class="list">${g.q.map(x=>`<li class="apv"><span class="grow"><b>تسميع: ${esc(x.l.what)}</b><br><span class="mut">${esc(x.l.at)}</span></span>${x.l.audio?`<button class="btn sm" data-a="play" data-src="q" data-k="${g.m.id}" data-i="${x.i}">${ic('speak')} استمع</button>`:''}<span class="row" style="gap:6px;flex-basis:100%"><input id="qs_${g.m.id}_${x.i}" type="number" min="0" max="100" inputmode="numeric" placeholder="الدرجة من 100" style="width:130px;flex:none"><input id="qn_${g.m.id}_${x.i}" placeholder="ملاحظة له (اختياري)" style="flex:1;min-width:140px"><button class="btn sm pri" data-a="vQScore" data-k="${g.m.id}" data-i="${x.i}">اعتماد الدرجة</button></span></li>`).join('')}
 ${g.items.map(({d,t})=>{const L=peekDay(g.m.id,d)||{},ev=(L.ev||{})[t.id],at=(doneAt(g.m.id,d,t)||'').slice(11),a=`data-k="${g.m.id}" data-d="${d}" data-id="${t.id}"`;
  const pr=t.kind==='pr'?(L.pr||{})[t.id.slice(2)]:null;
  return `<li class="apv"><span class="grow"><b>${esc(t.label)}</b><br><span class="mut">${dayName(d)}${at?' · سجّلها '+at:''}${pr?' · قال: '+({ontime:'في وقتها',late:'متأخرة',qada:'قضاء'}[pr.st]):''}${t.kind==='az'&&L.az[t.id.slice(2)]?.st==='self'?' · بدون تسجيل صوتي':''}</span></span>
  ${ev?`<button class="btn sm" data-a="play" data-src="ev" ${a}>${ic('speak')} استمع</button>`:''}
  ${t.kind==='pr'?`<span class="row" style="gap:4px"><button class="btn sm pri" data-a="vPr" ${a} data-st="ontime">في وقتها</button><button class="btn sm" data-a="vPr" ${a} data-st="late">متأخرة</button><button class="btn sm" data-a="vPr" ${a} data-st="qada">قضاء</button><button class="btn sm dang" data-a="vPr" ${a} data-st="none">لم يصلِّ</button></span>`
  :ev?`<span class="row" style="gap:6px"><input id="es_${g.m.id}_${d}_${t.id.replace(/[^a-z0-9]/gi,'')}" type="number" min="0" max="100" inputmode="numeric" placeholder="جودة القراءة /100" style="width:150px;flex:none"><button class="btn sm pri" data-a="vEvScore" ${a}>اعتماد</button><button class="btn sm dang" data-a="vNo" ${a}>لم يفعل</button></span>`:`<button class="btn sm pri" data-a="vOk" ${a}>${ic('check')} صحيح</button><button class="btn sm dang" data-a="vNo" ${a}>لم يفعل</button>`}</li>`}).join('')}</ul></div>`).join('')}</div>`;
}
const pendingCount=()=>kids().reduce((a,m)=>a+pendingFor(m.id).length+pendingQuran(m.id).length,0);

// ================= التسجيل الصوتي المباشر =================
let assetsObj=null;const RECS={};
const recInput=(key,label='سجّل بصوتك')=>`<div><button type="button" class="btn acc recbtn" data-a="recToggle" data-key="${key}" style="min-height:60px;font-size:18px;gap:10px">${ic('mic')} <span class="rl">${label}</span> <span class="rt num"></span></button><input type="file" accept="audio/*" capture data-rec="${key}" style="display:none"></div><div id="rp_${key}"></div>`;
document.addEventListener('change',e=>{const i=e.target;if(!i.dataset||!i.dataset.rec)return;const f=i.files&&i.files[0];if(f)setRec(i.dataset.rec,f)});
async function saveAudio(blob){
 if(assetsObj){try{const r=await assetsObj.upload(blob);return{a:'as',id:r.id,url:r.url}}catch(e){}}
 if(!db)throw{m:'لا يمكن حفظ الصوت هنا'};if(blob.size>1500000)throw{m:'التسجيل طويل جدًا، اجعله أقصر من دقيقتين'};
 const b64=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsDataURL(blob)});
 const id=rid(),CH=180000,n=Math.ceil(b64.length/CH);for(let i=0;i<n;i++)await db.doc('audio/'+id+'_'+i).set({d:b64.slice(i*CH,(i+1)*CH)});
 return{a:'db',id,n};
}
async function audioURL(m){if(m.a==='as'){const r=await sb.storage.from('audio').createSignedUrl(m.id,3600);if(r.error)throw r.error;return r.data.signedUrl}let s='';for(let i=0;i<m.n;i++){const g=await db.doc('audio/'+m.id+'_'+i).get();s+=g.exists?(g.data()||{}).d||'':''}return s}
async function dropAudio(m){try{if(m.a==='as'&&assetsObj)await assetsObj.delete(m.id);else if(m.a==='db'&&db)for(let i=0;i<m.n;i++)await db.doc('audio/'+m.id+'_'+i).delete()}catch(e){}}
A.play=async el=>{const k=el.dataset.k;let m=null;
 if(el.dataset.src==='q')m=kidS(k).quran.log[+el.dataset.i]?.audio;else m=((peekDay(k,el.dataset.d)||{}).ev||{})[el.dataset.id];
 if(!m){toast('التسجيل غير متوفر');return}el.disabled=true;el.textContent='جارٍ التحميل…';
 try{const u=await audioURL(m);const a=document.createElement('audio');a.controls=true;a.src=u;a.style.width='100%';el.replaceWith(a);a.play().catch(()=>{})}catch(e){el.disabled=false;el.textContent='تعذّر التحميل'}};
async function withAudio(key,btn){const f=RECS[key];if(!f)return null;if(!online()){toast('لا يوجد اتصال: سُجّل الإنجاز بدون الصوت');return null}
 btn.disabled=true;btn.textContent='جارٍ رفع التسجيل…';try{const m=await saveAudio(f);delete RECS[key];return m}catch(e){toast(e&&e.m||'تعذّر رفع التسجيل');btn.disabled=false;btn.textContent='أرسل';throw e}}

// recitation without built-in dictation → direct recorder, parent listens and approves
const _recite=A.recite;
A.recite=el=>{const k=el.dataset.k,mode=el.dataset.m,p=quranPortion(k);
 const what=mode==='hifz'?`سورة ${p.s.n} (${p.from}–${p.to})`:`ورد القراءة (${kidS(k).quran.read} صفحات)`;
 modal(`<h2>${mode==='hifz'?'تسميع الحفظ':'قراءة الورد'}</h2><p style="font-size:20px">${what}</p><p class="mut">اضغط زر التسجيل واقرأ بصوت واضح، ثم اضغط «إيقاف التسجيل». استمع لتسجيلك ثم أرسله، وسيصل لوالدك ليستمع إليه ويقيّمه.</p>
 <div style="margin-top:12px">${recInput('q'+mode)}</div>
 <div class="row" style="margin-top:12px"><button class="btn pri" data-a="reciteSend" data-k="${k}" data-m="${mode}" data-needs="q${mode}" disabled>أرسل لوالدي</button><button class="btn" data-a="close">إغلاق</button></div>`)};
A.reciteSend=async el=>{const k=el.dataset.k,mode=el.dataset.m,ks=kidS(k),q=ks.quran,p=quranPortion(k);let audio=null;try{audio=await withAudio('q'+mode,el)}catch(e){return}
 if(mode==='hifz'){q.log.push({at:stamp(),what:`سورة ${p.s.n} ${p.from}–${p.to}`,surah:q.surah,from:p.from,to:p.to,st:'pending',audio});touchKid(k);notifyParents(k,'تسميع سورة '+p.s.n);closeModal();toast('وصل تسميعك لوالدك، وسيُحتسب بعد أن يستمع إليه ويقيّمه');return}
 q.log.push({at:stamp(),what:'ورد القراءة',st:'ok'});touchKid(k);if(audio){const L=dayLog(k,TODAY());L.ev||={};L.ev['q:read']=audio}markAuto(k,'q:read');closeModal();toast('أحسنت! وصلت قراءتك لوالدك')};
const _adhkar=A.adhkar;
A.adhkar=el=>{const k=el.dataset.k,x=el.dataset.x,list=ADHKAR.common.concat(ADHKAR[x]);
 modal(`<h2>أذكار ${x==='m'?'الصباح':'المساء'}</h2><p class="mut">اضغط زر التسجيل واقرأ الأذكار بصوتك، ثم أرسلها لوالدك.</p><div style="margin:10px 0">${recInput('az'+x,'سجّل قراءتك')}</div>
 <div>${list.map(a=>`<div class="dhikr">${esc(a.t)} ${a.r>1?`<small>(${a.r} مرات)</small>`:''}</div>`).join('')}</div>
 <div class="row" style="margin-top:12px"><button class="btn pri" data-a="azSend" data-k="${k}" data-x="${x}" data-needs="az${x}" disabled>أرسل</button><button class="btn" data-a="azSelf" data-k="${k}" data-x="${x}">قرأتها (بدون تسجيل)</button><button class="btn ghost" data-a="close">إغلاق</button></div>`)};
A.azSend=async el=>{const k=el.dataset.k,x=el.dataset.x;let audio=null;try{audio=await withAudio('az'+x,el)}catch(e){return}
 const L=dayLog(k,TODAY());L.az[x]={at:stamp(),st:'rec'};if(audio){L.ev||={};L.ev['a:'+x]=audio}verAuto(k,'a:'+x);addPts(k,+S().pts||10);sumUp(k);closeModal();toast('بارك الله فيك، وصلت أذكارك لوالدك')};
// pronunciation: record and compare with the model voice on the device
A.pronRec=()=>{};

// ================= settings: which sections need approval =================
const _settings=F.settings;
F.settings=(f,d)=>{const st=S();st.verifyOff=allSections().filter(s=>!NOVER.includes(s.k)&&!d['v_'+s.k]).map(s=>s.k);_settings(f,d)};

// ---- تقييم التسميع والقراءة من 100 (الأب)
A.vQScore=el=>{const k=el.dataset.k,i=+el.dataset.i,q=kidS(k).quran,l=q.log[i];if(!l)return;
 const inp=document.getElementById(`qs_${k}_${i}`),sc=Math.round(num(inp&&inp.value));if(!inp||inp.value===''||sc<0||sc>100){toast('اكتب درجة من 0 إلى 100');inp&&inp.focus();return}
 const note=(document.getElementById(`qn_${k}_${i}`)||{}).value||'';const pass=sc>=(+S().quranPass||80);
 l.score=sc;l.note=note;l.by=me;l.st=pass?'ok':'retry';
 if(pass){const p=quranPortion(k);if(!l.surah||(l.surah===q.surah&&l.from===p.from))quranAdvance(k);markAuto(k,'q:hifz',Math.max(1,Math.round(2*(+S().pts||10)*sc/100)))}
 if(l.audio){dropAudio(l.audio);l.audio=null}touchKid(k);toast(pass?`اعتُمد التسميع بدرجة ${sc}%`:`الدرجة ${sc}% أقل من درجة النجاح — سيعيد التسميع`)};
A.vEvScore=el=>{const{k,d,id}=el.dataset,t=findT(k,d,id);if(!t)return;const inp=document.getElementById(`es_${k}_${d}_${id.replace(/[^a-z0-9]/gi,'')}`),sc=Math.round(num(inp&&inp.value));
 if(!inp||inp.value===''||sc<0||sc>100){toast('اكتب درجة من 0 إلى 100');return}
 addPts(k,Math.round(t.pts*sc/100)-t.pts);markVer(k,d,id,'ok',{score:sc});dropEv(k,d,id);toast(`اعتُمدت بدرجة ${sc}%`)};
