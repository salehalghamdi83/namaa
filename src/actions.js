// ================= actions =================
const A={},F={};
const fd=f=>Object.fromEntries(new FormData(f).entries());
A.close=()=>closeModal();
A.askyes=()=>{const f=askFn;askFn=null;closeModal();f&&f()};
A.home=()=>{T.subj=null;go({n:'home'})};
A.kid=el=>{T.subj=null;go(PM()?{n:'kid',k:el.dataset.k}:{n:'home'})};
A.sec=el=>{T.subj=null;T.schedEdit=false;go({n:'sec',k:el.dataset.k,s:el.dataset.s})};
A.manage=el=>{T.mtab=el.dataset.tab||'tasks';if(el.dataset.k)T.mkid=el.dataset.k;go({n:'manage'})};
A.mtab=el=>{T.mtab=el.dataset.tab;render(true)};
A.mkid=el=>{T.mkid=el.dataset.k;render(true)};
A.switch=()=>ask('تسجيل خروج هذا الجهاز؟ ستحتاج رمز العائلة والرمز السري للدخول مجددًا.',()=>deviceLogout(),'تسجيل الخروج');
A.logoutNow=()=>deviceLogout();
A.newFamBack=()=>{T.newFam=false;render(true)};
A.setupAdd=()=>{const f=$('form[data-f=setup]'),keep=fd(f);T.setupKids=(T.setupKids||[0,1]).concat([0]);render(true);const g=$('form[data-f=setup]');for(const[k,v]of Object.entries(keep))if(g.elements[k])g.elements[k].value=v};
A.pick=el=>{const m=M(el.dataset.id);const pin=m.role==='father'?S().parentPin:m.pin;
 if(pin){modal(`<form data-f="pin" data-id="${m.id}"><h2>أدخل الرمز السري لـ ${esc(m.name)}</h2><input name="p" inputmode="numeric" autocomplete="off" autofocus style="margin-top:10px"><div class="row" style="margin-top:12px"><button class="btn pri">دخول</button><button type="button" class="btn" data-a="close">إلغاء</button></div></form>`)}
 else{me=m.id;saveLocal();bindMe();go({n:'home'})}};
F.pin=(f,d)=>{const m=M(f.dataset.id),pin=m.role==='father'?S().parentPin:m.pin;if(String(d.p)===String(pin)){me=m.id;saveLocal();bindMe();closeModal();go({n:'home'})}else toast('الرمز غير صحيح')};
const setupCore=(f,d)=>{
 const city=CITIES.find(c=>c[0]===String(d.city).trim())||CITIES[0];
 const mem=[{id:'father',name:d.fn.trim(),role:'father'}];if(d.mn&&d.mn.trim())mem.push({id:'mother',name:d.mn.trim(),role:'mother'});
 let i=0;while(d['kn'+i]!==undefined){if(d['kn'+i].trim())mem.push({id:'k'+rid(),name:d['kn'+i].trim(),role:'child',age:+d['ka'+i]||9,gender:d['kg'+i],grade:d['kc'+i]||'',color:KID_COLORS[(mem.length-1)%KID_COLORS.length],pin:''});i++}
 C[P.cfg]={members:mem,settings:Object.assign(clone(DEFSET),{city:city[0],lat:city[1],lng:city[2],parentPin:''}),created:TODAY()};
 for(const m of mem.filter(x=>x.role==='child')){const pl=newPlan();pl.tasks=defaultTasks(m.age);C[P.plan(m.id)]=pl;touchPlan(m.id);C[P.kid(m.id)]=newKid();touchKid(m.id)}
 me='father';touchCfg();ensureSubs();
};
F.setup=async(f,d)=>{
 const kidsIn=[];let i=0;while(d['kn'+i]!==undefined){if(d['kn'+i].trim()){if(!/^[0-9]{4,6}$/.test(d['kp'+i]||'')){toast('حدّد رمزًا سريًا من 4 إلى 6 أرقام لكل ابن');return}kidsIn.push(d['kp'+i])}i++}
 if(d.mn&&d.mn.trim()&&(d.mpw||'').length<6){toast('كلمة مرور الأم 6 أحرف على الأقل');return}
 const btn=f.querySelector('button.pri');if(btn){btn.disabled=true;btn.textContent='جارٍ الإنشاء…'}
 try{
  if(!myDev){await ensureSession();const r=await sb.rpc('create_family',{p_family_name:'عائلة '+d.fn.trim(),p_father_name:d.fn.trim(),p_password:d.pw});if(r.error)throw r.error;
   const row=r.data[0];setDev({family_id:row.family_id,member_id:'father',role:'father',code:row.code,family_name:'عائلة '+d.fn.trim()});db=makeDB();startRealtime();remLoaded=true;cfgSeen=true}
  setupCore(f,d);
  const ms=cfg().members;let ki=0;
  for(const m of ms){if(m.role==='father')continue;const sec=m.role==='mother'?d.mpw:kidsIn[ki++];const x=await sb.rpc('set_member',{p_member_id:m.id,p_name:m.name,p_role:m.role,p_color:m.color||null,p_secret:sec||null});if(x.error)throw x.error}
  T.newFam=false;go({n:'home'});A.showCode();
 }catch(e){toast(errAr(rpcErr(e)));if(btn){btn.disabled=false;btn.textContent='حفظ وبدء الاستخدام'}}
};

// ---- tasks
A.task=el=>{const k=el.dataset.k,t=todayTasks(k).find(x=>x.id===el.dataset.id);if(t)setTask(k,t,!t.done)};
A.quickTask=el=>modal(`<form data-f="taskAdd" data-k="${el.dataset.k}" data-close="1"><h2>مهمة جديدة في ${esc(secOf(el.dataset.s).n)}</h2><input type="hidden" name="s" value="${el.dataset.s}"><label>المهمة</label><input name="l" required><div class="fr"><div><label>التكرار</label><select name="r">${opt('daily','يوميًا')}${opt('once','مرة واحدة')}</select></div><div><label>النقاط</label><input name="p" type="number" value="${S().pts}"></div></div><div class="row" style="margin-top:12px"><button class="btn pri">إضافة</button><button type="button" class="btn" data-a="close">إلغاء</button></div></form>`);
F.taskAdd=(f,d)=>{const days=[0,1,2,3,4,5,6].filter(i=>d['d'+i]);const targets=d.all?kids().map(m=>m.id):[f.dataset.k];
 for(const k of targets){plan(k).tasks.push({id:rid(),sec:d.s,label:d.l.trim(),rep:d.r,days:d.r==='once'?[]:days,pts:+d.p||0});touchPlan(k)}
 if(f.dataset.close)closeModal();toast('أُضيفت المهمة');render(true)};
A.taskDel=el=>ask('حذف هذه المهمة؟',()=>{const pl=plan(el.dataset.k);pl.tasks=pl.tasks.filter(t=>t.id!==el.dataset.id);touchPlan(el.dataset.k)});
A.defTasks=el=>{const k=el.dataset.k,pl=plan(k),have=new Set(pl.tasks.map(t=>t.label));for(const t of defaultTasks(ageOf(k)))if(!have.has(t.label))pl.tasks.push(t);touchPlan(k);toast('أُضيفت المهام الافتراضية')};
F.customAdd=(f,d)=>{const st=S();st.custom=(st.custom||[]).concat([{k:'c_'+rid(),n:d.n.trim(),c:d.c}]);touchCfg()};
A.customDel=el=>ask('حذف هذا القسم ومهامه؟',()=>{const st=S();st.custom=st.custom.filter(c=>c.k!==el.dataset.id);touchCfg();for(const m of kids()){const pl=plan(m.id);pl.tasks=pl.tasks.filter(t=>t.sec!==el.dataset.id);touchPlan(m.id)}});

// ---- study
F.hwAdd=(f,d)=>{const k=f.dataset.k;kidS(k).homework.push({id:rid(),title:d.t.trim(),sub:d.s,due:d.d,done:false,by:me});touchKid(k);sumUp(k)};
A.hwDel=el=>ask('حذف هذا الواجب؟',()=>{const k=el.dataset.k,ks=kidS(k);ks.homework=ks.homework.filter(h=>h.id!==el.dataset.id);touchKid(k);sumUp(k)});
A.hwHelp=el=>{const k=el.dataset.k,h=kidS(k).homework.find(x=>x.id===el.dataset.id),sj=plan(k).subjects.find(s=>s.id===h.sub);
 runAI('hw'+h.id,`${kidCtx(k)}\nلديه واجب في مادة ${sj?sj.name:'عامة'}: "${h.title}".\nساعده على الفهم خطوة بخطوة دون أن تعطيه الحل النهائي مباشرة: اشرح الفكرة، أعطِ مثالًا مشابهًا محلولًا، ثم اطرح عليه سؤالًا يقوده للحل. ${AI_RULES} اجعل الرد قصيرًا ومنظمًا بنقاط.`)};
F.subjAdd=(f,d)=>{const k=f.dataset.k;plan(k).subjects.push({id:rid(),name:d.n.trim(),lessons:[],grades:[]});touchPlan(k)};
A.subj=el=>{T.subj=el.dataset.id||null;render(true);window.scrollTo(0,0)};
F.lessonAdd=(f,d)=>{const k=f.dataset.k,s=plan(k).subjects.find(x=>x.id===f.dataset.sid);s.lessons=(s.lessons||[]).concat([{id:rid(),title:d.t.trim(),url:d.u||'',note:d.n||'',at:TODAY()}]);touchPlan(k);sumUp(k)};
A.lessonDel=el=>ask('حذف الدرس؟',()=>{const k=el.dataset.k,s=plan(k).subjects.find(x=>x.id===el.dataset.sid);s.lessons=s.lessons.filter(l=>l.id!==el.dataset.id);touchPlan(k);sumUp(k)});
A.lessonDone=el=>{const k=el.dataset.k,t=todayTasks(k).find(x=>x.id==='ls:'+el.dataset.id);if(t)setTask(k,t,!t.done);else{const ks=kidS(k);delete ks.lessonsDone[el.dataset.id];touchKid(k)}};
A.lessonAI=el=>{const k=el.dataset.k,s=plan(k).subjects.find(x=>x.id===el.dataset.sid),l=s.lessons.find(x=>x.id===el.dataset.id);
 T['ls'+l.id]='…';render(true);runAI('ls'+l.id,`${kidCtx(k)}\nاشرح له درس "${l.title}" في مادة ${s.name}${l.note?` (ملاحظة المعلم/الوالد: ${l.note})`:''}.\nابدأ بفكرة الدرس في جملة، ثم شرح مبسط بأمثلة من حياته اليومية، ثم 3 أسئلة قصيرة يختبر بها نفسه مع إجاباتها في النهاية. ${AI_RULES}`)};
F.gradeAdd=(f,d)=>{const k=f.dataset.k,s=plan(k).subjects.find(x=>x.id===f.dataset.sid);s.grades=(s.grades||[]).concat([{id:rid(),name:d.n.trim(),score:num(d.sc),max:num(d.mx)||100,date:d.d,weak:d.w||'',by:me}]);touchPlan(k);toast('حُفظت الدرجة')};
A.gradeDel=el=>ask('حذف الدرجة؟',()=>{const k=el.dataset.k,s=plan(k).subjects.find(x=>x.id===el.dataset.sid);s.grades=s.grades.filter(g=>g.id!==el.dataset.id);touchPlan(k)});
A.gradesAI=el=>{const k=el.dataset.k,data=plan(k).subjects.map(s=>`${s.name}: `+(s.grades||[]).map(g=>`${g.name} ${g.score}/${g.max} (${g.date})${g.weak?' ضعف: '+g.weak:''}`).join('؛ ')).join('\n');
 runAI('gr'+k,`أنت مستشار تربوي. ${kidCtx(k)}\nدرجاته في الاختبارات:\n${data}\nحلّل للوالدين: 1) مكامن الخلل الأساسية وأسبابها المحتملة، 2) الاتجاه (تحسن أم تراجع)، 3) خطة علاج عملية لأسبوعين بمهام يومية قصيرة، 4) كيف يتحدث الوالدان معه عنها بإيجابية. اكتب بنقاط مختصرة وواضحة بالعربية.`)};
F.explain=(f,d)=>{const k=f.dataset.k;runAI('ex'+k,`${kidCtx(k)}\nيريد أن يفهم: "${d.q}".\nاشرحه بطريقة مناسبة لعمره وصفّه: فكرة رئيسية، شرح بمثال من الحياة، ثم سؤالان للتأكد من الفهم مع إجابتيهما. ${AI_RULES}`)};
A.sayBox=el=>{const t=T[el.dataset.id];if(t)say(t.replace(/[*#]/g,''));else toast('اطلب الشرح أولًا')};

// ---- skills & coach
F.skillAdd=(f,d)=>{const k=f.dataset.k;kidS(k).skills.push({id:rid(),name:d.n.trim(),xp:0});touchKid(k);sumUp(k)};
A.chNew=async el=>{const k=el.dataset.k,ks=kidS(k);if(!ks.skills.length)return;const sk=ks.skills[new Date().getDate()%ks.skills.length];
 const fallback={text:`خصّص 15 دقيقة اليوم لممارسة ${sk.name}، ثم أخبر أحد والديك بشيء جديد تعلمته.`};
 let ch=fallback;
 if(sampleObj&&online()){el.disabled=true;el.textContent='لحظات…';try{const r=await aiJSON(`${kidCtx(k)}\nأنشئ تحديًا يوميًا واحدًا قصيرًا وممتعًا (10-20 دقيقة) لتطوير مهارة "${sk.name}" في مستواه الحالي ${skLevel(sk.xp).l} من 10. أعد JSON: {"text":"نص التحدي بجملة أو جملتين"}`);if(r&&r.text)ch=r}catch(e){}}
 ks.challenge={date:TODAY(),skill:sk.name,sid:sk.id,text:ch.text};touchKid(k)};
A.chDone=el=>{const k=el.dataset.k,ks=kidS(k),sk=ks.skills.find(s=>s.id===ks.challenge.sid);if(sk){const before=skLevel(sk.xp).l;sk.xp=(sk.xp||0)+40;if(skLevel(sk.xp).l>before)toast(`مبروك! وصلت للمستوى ${skLevel(sk.xp).l} في ${sk.name}`)}touchKid(k);markAuto(k,'sk:day')};
F.coach=async(f,d)=>{const k=f.dataset.k,ks=kidS(k),t=d.t.trim();if(!t||!aiReady())return;ks.coach.push({r:'u',t,at:stamp()});ks.coach=ks.coach.slice(-40);touchKid(k);T.coachTyping='…';render(true);
 let hist=ks.coach.slice(-10).map(c=>({role:c.r==='u'?'user':'assistant',content:c.t}));while(hist.length&&hist[0].role!=='user')hist.shift();
 hist[0].content=`أنت مرشد تربوي حكيم ولطيف لطفل. ${kidCtx(k)} ${AI_RULES} استمع لمشكلته، اعترف بمشاعره، اسأله سؤالًا يساعده على التفكير، واقترح خطوة عملية صغيرة. ردود قصيرة (3-5 جمل). إن ذكر خطرًا أو إيذاءً فانصحه بإخبار والديه فورًا.\n\n`+hist[0].content;
 try{const r=await sampleObj(hist,{cache:false,onText:({text})=>{T.coachTyping=text;const el=document.getElementById('coachlive');if(el)el.innerHTML=mdLite(text)}});ks.coach.push({r:'a',t:r.text,at:stamp()})}catch(e){toast('تعذّر الرد الآن')}
 T.coachTyping=null;touchKid(k);render(true)};

// ---- languages
A.langTab=el=>{T.lang=el.dataset.id;render(true)};
A.langAddOpen=()=>{const k=view.k;modal(`<form data-f="langAdd" data-k="${k}"><h2>إضافة لغة</h2><select name="n">${Object.keys(LANGS).map(l=>opt(l,l)).join('')}</select><div class="row" style="margin-top:12px"><button class="btn pri">إضافة</button><button type="button" class="btn" data-a="close">إلغاء</button></div></form>`)};
F.langAdd=(f,d)=>{const k=f.dataset.k,ks=kidS(k);if(ks.langs.some(l=>l.name===d.n)){closeModal();return}const id=LANGS[d.n]||rid();ks.langs.push({id,name:d.n,code:LANGS[d.n]||'en',xp:0,words:[]});T.lang=id;touchKid(k);sumUp(k);closeModal()};
A.langLesson=async el=>{const k=el.dataset.k,ks=kidS(k),lg=ks.langs.find(l=>l.id===el.dataset.id),known=lg.words.map(w=>w.w);
 let data=null;
 if(sampleObj&&online()){el.disabled=true;el.textContent='نجهّز درسك…';
  const subj=plan(k).subjects.map(s=>s.name).join('، '),hob=(ks.profile?.talents||[]).concat(ks.skills.map(s=>s.name)).join('، ');
  try{data=await aiJSON(`${kidCtx(k)}\nأنشئ درس ${lg.name} يوميًا قصيرًا لمستوى ${skLevel(lg.xp).l} من 10. اربطه بمواده (${subj||'—'}) أو هواياته (${hob||'—'}). تجنب هذه الكلمات المعروفة: ${known.slice(-80).join(', ')||'—'}.\nأعد JSON بهذا الشكل: {"title":"عنوان بالعربية","words":[{"w":"word","m":"المعنى بالعربية","ex":"short example sentence"}],"sentence":"جملة مفيدة باللغة","sentenceAr":"ترجمتها","quiz":[{"q":"سؤال بالعربية","o":["خيار","خيار","خيار"],"a":0}]} مع 5 كلمات و4 أسئلة، و a هو رقم الخيار الصحيح بدءًا من 0.`)}catch(e){data=null}}
 if(!data||!data.words){if(lg.code!=='en'){toast('درس هذه اللغة يحتاج اتصالًا بالإنترنت');render(true);return}
  const pool=EN_STARTER.filter(w=>!known.includes(w[0]));const pick=(pool.length>=5?pool:EN_STARTER).slice(0,5);
  data={title:'كلمات جديدة',words:pick.map(w=>({w:w[0],m:w[1]})),quiz:pick.slice(0,4).map(w=>{const o=[w[1]].concat(EN_STARTER.filter(x=>x[0]!==w[0]).sort(()=>Math.random()-.5).slice(0,2).map(x=>x[1])).sort(()=>Math.random()-.5);return{q:`ما معنى ${w[0]}؟`,o,a:o.indexOf(w[1])}})}}
 ks.lesson[lg.id]={date:TODAY(),data,ans:{}};touchKid(k)};
A.quiz=el=>{const k=el.dataset.k,ks=kidS(k),lg=ks.langs.find(l=>l.id===el.dataset.id),les=ks.lesson[lg.id],qi=+el.dataset.q,o=+el.dataset.o;if(les.ans[qi]!=null)return;les.ans[qi]=o;
 const Q=les.data.quiz||[];if(Object.keys(les.ans).length>=Q.length){const right=Q.filter((q,i)=>les.ans[i]===q.a).length;les.score=Math.round(right/Q.length*100);
  if(les.score>=50){for(const w of les.data.words||[])if(!lg.words.some(x=>x.w===w.w))lg.words.push({w:w.w,m:w.m,at:TODAY()});lg.xp=(lg.xp||0)+20+right*5;markAuto(k,'lang:'+lg.id);toast(`نتيجتك ${les.score}% — أحسنت!`)}
  else{toast('حاول مرة أخرى بعد مراجعة الكلمات');les.retry=true;setTimeout(()=>{les.ans={};les.score=null;touchKid(k)},2500)}}
 touchKid(k)};
A.sayW=el=>say(el.dataset.w,el.dataset.l||'en');
A.pronNew=el=>{const k=view.k,lg=kidS(k).langs.find(l=>l.id===el.dataset.id);const w=lg.words[Math.floor(Math.random()*lg.words.length)];T.pron={lg:lg.id,w:w.w,code:lg.code};render(true)};
A.pronRec=el=>{const w=T.pron;if(!w)return;const ok=startListen({update:t=>{const o=$('#pronout');if(o)o.textContent=t},end:t=>{w.heard=t;const a=t.toLowerCase().replace(/[^a-zÀ-ɏЀ-ӿ ]/g,'').trim(),b=w.w.toLowerCase();w.res=a.includes(b)?'<span class="tag good">نطق صحيح، ممتاز!</span>':`<span class="tag mid">سمعنا: "${esc(t||'…')}" — استمع وحاول مرة أخرى</span>`;render(true)},state:s=>el.classList.toggle('on',s==='listening')});if(ok)el.classList.add('on')};

// ---- mic into textarea
A.mic=el=>{const ta=document.getElementById(el.dataset.t);if(!ta)return;if(!dictObj){ta.removeAttribute('readonly');ta.focus();kbMicHint();return}const base=ta.value?ta.value+' ':'';
 const ok=startListen({update:t=>{ta.value=base+t},end:()=>el.classList.remove('on'),state:s=>el.classList.toggle('on',s==='listening')});if(ok)el.classList.add('on')};

// ---- quran
function quranPortion(k){const q=kidS(k).quran,s=SURAH[q.surah-1];return{s,from:q.ayah,to:Math.min(s.c,q.ayah+q.daily-1)}}
function quranAdvance(k){const q=kidS(k).quran,p=quranPortion(k);q.ayah=p.to+1;if(q.ayah>p.s.c){if(!q.memorized.includes(q.surah))q.memorized.push(q.surah);toast(`مبارك! أتممت حفظ سورة ${p.s.n}`);q.surah=q.dir==='fwd'?Math.min(114,q.surah+1):Math.max(1,q.surah-1);q.ayah=1}}
A.recite=el=>{const k=el.dataset.k,mode=el.dataset.m,p=quranPortion(k);
 const what=mode==='hifz'?`سورة ${p.s.n} (${p.from}–${p.to})`:`ورد القراءة (${kidS(k).quran.read} صفحات)`;
 modal(`<h2>${mode==='hifz'?'تسميع الحفظ':'قراءة الورد'}</h2><p style="font-size:18px">${what}</p><p class="mut">اضغط الميكروفون واقرأ بصوت واضح، ثم اضغط مرة أخرى عند الانتهاء.</p>
 <div class="row" style="margin-top:12px">${micBtn('rectx','data-rec="1"')}<span class="mut" id="recst">جاهز</span></div><textarea id="rectx" ${dictObj?'readonly':''} style="margin-top:10px" placeholder="سيظهر هنا ما نسمعه…"></textarea>
 <div class="row" style="margin-top:12px"><button class="btn pri" data-a="reciteSubmit" data-k="${k}" data-m="${mode}">إرسال للتصحيح</button><button class="btn" data-a="close">إغلاق</button></div><div id="recres"></div>`)};
A.reciteSubmit=async el=>{const k=el.dataset.k,mode=el.dataset.m,tx=($('#rectx')?.value||'').trim(),ks=kidS(k),q=ks.quran,p=quranPortion(k);
 if(tx.split(' ').length<3){toast('لم نسمع ما يكفي، حاول مرة أخرى');return}
 const what=mode==='hifz'?`سورة ${p.s.n} ${p.from}–${p.to}`:'ورد القراءة';
 if(mode==='read'){q.log.push({at:stamp(),what,st:'ok',words:tx.split(' ').length});touchKid(k);markAuto(k,'q:read');closeModal();return}
 const res=$('#recres');
 if(!sampleObj||!online()){q.log.push({at:stamp(),what,st:'pending',tx:tx.slice(0,2000)});touchKid(k);res.innerHTML='<div class="ai">حُفظ التسميع، وسيُعتمد من الوالدين أو يُصحَّح تلقائيًا عند الاتصال.</div>';return}
 el.disabled=true;res.innerHTML='<div class="ai">نراجع تسميعك…</div>';
 try{const r=await aiJSON(`أنت معلّم قرآن متقن لرواية حفص عن عاصم. طفل عمره ${ageOf(k)} سنوات يسمّع سورة ${p.s.n} من الآية ${p.from} إلى الآية ${p.to}.\nهذا ما التقطه التعرف على الكلام من صوته (قد يحتوي أخطاء إملائية بسبب التقنية لا تُحسب عليه): «${tx.slice(0,3000)}»\nقارنه بالنص الصحيح للآيات المطلوبة: هل قرأ الآيات كاملة وبالترتيب؟ هل نسي كلمات أو آيات؟\nأعد JSON: {"score":0-100,"passed":true/false,"missing":["مواضع النسيان أو الخطأ إن وجدت"],"note":"تعليق قصير مشجّع للطفل"} — اعتبره ناجحًا إذا كانت الدرجة 80 فأكثر.`);
  const ok=!!r.passed&&(+r.score||0)>=70;q.log.push({at:stamp(),what,st:ok?'ok':'retry',score:+r.score||0});
  if(ok){quranAdvance(k);touchKid(k);markAuto(k,'q:hifz',2*(+S().pts||10))}else touchKid(k);
  T['qr'+k]=`<b>${ok?'ممتاز! تسميع ناجح':'يحتاج مراجعة'}</b> · ${+r.score||0}%<br>${esc(r.note||'')}${(r.missing||[]).length?'<br><span class="mut">راجع: '+r.missing.map(esc).join('، ')+'</span>':''}`;closeModal();
 }catch(e){q.log.push({at:stamp(),what,st:'pending',tx:tx.slice(0,2000)});touchKid(k);res.innerHTML='<div class="ai">تعذّر التصحيح الآن، وحُفظ التسميع لاعتماد الوالدين.</div>';el.disabled=false}};
A.qApprove=el=>{const k=el.dataset.k,q=kidS(k).quran,p=quranPortion(k);q.log.forEach(l=>{if(l.st==='pending')l.st='ok'});q.log.push({at:stamp(),what:`سورة ${p.s.n} ${p.from}–${p.to} (اعتماد ${ME().name})`,st:'ok'});quranAdvance(k);touchKid(k);markAuto(k,'q:hifz',2*(+S().pts||10))};
A.readDone=el=>{const k=el.dataset.k;kidS(k).quran.log.push({at:stamp(),what:'ورد القراءة (تسجيل ذاتي)',st:'ok'});touchKid(k);markAuto(k,'q:read')};
F.quranPlan=(f,d)=>{const k=f.dataset.k,q=kidS(k).quran;q.surah=clamp(+d.s,1,114);q.ayah=clamp(+d.a||1,1,SURAH[q.surah-1].c);q.daily=clamp(+d.d||3,1,40);q.read=clamp(+d.r||0,0,40);q.dir=d.dir;touchKid(k);toast('حُفظت الخطة')};

// ---- prayer & adhkar
A.pray=el=>{const k=el.dataset.k,p=el.dataset.p,pt=ptFor(k),n=nowMin(),L=dayLog(k,TODAY()),i=PRAYERS.findIndex(x=>x.k===p);
 if(n<pt[p]-5){toast('لم يحن وقت هذه الصلاة بعد');return}
 const end=p==='fajr'?pt.sunrise:i<4?pt[PRAYERS[i+1].k]:1440;const st=n<=pt[p]+30?'ontime':n<end?'late':'qada';
 L.pr[p]={at:stamp(),st};verAuto(k,'p:'+p);const base=+S().pts||10;addPts(k,st==='ontime'?base:st==='late'?Math.round(base/2):Math.round(base/4));sumUp(k);
 toast(st==='ontime'?'تقبّل الله! صلاة في وقتها':st==='late'?'تقبّل الله، حاول أن تبكّر المرة القادمة':'تقبّل الله، سُجّلت قضاءً')};
A.adhkar=el=>{const k=el.dataset.k,x=el.dataset.x,list=ADHKAR.common.concat(ADHKAR[x]);
 modal(`<h2>أذكار ${x==='m'?'الصباح':'المساء'}</h2><p class="mut">اضغط الميكروفون واقرأ الأذكار بصوت مسموع، وسنتحقق من سماعها.</p>
 <div class="row" style="margin:10px 0">${micBtn('aztx')}<span class="mut">اضغط مرة أخرى عند الانتهاء</span></div>
 <div>${list.map(a=>`<div class="dhikr">${esc(a.t)} ${a.r>1?`<small>(${a.r} مرات)</small>`:''}</div>`).join('')}</div>
 <textarea id="aztx" ${dictObj?'readonly':''} style="margin-top:10px" placeholder="ما نسمعه يظهر هنا"></textarea>
 <div class="row" style="margin-top:12px"><button class="btn pri" data-a="azSubmit" data-k="${k}" data-x="${x}">تأكيد القراءة</button>${dictObj?'':`<button class="btn" data-a="azSelf" data-k="${k}" data-x="${x}">قرأتها (دون تسجيل)</button>`}<button class="btn ghost" data-a="close">إغلاق</button></div>`)};
function azScore(x,tx){const heard=new Set(normAr(tx).split(' '));const items=ADHKAR.common.concat(ADHKAR[x]);let tot=0,hit=0;for(const a of items){const w=[...new Set(normAr(a.t.replace(/^آية الكرسي:/,'')).split(' ').filter(s=>s.length>2))];tot+=w.length;hit+=w.filter(s=>heard.has(s)).length}return tot?Math.round(hit/tot*100):0}
A.azSubmit=el=>{const k=el.dataset.k,x=el.dataset.x,tx=$('#aztx')?.value||'',sc=azScore(x,tx);
 if(sc<45){toast(`سمعنا ${sc}% فقط من الأذكار — أكمل القراءة بصوت أوضح`);return}
 dayLog(k,TODAY()).az[x]={at:stamp(),st:'heard',score:sc};verAuto(k,'a:'+x);addPts(k,+S().pts||10);sumUp(k);closeModal();toast('بارك الله فيك، سُجّلت الأذكار')};
A.azSelf=el=>{const k=el.dataset.k;dayLog(k,TODAY()).az[el.dataset.x]={at:stamp(),st:'self'};verAuto(k,'a:'+el.dataset.x);addPts(k,Math.round((+S().pts||10)/2));sumUp(k);closeModal()};
function setLoc(k,la,ln,src){const n=nearestCity(la,ln);kidS(k).loc={lat:+(+la).toFixed(4),lng:+(+ln).toFixed(4),at:stamp(),src,label:n.km<=30?n.c[0]:(n.c[0]+' (~'+n.km+' كم)')};touchKid(k)}
function tryGPS(k,{silent=false}={}){return new Promise(res=>{if(!navigator.geolocation){res(false);return}
 navigator.geolocation.getCurrentPosition(p=>{setLoc(k,p.coords.latitude,p.coords.longitude,'gps');if(!silent)toast('تم تحديد موقعك وتحديث المواقيت');res(true)},()=>res(false),{timeout:silent?6000:10000,maximumAge:900000,enableHighAccuracy:false})})}
A.gps=async el=>{const k=el.dataset.k;el.disabled=true;el.textContent='جارٍ تحديد الموقع…';const ok=await tryGPS(k);if(ok)return;el.disabled=false;
 modal(`<h2>تحديد موقع ${esc(M(k).name)}</h2><p class="mut">لم يسمح المتصفح بقراءة GPS من داخل هذه الصفحة. اختر إحدى الطريقتين:</p>
 <form data-f="locPaste" data-k="${k}" class="card"><h3>1) الصق موقعك من خرائط Google</h3><ol class="mut" style="margin:4px 0;padding-inline-start:1.2em"><li>افتح خرائط Google على الجوال واضغط زر موقعي الأزرق.</li><li>اضغط مطولًا على النقطة الزرقاء فتظهر الإحداثيات في الأعلى (مثل 20.0129, 41.4677)، انسخها.</li><li>الصقها هنا.</li></ol><input id="locin" name="t" required placeholder="20.0129, 41.4677 أو رابط الموقع الكامل" dir="ltr"><button class="btn pri" style="margin-top:8px">حفظ الموقع</button></form>
 <form data-f="locCity" data-k="${k}" class="card"><h3>2) أو اختر المدينة / المحافظة</h3>${citySelect('c',S().city)}<button class="btn pri" style="margin-top:8px">حفظ</button></form>
 <button class="btn" data-a="close">إغلاق</button>`)};
F.locPaste=(f,d)=>{const p=parseLoc(d.t);if(!p){toast(/goo\.gl|maps\.app/.test(d.t)?'الرابط المختصر لا يحوي الإحداثيات — انسخ الأرقام نفسها':'لم نتعرّف على الإحداثيات، انسخ رقمين مثل 20.01, 41.46');return}setLoc(f.dataset.k,p.lat,p.lng,'paste');closeModal();toast('حُفظ الموقع وحُدّثت المواقيت')};
F.locCity=(f,d)=>{const c=CITIES.find(x=>x[0]===String(d.c).trim());if(!c){toast('اختر اسمًا من القائمة');return}kidS(f.dataset.k).loc={lat:c[1],lng:c[2],at:stamp(),src:'city',label:c[0]};touchKid(f.dataset.k);closeModal()};
A.gpsClear=el=>{kidS(el.dataset.k).loc=null;touchKid(el.dataset.k)};

// ---- money
F.txAdd=(f,d)=>{const k=f.dataset.k,ks=kidS(k),amt=num(d.a);if(amt<=0)return;
 if(d.ty==='in'&&d.j==='auto'){const J=S().jars;for(const j of JARS){const v=Math.round(amt*(+J[j.k]||0))/100;if(v>0)ks.money.tx.push({id:rid(),d:TODAY(),type:'in',amt:v,jar:j.k,n:d.n||'إيداع'})}}
 else ks.money.tx.push({id:rid(),d:TODAY(),type:d.ty,amt,jar:d.j==='auto'?'spend':d.j,n:d.n||''});
 ks.money.tx=ks.money.tx.slice(-400);touchKid(k);toast('سُجّلت العملية')};
F.goalAdd=(f,d)=>{const k=f.dataset.k;kidS(k).money.goals.push({id:rid(),n:d.n.trim(),t:num(d.t)});touchKid(k)};
A.goalDel=el=>{const ks=kidS(el.dataset.k);ks.money.goals=ks.money.goals.filter(g=>g.id!==el.dataset.id);touchKid(el.dataset.k)};
A.moneyAI=el=>{const k=el.dataset.k;runAI('mo'+k,`${kidCtx(k)}\nعلّمه درسًا ماليًا واحدًا جديدًا اليوم (ادخار، ميزانية، صدقة، أو استثمار حلال مبسط) بقصة قصيرة أو مثال من حياته، ثم مهمة عملية صغيرة يطبقها هذا الأسبوع. ${AI_RULES} لا يزيد عن 120 كلمة.`)};
document.addEventListener('input',e=>{const s=e.target.dataset&&e.target.dataset.sim;if(s){T.sim=Object.assign({m:20,y:5,r:6},T.sim,{[s]:num(e.target.value)});clearTimeout(T.simT);T.simT=setTimeout(()=>{const id=document.activeElement&&document.activeElement.dataset.sim;render(true);if(id){const el=document.querySelector(`[data-sim="${id}"]`);if(el){el.focus();const v=el.value;el.value='';el.value=v}}},500)}});

// ---- time
A.water=el=>{const k=el.dataset.k,L=dayLog(k,TODAY()),g=waterGoal(k),was=L.water>=g;L.water=Math.max(0,L.water+(+el.dataset.d));const now=L.water>=g;if(now&&!was){verAuto(k,'water');addPts(k,+S().pts||10);toast('هدف الماء تحقق!')}else if(was&&!now)addPts(k,-(+S().pts||10));sumUp(k)};
A.schedEdit=()=>{T.schedEdit=!T.schedEdit;render(true)};
F.sched=(f,d)=>{const k=f.dataset.k,pl=plan(k),rows=[];for(let i=0;i<+d.n;i++)if((d['l'+i]||'').trim()&&d['t'+i])rows.push([d['t'+i],d['l'+i].trim(),d['y'+i]]);pl.schedule=pl.schedule||{};pl.schedule[f.dataset.key]=rows;touchPlan(k);T.schedEdit=false;toast('حُفظ الجدول')};
A.schedRow=el=>{const k=el.dataset.k,pl=plan(k),key=el.dataset.key,we=key==='weekend';pl.schedule=pl.schedule||{};pl.schedule[key]=((pl.schedule[key])||defSchedule(ageOf(k),we)).concat([['12:00','نشاط جديد','routine']]);touchPlan(k)};
A.schedReset=el=>{const pl=plan(el.dataset.k);if(pl.schedule)delete pl.schedule[el.dataset.key];touchPlan(el.dataset.k)};

// ---- rewards
F.rewardSet=(f,d)=>{const k=f.dataset.k,rw=RWw(),wk=weekKey(),pl=plan(k);rw.pct[k]||={};delete pl.rewardPct[wk];if(d.p===''||d.p==null){rw.pct[k][wk]=null}else rw.pct[k][wk]=clamp(num(d.p),0,100);touch(P.rw);toast('حُفظت نسبة المكافأة')};
A.payReward=el=>{const k=el.dataset.k,ri=rewardInfo(k);ask(`صرف ${ri.amt} ${S().cur} لـ ${M(k).name}؟`,()=>{const rw=RWw();rw.paid[k]||={};rw.paid[k][ri.wk]=ri.amt;touch(P.rw);const ks=kidS(k),J=S().jars;for(const j of JARS){const v=Math.round(ri.amt*(+J[j.k]||0))/100;if(v>0)ks.money.tx.push({id:rid(),d:TODAY(),type:'in',amt:v,jar:j.k,n:'مكافأة الأسبوع ('+ri.pct+'%)'})}touchKid(k);toast('صُرفت المكافأة إلى الحصّالة')})};
A.redeem=el=>{const k=el.dataset.k,c=S().catalog.find(x=>x.id===el.dataset.id);ask(`طلب "${c.n}" مقابل ${c.cost} نقطة؟`,()=>{kidS(k).redeem.push({id:rid(),cid:c.id,n:c.n,cost:c.cost,at:stamp(),st:'pending'});touchKid(k);toast('أُرسل الطلب لوالدك')})};
A.redeemOk=el=>{const k=el.dataset.k,ks=kidS(k),r=ks.redeem.find(x=>x.id===el.dataset.id);if(ks.points<r.cost){toast('النقاط غير كافية');return}r.st='ok';ks.points-=r.cost;touchKid(k)};
A.redeemNo=el=>{const ks=kidS(el.dataset.k);ks.redeem.find(x=>x.id===el.dataset.id).st='no';touchKid(el.dataset.k)};
F.catalog=(f,d)=>{const st=S(),out=[];for(let i=0;i<+d.len;i++)if((d['n'+i]||'').trim())out.push({id:st.catalog[i].id,n:d['n'+i].trim(),cost:num(d['c'+i])});if((d.nn||'').trim())out.push({id:rid(),n:d.nn.trim(),cost:num(d.nc)||100});st.catalog=out;touchCfg();toast('حُفظ المتجر')};

// ---- family & settings
A.memEdit=el=>{const m=el.dataset.id?M(el.dataset.id):{id:'',role:el.dataset.role||'child',name:'',age:9,gender:'m',grade:'',pin:''};
 modal(`<form data-f="memSave" data-id="${m.id}" data-role="${m.role}"><h2>${m.id?'تعديل '+esc(m.name):m.role==='mother'?'إضافة حساب الأم':'إضافة ابن'}</h2>
 <label>الاسم</label><input name="n" required value="${esc(m.name)}">
 ${m.role==='child'?`<div class="fr"><div><label>العمر</label><input name="a" type="number" min="3" max="20" value="${m.age}"></div><div><label>الجنس</label><select name="g">${opt('m','ولد',m.gender)}${opt('f','بنت',m.gender)}</select></div><div><label>الصف</label><input name="c" value="${esc(m.grade||'')}"></div></div>`:''}
 ${m.role!=='father'?`<label>${m.role==='child'?'رمزه السري (4–6 أرقام)':'كلمة المرور (6 أحرف على الأقل)'}</label><input name="p" ${m.role==='child'?'inputmode="numeric" maxlength="6"':'type="password"'} ${m.id?'placeholder="اتركه فارغًا للإبقاء على الحالي"':'required'} autocomplete="new-password">`:''}
 <div class="row" style="margin-top:12px"><button class="btn pri">حفظ</button><button type="button" class="btn" data-a="close">إلغاء</button></div></form>`)};
F.memSave=(f,d)=>{const c=cfg();let m=f.dataset.id&&M(f.dataset.id);
 if(!m){m={id:f.dataset.role==='mother'?'mother':'k'+rid(),role:f.dataset.role,color:KID_COLORS[c.members.length%KID_COLORS.length]};c.members.push(m);if(m.role==='child'){const pl=newPlan();pl.tasks=defaultTasks(+d.a||9);C[P.plan(m.id)]=pl;touchPlan(m.id)}}
 m.name=d.n.trim();if(m.role==='child'){m.age=+d.a||9;m.gender=d.g;m.grade=d.c||''}delete m.pin;
 touchCfg();ensureSubs();closeModal();
 sb&&sb.rpc('set_member',{p_member_id:m.id,p_name:m.name,p_role:m.role,p_color:m.color||null,p_secret:d.p||null}).then(r=>{if(r.error)toast(errAr(rpcErr(r.error)));else toast(d.p?'حُفظ الرمز السري':'حُفظ')})};
A.memDel=el=>{const m=M(el.dataset.id);ask(`حذف ${m.name} من العائلة؟ (تبقى بياناته محفوظة)`,()=>{const c=cfg();c.members=c.members.filter(x=>x.id!==m.id);touchCfg();sb&&sb.rpc('remove_member',{p_member_id:m.id})})};
F.settings=(f,d)=>{const st=S(),c=CITIES.find(x=>x[0]===String(d.city).trim());
 if(c&&d.city!==st.city){st.city=c[0];st.lat=c[1];st.lng=c[2]}else{st.lat=num(d.lat);st.lng=num(d.lng);if(!c)st.city='موقع مخصص'}
 st.method=d.method;st.playStart=d.ps;st.playEnd=d.pe;st.playThreshold=clamp(num(d.th),0,100);st.funIdeas=d.ideas.split(/[،,]/).map(s=>s.trim()).filter(Boolean);
 st.rewardBase=num(d.rb);st.cur=d.cur||'ر.س';st.pts=num(d.pts)||10;st.jars={};for(const j of JARS)st.jars[j.k]=num(d['j_'+j.k]);st.parentPin=d.pin||'';touchCfg();toast('حُفظت الإعدادات')};

// ---- assessment flow
A.assess=el=>{const k=el.dataset.k,ks=kidS(k);if(ks.profile&&!PM()){go({n:'sec',k,s:'skills'});return}
 const go2=()=>{const dr=ks.asDraft;T.as=dr&&!ks.profile?{k,i:dr.i,ans:dr.ans||[]}:{k,i:-1,ans:[]};go({n:'assess',k})};
 if(ks.profile&&PM())ask(`لدى ${M(k).name} ملف شخصية من ${ks.profile.at||''}. إعادة الاختبار ستستبدل النتيجة السابقة. متابعة؟`,()=>{ks.asDraft=null;go2()},'إعادة الاختبار');else go2()};
const asDraft=()=>{const ks=kidS(T.as.k);ks.asDraft={i:T.as.i,ans:T.as.ans.slice(),at:stamp()};touchKid(T.as.k)};
const asQ=()=>qsetFor(T.as.k)[T.as.i];
A.asStart=()=>{T.as.i=0;render(true);say(asQ())};
A.asSay=()=>say(asQ());
const asSave=()=>{const ta=$('#asin');if(ta)T.as.ans[T.as.i]=ta.value.trim()};
A.asNext=()=>{asSave();stopListen();T.as.i++;asDraft();render(true);window.scrollTo(0,0);if(T.as.i<qsetFor(T.as.k).length)say(asQ());else A.asAnalyze()};
A.asSkip=()=>{T.as.ans[T.as.i]='';stopListen();T.as.i++;asDraft();render(true);if(T.as.i<qsetFor(T.as.k).length)say(asQ())};
A.asPrev=()=>{asSave();T.as.i--;render(true)};
A.asAnalyze=async()=>{const A_=T.as,k=A_.k,Q=qsetFor(k),ks=kidS(k);ks.answers={at:stamp(),qa:Q.map((q,i)=>({q,a:A_.ans[i]||''}))};touchKid(k);
 if(!aiReady()){A_.err='حُفظت الإجابات. سيتم التحليل عند الاتصال بالإنترنت — اضغط الزر لاحقًا.';render(true);return}
 A_.busy=true;render(true);
 try{const r=await aiJSON(`أنت أخصائي نفسي تربوي ومقيّم تعليمي. ${kidCtx(k)}\nأجرى الطفل مقابلة صوتية (الإجابات مكتوبة آليًا من الصوت وقد تحتوي أخطاء تقنية):\n${ks.answers.qa.map((x,i)=>`${i+1}. س: ${x.q}\nج: ${x.a||'(لم يُجب)'}`).join('\n')}\n\nحلّل شخصيته ومهاراته وموهبته ومستواه العلمي مقارنة بعمره. أعد JSON:\n{"summary":"فقرة قصيرة دافئة تصف شخصيته بصيغة المخاطب له","traits":["سمات"],"strengths":["نقاط قوة"],"talents":["مواهب محتملة"],"improve":["مهارات تحتاج تطوير"],"academicLevel":"وصف مختصر لمستواه العلمي (رياضيات/علوم/لغة)","learningStyle":"بصري/سمعي/حركي مع تفسير قصير","skills":[{"name":"مهارة يُنصح بتطويرها","why":"لماذا"}],"englishLevel":1-10,"tips":["3-5 نصائح عملية للوالدين"]}\nاجعل المهارات المقترحة 3 إلى 5، مزيجًا من مهارات حياتية وموهبته.`);
  ks.profile=Object.assign({at:stamp()},r);ks.asDraft=null;
  for(const s of(r.skills||[]))if(!ks.skills.some(x=>x.name===s.name))ks.skills.push({id:rid(),name:s.name,xp:0,why:s.why||''});
  const en=ks.langs.find(l=>l.id==='en');if(en&&!en.xp&&r.englishLevel)en.xp=Math.max(0,(+r.englishLevel-1)*100);
  touchKid(k);sumUp(k);A_.busy=false;A_.done=true;render(true);
 }catch(e){A_.busy=false;A_.err='تعذّر التحليل الآن، وحُفظت الإجابات. حاول مرة أخرى.';render(true)}};

// ================= event wiring =================
document.addEventListener('click',e=>{const el=e.target.closest('[data-a]');if(!el||el.disabled)return;const fn=A[el.dataset.a];if(fn){e.preventDefault();fn(el,e)}});
document.addEventListener('submit',e=>{const f=e.target.closest('form[data-f]');if(!f)return;e.preventDefault();const fn=F[f.dataset.f];if(fn){fn(f,fd(f));if(document.activeElement)document.activeElement.blur();setTimeout(()=>render(true),0)}});
window.addEventListener('online',()=>{syncState='ok';flush();updSync()});
window.addEventListener('offline',updSync);
setInterval(()=>{if(!typing()&&!$('.mback'))render();if(Object.keys(dirty).length)flush()},60000);

