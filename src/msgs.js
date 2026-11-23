// ================= الرسائل الصوتية بين أفراد العائلة =================
// كل رسالة مستند مستقل: msgs/<المستلم>_<المعرّف> حتى لا تتعارض الكتابة بين المرسل والمستلم
const msgAll=()=>Object.entries(C).filter(([p,v])=>p.startsWith('msgs/')&&v&&v.to).map(([p,v])=>Object.assign({path:p},v));
const inboxOf=k=>msgAll().filter(m=>m.to===k).sort((a,b)=>b.at.localeCompare(a.at));
const sentBy=k=>msgAll().filter(m=>m.from===k).sort((a,b)=>b.at.localeCompare(a.at));
const unheard=()=>me?inboxOf(me).filter(m=>!m.heard):[];
const whenTxt=at=>(at.slice(0,10)===TODAY()?'اليوم':at.slice(0,10)===addDays(TODAY(),-1)?'أمس':at.slice(5,10).replace('-','/'))+' '+at.slice(11);
function msgBanner(){const u=unheard();if(!u.length)return'';const x=u[0],fm=M(x.from);
 return `<button class="msgbar" data-a="msgOpen" data-p="${esc(x.path)}"><span class="mic" style="width:44px;height:44px;background:#fff;color:var(--co)">${ic('speak')}</span><span style="flex:1;text-align:start"><b>رسالة صوتية من ${esc(fm?fm.name:'')}</b><br><span style="opacity:.9">${whenTxt(x.at)}${u.length>1?` · ومعها ${u.length-1} ${u.length-1===1?'رسالة أخرى':'رسائل أخرى'}`:''}</span></span><span class="btn sm" style="background:#fff;color:var(--ink)">استمع</span></button>`}
const msgBtn=()=>{const n=unheard().length;return `<button class="who" style="position:relative;padding:6px 10px" data-a="msgs" aria-label="الرسائل الصوتية">${ic('mic')}${n?`<span class="badge" style="top:-6px;inset-inline-end:-6px">${n}</span>`:''}</button>`};

const msgItem=(m,mode)=>{const other=M(mode==='in'?m.from:m.to);return `<li><span class="rank" style="background:${esc(other&&other.color||'#0d5345')};color:#fff">${esc(other?other.name[0]:'؟')}</span><span class="grow"><b>${mode==='in'?'من ':'إلى '}${esc(other?other.name:'')}</b>${m.text?`<br>${esc(m.text)}`:''}<br><span class="mut">${whenTxt(m.at)}${mode==='out'?(m.heard?` · <span style="color:var(--ok)">سُمعت ${whenTxt(m.heard)}</span>`:' · لم تُسمع بعد'):(m.heard?'':' · <b style="color:var(--co)">جديدة</b>')}</span></span>
 ${m.audio?`<button class="btn sm" data-a="msgPlay" data-p="${esc(m.path)}">${ic('speak')} استمع</button>`:''}${mode==='in'?`<button class="btn sm ghost" data-a="msgCompose" data-to="${esc(m.from)}">رد</button>`:''}</li>`};
A.msgs=()=>{const tab=T.msgTab||'in',L=tab==='in'?inboxOf(me):sentBy(me);
 modal(`<div class="row sp"><h2>الرسائل الصوتية</h2><button class="btn pri" data-a="msgCompose">${ic('mic')} رسالة جديدة</button></div>
 <div class="tabs" style="margin-top:8px"><button class="chip ${tab==='in'?'on':''}" data-a="msgTab" data-t="in">الواردة</button><button class="chip ${tab==='out'?'on':''}" data-a="msgTab" data-t="out">المرسلة</button></div>
 <ul class="list">${L.slice(0,30).map(m=>msgItem(m,tab)).join('')||'<li class="empty">لا رسائل</li>'}</ul><button class="btn" data-a="close" style="margin-top:10px">إغلاق</button>`)};
A.msgTab=el=>{T.msgTab=el.dataset.t;A.msgs()};
async function playMsg(el,path){const m=C[path];if(!m||!m.audio){toast('التسجيل غير متوفر');return}
 el.disabled=true;el.textContent='جارٍ التحميل…';
 try{const u=await audioURL(m.audio);const a=document.createElement('audio');a.controls=true;a.src=u;a.style.width='100%';a.style.marginTop='8px';
  a.addEventListener('play',()=>{if(m.to===me&&!m.heard){m.heard=stamp();touch(path)}},{once:true});
  el.replaceWith(a);a.play().catch(()=>{})}catch(e){el.disabled=false;el.textContent='تعذّر التحميل، أعد المحاولة'}}
A.msgPlay=el=>playMsg(el,el.dataset.p);
A.msgOpen=el=>{const m=C[el.dataset.p];if(!m)return;const fm=M(m.from);
 modal(`<h2>رسالة صوتية من ${esc(fm?fm.name:'')}</h2><p class="mut">${whenTxt(m.at)}</p>${m.text?`<p style="font-size:18px">${esc(m.text)}</p>`:''}
 <button class="btn acc" style="min-height:56px;width:100%;margin-top:10px" data-a="msgPlay" data-p="${esc(el.dataset.p)}">${ic('speak')} استمع للرسالة</button>
 <div class="row" style="margin-top:12px"><button class="btn" data-a="msgCompose" data-to="${esc(m.from)}">${ic('mic')} رد صوتي</button><button class="btn ghost" data-a="close">إغلاق</button></div>`)};
A.msgCompose=el=>{const to=el&&el.dataset&&el.dataset.to;const others=members().filter(m=>m.id!==me);
 modal(`<form data-f="msgSend"><h2>رسالة صوتية جديدة</h2><label>إلى</label><div class="chips">
 ${others.length>1?`<label class="chip" style="margin:0;color:var(--ink)"><input type="checkbox" name="all" data-allto style="width:auto;min-height:0"> الجميع</label>`:''}
 ${others.map(m=>`<label class="chip" style="margin:0;color:var(--ink)"><input type="checkbox" name="to_${esc(m.id)}" ${to===m.id?'checked':''} style="width:auto;min-height:0"> ${esc(m.name)}</label>`).join('')}</div>
 <div style="margin-top:14px">${recInput('vmsg','سجّل رسالتك')}</div>
 <label>نص قصير يظهر مع التنبيه (اختياري)</label><input name="text" maxlength="120" placeholder="مثال: تعال للعشاء، أو أحسنت اليوم!">
 <div class="row" style="margin-top:12px"><button class="btn pri" data-needs="vmsg" disabled>إرسال</button><button type="button" class="btn" data-a="close">إلغاء</button></div><p class="mut" id="msgst"></p></form>`)};
document.addEventListener('change',e=>{const i=e.target;if(!i.dataset||i.dataset.allto===undefined)return;i.closest('form').querySelectorAll('input[name^=to_]').forEach(x=>x.checked=i.checked)});
F.msgSend=async(f,d)=>{const blob=RECS.vmsg;const to=members().filter(m=>m.id!==me&&(d.all||d['to_'+m.id])).map(m=>m.id);
 if(!to.length){toast('اختر من سترسل إليه');return}if(!blob){toast('سجّل الرسالة أولًا');return}if(!online()){toast('إرسال الرسائل الصوتية يحتاج اتصالًا بالإنترنت');return}
 const btn=f.querySelector('button.pri'),st=$('#msgst');btn.disabled=true;
 try{let i=0;for(const k of to){if(st)st.textContent=`جارٍ الإرسال ${++i} من ${to.length}…`;
   const audio=await saveAudio(blob);const id=rid(),path='msgs/'+k+'_'+id;
   C[path]={to:k,from:me,at:stamp(),audio,text:(d.text||'').trim().slice(0,120),heard:null};touch(path);
   sb.functions.invoke('notify',{body:{to:'member',member:k,title:'رسالة صوتية من '+(ME()||{}).name,body:(d.text||'').trim()||'اضغط للاستماع',tag:'vm-'+id}}).catch(()=>{})}
  delete RECS.vmsg;closeModal();toast(to.length>1?`أُرسلت الرسالة إلى ${to.length}`:'أُرسلت الرسالة')}
 catch(e){btn.disabled=false;toast('تعذّر الإرسال، حاول مرة أخرى')}};
// تنظيف الرسائل الأقدم من 14 يومًا (من جهاز الأب أو الأم فقط)
async function pruneMsgs(){if(!PM()||!db)return;const old=addDays(TODAY(),-14);
 for(const m of msgAll())if(m.at.slice(0,10)<old){try{if(m.audio)await dropAudio(m.audio);await db.doc(m.path).delete();delete C[m.path]}catch(e){}}saveLocal()}
