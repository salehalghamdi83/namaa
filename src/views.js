// ================= render root =================
let rq=false,needR=false;
function queueRender(){if(rq)return;rq=true;requestAnimationFrame(()=>{rq=false;render()})}
function typing(){const a=document.activeElement;return !!a&&/INPUT|TEXTAREA|SELECT/.test(a.tagName)&&a.type!=='checkbox'}
function render(force){
 if(!force&&(typing()||$('.mback'))){needR=true;return}
 needR=false;const app=$('#app');app.innerHTML=renderView();updSync();
}
function renderView(){
 if(!myDev)return T.newFam?topLite()+setupView():welcomeView();
 if(!cfg()){
  if(db&&!cfgSeen)return topLite()+'<div class="empty" style="padding:80px 20px">جارٍ جلب بيانات العائلة…</div>';
  if(!db||isOwner)return topLite()+setupView();
  return topLite()+`<div class="wrap"><div class="card" style="margin-top:30px"><h2>بانتظار ولي الأمر</h2><p>لم يتم إعداد العائلة بعد. اطلب من والدك فتح هذا التطبيق أولًا وإكمال الإعداد، ثم أعد فتحه.</p></div></div>`;
 }
 if(!ME())return topLite()+`<div class="wrap"><div class="card" style="margin-top:30px"><h2>هذا الحساب لم يعد ضمن العائلة</h2><button class="btn pri" data-a="logoutNow">تسجيل الخروج</button></div></div>`;
 const v=view,top=topBar()+roBanner();
 if(v.n==='sec')return top+secView(v.k,v.s);
 if(v.n==='assess')return top+assessView(v.k);
 if(v.n==='manage'&&PM())return top+manageView();
 if(v.n==='kid'&&PM())return top+kidHome(v.k);
 return top+(PM()?parentHome():kidHome(me));
}
const topLite=()=>`<header class="top"><span class="brand">${ic('leaf')}<span>نماء</span></span><span id="sync" class="sync"></span></header>`;
const roBanner=()=>roState?`<div style="background:var(--co);color:#fff;padding:10px max(4vw,14px);font-weight:600">تعذّر حفظ بعض البيانات بسبب الصلاحيات. ما تنجزه محفوظ على هذا الجهاز، وإن تكرر هذا فاطلب من والدك تسجيل دخولك من جديد.</div>`:'';
const topBar=()=>`<header class="top"><button class="brand" data-a="home">${ic('leaf')}<span>نماء</span></button><span id="sync" class="sync"></span><button class="who" data-a="switch" aria-label="تبديل المستخدم">${esc(ME().name)}</button></header>`;

// ================= setup & profile picker =================
function setupView(){
 const rows=(T.setupKids||[0,1]).map((_,i)=>`<div class="fr"><div><label>اسم الابن/البنت</label><input name="kn${i}" ${i===0?'required':''}></div><div><label>العمر</label><input name="ka${i}" type="number" min="4" max="20" value="9" required></div><div><label>رمزه السري (4–6 أرقام)</label><input name="kp${i}" inputmode="numeric" pattern="[0-9]{4,6}" maxlength="6" ${i===0?'required':''}></div><div><label>الجنس</label><select name="kg${i}">${opt('m','ولد')}${opt('f','بنت')}</select></div><div><label>الصف الدراسي</label><input name="kc${i}" placeholder="مثال: الرابع الابتدائي"></div></div>`).join('<hr style="border:0;border-top:1px solid var(--line)">');
 return `<section class="hero"><div class="in"><div><h1>أهلًا بك في نماء</h1><p>منصة عائلية لمتابعة نمو أبنائك يومًا بيوم: الدراسة، الشخصية، اللغات، القرآن، الصلاة، المال، الوقت، الترفيه والمكافآت.</p></div></div></section>
 <div class="wrap"><form class="card" data-f="setup" style="margin-top:-40px"><h2>إعداد العائلة</h2>
 <div class="fr"><div><label>اسم الأب</label><input name="fn" required></div><div><label>كلمة مرور الأب (6 أحرف على الأقل)</label><input name="pw" type="password" minlength="6" required autocomplete="new-password"></div></div>
 <div class="fr"><div><label>اسم الأم (اختياري)</label><input name="mn"></div><div><label>كلمة مرور الأم</label><input name="mpw" type="password" minlength="6" autocomplete="new-password"></div></div>
 <div><label>المدينة (لحساب مواقيت الصلاة)</label>${citySelect('city','الرياض')}</div>
 <h3 style="margin-top:16px">الأبناء</h3>${rows}
 <div class="row" style="margin-top:12px"><button type="button" class="btn" data-a="setupAdd">${ic('plus')} إضافة ابن آخر</button><button class="btn pri">حفظ وبدء الاستخدام</button></div>
 <p class="mut">ستُنشأ مهام وجدول يومي مناسب لعمر كل ابن، ويمكنك تعديلها لاحقًا. كلمات المرور والرموز تُحفظ مشفّرة.</p><button type="button" class="btn ghost" data-a="newFamBack" style="margin-top:6px">رجوع</button></form>
 <form class="card" data-f="setupImport" style="border-color:var(--sa)"><h2>أو: انقل عائلتك من نماء السابق</h2><p class="mut">في نماء السابق افتح: الإعدادات ← العائلة ← «تصدير كل البيانات» ← نسخ، ثم الصق هنا. ينتقل كل شيء، ويدخل الأبناء والأم برموزهم السابقة نفسها.</p>
 <div class="fr"><div><label>اسم الأب</label><input name="fn" placeholder="كما في نماء السابق"></div><div><label>كلمة مرور جديدة للأب (6 أحرف على الأقل)</label><input name="pw" type="password" minlength="6" required autocomplete="new-password"></div></div>
 <label>البيانات المنسوخة</label><textarea name="imp" required dir="ltr" placeholder='{"namaa":1,...}' style="min-height:110px;font-size:12px"></textarea>
 <label>أو اختر ملفًا</label><input type="file" id="impFileSetup" accept=".json,application/json,text/plain">
 <button class="btn acc" style="margin-top:12px">إنشاء العائلة ونقل البيانات</button></form></div>`;
}
function whoView(){
 const roleN={father:'الأب',mother:'الأم',child:'ابن'};
 return `<div class="wrap"><div class="card" style="margin-top:24px"><h2>من يستخدم هذا الجهاز؟</h2><p class="mut">اختر حسابك مرة واحدة، وسيتذكره الجهاز.</p>
 <div class="grid2" style="margin-top:12px">${members().map(m=>`<button class="btn" style="justify-content:flex-start;min-height:64px" data-a="pick" data-id="${m.id}"><span class="rank" style="background:${m.color||'var(--soft)'};color:#fff">${esc(m.name[0]||'؟')}</span><span><b>${esc(m.name)}</b><br><span class="mut">${m.role==='child'?(m.gender==='f'?'بنت':'ابن')+' · '+m.age+' سنوات':roleN[m.role]}</span></span></button>`).join('')}</div></div></div>`;
}

// ================= kid home =================
function kidHome(k){
 const m=M(k);if(!m)return'<div class="empty">غير موجود</div>';
 const ks=kidS(k),ts=todayTasks(k),pct=pctOf(ts),rem=remainBySec(k),lv=levelOf(ks.points||0),nn=nowNext(k),h=new Date().getHours();
 const greet=h<12?'صباح الخير':'مساء الخير';
 const tiles=allSections().map(s=>`<button class="tile" data-a="sec" data-k="${k}" data-s="${s.k}" style="--c:${s.c}"><span class="ic">${ic(s.i)}</span><span class="tn">${esc(s.n)}</span>${badge(rem[s.k]||0)}</button>`).join('');
 const left=ts.filter(t=>!t.done).length;
 return `<section class="hero"><div class="in"><div>
 ${PM()?`<button class="back" style="color:#cfe3d9" data-a="home">${ic('back')} لوحة ولي الأمر</button>`:''}
 <h1>${greet} يا ${esc(m.name)}</h1><p>${gdate(new Date())} · ${hijri(new Date())}</p>
 <div class="meta"><span class="pill">المستوى <b>${lv.l}</b> ${lv.n}</span><span class="pill">النقاط <b>${ks.points||0}</b></span><span class="pill">المتبقي اليوم <b>${left}</b></span></div>
 ${nn.cur?`<p style="margin-top:10px">الآن: <b>${esc(nn.cur.l)}</b>${nn.nxt?` · التالي ${fmtMin(toMin(nn.nxt.t))}: ${esc(nn.nxt.l)}`:''}</p>`:''}
 </div><div class="ring">${ring(pct)}<div class="v">${pct}%<small>إنجاز اليوم</small></div></div></div></section>
 <div class="wrap"><div class="tiles">${tiles}</div>
 <button class="card kc" data-a="sec" data-k="${k}" data-s="mentor" style="grid-template-columns:auto minmax(0,1fr);border-color:#2b6f8f;color:inherit"><span class="rank" style="background:#2b6f8f;color:#fff">${ic('chat')}</span><span><b>من مرشدك</b><br>${esc(mentorNudge(k))}</span></button>
 ${!ks.profile?`<div class="card" style="border-color:var(--sa)"><div class="row sp"><div><h2>${ks.asDraft?'أكمل ':''}اختبار التعرّف على ${esc(m.name)}${ks.asDraft?` (وصلت للسؤال ${ks.asDraft.i+1})`:''}</h2><p class="mut">أسئلة صوتية قصيرة لمعرفة الشخصية والمهارات والموهبة والمستوى العلمي، وعلى أساسها تُبنى الخطة.</p></div><button class="btn acc" data-a="assess" data-k="${k}">${ic('mic')} ابدأ الاختبار الصوتي</button></div></div>`:''}
 <div class="card"><div class="row sp"><h2>مهام اليوم</h2><span class="mut">${ts.length-left} من ${ts.length}</span></div>${bar(pct)}
 <ul class="list" style="margin-top:8px">${ts.filter(t=>!t.done).slice(0,8).map(t=>`<li><span class="k" style="width:10px;height:10px;border-radius:50%;background:${secOf(t.sec).c}"></span><span class="grow">${esc(t.label)}</span><button class="btn sm" data-a="sec" data-k="${k}" data-s="${t.sec}">افتح</button></li>`).join('')||'<li class="empty">أنجزت كل مهام اليوم، ما شاء الله!</li>'}</ul></div>
 ${PM()?`<div class="row" style="margin-top:14px"><button class="btn" data-a="manage" data-tab="tasks" data-k="${k}">${ic('gear')} إدارة مهام ${esc(m.name)}</button><button class="btn" data-a="assess" data-k="${k}">${ic('mic')} ${ks.profile?'إعادة اختبار الشخصية (آخر مرة '+esc((ks.profile.at||'').slice(0,10))+')':'بدء اختبار الشخصية'}</button></div>`:''}
 </div>`;
}

// ================= parent dashboard =================
function parentHome(){
 const st=S(),list=kids().map(m=>{const ts=todayTasks(m.id);return{m,ts,pct:pctOf(ts),wk:weekPct(m.id),ks:kidS(m.id),L:dayLog(m.id,TODAY())}}).sort((a,b)=>b.pct-a.pct);
 const avg=list.length?Math.round(list.reduce((s,x)=>s+x.pct,0)/list.length):0,pt=ptFor(null);
 const alerts=[];
 for(const x of list){
  x.ks.redeem.filter(r=>r.st==='pending').forEach(r=>alerts.push(`${esc(x.m.name)} طلب مكافأة: ${esc(r.n)}`));
  const wk=addDays(TODAY(),-7);for(const c of x.ks.mentor.checkins.filter(c=>c.date>=wk))for(const f of(c.an?.flags||[]))if(f.level==='high')alerts.push(`<b style="color:var(--co)">تنبيه تربوي — ${esc(x.m.name)}:</b> ${esc(f.text)}`);
  const rv=x.ks.mentor.missions.filter(m=>m.status==='review').length,pp=x.ks.mentor.missions.filter(m=>m.status==='proposed').length;if(rv)alerts.push(`${esc(x.m.name)} أنهى ${rv} تحدٍّ بانتظار اعتمادك`);if(pp)alerts.push(`${pp} تحديات مقترحة لـ ${esc(x.m.name)} بانتظار اعتمادك (من قسم مرشدي)`);
  if(!x.ks.profile)alerts.push(`${esc(x.m.name)} لم يُجرِ اختبار الشخصية بعد`);
  const late=PRAYERS.filter(p=>pt[p.k]+40<nowMin()&&!x.L.pr[p.k]);if(late.length)alerts.push(`${esc(x.m.name)} لم يسجّل صلاة: ${late.map(p=>p.n).join('، ')}`);
 }
 const cards=list.map((x,i)=>{const rem=x.ts.filter(t=>!t.done).length;return `<div class="card"><button class="kc" data-a="kid" data-k="${x.m.id}" style="background:none;border:0;padding:0;color:inherit">
  <span class="rank ${i===0&&x.pct>0?'r1':''}">${i+1}</span>
  <span><span class="row"><h2>${esc(x.m.name)}</h2>${statusTag(x.pct)}</span>
  <span class="mut">متبقٍ ${rem} · الأسبوع ${x.wk}% · ${x.ks.points||0} نقطة${(()=>{const c=x.ks.mentor.checkins.slice(-1)[0];return c?` · المزاج: <b style="color:${moodOf(c.mood).c}">${moodOf(c.mood).n}</b>${c.date===TODAY()?'':' ('+c.date.slice(5)+')'}`:''})()}</span>
  <span class="dots" style="margin-top:6px" title="الصلوات">${PRAYERS.map(p=>`<i class="${x.L.pr[p.k]?x.L.pr[p.k].st:(pt[p.k]+40<nowMin()?'miss':'')}"></i>`).join('')}</span>
  ${x.ks.loc?`<span class="mut" style="display:block">${ic('pin')} آخر موقع: ${esc(x.ks.loc.label||'محدد')} · ${esc(x.ks.loc.at.slice(11))}</span>`:''}</span>
  <span class="ring ringS">${ring(x.pct,64,7,x.m.color||'var(--em2)','var(--soft)')}<span class="v">${x.pct}%</span></span></button>
  <div class="row" style="margin-top:10px">${allSections().filter(s=>s.k!=='rewards').map(s=>{const n=x.ts.filter(t=>t.sec===s.k&&!t.done).length;return n?`<button class="chip" data-a="sec" data-k="${x.m.id}" data-s="${s.k}" style="border-color:${s.c}">${esc(s.n)} · ${n}</button>`:''}).join('')||'<span class="tag good">أنهى كل مهامه</span>'}</div></div>`}).join('');
 return `<section class="hero"><div class="in"><div><h1>لوحة ${FATHER()?'ولي الأمر':'الأم'}</h1><p>${gdate(new Date())} · ${hijri(new Date())}</p>
 <div class="meta"><span class="pill">عدد الأبناء <b>${list.length}</b></span><span class="pill">بانتظار تأكيدك <b>${pendingCount()}</b></span>${FATHER()?`<button class="pill" style="border:0;color:inherit;cursor:pointer" data-a="showCode">رمز العائلة <b dir="ltr">${esc(myDev.code)}</b></button>`:''}<span class="pill">وقت الترفيه <b>${fmtMin(toMin(st.playStart))}–${fmtMin(toMin(st.playEnd))}</b></span></div></div>
 <div class="ring">${ring(avg)}<div class="v">${avg}%<small>متوسط العائلة</small></div></div></div></section>
 <div class="wrap"><div class="row" style="margin-top:-40px;position:relative">
 <button class="btn acc" data-a="manage" data-tab="tasks">${ic('gear')} المهام والأجزاء</button>
 ${FATHER()?`<button class="btn" data-a="manage" data-tab="rewards">${ic('gift')} المكافآت</button><button class="btn" data-a="manage" data-tab="family">${ic('users')} العائلة</button><button class="btn" data-a="manage" data-tab="settings">${ic('gear')} الإعدادات</button>`:`<button class="btn" data-a="manage" data-tab="study">${ic('book')} المواد والدرجات</button>`}
 </div>
 ${pushOn()?'':`<div class="card" style="border-color:var(--sa)"><div class="row sp"><div><h2>فعّل الإشعارات على جوالك</h2><p class="mut">ليصلك تنبيه فور تسجيل أحد الأبناء صلاة أو مهمة أو تسميعًا.</p></div><button class="btn acc" data-a="enablePush">تفعيل الإشعارات</button></div></div>`}
 ${approvalsCard()}
 ${alerts.length?`<div class="card" style="border-color:var(--co)"><h2>تنبيهات</h2><ul class="list">${alerts.map(a=>`<li>${a}</li>`).join('')}</ul></div>`:''}
 <h2 style="margin-top:20px">ترتيب الأبناء اليوم</h2>${cards||'<div class="card empty">أضف الأبناء من قسم العائلة</div>'}
 <div class="card"><h2>مقارنة الأسبوع</h2>${list.map(x=>`<div class="gbar"><span>${esc(x.m.name)}</span>${bar(x.wk,x.m.color)}<span class="num">${x.wk}%</span></div>`).join('')}<p class="mut">متوسط نسبة الإنجاز اليومية خلال آخر 7 أيام.</p></div></div>`;
}

// ================= section shell =================
function secView(k,sk){
 const s=secOf(sk),m=M(k);if(!m)return'';
 const rem=sk==='fun'?0:todayTasks(k).filter(t=>t.sec===sk&&!t.done).length;
 const fn=SEC[sk]||secCustom;
 return `<section class="sh" style="--c:${s.c}"><div><button class="back" data-a="${PM()?'kid':'home'}" data-k="${k}">${ic('back')} رجوع</button>
 <div class="sht"><span class="ic big">${ic(s.i)}</span><div><h1>${esc(s.n)}</h1><p>${esc(m.name)}${sk!=='fun'&&sk!=='rewards'?' · '+(rem?`متبقٍ ${rem}`:'لا مهام متبقية'):''}</p></div></div></div></section>
 <div class="wrap" style="--c:${s.c}">${fn(k,sk)}</div>`;
}
function taskList(k,sec,title='مهام اليوم'){
 const ts=todayTasks(k).filter(t=>t.sec===sec&&['daily','once','hw','ls'].includes(t.kind));
 return `<div class="card"><div class="row sp"><h2>${title}</h2>${PM()?`<button class="btn sm" data-a="quickTask" data-k="${k}" data-s="${sec}">${ic('plus')} مهمة</button>`:''}</div>
 <ul class="list">${ts.map(t=>`<li><button class="chk ${t.done?'on':''}" data-a="task" data-k="${k}" data-id="${t.id}" aria-label="إنجاز">${t.done?ic('check'):''}</button><span class="grow"><span class="${t.done?'done-t':''}">${esc(t.label)}</span>${verTag(k,t)}</span><span class="pts">+${t.pts}</span></li>`).join('')||'<li class="empty">لا توجد مهام هنا اليوم</li>'}</ul></div>`;
}
function secCustom(k,sk){return taskList(k,sk)}
