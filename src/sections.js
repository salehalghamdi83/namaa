// ================= sections =================
const SEC={};
const gpct=g=>g.max?g.score/g.max*100:0;
const subjAvg=s=>{const g=s.grades||[];return g.length?Math.round(g.reduce((a,x)=>a+gpct(x),0)/g.length):null};

SEC.study=k=>{
 const pl=plan(k),ks=kidS(k),sid=T.subj;
 if(sid){const s=pl.subjects.find(x=>x.id===sid);if(s)return subjectView(k,s)}
 const hw=ks.homework.filter(h=>!h.done||(h.doneAt||'').slice(0,10)===TODAY()).sort((a,b)=>(a.due||'').localeCompare(b.due||''));
 const avgs=pl.subjects.map(s=>({s,a:subjAvg(s)})).filter(x=>x.a!=null);
 const weak=avgs.filter(x=>x.a<70).sort((a,b)=>a.a-b.a);
 return taskList(k,'study')+
 `<div class="card"><h2>الواجبات</h2><ul class="list">${hw.map(h=>{const sj=pl.subjects.find(s=>s.id===h.sub);const late=!h.done&&h.due&&h.due<TODAY();return `<li><button class="chk ${h.done?'on':''}" data-a="task" data-k="${k}" data-id="hw:${h.id}">${h.done?ic('check'):''}</button><span class="grow"><span class="${h.done?'done-t':''}">${esc(h.title)}</span><br><span class="mut">${esc(sj?sj.name:'عام')}${h.due?` · التسليم ${h.due.slice(5).replace('-','/')}`:''}</span> ${late?'<span class="tag bad">متأخر</span>':''}</span><button class="btn sm" data-a="hwHelp" data-k="${k}" data-id="${h.id}">ساعدني</button><button class="btn sm ghost dang" data-a="hwDel" data-k="${k}" data-id="${h.id}" aria-label="حذف">${ic('trash')}</button></li>${T['hw'+h.id]?`<li style="display:block">${aiBox('hw'+h.id)}</li>`:''}`}).join('')||'<li class="empty">لا واجبات مسجلة</li>'}</ul>
 <form data-f="hwAdd" data-k="${k}" class="fr" style="margin-top:8px"><div><label>واجب جديد</label><input name="t" required placeholder="مثال: حل تمارين صفحة 42"></div><div><label>المادة</label><select name="s">${opt('','عام')}${pl.subjects.map(s=>opt(s.id,s.name)).join('')}</select></div><div><label>موعد التسليم</label><input type="date" name="d" value="${addDays(TODAY(),1)}"></div><button class="btn pri">إضافة</button></form></div>
 <div class="card"><div class="row sp"><h2>المواد الدراسية</h2></div>
 <div class="grid2">${pl.subjects.map(s=>{const a=subjAvg(s);return `<button class="btn" style="flex-direction:column;align-items:stretch;text-align:start;min-height:84px" data-a="subj" data-id="${s.id}"><b>${esc(s.name)}</b><span class="mut">${(s.lessons||[]).length} دروس · ${(s.grades||[]).length} درجات${a!=null?` · المعدل ${a}%`:''}</span>${a!=null?bar(a,a<60?'var(--co)':a<80?'var(--sa)':'var(--ok)'):''}</button>`}).join('')||'<p class="empty">لم تُضف مواد بعد</p>'}</div>
 ${PM()?`<form data-f="subjAdd" data-k="${k}" class="fr" style="margin-top:10px"><div><label>إضافة مادة</label><input name="n" required placeholder="الرياضيات، العلوم، لغتي…"></div><button class="btn pri">${ic('plus')} إضافة</button></form>`:''}</div>
 <div class="card"><h2>تحليل الدرجات</h2>${avgs.length?avgs.map(x=>`<div class="gbar"><span>${esc(x.s.name)}</span>${bar(x.a,x.a<60?'var(--co)':x.a<80?'var(--sa)':'var(--ok)')}<span class="num">${x.a}%</span></div>`).join('')+
 (weak.length?`<p><b>مكامن تحتاج اهتمامًا:</b> ${weak.map(x=>esc(x.s.name)+' ('+x.a+'%)').join('، ')}</p>`:'<p>المستوى جيد في كل المواد المسجلة.</p>')+
 `<button class="btn" data-a="gradesAI" data-k="${k}">${ic('spark')} تحليل مفصّل وخطة علاج</button>${aiBox('gr'+k)}`:'<p class="empty">أضف درجات الاختبارات داخل كل مادة ليظهر التحليل</p>'}</div>
 <div class="card"><h2>اشرح لي درسًا</h2><form data-f="explain" data-k="${k}" class="fr"><div style="grid-column:1/-1"><label>ما الموضوع الذي تريد فهمه؟</label><input name="q" required placeholder="مثال: الكسور العشرية، دورة الماء، الفاعل…"></div><button class="btn pri">${ic('spark')} اشرح</button><button type="button" class="btn" data-a="sayBox" data-id="ex${k}">${ic('speak')} اقرأه لي</button></form>${aiBox('ex'+k)}</div>`;
};
function subjectView(k,s){
 const ks=kidS(k),a=subjAvg(s);
 return `<button class="btn ghost" style="margin-top:12px" data-a="subj" data-id="">${ic('back')} كل المواد</button>
 <div class="card"><div class="row sp"><h2>${esc(s.name)}</h2>${a!=null?`<span class="big-n">${a}%</span>`:''}</div></div>
 <div class="card"><h2>الدروس والشروحات</h2><ul class="list">${(s.lessons||[]).map(l=>{const dn=ks.lessonsDone[l.id];return `<li><button class="chk ${dn?'on':''}" data-a="lessonDone" data-k="${k}" data-id="${l.id}">${dn?ic('check'):''}</button><span class="grow"><b>${esc(l.title)}</b>${l.note?`<br><span class="mut">${esc(l.note)}</span>`:''}</span>${l.url?`<a class="btn sm" href="${esc(l.url)}" target="_blank" rel="noopener">${ic('link')} شاهد</a>`:''}<button class="btn sm" data-a="lessonAI" data-k="${k}" data-sid="${s.id}" data-id="${l.id}">اشرح لي</button>${PM()?`<button class="btn sm ghost dang" data-a="lessonDel" data-k="${k}" data-sid="${s.id}" data-id="${l.id}">${ic('trash')}</button>`:''}</li>${T['ls'+l.id]?`<li style="display:block">${aiBox('ls'+l.id)}<button class="btn sm" data-a="sayBox" data-id="ls${l.id}">${ic('speak')} اقرأه لي</button></li>`:''}`}).join('')||'<li class="empty">لا دروس بعد</li>'}</ul>
 ${PM()?`<form data-f="lessonAdd" data-k="${k}" data-sid="${s.id}" class="fr" style="margin-top:8px"><div><label>عنوان الدرس</label><input name="t" required></div><div><label>رابط يوتيوب (اختياري)</label><input name="u" type="url" placeholder="https://youtube.com/…"></div><div><label>ملاحظة</label><input name="n"></div><button class="btn pri">إضافة درس</button></form>`:''}</div>
 <div class="card"><h2>درجات الاختبارات</h2><div class="scroll"><table><tr><th>الاختبار</th><th>التاريخ</th><th>الدرجة</th><th>النسبة</th>${PM()?'<th></th>':''}</tr>${(s.grades||[]).map(g=>`<tr><td>${esc(g.name)}</td><td>${esc(g.date||'')}</td><td class="num">${g.score}/${g.max}</td><td class="num">${Math.round(gpct(g))}%</td>${PM()?`<td><button class="btn sm ghost dang" data-a="gradeDel" data-k="${k}" data-sid="${s.id}" data-id="${g.id}">${ic('trash')}</button></td>`:''}</tr>`).join('')||'<tr><td colspan="5" class="empty">لا درجات بعد</td></tr>'}</table></div>
 ${PM()?`<form data-f="gradeAdd" data-k="${k}" data-sid="${s.id}" class="fr" style="margin-top:8px"><div><label>اسم الاختبار</label><input name="n" required placeholder="اختبار الوحدة الثانية"></div><div><label>الدرجة</label><input name="sc" type="number" step="0.5" required></div><div><label>من</label><input name="mx" type="number" value="20" required></div><div><label>التاريخ</label><input name="d" type="date" value="${TODAY()}"></div><div><label>نقاط الضعف (اختياري)</label><input name="w" placeholder="مثال: أخطأ في القسمة الطويلة"></div><button class="btn pri">حفظ الدرجة</button></form>`:''}</div>`;
}

SEC.skills=k=>{
 const ks=kidS(k),p=ks.profile,L=dayLog(k,TODAY()),ch=ks.challenge&&ks.challenge.date===TODAY()?ks.challenge:null;
 return `${p?`<div class="card"><h2>ملف ${esc(M(k).name)}</h2><p>${esc(p.summary||'')}</p>
 <div class="grid2" style="margin-top:8px"><div><h3>نقاط القوة</h3><div class="chips">${(p.strengths||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div><div><h3>المواهب</h3><div class="chips">${(p.talents||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div>
 <div><h3>يحتاج إلى تطوير</h3><div class="chips">${(p.improve||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div><div><h3>أسلوب التعلم والمستوى</h3><p>${esc(p.learningStyle||'')} · ${esc(p.academicLevel||'')}</p></div></div></div>`:
 `<div class="card"><h2>لم يُجرَ اختبار الشخصية بعد</h2><button class="btn acc" data-a="assess" data-k="${k}">${ic('mic')} ابدأ الاختبار الصوتي</button></div>`}
 <div class="card"><h2>تحدّي اليوم</h2>${ch?`<p style="font-size:18px">${esc(ch.text)}</p><p class="mut">المهارة: ${esc(ch.skill)}</p>${L.done['sk:day']?'<span class="tag good">أنجزته اليوم</span>':`<button class="btn pri" data-a="chDone" data-k="${k}">${ic('check')} أنجزت التحدي (+40 خبرة)</button>`}`:
 `<p class="mut">تحدٍّ صغير كل يوم يرفع مستوى إحدى مهاراتك.</p><button class="btn pri" data-a="chNew" data-k="${k}" ${ks.skills.length?'':'disabled'}>${ic('spark')} أعطني تحدي اليوم</button>${ks.skills.length?'':'<p class="mut">أضف مهارة أولًا.</p>'}`}</div>
 <div class="card"><h2>مستويات المهارات</h2>${ks.skills.map(s=>{const l=skLevel(s.xp);return `<div style="margin:10px 0"><div class="row sp"><b>${esc(s.name)}</b><span class="mut">المستوى ${l.l} · ${l.n}</span></div>${bar(l.p,'#8a4fd6')}<p class="mut">${l.p}/100 خبرة للمستوى التالي</p></div>`}).join('')||'<p class="empty">لا مهارات بعد</p>'}
 <form data-f="skillAdd" data-k="${k}" class="fr"><div><label>مهارة أو موهبة جديدة</label><input name="n" required placeholder="الرسم، الخطابة، البرمجة، كرة القدم…"></div><button class="btn pri">${ic('plus')} إضافة</button></form></div>
 ${taskList(k,'skills','مهام الشخصية والمهارات')}
 <div class="card"><div class="row sp"><div><h2>تحدّث مع مرشدك</h2><p class="mut">أي موقف أو تحدٍّ يواجهك</p></div><button class="btn" data-a="sec" data-k="${k}" data-s="mentor">افتح «مرشدي»</button></div></div>`;
};

SEC.lang=k=>{
 const ks=kidS(k),lid=T.lang&&ks.langs.find(l=>l.id===T.lang)?T.lang:(ks.langs[0]||{}).id,lg=ks.langs.find(l=>l.id===lid);
 const les=lg&&ks.lesson[lg.id]&&ks.lesson[lg.id].date===TODAY()?ks.lesson[lg.id]:null,L=dayLog(k,TODAY());
 return `<div class="card"><div class="tabs">${ks.langs.map(l=>`<button class="chip ${l.id===lid?'on':''}" data-a="langTab" data-id="${l.id}">${esc(l.name)} · م${skLevel(l.xp).l}</button>`).join('')}<button class="chip" data-a="langAddOpen">${ic('plus')} لغة</button></div>
 ${lg?`<div class="row sp" style="margin-top:10px"><div><h2>${esc(lg.name)}</h2><p class="mut">المستوى ${skLevel(lg.xp).l} (${skLevel(lg.xp).n}) · ${lg.words.length} كلمة تعلمتها</p></div>${L.done['lang:'+lg.id]?'<span class="tag good">درس اليوم منجز</span>':'<span class="tag mid">درس اليوم ينتظرك</span>'}</div>${bar(skLevel(lg.xp).p)}`:''}</div>
 ${lg?(les?lessonView(k,lg,les):`<div class="card"><h2>درس اليوم</h2><p class="mut">كلمات جديدة وجملة وتمرين قصير مناسب لعمرك ومستواك، مرتبط بموادك وهواياتك.</p><button class="btn pri" data-a="langLesson" data-k="${k}" data-id="${lg.id}">${ic('spark')} ابدأ درس اليوم</button></div>`)+
 `<div class="card"><h2>كلماتي</h2><div class="chips">${lg.words.slice(-60).map(w=>`<button class="chip" data-a="sayW" data-w="${esc(w.w)}" data-l="${lg.code}">${esc(w.w)} — ${esc(w.m)}</button>`).join('')||'<span class="mut">ستظهر هنا الكلمات التي تتعلمها</span>'}</div></div>
 <div class="card"><h2>تدريب النطق</h2><p class="mut">اختر كلمة، استمع لها، ثم انطقها.</p>${(()=>{const w=T.pron&&T.pron.lg===lg.id?T.pron:null;return w?`<p class="big-n" dir="ltr">${esc(w.w)}</p><div class="row"><button class="btn" data-a="sayW" data-w="${esc(w.w)}" data-l="${lg.code}">${ic('speak')} استمع</button>${dictObj?`<button class="mic" data-a="pronRec">${ic('mic')}</button><span id="pronout" class="mut">${esc(w.heard||'')}</span>`:''}</div>${dictObj?'':`<div style="margin-top:10px">${recInput('pron','انطقها وسجّل صوتك')}</div><p class="mut">قارن صوتك بصوت النطق الصحيح، وكرر حتى يتطابقا.</p>`}${w.res?`<p>${w.res}</p>`:''}`:''})()}<button class="btn sm" data-a="pronNew" data-id="${lg.id}" ${lg.words.length?'':'disabled'}>كلمة للتدريب</button></div>`:''}`;
};
function lessonView(k,lg,les){
 const d=les.data,ans=les.ans||{};
 return `<div class="card"><h2>درس اليوم: ${esc(d.title||'')}</h2><ul class="list">${(d.words||[]).map(w=>`<li><button class="btn sm" data-a="sayW" data-w="${esc(w.w)}" data-l="${lg.code}">${ic('speak')}</button><span class="grow"><b dir="ltr">${esc(w.w)}</b> — ${esc(w.m)}${w.ex?`<br><span class="mut" dir="ltr">${esc(w.ex)}</span>`:''}</span></li>`).join('')}</ul>
 ${d.sentence?`<p dir="ltr" style="font-size:18px;margin-top:10px">${esc(d.sentence)}</p><p class="mut">${esc(d.sentenceAr||'')}</p>`:''}</div>
 <div class="card"><h2>تمرين</h2>${(d.quiz||[]).map((q,i)=>`<div style="margin:10px 0"><p><b>${i+1}. ${esc(q.q)}</b></p><div class="chips">${q.o.map((o,j)=>{const a=ans[i];const cls=a==null?'':(j===q.a?'on':(a===j?'':''));return `<button class="chip ${a!=null&&j===q.a?'on':''}" style="${a===j&&j!==q.a?'background:var(--co);color:#fff':''}" data-a="quiz" data-k="${k}" data-id="${lg.id}" data-q="${i}" data-o="${j}" ${a!=null?'disabled':''}>${esc(o)}</button>`}).join('')}</div></div>`).join('')}
 ${les.score!=null?`<p class="big-n">${les.score}%</p>`:''}</div>`;
}

SEC.quran=k=>{
 const ks=kidS(k),q=ks.quran,s=SURAH[q.surah-1],to=Math.min(s.c,q.ayah+q.daily-1),L=dayLog(k,TODAY());
 const memAy=q.memorized.reduce((a,n)=>a+SURAH[n-1].c,0)+(q.ayah-1);
 const pend=q.log.filter(l=>l.st==='pending');
 return `<div class="card"><div class="row sp"><div><h2>ورد الحفظ اليوم</h2><p style="font-size:20px">سورة ${s.n}: من الآية ${q.ayah} إلى ${to}</p></div>${L.done['q:hifz']?'<span class="tag good">تم التسميع</span>':q.log.some(l=>l.st==='pending')?'<span class="tag mid">بانتظار أن يستمع والدك</span>':'<span class="tag mid">لم يُسمَّع بعد</span>'}</div>
 <div class="row" style="margin-top:8px"><a class="btn" href="https://quran.com/${q.surah}/${q.ayah}-${to}" target="_blank" rel="noopener">${ic('speak')} استمع للآيات</a><button class="btn pri" data-a="recite" data-k="${k}" data-m="hifz">${ic('mic')} سمّع الآن</button></div>
 ${T['qr'+k]?`<div class="ai">${T['qr'+k]}</div>`:''}
 ${PM()&&!L.done['q:hifz']?`<button class="btn acc" style="margin-top:8px" data-a="qApprove" data-k="${k}">${ic('check')} سمّع أمامي الآن (تقييم حضوري)</button>`:''}
 ${pend.length&&PM()?`<p class="mut">تسميعات بانتظار الاعتماد: ${pend.length}</p>`:''}</div>
 <div class="card"><div class="row sp"><div><h2>ورد القراءة</h2><p>${q.read} صفحات يوميًا</p></div>${L.done['q:read']?'<span class="tag good">تمت القراءة</span>':`<div class="row"><button class="btn pri" data-a="recite" data-k="${k}" data-m="read">${ic('mic')} اقرأ بصوتك</button><button class="btn" data-a="readDone" data-k="${k}">قرأت</button></div>`}</div></div>
 <div class="card"><h2>تقدّم الحفظ</h2><div class="gbar"><span>المصحف كاملًا</span>${bar(memAy/6236*100,'#0d5345')}<span class="num">${(memAy/6236*100).toFixed(1)}%</span></div>
 <div class="gbar"><span>السورة الحالية</span>${bar((q.ayah-1)/s.c*100,'#0d5345')}<span class="num">${Math.round((q.ayah-1)/s.c*100)}%</span></div>
 <p class="mut">${memAy} آية محفوظة · ${q.memorized.length} سورة مكتملة</p>
 <div class="chips" style="margin-top:6px">${q.memorized.slice(-30).map(n=>`<span class="chip">${SURAH[n-1].n}</span>`).join('')}</div></div>
 ${PM()?`<form class="card" data-f="quranPlan" data-k="${k}"><h2>خطة الحفظ</h2><div class="fr"><div><label>السورة الحالية</label><select name="s">${SURAH.map((x,i)=>opt(i+1,(i+1)+'. '+x.n,q.surah)).join('')}</select></div><div><label>يبدأ من الآية</label><input name="a" type="number" min="1" value="${q.ayah}"></div><div><label>آيات يوميًا</label><input name="d" type="number" min="1" max="40" value="${q.daily}"></div><div><label>صفحات القراءة يوميًا</label><input name="r" type="number" min="0" max="40" value="${q.read}"></div><div><label>اتجاه الحفظ</label><select name="dir">${opt('back','من الناس إلى البقرة',q.dir)}${opt('fwd','من الفاتحة إلى الناس',q.dir)}</select></div><button class="btn pri">حفظ الخطة</button></div></form>`:''}
 <div class="card"><h2>سجل التسميع</h2><ul class="list">${q.log.slice(-10).reverse().map(l=>`<li><span class="grow">${esc(l.at)} · ${esc(l.what)}</span><span class="tag ${l.st==='ok'?'good':l.st==='pending'?'mid':'bad'}">${l.st==='ok'?'ممتاز':l.st==='pending'?'بانتظار الاعتماد':'يحتاج مراجعة'}${l.score!=null?' · '+l.score+'%':''}</span>${l.note?`<span class="mut" style="flex-basis:100%">ملاحظة: ${esc(l.note)}</span>`:''}</li>`).join('')||'<li class="empty">لا تسميع بعد</li>'}</ul></div>`;
};

SEC.prayer=k=>{
 const L=dayLog(k,TODAY()),pt=ptFor(k),n=nowMin(),ks=kidS(k),st=S();
 let nxt=PRAYERS.find(p=>pt[p.k]>n);
 const stN={ontime:'في وقتها',late:'متأخرة',qada:'قضاء'};
 const cells=PRAYERS.map(p=>{const r=L.pr[p.k];const miss=!r&&pt[p.k]+40<n;return `<div class="prc ${r?r.st:miss?'miss':''} ${nxt&&nxt.k===p.k?'nextp':''}"><b>${p.k==='dhuhr'&&dowOf(TODAY())===5?'الجمعة':p.n}</b><div class="num">${fmtMin(pt[p.k])}</div>${r?`<div class="mut">${stN[r.st]} · ${esc(r.at.slice(11))}</div>${verTag(k,{id:'p:'+p.k,sec:'prayer',done:true})}`:`<button class="btn sm ${pt[p.k]<=n?'pri':''}" style="margin-top:6px" data-a="pray" data-k="${k}" data-p="${p.k}">صلّيت</button>`}</div>`}).join('');
 const az=x=>{const r=L.az[x];return r?`${verTag(k,{id:'a:'+x,sec:'prayer',done:true})} <span class="tag ${r.st==='heard'||r.st==='rec'?'good':'mid'}">${r.st==='heard'?'سُمعت بصوته':r.st==='rec'?'سجّلها بصوته':'بدون تسجيل'} · ${esc(r.at.slice(11))}${r.score!=null?' · '+r.score+'%':''}</span>`:''};
 return `<div class="card"><div class="row sp"><h2>مواقيت اليوم</h2><span class="mut">${ic('pin')} ${ks.loc?esc(ks.loc.label||'موقعك')+' · '+({gps:'GPS',paste:'من الخرائط',city:'مختارة'}[ks.loc.src]||'')+' '+esc(ks.loc.at.slice(11)):esc(st.city)}${nxt?` · القادمة ${nxt.n} بعد ${Math.floor((pt[nxt.k]-n)/60)}س ${(pt[nxt.k]-n)%60}د`:''}</span></div>
 <div class="pr" style="margin-top:10px">${cells}</div><p class="mut" style="margin-top:8px">الشروق ${fmtMin(pt.sunrise)} · تُسجَّل الصلاة "في وقتها" إذا سُجّلت خلال 30 دقيقة من الأذان.</p>
 <div class="row" style="margin-top:8px"><button class="btn sm" data-a="gps" data-k="${k}">${ic('pin')} تحديد موقعي الآن</button>${ks.loc?`<button class="btn sm ghost" data-a="gpsClear" data-k="${k}">استخدام مدينة العائلة</button>`:''}</div></div>
 <div class="card"><div class="row sp"><div><h2>أذكار الصباح</h2><p class="mut">من بعد الفجر حتى الضحى</p></div>${az('m')||`<button class="btn pri" data-a="adhkar" data-k="${k}" data-x="m">${ic('mic')} اقرأها بصوتك</button>`}</div></div>
 <div class="card"><div class="row sp"><div><h2>أذكار المساء</h2><p class="mut">من بعد العصر حتى المغرب</p></div>${az('e')||`<button class="btn pri" data-a="adhkar" data-k="${k}" data-x="e">${ic('mic')} اقرأها بصوتك</button>`}</div></div>
 <div class="card"><h2>سجل الأسبوع</h2><div class="scroll"><table><tr><th>اليوم</th>${PRAYERS.map(p=>`<th>${p.n}</th>`).join('')}<th>الأذكار</th></tr>${[0,1,2,3,4,5,6].map(i=>{const d=addDays(TODAY(),-i),x=peekDay(k,d)||{pr:{},az:{}};if(d<(ks.created||d))return '';return `<tr><td>${i?d.slice(5):'اليوم'}</td>${PRAYERS.map(p=>`<td><span class="dots"><i class="${x.pr&&x.pr[p.k]?x.pr[p.k].st:(i?'miss':'')}"></i></span></td>`).join('')}<td>${(x.az&&x.az.m?'ص ':'')+(x.az&&x.az.e?'م':'')}</td></tr>`}).join('')}</table></div></div>`;
};

SEC.money=k=>{
 const ks=kidS(k),tx=ks.money.tx,cur=S().cur,bal={};JARS.forEach(j=>bal[j.k]=0);
 for(const t of tx)bal[t.jar]=(bal[t.jar]||0)+(t.type==='in'?t.amt:-t.amt);
 const total=Object.values(bal).reduce((a,b)=>a+b,0),sim=T.sim||{m:20,y:5,r:6};
 const fv=(()=>{const r=sim.r/100/12,n=sim.y*12;return r?sim.m*((Math.pow(1+r,n)-1)/r):sim.m*n})();
 const tips=['ادّخر أولًا ثم اصرف: عند أي مبلغ جديد ضع جزءًا في الادخار قبل أي شراء.','فرّق بين ما تحتاجه وما ترغب فيه، واسأل نفسك: هل سأحتاجه بعد أسبوع؟','الصدقة لا تُنقص المال، وجزء صغير منها يبارك فيه.','الاستثمار يجعل المال ينمو مع الوقت، والصبر أهم سر فيه.'];
 return `<div class="card"><div class="row sp"><div><p class="mut">رصيدي الكلي</p><span class="big-n">${total.toFixed(2)} ${cur}</span></div></div>
 <div class="grid2" style="margin-top:10px">${JARS.map(j=>`<div class="card" style="margin:0;border-color:${j.c}"><b style="color:${j.c}">${j.n}</b><div class="num" style="font-size:22px">${bal[j.k].toFixed(2)}</div></div>`).join('')}</div></div>
 <form class="card" data-f="txAdd" data-k="${k}"><h2>عملية جديدة</h2><div class="fr"><div><label>النوع</label><select name="ty">${opt('in','إيداع (حصلت على مال)')}${opt('out','صرف')}</select></div><div><label>المبلغ</label><input name="a" type="number" step="0.5" min="0.5" required></div><div><label>الحصّالة</label><select name="j">${opt('auto','توزيع تلقائي (للإيداع)')}${JARS.map(j=>opt(j.k,j.n)).join('')}</select></div><div><label>الوصف</label><input name="n" placeholder="عيدية، مصروف، شراء…"></div><button class="btn pri">تسجيل</button></div>
 <p class="mut">التوزيع التلقائي: ادخار ${S().jars.save}% · مصروف ${S().jars.spend}% · صدقة ${S().jars.give}% · استثمار ${S().jars.invest}%</p></form>
 <div class="card"><h2>أهدافي</h2>${ks.money.goals.map(g=>{const p=bal.save/g.t*100;return `<div style="margin:8px 0"><div class="row sp"><b>${esc(g.n)}</b><span class="mut">${bal.save.toFixed(0)} / ${g.t} ${cur}</span><button class="btn sm ghost dang" data-a="goalDel" data-k="${k}" data-id="${g.id}">${ic('trash')}</button></div>${bar(p,'#1f8a5b')}${p>=100?'<span class="tag good">وصلت لهدفك!</span>':''}</div>`}).join('')||'<p class="empty">ضع هدفًا تدّخر له</p>'}
 <form data-f="goalAdd" data-k="${k}" class="fr"><div><label>الهدف</label><input name="n" required placeholder="دراجة، كتاب، هدية لأمي…"></div><div><label>المبلغ</label><input name="t" type="number" min="1" required></div><button class="btn pri">إضافة</button></form></div>
 <div class="card"><h2>حاسبة نمو الاستثمار</h2><div class="fr"><div><label>شهريًا (${cur})</label><input data-sim="m" type="number" value="${sim.m}"></div><div><label>لمدة (سنوات)</label><input data-sim="y" type="number" value="${sim.y}"></div><div><label>عائد سنوي متوقع %</label><input data-sim="r" type="number" value="${sim.r}"></div></div>
 <p style="margin-top:10px">لو ادّخرت <b>${sim.m}</b> شهريًا لمدة <b>${sim.y}</b> سنوات: بدون استثمار = <b>${(sim.m*sim.y*12).toFixed(0)}</b>، مع الاستثمار ≈ <b style="color:var(--ok)">${fv.toFixed(0)} ${cur}</b></p><p class="mut">مثال تعليمي فقط؛ العائد الحقيقي يتغير، ويُختار الاستثمار الحلال مع الوالدين.</p></div>
 <div class="card"><h2>دروس المال</h2><ul class="list">${tips.map(t=>`<li>${t}</li>`).join('')}</ul><button class="btn" data-a="moneyAI" data-k="${k}">${ic('spark')} درس مالي جديد لي</button>${aiBox('mo'+k)}</div>
 ${taskList(k,'money')}
 <div class="card"><h2>آخر العمليات</h2><ul class="list">${tx.slice(-15).reverse().map(t=>`<li><span class="grow">${esc(t.n||'—')}<br><span class="mut">${esc(t.d)} · ${JARS.find(j=>j.k===t.jar)?.n||''}</span></span><b class="num" style="color:${t.type==='in'?'var(--ok)':'var(--co)'}">${t.type==='in'?'+':'−'}${t.amt}</b></li>`).join('')||'<li class="empty">لا عمليات بعد</li>'}</ul></div>`;
};

SEC.time=k=>{
 const rows=scheduleFor(k),n=nowMin(),L=dayLog(k,TODAY()),g=waterGoal(k),we=isWeekend(TODAY());let cur=-1;rows.forEach((r,i)=>{if(toMin(r.t)<=n)cur=i});
 const edit=T.schedEdit&&PM();
 return `<div class="card"><h2>شرب الماء</h2><div class="cups">${Array.from({length:Math.max(g,L.water)},(_,i)=>`<span class="cup ${i<L.water?'on':''}"></span>`).join('')}</div>
 <div class="row"><button class="btn pri" data-a="water" data-k="${k}" data-d="1">${ic('plus')} شربت كوبًا</button><button class="btn" data-a="water" data-k="${k}" data-d="-1">تراجع</button><span class="mut">${L.water} من ${g} أكواب${L.water>=g?' · أحسنت!':''}</span></div></div>
 <div class="card"><div class="row sp"><h2>جدول ${we?'الإجازة':'يوم الدراسة'}</h2>${PM()?`<button class="btn sm" data-a="schedEdit">${edit?'إغلاق التعديل':'تعديل الجدول'}</button>`:''}</div>
 ${edit?schedEditor(k,we):`<ul class="tl">${rows.map((r,i)=>`<li class="${i===cur?'cur':''}" style="--c:${TYPE_C[r.ty]||'var(--line)'}"><span class="t">${fmtMin(toMin(r.t))}</span><span><span class="k"></span>${esc(r.l)}${i===cur?' <span class="tag mid">الآن</span>':''}</span></li>`).join('')}</ul>`}
 <p class="mut">تذكير: كوب ماء كل ساعتين تقريبًا، ونوم مبكر ليوم أنشط.</p></div>${taskList(k,'time')}`;
};
function schedEditor(k,we){
 const pl=plan(k),key=we?'weekend':'school',base=(pl.schedule&&pl.schedule[key])||defSchedule(ageOf(k),we);
 return `<form data-f="sched" data-k="${k}" data-key="${key}">${base.map((r,i)=>`<div class="fr"><input name="t${i}" type="${r[0]==='@play'?'text':'time'}" value="${esc(r[0])}" ${r[0]==='@play'?'readonly title="يتبع وقت الترفيه الموحّد"':''}><input name="l${i}" value="${esc(r[1])}"><select name="y${i}">${Object.keys(TYPE_C).map(t=>opt(t,{meal:'وجبة',school:'مدرسة',study:'مذاكرة',quran:'قرآن',lang:'لغة',skills:'مهارة',fun:'ترفيه',sleep:'نوم',prayer:'صلاة/أذكار',rest:'راحة',family:'عائلة',routine:'روتين'}[t],r[2])).join('')}</select></div>`).join('')}
 <input type="hidden" name="n" value="${base.length}"><div class="row" style="margin-top:8px"><button type="button" class="btn" data-a="schedRow" data-k="${k}" data-key="${key}">${ic('plus')} سطر</button><button class="btn pri">حفظ الجدول</button><button type="button" class="btn ghost" data-a="schedReset" data-k="${k}" data-key="${key}">استعادة الافتراضي</button></div><p class="mut">لحذف سطر امسح نصّه ثم احفظ.</p></form>`;
}

SEC.fun=k=>{
 const f=funState(k),st=S(),sib=kids().filter(m=>m.id!==k);
 let main;
 if(f.after)main=`<div class="lock">${ic('clock')}<h2>انتهى وقت الترفيه لليوم</h2><p class="mut">يعود غدًا الساعة ${fmtMin(f.a)}</p></div>`;
 else if(!f.ok)main=`<div class="lock" style="color:var(--co)">${ic('lock')}<h2 style="color:var(--ink)">وقت الترفيه مقفل حتى تُنجز مهامك</h2><p class="mut">أنجزت ${f.pct}% من المهام المستحقة، والمطلوب ${st.playThreshold}%${f.pr.length?' مع أداء الصلوات التي حان وقتها':''}.</p></div>
  <ul class="list">${f.pend.slice(0,10).map(t=>`<li><span class="grow">${esc(t.label)}</span><button class="btn sm" data-a="sec" data-k="${k}" data-s="${t.sec}">أنجزها</button></li>`).join('')}</ul>`;
 else if(f.before)main=`<div class="lock" style="color:var(--ok)">${ic('unlock')}<h2 style="color:var(--ink)">جاهز للعب!</h2><p>يبدأ وقت الترفيه لجميع الإخوة الساعة <b>${fmtMin(f.a)}</b> (بعد ${Math.floor((f.a-f.n)/60)}س ${(f.a-f.n)%60}د)</p></div>`;
 else main=`<div class="lock" style="color:var(--ok)">${ic('play')}<h2 style="color:var(--ink)">وقت الترفيه مفتوح الآن</h2><p>متبقٍ <b>${f.b-f.n}</b> دقيقة · ينتهي ${fmtMin(f.b)}</p></div>`;
 return `<div class="card">${main}</div>
 <div class="card"><h2>الإخوة</h2><ul class="list">${sib.map(m=>{const s=funState(m.id);return `<li><span class="rank" style="background:${m.color};color:#fff">${esc(m.name[0])}</span><span class="grow">${esc(m.name)}</span>${s.ok?'<span class="tag good">جاهز</span>':`<span class="tag bad">لم يكمل (${s.pct}%)</span>`}</li>`}).join('')||'<li class="empty">لا إخوة مسجلون</li>'}</ul><p class="mut">وقت اللعب موحّد للجميع: ${fmtMin(f.a)} – ${fmtMin(f.b)}، ولا يتعارض مع الدراسة والصلاة والنوم.</p></div>
 <div class="card"><h2>أفكار للعب</h2><div class="chips">${(st.funIdeas||[]).map(x=>`<span class="chip">${esc(x)}</span>`).join('')}</div></div>`;
};

SEC.rewards=k=>{
 const ks=kidS(k),lv=levelOf(ks.points||0),ri=rewardInfo(k),st=S();
 return `<div class="card"><div class="row sp"><div><p class="mut">نقاطي</p><span class="big-n">${ks.points||0}</span></div><div style="text-align:end"><p class="mut">المستوى ${lv.l}</p><h2>${lv.n}</h2></div></div>${bar(lv.cur/lv.need*100,'#9a6b00')}<p class="mut">${lv.need-lv.cur} نقطة للمستوى التالي</p></div>
 <div class="card"><h2>مكافأة هذا الأسبوع</h2><p>نسبة الإنجاز: <b>${ri.auto}%</b>${ri.ov!=null&&ri.ov!==''?` · النسبة المعتمدة من الوالد: <b>${ri.pct}%</b>`:''}</p>
 <p>المكافأة المتوقعة: <span class="big-n" style="font-size:28px">${ri.amt} ${st.cur}</span> <span class="mut">من ${st.rewardBase}</span></p>${bar(ri.pct,'#9a6b00')}
 ${ri.paid?`<span class="tag good">صُرفت: ${ri.paid} ${st.cur}</span>`:''}
 ${FATHER()?`<form data-f="rewardSet" data-k="${k}" class="fr" style="margin-top:10px"><div><label>تحديد نسبة المكافأة يدويًا % (اتركه فارغًا للتلقائي)</label><input name="p" type="number" min="0" max="100" value="${ri.ov??''}"></div><button class="btn">حفظ النسبة</button><button type="button" class="btn acc" data-a="payReward" data-k="${k}" ${ri.paid?'disabled':''}>صرف ${ri.amt} ${st.cur} إلى حصّالته</button></form>`:''}</div>
 <div class="card"><h2>متجر المكافآت</h2><ul class="list">${(st.catalog||[]).map(c=>`<li><span class="grow"><b>${esc(c.n)}</b></span><span class="pts">${c.cost} نقطة</span><button class="btn sm ${ks.points>=c.cost?'pri':''}" data-a="redeem" data-k="${k}" data-id="${c.id}" ${ks.points>=c.cost?'':'disabled'}>اطلب</button></li>`).join('')}</ul></div>
 <div class="card"><h2>طلباتي</h2><ul class="list">${ks.redeem.slice().reverse().map(r=>`<li><span class="grow">${esc(r.n)}<br><span class="mut">${esc(r.at)}</span></span><span class="tag ${r.st==='ok'?'good':r.st==='no'?'bad':'mid'}">${r.st==='ok'?'تمت الموافقة':r.st==='no'?'مرفوض':'بانتظار الموافقة'}</span>${FATHER()&&r.st==='pending'?`<button class="btn sm pri" data-a="redeemOk" data-k="${k}" data-id="${r.id}">موافقة</button><button class="btn sm" data-a="redeemNo" data-k="${k}" data-id="${r.id}">رفض</button>`:''}</li>`).join('')||'<li class="empty">لا طلبات</li>'}</ul></div>`;
};
