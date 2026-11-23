// ================= defaults by age =================
function defaultTasks(age){
 const school=[0,1,2,3,4],nights=[6,0,1,2,3];
 const t=(sec,label,days=[],pts=0)=>({id:rid(),sec,label,rep:'daily',days,pts});
 const L=[t('study','مراجعة دروس اليوم 20 دقيقة',school),t('study','تجهيز الحقيبة المدرسية',nights),
  t('skills',age<=8?'قراءة قصة 10 دقائق':'قراءة كتاب 20 دقيقة'),t('skills','مساعدة في البيت (مهمة واحدة)'),
  t('time','ترتيب السرير بعد الاستيقاظ'),t('time','النوم في الموعد المحدد'),t('money','تسجيل مصروف اليوم في الحصّالة')];
 if(age>=10)L.push(t('skills','ممارسة رياضة 30 دقيقة'));
 if(age>=13)L.push(t('time','تخطيط مهام الغد قبل النوم'));
 return L;
}
function defSchedule(age,weekend){
 const sleep=age<=9?'20:00':age<=13?'21:00':'22:00';
 if(weekend)return[['07:30','الاستيقاظ والفطور','meal'],['09:00','حفظ القرآن وقراءة الورد','quran'],['10:00','رياضة أو مهارة','skills'],['11:00','تعلّم اللغة','lang'],['11:45','مساعدة في البيت','family'],['13:00','الغداء','meal'],['14:00','راحة / قراءة حرة','rest'],['16:00','نشاط عائلي','family'],['@play','وقت الترفيه (لجميع الإخوة)','fun'],['19:00','العشاء','meal'],['19:45','أذكار المساء وتجهيز الغد','prayer'],[sleep,'النوم','sleep']];
 const S=[['05:45','الاستيقاظ والاستعداد','routine'],['06:15','الفطور','meal'],['06:45','المدرسة','school'],['13:15','العودة والغداء','meal'],['14:00','راحة قصيرة','rest'],['14:30',age>=13?'الواجبات والمذاكرة (ساعة ونصف)':'الواجبات والمذاكرة','study'],['15:30','حفظ القرآن وقراءة الورد','quran'],['16:00','تعلّم اللغة','lang'],['16:30','مهارة أو هواية','skills'],['@play','وقت الترفيه (لجميع الإخوة)','fun'],['19:00','العشاء','meal'],['19:30','وقت العائلة وتجهيز الحقيبة','family'],[sleep,'النوم','sleep']];
 if(age>=14)S.splice(S.length-1,0,['20:30','مذاكرة إضافية / مشروع شخصي','study']);
 return S;
}
const TYPE_C={meal:'#e9a23b',school:'#2f6fdb',study:'#2f6fdb',quran:'#0d5345',lang:'#0e8f84',skills:'#8a4fd6',fun:'#d23f73',sleep:'#5b6b8c',prayer:'#1e7a55',rest:'#9db0a7',family:'#cf5a35',routine:'#9db0a7'};
function scheduleFor(k,date=TODAY()){
 const pl=plan(k),we=isWeekend(date),st=S();
 const base=(pl.schedule&&pl.schedule[we?'weekend':'school'])||defSchedule(ageOf(k),we);
 const rows=base.map(r=>({t:r[0]==='@play'?st.playStart:r[0],l:r[1],ty:r[2]}));
 const pt=ptFor(k,date);
 for(const p of PRAYERS)rows.push({t:hhmm(pt[p.k]),l:'صلاة '+(p.k==='dhuhr'&&dowOf(date)===5?'الجمعة':p.n),ty:'prayer'});
 return rows.sort((a,b)=>toMin(a.t)-toMin(b.t));
}
function nowNext(k){const rows=scheduleFor(k),n=nowMin();let cur=null,nxt=null;for(const r of rows){if(toMin(r.t)<=n)cur=r;else{nxt=r;break}}return{cur,nxt}}

// ================= task engine =================
function todayTasks(k,date=TODAY()){
 const pl=plan(k),ks=kidS(k),L=dayLog(k,date),st=S(),dow=dowOf(date),pts=+st.pts||10,out=[];
 for(const t of pl.tasks){
  if(t.rep==='once'){const dn=ks.onceDone[t.id];if(dn&&dn.slice(0,10)!==date)continue;out.push({id:t.id,sec:t.sec,label:t.label,pts:+t.pts||pts,done:!!dn,kind:'once'})}
  else{if(t.days&&t.days.length&&!t.days.includes(dow))continue;out.push({id:t.id,sec:t.sec,label:t.label,pts:+t.pts||pts,done:!!L.done[t.id],kind:'daily'})}
 }
 for(const h of ks.homework){if(h.done&&(h.doneAt||'').slice(0,10)!==date)continue;out.push({id:'hw:'+h.id,sec:'study',label:'واجب: '+h.title,pts,done:!!h.done,kind:'hw',ref:h.id})}
 for(const s of pl.subjects)for(const l of(s.lessons||[])){const dn=ks.lessonsDone[l.id];if(dn&&dn.slice(0,10)!==date)continue;out.push({id:'ls:'+l.id,sec:'study',label:'درس '+s.name+': '+l.title,pts,done:!!dn,kind:'ls',ref:l.id})}
 for(const lg of ks.langs)out.push({id:'lang:'+lg.id,sec:'lang',label:'درس اليوم في '+lg.name,pts,done:!!L.done['lang:'+lg.id],kind:'auto'});
 if(ks.skills.length)out.push({id:'sk:day',sec:'skills',label:'تحدّي المهارة اليومي',pts,done:!!L.done['sk:day'],kind:'auto'});
 out.push({id:'mentor:checkin',sec:'mentor',label:'حديث اليوم مع مرشدك',pts,done:!!L.done['mentor:checkin'],kind:'auto'});
 for(const m of(ks.mentor?.missions||[])){if(m.status==='active'||m.status==='review'||(m.status==='done'&&(m.doneAt||'').slice(0,10)===date))out.push({id:'ms:'+m.id,sec:'mentor',label:'تحدٍّ: '+m.title,pts:m.pts,done:m.status==='done',kind:'mission',bonus:true})}
 out.push({id:'q:hifz',sec:'quran',label:'تسميع الحفظ اليومي',pts:pts*2,done:!!L.done['q:hifz'],kind:'auto'});
 out.push({id:'q:read',sec:'quran',label:'ورد القراءة اليومي',pts,done:!!L.done['q:read'],kind:'auto'});
 const pt=ptFor(k,date);
 for(const p of PRAYERS)out.push({id:'p:'+p.k,sec:'prayer',label:'صلاة '+p.n,pts,done:!!L.pr[p.k],due:pt[p.k],kind:'pr'});
 out.push({id:'a:m',sec:'prayer',label:'أذكار الصباح',pts,done:!!L.az.m,due:pt.fajr,kind:'az'});
 out.push({id:'a:e',sec:'prayer',label:'أذكار المساء',pts,done:!!L.az.e,due:pt.asr,kind:'az'});
 out.push({id:'water',sec:'time',label:`شرب الماء (${waterGoal(k)} أكواب)`,pts,done:L.water>=waterGoal(k),kind:'water'});
 return out;
}
const pctOf=ts=>{ts=ts.filter(t=>!t.bonus);return ts.length?Math.round(ts.filter(t=>t.done).length/ts.length*100):0};
const isDue=(t,date=TODAY())=>date<TODAY()||t.due==null||t.due<=nowMin();
function sumUp(k,date=TODAY()){const ts=todayTasks(k,date).filter(t=>!t.bonus),L=dayLog(k,date);L.sum={d:ts.filter(t=>t.done).length,t:ts.length};touchLog(k,date)}
function addPts(k,n){const ks=kidS(k);ks.points=Math.max(0,(ks.points||0)+n);touchKid(k)}
function setTask(k,t,on){
 const ks=kidS(k),L=dayLog(k,TODAY()),ts=stamp();
 if(t.kind==='once'){if(on)ks.onceDone[t.id]=ts;else delete ks.onceDone[t.id]}
 else if(t.kind==='hw'){const h=ks.homework.find(x=>x.id===t.ref);if(!h)return;h.done=on;h.doneAt=on?ts:null}
 else if(t.kind==='ls'){if(on)ks.lessonsDone[t.ref]=ts;else delete ks.lessonsDone[t.ref]}
 else if(t.kind==='daily'||t.kind==='auto'){if(on)L.done[t.id]=ts;else delete L.done[t.id]}
 else return;
 if(on)verAuto(k,t.id);else{const L2=dayLog(k,TODAY());if(L2.ver)delete L2.ver[t.id]}
 addPts(k,on?t.pts:-t.pts);sumUp(k);if(on)toast(`أحسنت! +${t.pts} نقطة`);
}
function markAuto(k,id,pts){const L=dayLog(k,TODAY());if(L.done[id])return;L.done[id]=stamp();verAuto(k,id);addPts(k,pts||(+S().pts||10));sumUp(k)}
function weekPct(k,end=TODAY()){
 let s=0,n=0;const created=kidS(k).created||end;
 for(let i=0;i<7;i++){const d=addDays(end,-i);if(d<created)break;const L=peekDay(k,d);s+=d===TODAY()?pctOf(todayTasks(k)):(L&&L.sum&&L.sum.t?L.sum.d/L.sum.t*100:0);n++}
 return n?Math.round(s/n):0;
}
const weekKey=(d=TODAY())=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()-x.getDay());return dk(x)};
function rewardInfo(k){const pl=plan(k),rw=RW(),wk=weekKey(),auto=weekPct(k),ovA=(rw.pct||{})[k]||{},ov=ovA[wk]!=null?ovA[wk]:pl.rewardPct[wk];const pct=ov!=null&&ov!==''?+ov:auto;return{wk,auto,pct,ov,amt:Math.round((+S().rewardBase||0)*pct/100),paid:((rw.paid||{})[k]||{})[wk]||pl.paid[wk]}}
function funState(k){
 const st=S(),n=nowMin(),a=toMin(st.playStart),b=toMin(st.playEnd);
 const ts=todayTasks(k),due=ts.filter(t=>isDue(t)&&t.sec!=='fun'&&!t.bonus),pend=due.filter(t=>!t.done);
 const pr=due.filter(t=>t.kind==='pr'&&!t.done);
 const pct=due.length?Math.round((due.length-pend.length)/due.length*100):100;
 const ok=pct>=(+st.playThreshold||0)&&pr.length===0;
 return{inWin:n>=a&&n<b,before:n<a,after:n>=b,ok,pct,pend,pr,a,b,n};
}
function remainBySec(k){const r={};for(const t of todayTasks(k))if(!t.done)r[t.sec]=(r[t.sec]||0)+1;const f=funState(k);r.fun=f.ok?0:Math.max(1,f.pend.length);return r}

// ================= Claude helpers (AI, voice) =================
async function use(n){try{return PLATFORM_CAPS[n]?PLATFORM_CAPS[n]():null}catch(e){return null}}
let dictObj=null,dictCur=null,ttsObj=null,sampleObj=null;
async function initCaps(){
 dictObj=await use('dictation');
 if(dictObj){dictObj.onPartial(({text})=>dictCur&&dictCur.part(text));dictObj.onFinal(({text})=>dictCur&&dictCur.fin(text));dictObj.onState(({state})=>{if(dictCur)dictCur.st(state);if(state==='idle'&&dictCur){const c=dictCur;dictCur=null;c.end()}})}
 ttsObj=await use('tts');sampleObj=await use('sample');assetsObj=await use('assets');queueRender();
}
function startListen(cb){
 if(!dictObj){kbMicHint();return false}
 if(dictCur){stopListen();return false}
 let fin='';dictCur={part:t=>cb.update((fin+' '+t).trim()),fin:t=>{fin=(fin+' '+t).trim();cb.update(fin)},end:()=>cb.end&&cb.end(fin),st:s=>cb.state&&cb.state(s)};
 try{dictObj.start().catch(e=>{const c=dictCur;dictCur=null;toast(e&&e.code==='not_granted'?'لم يُسمح باستخدام الميكروفون':'تعذّر تشغيل الميكروفون');c&&c.end()})}catch(e){dictCur=null;return false}
 return true;
}
function stopListen(){if(dictObj&&dictCur)dictObj.stop().catch(()=>{})}
function kbMicHint(){toast('التحويل الصوتي غير مدعوم في هذا المتصفح — استخدم Chrome، أو ميكروفون لوحة المفاتيح')}
async function say(text,language='ar'){text=String(text).replace(/[*#]/g,'').slice(0,1900);
 if(ttsObj){try{await ttsObj.speak(text,{language});return}catch(e){}}
 try{const ss=window.speechSynthesis;if(!ss){toast('القراءة الصوتية غير متاحة على هذا الجهاز');return}ss.cancel();const u=new SpeechSynthesisUtterance(text);const lang={ar:'ar-SA',en:'en-US'}[language]||language;u.lang=lang;const v=ss.getVoices().find(v=>v.lang&&v.lang.toLowerCase().startsWith(lang.slice(0,2)));if(v)u.voice=v;u.rate=.95;ss.speak(u)}catch(e){toast('القراءة الصوتية غير متاحة على هذا الجهاز')}}
function aiReady(){if(!sampleObj){toast('ميزة الذكاء الاصطناعي غير متاحة الآن');return false}if(!online()){toast('أنت غير متصل الآن — جرّب عند الاتصال');return false}return true}
async function aiText(prompt,onText){const r=await sampleObj(prompt,{onText:onText?({text})=>onText(text):undefined,cache:false});return r.text}
async function aiJSON(prompt){
 if(typeof sampleObj.json==='function'){try{return await sampleObj.json(prompt)}catch(e){if(e&&e.code&&e.code!=='invalid_json')throw e}}
 const r=await sampleObj(prompt+'\nأعد JSON صالحًا فقط بلا أي شرح.');const t=r.text,a=t.search(/[\[{]/),b=Math.max(t.lastIndexOf('}'),t.lastIndexOf(']'));return JSON.parse(t.slice(a,b+1));
}
const kidCtx=k=>{const m=M(k),p=kidS(k).profile;return `الطفل: ${m.name}، ${m.gender==='f'?'بنت':'ولد'}، عمره ${m.age} سنوات، الصف: ${m.grade||'غير محدد'}.${p?` ملخص شخصيته: ${p.summary||''}. أسلوب تعلمه: ${p.learningStyle||''}.`:''}`};
const AI_RULES='اكتب بالعربية الفصحى البسيطة المناسبة لعمره، بأسلوب مشجّع ولطيف، وبقيم إسلامية وأسرية سعودية. لا تذكر أنك ذكاء اصطناعي.';
function aiBox(id){return `<div class="ai" id="${id}">${T[id]?mdLite(T[id]):''}</div>`}
async function runAI(id,prompt,{speak=false}={}){
 if(!aiReady())return;T[id]='…';const put=t=>{T[id]=t;const el=document.getElementById(id);if(el)el.innerHTML=mdLite(t)};put('جارٍ التفكير…');
 try{const t=await aiText(prompt,put);put(t);if(speak)say(t)}catch(e){put(e&&e.code==='rate_limited'?'الطلبات كثيرة الآن، انتظر قليلًا ثم أعد المحاولة.':'تعذّر الحصول على الرد الآن.')}
}

// ================= UI helpers =================
let toastT;
function toast(m){$('.toast')?.remove();const d=document.createElement('div');d.className='toast';d.textContent=m;document.body.appendChild(d);clearTimeout(toastT);toastT=setTimeout(()=>d.remove(),2600)}
function modal(html){closeModal();const w=document.createElement('div');w.className='mback';w.innerHTML=`<div class="modal" role="dialog" aria-modal="true">${html}</div>`;w.addEventListener('click',e=>{if(e.target===w)closeModal()});document.body.appendChild(w);return w.firstChild}
function closeModal(){stopListen();stopRecording();$('.mback')?.remove();if(needR)render()}
let askFn=null;
function ask(msg,fn,yes='نعم، تأكيد'){askFn=fn;modal(`<h2>${esc(msg)}</h2><div class="row" style="margin-top:16px"><button class="btn pri" data-a="askyes">${yes}</button><button class="btn" data-a="close">إلغاء</button></div>`)}
function ring(p,size=132,stroke=12,col='var(--sa)',track='rgba(255,255,255,.15)'){const r=(size-stroke)/2,c=2*Math.PI*r;return `<svg viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${track}" stroke-width="${stroke}"/><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="${p>0?'round':'butt'}" stroke-dasharray="${c*p/100} ${c}"/></svg>`}
const bar=(p,c)=>`<div class="bar" ${c?`style="--c:${c}"`:''}><i style="width:${clamp(p,0,100)}%"></i></div>`;
const badge=n=>`<span class="badge${n?'':' zero'}" aria-label="${n} مهام متبقية">${n}</span>`;
const micBtn=(target,extra='')=>`<button type="button" class="mic" data-a="mic" data-t="${target}" ${extra} aria-label="تسجيل صوتي">${ic('mic')}</button>`;
const opt=(v,l,sel)=>`<option value="${esc(v)}" ${String(v)===String(sel)?'selected':''}>${esc(l)}</option>`;
function go(v){view=v;stopListen();render(true);window.scrollTo(0,0)}
function statusTag(p){return p>=80?'<span class="tag good">متقدّم</span>':p>=50?'<span class="tag mid">في الطريق</span>':'<span class="tag bad">متأخر</span>'}
