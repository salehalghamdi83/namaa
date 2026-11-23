// ================= المرشد التربوي =================
const MOODS=[{v:5,n:'سعيد جدًا',c:'#1f8a5b'},{v:4,n:'مرتاح',c:'#6bae4f'},{v:3,n:'عادي',c:'#e9a23b'},{v:2,n:'متضايق',c:'#e07b39'},{v:1,n:'حزين',c:'#d8553f'}];
const moodOf=v=>MOODS.find(m=>m.v===+v)||MOODS[2];
const CI_FALLBACK=[
 ['ما أجمل شيء حدث لك اليوم؟','هل ضايقك شيء اليوم؟ ماذا حدث وكيف تصرفت؟','لو استطعت تغيير شيء واحد في يومك، ماذا تغيّر؟ ولماذا؟'],
 ['من الشخص الذي ساعدته أو ساعدك اليوم؟','ما الشيء الذي وجدته صعبًا اليوم؟ وكيف فكرت في حله؟','ما الذي تتطلع إليه غدًا؟'],
 ['متى شعرت اليوم أنك فخور بنفسك؟','هل غضبت أو حزنت اليوم؟ ماذا كنت تفكر وقتها؟','لو كان صديقك في موقف صعب مثل موقفك، بماذا تنصحه؟']];
const MENTOR_ROLE='أنت مرشد تربوي متخصص في علم نفس النمو والتربية الإيجابية (منهج التعلم الاجتماعي العاطفي والعلاج المعرفي السلوكي المبسط للأطفال)، تعمل مع أسرة سعودية مسلمة. لا تشخّص اضطرابات، ولا تُخِف الطفل، ولا تحكم عليه. تقرأ المشاعر خلف الكلمات، وتلاحظ أنماط التفكير (مثل: التعميم، لوم النفس، لوم الآخرين، التفكير بالحلول، المرونة، التسرع)، وتقترح تطويرًا تدريجيًا لطيفًا.';
function dataSummary(k){
 const ks=kidS(k),pl=plan(k),days=[];for(let i=1;i<=7;i++){const L=peekDay(k,addDays(TODAY(),-i));if(L)days.push(L)}
 const prAny=days.reduce((a,L)=>a+Object.keys(L.pr||{}).length,0),prOn=days.reduce((a,L)=>a+Object.values(L.pr||{}).filter(x=>x.st==='ontime').length,0);
 const late=ks.homework.filter(h=>!h.done&&h.due&&h.due<TODAY()).length;
 const weak=pl.subjects.map(s=>({n:s.name,a:subjAvg(s)})).filter(x=>x.a!=null&&x.a<70).map(x=>x.n+' '+x.a+'%');
 const by={};for(const t of todayTasks(k)){if(t.bonus)continue;by[t.sec]=by[t.sec]||[0,0];by[t.sec][1]++;if(t.done)by[t.sec][0]++}
 const ms=ks.mentor.missions;
 return `إنجاز اليوم ${pctOf(todayTasks(k))}%، متوسط الأسبوع ${weekPct(k)}%. الصلوات المسجلة آخر 7 أيام: ${prAny} من ${days.length*5}، منها ${prOn} في وقتها. واجبات متأخرة: ${late}. مواد درجاتها منخفضة: ${weak.join('، ')||'لا يوجد'}. إنجاز اليوم حسب القسم: ${Object.entries(by).map(([s,v])=>secOf(s).n+' '+v[0]+'/'+v[1]).join('، ')}. النقاط ${ks.points||0}. تحديات منجزة ${ms.filter(m=>m.status==='done').length}، لم تكتمل ${ms.filter(m=>m.status==='expired').length}.`;
}
const prevInsights=k=>kidS(k).mentor.checkins.slice(-4).map(c=>`${c.date}: المزاج ${moodOf(c.mood).n}${c.an?`، المشاعر ${(c.an.emotions||[]).join('/')}، التفكير: ${c.an.thinking||''}`:''}`).join('\n')||'لا يوجد';
const ciToday=k=>kidS(k).mentor.checkins.find(c=>c.date===TODAY());

// rule-based nudge shown on the child's home (works offline)
function mentorNudge(k){
 const m=M(k),pt=ptFor(k),n=nowMin(),L=dayLog(k,TODAY()),f=funState(k),ts=todayTasks(k),pct=pctOf(ts);
 const due=PRAYERS.find(p=>pt[p.k]<=n&&!L.pr[p.k]&&n-pt[p.k]<90);
 if(due)return `حان وقت صلاة ${due.n}. صلاتك في وقتها أجمل ما تبدأ به، وتمنحك نقاطًا كاملة.`;
 if(pct>=100)return `ما شاء الله يا ${m.name}! أنهيت كل مهامك اليوم. هذا هو الانضباط الذي يصنع الأبطال.`;
 if(!ciToday(k)&&n>=toMin('15:00'))return `أريد أن أسمع عن يومك يا ${m.name}. افتح «مرشدي» ولنتحدث قليلًا.`;
 if(!f.ok&&f.before){const r=f.pend.length;return `باقٍ ${r} ${r===1?'مهمة':'مهام'} ويُفتح وقت الترفيه مع إخوتك. ابدأ بالأسهل لتكسب حماسك!`}
 const act=kidS(k).mentor.missions.filter(x=>x.status==='active');
 if(act.length)return `تذكّر تحديك: «${act[0].title}». خطوة صغيرة اليوم تقرّبك منه.`;
 return pct<30?'كل رحلة تبدأ بخطوة. اختر مهمة واحدة الآن وأنجزها، وسأفرح بك.':'أنت تتقدم بشكل جميل. واصل!';
}

SEC.mentor=k=>{
 const ks=kidS(k),me_=ks.mentor,ci=ciToday(k),st=T.ci&&T.ci.k===k?T.ci:null,act=me_.missions.filter(x=>x.status==='active'||x.status==='review'),prop=me_.missions.filter(x=>x.status==='proposed'),done=me_.missions.filter(x=>x.status==='done');
 let checkin;
 if(ci)checkin=`<h2>حديث اليوم</h2><p class="mut">شعورك اليوم: <b style="color:${moodOf(ci.mood).c}">${moodOf(ci.mood).n}</b></p>${ci.reply?`<div class="ai">${mdLite(ci.reply)}</div><button class="btn sm" style="margin-top:8px" data-a="sayTxt" data-t="${esc(ci.reply)}">${ic('speak')} اسمعه</button>`:'<p class="mut">حُفظ حديثك، وسيرد عليك مرشدك عند الاتصال بالإنترنت.</p>'}`;
 else if(!st)checkin=`<h2>كيف كان يومك؟</h2><p class="mut">دقيقتان من الحديث مع مرشدك: كيف تشعر، وماذا حدث، وكيف فكّرت.</p><button class="btn pri" data-a="ciStart" data-k="${k}">${ic('chat')} ابدأ حديث اليوم</button>`;
 else if(st.busy)checkin=`<h2>${esc(st.busy)}</h2><p class="mut">لحظات…</p>`;
 else checkin=`<form data-f="ciSubmit" data-k="${k}"><h2>كيف تشعر الآن؟</h2><div class="chips" style="margin:8px 0">${MOODS.map(m=>`<label class="chip" style="margin:0;color:var(--ink);border-color:${m.c}"><input type="radio" name="mood" value="${m.v}" ${st.mood==m.v?'checked':''} required style="width:auto;min-height:0;accent-color:${m.c}"> ${m.n}</label>`).join('')}</div>
  ${st.qs.map((q,i)=>`<p class="q" style="font-size:18px">${esc(q)}</p><div class="row" style="align-items:flex-start">${micBtn('ci'+i)}<textarea id="ci${i}" name="a${i}" placeholder="تحدّث أو اكتب…" style="flex:1;min-height:70px"></textarea></div>`).join('')}
  <p class="mut" style="margin-top:8px">يطّلع والداك على ملخص هذا الحديث ليساعداك أكثر.</p><button class="btn pri" style="margin-top:8px">أرسل لمرشدك</button></form>`;
 const msCard=m=>`<div class="card" style="margin-top:10px;border-color:var(--c)"><div class="row sp"><div><span class="tag mid">${esc(m.type||'تحدٍّ')}</span><h3 style="margin-top:6px">${esc(m.title)}</h3></div><span class="pts">+${m.pts} نقطة</span></div>
  ${m.why?`<p class="mut">${esc(m.why)}</p>`:''}${(m.steps||[]).length?`<ol style="margin:6px 0;padding-inline-start:1.3em">${m.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}
  <p class="mut">${m.status==='review'?'بانتظار مراجعة إنجازك':`المدة: ${m.days} ${m.days==1?'يوم':'أيام'} · ينتهي ${esc(addDays(m.start,(+m.days||1)-1).slice(5).replace('-','/'))}`}</p>
  ${m.feedback?`<div class="ai">${mdLite(m.feedback)}</div>`:''}
  <div class="row" style="margin-top:8px">${m.status==='active'?`<button class="btn pri" data-a="msDone" data-k="${k}" data-id="${m.id}">${ic('check')} أنجزت التحدي</button>`:''}${PM()&&m.status==='review'?`<button class="btn acc" data-a="msApprove" data-k="${k}" data-id="${m.id}">اعتماد الإنجاز</button>`:''}${PM()?`<button class="btn sm ghost dang" data-a="msDel" data-k="${k}" data-id="${m.id}">${ic('trash')}</button>`:''}</div></div>`;
 const coach=COACH_HTML(k,ks);
 const parent=PM()?mentorParent(k):'';
 return `<div class="card" style="background:color-mix(in srgb,var(--c) 10%,var(--card))"><p style="font-size:18px;margin:0">${esc(mentorNudge(k))}</p></div>
 <div class="card">${checkin}</div>
 <div class="card"><div class="row sp"><h2>تحدياتي</h2><span class="mut">${done.length} منجز · ${done.reduce((a,m)=>a+(+m.earned||0),0)} نقطة مكتسبة</span></div>
 ${act.map(msCard).join('')||'<p class="empty">لا تحديات نشطة الآن</p>'}
 ${act.length<3?`<button class="btn" style="margin-top:10px" data-a="msNew" data-k="${k}">${ic('spark')} تحدٍّ جديد من مرشدي</button>`:''}
 ${done.length?`<details style="margin-top:10px"><summary>التحديات المنجزة (${done.length})</summary><ul class="list">${done.slice(-15).reverse().map(m=>`<li><span class="grow">${esc(m.title)}</span><span class="pts">+${m.earned||m.pts}</span></li>`).join('')}</ul></details>`:''}</div>
 ${PM()&&prop.length?`<div class="card" style="border-color:var(--sa)"><h2>تحديات مقترحة بانتظار اعتمادك</h2>${prop.map(m=>`<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(m.title)}</b> <span class="pts">+${m.pts}</span><p class="mut">${esc(m.why||'')}</p><div class="row"><button class="btn sm pri" data-a="msActivate" data-k="${k}" data-id="${m.id}">اعتماد وإرسال له</button><button class="btn sm ghost dang" data-a="msDel" data-k="${k}" data-id="${m.id}">${ic('trash')}</button></div></div>`).join('')}</div>`:''}
 ${coach}${parent}`;
};
const COACH_HTML=(k,ks)=>`<div class="card"><h2>تحدّث مع مرشدك</h2><p class="mut">احكِ عن أي موقف أو تحدٍّ يواجهك، وسنفكر معًا في الحل.</p><div id="coachlog">${ks.coach.slice(-12).map(c=>`<div class="msg ${c.r}">${c.r==='a'?mdLite(c.t):esc(c.t)}</div>`).join('')}${T.coachTyping?`<div class="msg a" id="coachlive">${mdLite(T.coachTyping)}</div>`:''}</div>
 <form data-f="coach" data-k="${k}" class="row" style="margin-top:8px"><textarea id="coachin" name="t" required placeholder="اكتب أو تحدّث…" style="flex:1;min-height:60px"></textarea>${micBtn('coachin')}<button class="btn pri">إرسال</button></form></div>`;

function mentorParent(k){
 const ks=kidS(k),cis=ks.mentor.checkins.slice(-14),rep=ks.mentor.report,flags=[];
 for(const c of cis)for(const f of(c.an?.flags||[]))flags.push({d:c.date,...f});
 return `<div class="card" style="border-color:var(--c)"><h2>للوالدين: القراءة التربوية</h2>
 <h3 style="margin-top:8px">المزاج خلال آخر ${cis.length} أحاديث</h3><div class="row" style="gap:4px;margin:6px 0">${cis.map(c=>`<span title="${esc(c.date)} · ${moodOf(c.mood).n}" style="width:22px;height:${10+c.mood*7}px;border-radius:5px;background:${moodOf(c.mood).c};align-self:flex-end"></span>`).join('')||'<span class="mut">لا أحاديث بعد</span>'}</div>
 ${flags.length?`<div class="ai" style="border:1px solid var(--co)"><b>إشارات تحتاج انتباهك:</b><ul>${flags.slice(-6).map(f=>`<li>${esc(f.d)} — ${esc(f.text)}${f.level==='high'?' <span class="tag bad">مهم</span>':''}</li>`).join('')}</ul></div>`:''}
 ${cis.slice().reverse().slice(0,5).map(c=>`<details style="margin-top:8px"><summary>${esc(c.date)} · ${moodOf(c.mood).n}${c.an?' · '+esc((c.an.emotions||[]).join('، ')):''}</summary>${(c.qa||[]).map(x=>`<p class="mut" style="margin-top:6px">س: ${esc(x.q)}</p><p>ج: ${esc(x.a||'—')}</p>`).join('')}${c.an?`<div class="ai"><p><b>نمط التفكير:</b> ${esc(c.an.thinking||'')}</p><p><b>السلوك:</b> ${esc(c.an.behavior||'')}</p><p><b>ما نطوّره:</b> ${esc(c.an.growth||'')}</p><p><b>توصية لكما:</b> ${esc(c.an.parentNote||'')}</p></div>`:''}</details>`).join('')}
 <div class="row" style="margin-top:12px"><button class="btn acc" data-a="mReport" data-k="${k}">${ic('spark')} تقرير تربوي شامل</button><span class="mut">${rep?'آخر تقرير: '+esc(rep.at):'يحلل الأحاديث والإنجاز والصلاة والدراسة معًا'}</span></div>
 ${rep&&rep.r?reportHTML(rep.r):''}
 <form data-f="msManual" data-k="${k}" class="fr" style="margin-top:14px"><div style="grid-column:1/-1"><label>أضف تحديًا بنفسك</label><input name="t" required placeholder="مثال: يقول كلمة طيبة لكل فرد في البيت يوميًا"></div><div><label>المدة (أيام)</label><input name="d" type="number" min="1" max="30" value="3"></div><div><label>المكافأة (نقاط)</label><input name="p" type="number" value="50"></div><button class="btn pri">إضافة التحدي</button></form></div>`;
}
const reportHTML=r=>`<div class="ai"><p>${esc(r.summary||'')}</p><h3>المشاعر والحالة النفسية</h3><p>${esc(r.emotional||'')}</p><h3>طريقة التفكير</h3><p>${esc(r.thinking||'')}</p><h3>السلوك والعادات</h3><p>${esc(r.behavior||'')}</p>
 ${(r.strengths||[]).length?`<h3>نقاط القوة</h3><ul>${r.strengths.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${(r.concerns||[]).length?`<h3>ما يحتاج انتباهًا</h3><ul>${r.concerns.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
 ${(r.parentActions||[]).length?`<h3>خطوات عملية لكما هذا الأسبوع</h3><ul>${r.parentActions.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${r.talkScript?`<h3>كيف تبدأ الحديث معه</h3><p>${esc(r.talkScript)}</p>`:''}</div>`;

// ---- actions
A.sayTxt=el=>say(el.dataset.t);
A.ciStart=async el=>{const k=el.dataset.k,ks=kidS(k);T.ci={k,qs:CI_FALLBACK[new Date().getDate()%CI_FALLBACK.length],busy:null};
 if(sampleObj&&online()){T.ci.busy='مرشدك يحضّر أسئلة اليوم';render(true);
  try{const r=await aiJSON(`${MENTOR_ROLE}\n${kidCtx(k)}\nبيانات يومه: ${dataSummary(k)}\nأحاديث سابقة:\n${prevInsights(k)}\nاكتب 3 أسئلة قصيرة دافئة لحديث اليوم مناسبة لعمره: سؤال عن مشاعره وموقف حدث اليوم، سؤال يكشف كيف فكّر وتصرّف في موقف (مرتبط ببياناته إن أمكن بلطف ودون لوم)، وسؤال تفكير أو تأمل ينمّي نمط تفكير إيجابيًا. أعد JSON: {"qs":["","",""]}`);if(r&&Array.isArray(r.qs)&&r.qs.length)T.ci.qs=r.qs.slice(0,4)}catch(e){}}
 T.ci.busy=null;render(true);say('كيف حالك يا '+M(k).name+'؟ '+T.ci.qs[0])};
F.ciSubmit=async(f,d)=>{const k=f.dataset.k,ks=kidS(k),qs=T.ci.qs;
 const c={date:TODAY(),at:stamp(),mood:+d.mood||3,qa:qs.map((q,i)=>({q,a:(d['a'+i]||'').trim()}))};ks.mentor.checkins.push(c);touchKid(k);markAuto(k,'mentor:checkin');
 if(!sampleObj||!online()){T.ci=null;render(true);return}
 T.ci.busy='مرشدك يقرأ كلامك';render(true);
 try{const r=await aiJSON(`${MENTOR_ROLE}\n${kidCtx(k)}\nبيانات سلوكه وإنجازه: ${dataSummary(k)}\nأحاديث سابقة:\n${prevInsights(k)}\nحديث اليوم — اختار شعور: ${moodOf(c.mood).n}\n${c.qa.map(x=>`س: ${x.q}\nج: ${x.a||'(لم يُجب)'}`).join('\n')}\n(الإجابات مأخوذة من الصوت وقد تحتوي أخطاء تقنية)\n\nأعد JSON:\n{"reply":"رد للطفل بصيغة المخاطب (3-5 جمل): يسمّي مشاعره ويتقبّلها، يمدح جهده أو صدقه تحديدًا، يعيد صياغة أي فكرة سلبية بطريقة متوازنة، وينتهي بسؤال تأملي أو اقتراح صغير",\n"emotions":["مشاعر ملحوظة"],"thinking":"نمط التفكير الملاحظ بجملة","behavior":"ملاحظة سلوكية من الإجابات والبيانات","growth":"نمط تفكير أو سلوك نطوّره الآن","flags":[{"level":"low|high","text":"إشارة تستحق انتباه الوالدين"}],"parentNote":"توصية عملية قصيرة للوالدين",\n"mission":null أو {"title":"تحدٍّ ممتع قصير","why":"لماذا يفيده بلغة الطفل","steps":["خطوة","خطوة"],"type":"تفكير|سلوك|مشاعر|عادات|اجتماعي|إيماني","days":1-7,"pts":20-100}}\nاستخدم high فقط لإشارات السلامة (تنمّر، إيذاء، حزن متكرر شديد، خوف من شخص، كلام عن إيذاء النفس) وانصح فيها بحديث الوالدين معه وبمختص عند الحاجة. اقترح mission فقط إن كان مفيدًا ولا يوجد أكثر من تحديين نشطين (النشطة حاليًا: ${ks.mentor.missions.filter(m=>m.status==='active').length}).`);
  c.reply=r.reply||'';c.an={emotions:r.emotions||[],thinking:r.thinking||'',behavior:r.behavior||'',growth:r.growth||'',flags:(r.flags||[]).filter(x=>x&&x.text),parentNote:r.parentNote||''};
  if(r.mission&&r.mission.title)addMission(k,r.mission,'active');
  touchKid(k);T.ci=null;render(true);if(c.reply)say(c.reply);
 }catch(e){T.ci=null;touchKid(k);render(true);toast('حُفظ حديثك، وسيرد مرشدك لاحقًا')}};
function addMission(k,m,status){kidS(k).mentor.missions.push({id:rid(),title:String(m.title).slice(0,120),why:m.why||'',steps:(m.steps||[]).slice(0,5),type:m.type||'تحدٍّ',days:clamp(+m.days||3,1,30),pts:clamp(+m.pts||40,10,150),start:TODAY(),status,by:status==='proposed'?'report':'mentor'});touchKid(k)}
A.msNew=async el=>{const k=el.dataset.k,ks=kidS(k);if(!aiReady())return;el.disabled=true;el.textContent='مرشدك يفكر في تحدٍّ يناسبك…';
 try{const r=await aiJSON(`${MENTOR_ROLE}\n${kidCtx(k)}\nبياناته: ${dataSummary(k)}\nأحاديثه الأخيرة:\n${prevInsights(k)}\nالتحديات السابقة: ${ks.mentor.missions.slice(-8).map(m=>m.title+' ('+m.status+')').join('، ')||'لا يوجد'}\nصمّم تحديًا شخصيًا واحدًا جديدًا ممتعًا ومحفّزًا يطوّر نمط تفكير أو سلوكًا يحتاجه الآن (لا تكرر السابق)، قابلًا للإنجاز والقياس، بخطوات واضحة. أعد JSON: {"title":"","why":"بلغة الطفل","steps":["",""],"type":"تفكير|سلوك|مشاعر|عادات|اجتماعي|إيماني","days":1-7,"pts":20-100}`);addMission(k,r,'active');toast('وصلك تحدٍّ جديد!')}
 catch(e){toast('تعذّر إنشاء التحدي الآن');el.disabled=false}};
A.msDone=el=>{const k=el.dataset.k,m=kidS(k).mentor.missions.find(x=>x.id===el.dataset.id);
 modal(`<form data-f="msReflect" data-k="${k}" data-id="${m.id}"><h2>${esc(m.title)}</h2><p class="q" style="font-size:18px">ماذا فعلت بالضبط؟ وماذا تعلمت أو شعرت؟</p><div class="row" style="align-items:flex-start">${micBtn('msr')}<textarea id="msr" name="t" required style="flex:1"></textarea></div><div class="row" style="margin-top:12px"><button class="btn pri">أرسل</button><button type="button" class="btn" data-a="close">إلغاء</button></div><div id="msres"></div></form>`)};
function finishMission(k,m,extra=0,fb){const ks=kidS(k);m.status='done';m.doneAt=stamp();m.earned=m.pts+extra;if(fb)m.feedback=fb;ks.points=(ks.points||0)+m.earned;touchKid(k);toast(`مبروك! +${m.earned} نقطة`)}
F.msReflect=async(f,d)=>{const k=f.dataset.k,m=kidS(k).mentor.missions.find(x=>x.id===f.dataset.id);m.reflection=d.t.trim();
 if(!sampleObj||!online()){m.status='review';touchKid(k);closeModal();toast('أُرسل إنجازك لوالديك للاعتماد');return}
 const res=$('#msres');if(res)res.innerHTML='<div class="ai">مرشدك يقرأ إنجازك…</div>';
 try{const r=await aiJSON(`${MENTOR_ROLE}\n${kidCtx(k)}\nالتحدي: "${m.title}" — الخطوات: ${(m.steps||[]).join('؛ ')}\nوصف الطفل لما فعله: "${m.reflection}"\nقيّم بلطف: هل يبدو أنه أنجز التحدي بصدق (ولو جزئيًا بجهد واضح)؟ أعد JSON: {"accepted":true/false,"bonus":0-20 لجودة التأمل,"feedback":"رد مشجع للطفل 2-3 جمل يمدح ما تعلمه تحديدًا، وإن لم يُقبل يوضح ما ينقص بلطف"}`);
  if(r.accepted){finishMission(k,m,clamp(+r.bonus||0,0,20),r.feedback);closeModal();if(r.feedback)say(r.feedback)}
  else{m.feedback=r.feedback||'';touchKid(k);if(res)res.innerHTML=`<div class="ai">${mdLite(r.feedback||'أكمل التحدي ثم أخبرني من جديد.')}</div>`}
 }catch(e){m.status='review';touchKid(k);closeModal();toast('أُرسل إنجازك لوالديك للاعتماد')}};
A.msApprove=el=>{const k=el.dataset.k,m=kidS(k).mentor.missions.find(x=>x.id===el.dataset.id);finishMission(k,m,0,'اعتمد '+ME().name+' إنجازك. أحسنت!')};
A.msActivate=el=>{const k=el.dataset.k,m=kidS(k).mentor.missions.find(x=>x.id===el.dataset.id);m.status='active';m.start=TODAY();touchKid(k)};
A.msDel=el=>ask('حذف هذا التحدي؟',()=>{const ks=kidS(el.dataset.k);ks.mentor.missions=ks.mentor.missions.filter(x=>x.id!==el.dataset.id);touchKid(el.dataset.k)});
F.msManual=(f,d)=>{addMission(f.dataset.k,{title:d.t.trim(),days:+d.d,pts:+d.p,type:'من '+ME().name},'active');toast('أُضيف التحدي')};
A.mReport=async el=>{const k=el.dataset.k,ks=kidS(k);if(!aiReady())return;el.disabled=true;el.textContent='نحلل بيانات الأسابيع الأخيرة…';
 const cis=ks.mentor.checkins.slice(-12).map(c=>`${c.date} شعور ${moodOf(c.mood).n}: ${c.qa.map(x=>x.a).filter(Boolean).join(' | ')}${c.an?` [تحليل: ${c.an.thinking}؛ ${c.an.behavior}]`:''}`).join('\n');
 const chat=ks.coach.filter(c=>c.r==='u').slice(-10).map(c=>c.t).join(' | ');
 const ms=ks.mentor.missions.slice(-10).map(m=>`${m.title}: ${m.status}${m.reflection?' — تأمله: '+m.reflection:''}`).join('\n');
 try{const r=await aiJSON(`${MENTOR_ROLE}\nاكتب تقريرًا تربويًا للوالدين عن ابنهما. ${kidCtx(k)}\nملف الاختبار الأولي: ${ks.profile?JSON.stringify({traits:ks.profile.traits,strengths:ks.profile.strengths,improve:ks.profile.improve}):'غير متوفر'}\nبيانات الإنجاز والسلوك: ${dataSummary(k)}\nأحاديث اليوم الأخيرة:\n${cis||'لا يوجد'}\nما كتبه للمرشد: ${chat||'لا يوجد'}\nالتحديات:\n${ms||'لا يوجد'}\nأعد JSON: {"summary":"خلاصة في جملتين","emotional":"","thinking":"أنماط تفكيره وطريقة تحليله","behavior":"","strengths":[""],"concerns":[""],"parentActions":["4-6 خطوات عملية محددة"],"talkScript":"جملة افتتاحية مقترحة لحديث هادئ معه","missions":[{"title":"","why":"","steps":[""],"type":"","days":3,"pts":50}]} — اقترح تحديين أو ثلاثة. كن دقيقًا ومحددًا ومبنيًا على البيانات، ولا تشخّص.`);
  ks.mentor.report={at:stamp(),r};for(const m of(r.missions||[]).slice(0,3))if(m&&m.title)addMission(k,m,'proposed');touchKid(k);toast('التقرير جاهز')}
 catch(e){toast('تعذّر إعداد التقرير الآن');el.disabled=false}};
