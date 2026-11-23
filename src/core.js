// ================= core utilities =================
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rid=()=>Date.now().toString(36).slice(-5)+Math.random().toString(36).slice(2,6);
const pad=n=>String(n).padStart(2,'0');
const dk=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const TODAY=()=>dk(new Date());
const ymOf=s=>s.slice(0,7);
const addDays=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return dk(d)};
const dowOf=s=>new Date(s+'T12:00:00').getDay();
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const toMin=t=>{const p=String(t||'0:0').split(':').map(Number);return (p[0]||0)*60+(p[1]||0)};
const hhmm=m=>{m=((Math.round(m)%1440)+1440)%1440;return pad(Math.floor(m/60))+':'+pad(m%60)};
const fmtMin=m=>{m=((Math.round(m)%1440)+1440)%1440;const h=Math.floor(m/60);return ((h%12)||12)+':'+pad(m%60)+' '+(h<12?'ص':'م')};
const stamp=()=>{const d=new Date();return TODAY()+' '+pad(d.getHours())+':'+pad(d.getMinutes())};
const clone=o=>JSON.parse(JSON.stringify(o));
const num=v=>{const n=parseFloat(String(v).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)));return isFinite(n)?n:0};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const hijri=d=>{try{return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura-nu-latn',{day:'numeric',month:'long',year:'numeric'}).format(d)}catch(e){return ''}};
const gdate=d=>{try{return new Intl.DateTimeFormat('ar-u-nu-latn',{weekday:'long',day:'numeric',month:'long'}).format(d)}catch(e){return dk(d)}};
function normAr(s){return String(s||'').replace(/[ً-ٰٟۖ-ۭـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[^ء-يa-z0-9\s]/gi,' ').replace(/\s+/g,' ').trim()}
function mdLite(t){const lines=esc(t).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').split('\n');let h='',ul=false;for(const l of lines){const m=l.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)/);if(m){if(!ul){h+='<ul>';ul=true}h+='<li>'+m[1]+'</li>'}else{if(ul){h+='</ul>';ul=false}const hd=l.match(/^#+\s*(.*)/);h+=hd?'<h3>'+hd[1]+'</h3>':(l.trim()?'<p>'+l+'</p>':'')}}if(ul)h+='</ul>';return h}

// ================= icons =================
const IC={
book:'<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/><path d="M9 7h6"/>',
spark:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z"/>',
globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
quran:'<path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5z"/><path d="M12 6v13"/>',
moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
coin:'<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7"/><path d="M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
play:'<rect x="2.5" y="7" width="19" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1"/><circle cx="18" cy="13.5" r="1"/>',
gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v8h14v-8M12 8v12"/><path d="M12 8C10 4 6.5 4.5 7.5 7c.5 1 4.5 1 4.5 1zm0 0c2-4 5.5-3.5 4.5-1-.5 1-4.5 1-4.5 1z"/>',
box:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 12l2 2 4-4"/>',
leaf:'<path d="M5 19c0-8 5-14 15-14 0 10-6 15-14 15"/><path d="M5 19c3-4 6-6.5 10-8.5"/>',
mic:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
speak:'<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
back:'<path d="M9 5l7 7-7 7"/>',
check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
lock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
unlock:'<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.5-2"/>',
pin:'<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
gear:'<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14a5 5 0 0 1 5.5 5"/>',
chat:'<path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 9h8M8 12h5"/>',
link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
};
const ic=(n,c='')=>`<svg class="i ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||IC.box}</svg>`;

// ================= reference data =================
const SECTIONS=[
{k:'mentor',n:'مرشدي',c:'#2b6f8f',i:'chat'},
{k:'study',n:'دراستي',c:'#2f6fdb',i:'book'},
{k:'skills',n:'شخصيتي ومهاراتي',c:'#8a4fd6',i:'spark'},
{k:'lang',n:'لغاتي',c:'#0e8f84',i:'globe'},
{k:'quran',n:'القرآن الكريم',c:'#13795f',i:'quran'},
{k:'prayer',n:'صلاتي وأذكاري',c:'#1e7a55',i:'moon'},
{k:'money',n:'حصّالتي',c:'#b57a0c',i:'coin'},
{k:'time',n:'يومي ووقتي',c:'#cf5a35',i:'clock'},
{k:'fun',n:'وقت الترفيه',c:'#d23f73',i:'play'},
{k:'rewards',n:'مكافآتي',c:'#9a6b00',i:'gift'}];
const PRAYERS=[{k:'fajr',n:'الفجر'},{k:'dhuhr',n:'الظهر'},{k:'asr',n:'العصر'},{k:'maghrib',n:'المغرب'},{k:'isha',n:'العشاء'}];
const CITIES=[
['الرياض',24.7136,46.6753],['الخرج',24.1556,47.3346],['الدوادمي',24.5077,44.3924],['المجمعة',25.9039,45.3456],['الزلفي',26.2994,44.8156],['شقراء',25.2483,45.2528],['عفيف',23.9065,42.9172],['القويعية',24.0737,45.2806],['وادي الدواسر',20.4607,44.7812],['الأفلاج',22.2833,46.7333],['حوطة بني تميم',23.5,46.8333],['الدرعية',24.7375,46.5753],
['مكة المكرمة',21.3891,39.8579],['جدة',21.4858,39.1925],['الطائف',21.2703,40.4158],['القنفذة',19.1264,41.0789],['الليث',20.15,40.2667],['رابغ',22.7986,39.0349],['تربة',21.2142,41.6331],['الخرمة',21.9167,42.05],['رنية',21.2585,42.8467],
['المدينة المنورة',24.5247,39.5692],['ينبع',24.0895,38.0618],['العلا',26.6085,37.9232],['بدر',23.7833,38.7833],['خيبر',25.6967,39.2925],['المهد',23.4833,40.8667],
['الباحة',20.0129,41.4677],['بلجرشي',19.8597,41.5583],['المخواة',19.7833,41.4333],['العقيق',20.2667,41.65],['المندق',20.1667,41.2833],['قلوة',19.9333,41.2833],['القرى',20.1167,41.35],
['أبها',18.2164,42.5053],['خميس مشيط',18.3,42.7333],['بيشة',20.0005,42.6052],['محايل عسير',18.5469,42.0517],['النماص',19.1167,42.1333],['سراة عبيدة',18.0833,43.1167],['رجال ألمع',18.2167,42.2833],['ظهران الجنوب',17.6667,43.5167],
['جازان',16.8892,42.5511],['صبيا',17.1495,42.6254],['أبو عريش',16.9689,42.8325],['صامطة',16.5964,42.9444],['فرسان',16.7022,42.1183],
['نجران',17.4924,44.1277],['شرورة',17.4849,47.1172],
['الدمام',26.4207,50.0888],['الخبر',26.2172,50.1971],['الظهران',26.2361,50.0393],['الأحساء',25.3833,49.5867],['الجبيل',27.0174,49.6225],['القطيف',26.5196,50.0115],['رأس تنورة',26.6436,50.1597],['الخفجي',28.4391,48.4913],['حفر الباطن',28.4342,45.9636],['النعيرية',27.4697,48.4878],
['بريدة',26.326,43.975],['عنيزة',26.0844,43.9935],['الرس',25.8694,43.4973],['البكيرية',26.1393,43.6588],['المذنب',25.8601,44.2223],['البدائع',25.9833,43.7333],
['حائل',27.5114,41.7208],['بقعاء',27.8833,42.4],
['تبوك',28.3835,36.5662],['الوجه',26.2333,36.4667],['أملج',25.0213,37.2685],['ضباء',27.3511,35.69],['تيماء',27.6333,38.55],['حقل',29.2833,34.9333],
['سكاكا',29.9697,40.2064],['دومة الجندل',29.8114,39.8681],['القريات',31.3317,37.3428],['طبرجل',30.4997,38.2161],
['عرعر',30.9753,41.0381],['رفحاء',29.6386,43.5014],['طريف',31.6725,38.6637],
['الكويت',29.3759,47.9774],['دبي',25.2048,55.2708],['أبوظبي',24.4539,54.3773],['الشارقة',25.3463,55.4209],['الدوحة',25.2854,51.531],['المنامة',26.2285,50.586],['مسقط',23.588,58.3829],['عمّان',31.9454,35.9284],['القاهرة',30.0444,31.2357],['إسطنبول',41.0082,28.9784],['لندن',51.5074,-0.1278]];
const nearestCity=(la,ln)=>{let b=null,bd=1e9;for(const c of CITIES){const d=Math.hypot(c[1]-la,(c[2]-ln)*Math.cos(la*Math.PI/180));if(d<bd){bd=d;b=c}}return{c:b,km:Math.round(bd*111)}};
const citySelect=(name,sel)=>`<input name="${name}" list="citylist" value="${esc(sel||'')}" placeholder="اكتب اسم المدينة أو المحافظة" autocomplete="off"><datalist id="citylist">${CITIES.map(c=>`<option value="${c[0]}">`).join('')}</datalist>`;
function parseLoc(t){t=String(t||'').replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));const m=t.match(/@(-?\d+\.\d+),\s*(-?\d+\.\d+)/)||t.match(/[?&](?:q|ll|query|destination)=(-?\d+\.\d+)(?:,|%2C)\s*(-?\d+\.\d+)/i)||t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)||t.match(/(-?\d{1,2}\.\d{3,})\s*[,،\s]\s*(-?\d{1,3}\.\d{3,})/);if(!m)return null;const la=+m[1],ln=+m[2];return Math.abs(la)<=90&&Math.abs(ln)<=180?{lat:la,lng:ln}:null}
const SURAH='الفاتحة:7|البقرة:286|آل عمران:200|النساء:176|المائدة:120|الأنعام:165|الأعراف:206|الأنفال:75|التوبة:129|يونس:109|هود:123|يوسف:111|الرعد:43|إبراهيم:52|الحجر:99|النحل:128|الإسراء:111|الكهف:110|مريم:98|طه:135|الأنبياء:112|الحج:78|المؤمنون:118|النور:64|الفرقان:77|الشعراء:227|النمل:93|القصص:88|العنكبوت:69|الروم:60|لقمان:34|السجدة:30|الأحزاب:73|سبأ:54|فاطر:45|يس:83|الصافات:182|ص:88|الزمر:75|غافر:85|فصلت:54|الشورى:53|الزخرف:89|الدخان:59|الجاثية:37|الأحقاف:35|محمد:38|الفتح:29|الحجرات:18|ق:45|الذاريات:60|الطور:49|النجم:62|القمر:55|الرحمن:78|الواقعة:96|الحديد:29|المجادلة:22|الحشر:24|الممتحنة:13|الصف:14|الجمعة:11|المنافقون:11|التغابن:18|الطلاق:12|التحريم:12|الملك:30|القلم:52|الحاقة:52|المعارج:44|نوح:28|الجن:28|المزمل:20|المدثر:56|القيامة:40|الإنسان:31|المرسلات:50|النبأ:40|النازعات:46|عبس:42|التكوير:29|الانفطار:19|المطففين:36|الانشقاق:25|البروج:22|الطارق:17|الأعلى:19|الغاشية:26|الفجر:30|البلد:20|الشمس:15|الليل:21|الضحى:11|الشرح:8|التين:8|العلق:19|القدر:5|البينة:8|الزلزلة:8|العاديات:11|القارعة:11|التكاثر:8|العصر:3|الهمزة:9|الفيل:5|قريش:4|الماعون:7|الكوثر:3|الكافرون:6|النصر:3|المسد:5|الإخلاص:4|الفلق:5|الناس:6'.split('|').map(x=>{const[a,b]=x.split(':');return{n:a,c:+b}});
const ADHKAR={
 common:[
  {t:'آية الكرسي: الله لا إله إلا هو الحي القيوم لا تأخذه سنة ولا نوم له ما في السماوات وما في الأرض من ذا الذي يشفع عنده إلا بإذنه يعلم ما بين أيديهم وما خلفهم ولا يحيطون بشيء من علمه إلا بما شاء وسع كرسيه السماوات والأرض ولا يئوده حفظهما وهو العلي العظيم',r:1},
  {t:'قل هو الله أحد ۝ الله الصمد ۝ لم يلد ولم يولد ۝ ولم يكن له كفوا أحد',r:3},
  {t:'قل أعوذ برب الفلق ۝ من شر ما خلق ۝ ومن شر غاسق إذا وقب ۝ ومن شر النفاثات في العقد ۝ ومن شر حاسد إذا حسد',r:3},
  {t:'قل أعوذ برب الناس ۝ ملك الناس ۝ إله الناس ۝ من شر الوسواس الخناس ۝ الذي يوسوس في صدور الناس ۝ من الجنة والناس',r:3},
  {t:'اللهم أنت ربي لا إله إلا أنت، خلقتني وأنا عبدك، وأنا على عهدك ووعدك ما استطعت، أعوذ بك من شر ما صنعت، أبوء لك بنعمتك علي، وأبوء بذنبي فاغفر لي، فإنه لا يغفر الذنوب إلا أنت',r:1},
  {t:'بسم الله الذي لا يضر مع اسمه شيء في الأرض ولا في السماء وهو السميع العليم',r:3},
  {t:'رضيت بالله ربا، وبالإسلام دينا، وبمحمد صلى الله عليه وسلم نبيا',r:3}],
 m:[{t:'أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',r:1},{t:'اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور',r:1},{t:'سبحان الله وبحمده',r:100}],
 e:[{t:'أمسينا وأمسى الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير',r:1},{t:'اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير',r:1},{t:'أعوذ بكلمات الله التامات من شر ما خلق',r:3}]};
const LANGS={'الإنجليزية':'en','الفرنسية':'fr','الإسبانية':'es','الألمانية':'de','التركية':'tr','الإيطالية':'it','الصينية':'zh','اليابانية':'ja','الكورية':'ko','الروسية':'ru','الأردية':'ur'};
const EN_STARTER=[['apple','تفاحة'],['book','كتاب'],['water','ماء'],['school','مدرسة'],['friend','صديق'],['family','عائلة'],['happy','سعيد'],['house','بيت'],['sun','شمس'],['moon','قمر'],['teacher','معلّم'],['pen','قلم'],['door','باب'],['car','سيارة'],['bird','طائر'],['tree','شجرة'],['big','كبير'],['small','صغير'],['fast','سريع'],['read','يقرأ'],['write','يكتب'],['play','يلعب'],['help','يساعد'],['thank you','شكرًا'],['morning','صباح'],['night','ليل'],['green','أخضر'],['blue','أزرق'],['milk','حليب'],['bread','خبز'],['brother','أخ'],['sister','أخت'],['clean','نظيف'],['strong','قوي'],['kind','لطيف'],['learn','يتعلّم'],['garden','حديقة'],['window','نافذة'],['chair','كرسي'],['star','نجمة']];
const LEVELS=['مبتدئ','مستكشف','متعلّم','متمكّن','متقدّم','خبير','محترف','قائد','مُلهِم','أسطورة'];
const JARS=[{k:'save',n:'ادخار',c:'#1f8a5b'},{k:'spend',n:'مصروف',c:'#2f6fdb'},{k:'give',n:'صدقة',c:'#8a4fd6'},{k:'invest',n:'استثمار',c:'#b57a0c'}];
const KID_COLORS=['#2f6fdb','#d23f73','#0e8f84','#b57a0c','#8a4fd6','#cf5a35','#1e7a55'];

// ================= prayer times (offline calculation) =================
const rad=d=>d*Math.PI/180,deg=r=>r*180/Math.PI;
const sinD=d=>Math.sin(rad(d)),cosD=d=>Math.cos(rad(d)),tanD=d=>Math.tan(rad(d));
const asinD=x=>deg(Math.asin(x)),acosD=x=>deg(Math.acos(clamp(x,-1,1))),atan2D=(y,x)=>deg(Math.atan2(y,x)),acotD=x=>deg(Math.atan(1/x));
const fixA=a=>((a%360)+360)%360,fixH=h=>((h%24)+24)%24;
function julian(y,m,d){if(m<=2){y--;m+=12}const A=Math.floor(y/100),B=2-A+Math.floor(A/4);return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+B-1524.5}
const METHODS={umm:{n:'أم القرى (السعودية)',f:18.5,ish:90},mwl:{n:'رابطة العالم الإسلامي',f:18,i:17},egypt:{n:'الهيئة المصرية',f:19.5,i:17.5},kuwait:{n:'الكويت',f:18,i:17.5},qatar:{n:'قطر',f:18,ish:90}};
const _ptc={};
function prayerTimes(date,lat,lng,method='umm'){
 const key=date+lat+lng+method;if(_ptc[key])return _ptc[key];
 const d=new Date(date+'T12:00:00'),tz=-d.getTimezoneOffset()/60,M=METHODS[method]||METHODS.umm;
 const jd=julian(d.getFullYear(),d.getMonth()+1,d.getDate())+0.5-lng/360;
 const D=jd-2451545;const g=fixA(357.529+0.98560028*D),q=fixA(280.459+0.98564736*D);
 const L=fixA(q+1.915*sinD(g)+0.020*sinD(2*g)),e=23.439-0.00000036*D;
 const RA=fixH(atan2D(cosD(e)*sinD(L),cosD(L))/15),decl=asinD(sinD(e)*sinD(L));
 let eqt=q/15-RA;while(eqt>12)eqt-=24;while(eqt<-12)eqt+=24;
 const dh=12+tz-lng/15-eqt;
 const T=a=>acosD((-sinD(a)-sinD(decl)*sinD(lat))/(cosD(decl)*cosD(lat)))/15;
 const asrAlt=acotD(1+tanD(Math.abs(lat-decl)));
 const r={fajr:dh-T(M.f),sunrise:dh-T(0.833),dhuhr:dh+1/60,asr:dh+T(-asrAlt),maghrib:dh+T(0.833)+1/60};
 r.isha=M.ish?r.maghrib+M.ish/60:dh+T(M.i);
 const out={};for(const k in r)out[k]=Math.round(r[k]*60);
 return _ptc[key]=out;
}

// ================= store (offline-first + live sync) =================
const LS='namaa-v1';
let C={},dirty={},rev=0,me=null,db=null,isOwner=false,cfgSeen=false,bootDone=false;
let view={n:'home'},T={};
const inflight={},subs={};
const P={cfg:'fam/config',rw:'fam/rewards',plan:k=>'plans/'+k,kid:k=>'kids/'+k,log:(k,ym)=>'logs/'+k+'_'+ym};
function saveLocal(){try{localStorage.setItem(LS,JSON.stringify({C,dirty,me}))}catch(e){}}
function loadLocal(){try{const j=JSON.parse(localStorage.getItem(LS)||'null');if(j){C=j.C||{};dirty=j.dirty||{};me=j.me||null}}catch(e){}}
function touch(path){dirty[path]=++rev;saveLocal();scheduleFlush();queueRender()}
let flushT=null;
function scheduleFlush(ms=600){clearTimeout(flushT);flushT=setTimeout(flush,ms)}
async function flush(){
 if(!db){updSync();return}
 for(const path of Object.keys(dirty)){
  if(inflight[path])continue;const r=dirty[path],data=C[path];
  if(!data){delete dirty[path];continue}
  inflight[path]=true;
  try{await db.doc(path).set(clone(data));if(dirty[path]===r)delete dirty[path];syncState='ok';if(roState){roState=false;queueRender()}}
  catch(e){if(e&&e.code==='invalid_argument'){if(path.startsWith('fam/')&&!isOwner){delete dirty[path];toast('إعدادات العائلة والمكافآت لا يغيّرها إلا الأب')}else if(!roState){roState=true;queueRender()}}else syncState='off'}
  finally{inflight[path]=false}
 }
 saveLocal();
 if(Object.keys(dirty).length)scheduleFlush(online()?4000:15000);
 updSync();
}
const online=()=>navigator.onLine!==false;
let syncState='ok',roState=false;
function updSync(){const el=$('#sync');if(!el)return;const n=Object.keys(dirty).length;
 if(!db){el.className='sync';el.style.display='none';return}el.style.display='';
 if(roState){el.className='sync off';el.textContent='لا صلاحية حفظ';return}
 if(!online()||syncState==='off'){el.className='sync off';el.textContent=n?`غير متصل · ${n} بانتظار المزامنة`:'غير متصل';return}
 el.className='sync'+(n?'':' ok');el.textContent=n?'جارٍ المزامنة…':'متزامن'}
function sub(path){
 if(!db||subs[path])return;
 subs[path]=db.doc(path).onSnapshot(s=>{
  if(s.exists){if(!dirty[path]&&!inflight[path]){C[path]=clone(s.data());saveLocal();queueRender()}}
  else if(C[path]&&!dirty[path]&&!(s.metadata&&s.metadata.fromCache)){dirty[path]=++rev;scheduleFlush()}
  if(path===P.cfg&&!(s.metadata&&s.metadata.fromCache)){cfgSeen=true;ensureSubs();queueRender()}
 },e=>{delete subs[path];syncState='off';updSync()});
}
function ensureSubs(){if(!db)return;sub(P.cfg);sub(P.rw);const ym=ymOf(TODAY()),pym=ymOf(addDays(TODAY().slice(0,8)+'01',-1));for(const m of kids()){sub(P.plan(m.id));sub(P.kid(m.id));sub(P.log(m.id,ym));sub(P.log(m.id,pym))}}

// ================= model accessors =================
const cfg=()=>C[P.cfg];
const members=()=>cfg()?.members||[];
const kids=()=>members().filter(m=>m.role==='child');
const M=id=>members().find(m=>m.id===id);
const ME=()=>M(me);
const PM=()=>!!ME()&&ME().role!=='child';
const FATHER=()=>ME()?.role==='father';
const DEFSET={quranPass:80,city:'الرياض',lat:24.7136,lng:46.6753,method:'umm',playStart:'17:00',playEnd:'18:30',playThreshold:80,rewardBase:50,cur:'ر.س',pts:10,parentPin:'',jars:{save:50,spend:30,give:10,invest:10},catalog:[{id:'c1',n:'نزهة عائلية يختارها',cost:300},{id:'c2',n:'ساعة لعب إضافية',cost:150},{id:'c3',n:'لعبة أو كتاب جديد',cost:600}],custom:[],funIdeas:['لعبة جماعية في الحديقة','ركوب الدراجة','ألعاب الطاولة','رسم وتلوين','بناء بالمكعبات','لعبة إلكترونية مسموحة']};
function S(){const c=cfg();if(!c)return clone(DEFSET);c.settings=Object.assign({},DEFSET,c.settings||{});return c.settings}
const allSections=()=>SECTIONS.concat((S().custom||[]).map(c=>({k:c.k,n:c.n,c:c.c||'#5b6b8c',i:'box',custom:true})));
const secOf=k=>allSections().find(s=>s.k===k)||SECTIONS[0];
const RW=()=>C[P.rw]||{pct:{},paid:{}};
function RWw(){const r=C[P.rw]||(C[P.rw]={pct:{},paid:{}});r.pct||={};r.paid||={};return r}
function newPlan(){return{tasks:[],subjects:[],schedule:null,rewardPct:{},paid:{}}}
function newKid(){return{created:TODAY(),profile:null,answers:null,homework:[],skills:[],langs:[{id:'en',name:'الإنجليزية',code:'en',xp:0,words:[]}],quran:{surah:114,ayah:1,daily:3,read:2,dir:'back',memorized:[],log:[]},money:{tx:[],goals:[]},onceDone:{},lessonsDone:{},points:0,redeem:[],coach:[],challenge:null,lesson:{},loc:null}}
function plan(k){const p=C[P.plan(k)]||(C[P.plan(k)]=newPlan());p.tasks||=[];p.subjects||=[];p.rewardPct||={};p.paid||={};return p}
function kidS(k){const s=C[P.kid(k)]||(C[P.kid(k)]=newKid());const d=newKid();for(const x in d)if(s[x]===undefined)s[x]=d[x];s.money.tx||=[];s.money.goals||=[];s.quran.memorized||=[];s.mentor||={};s.mentor.checkins||=[];s.mentor.missions||=[];if(s.mentor.checkins.length>60)s.mentor.checkins=s.mentor.checkins.slice(-60);if(s.mentor.missions.length>80)s.mentor.missions=s.mentor.missions.slice(-80);s.quran.log||=[];if(s.quran.log.length>250)s.quran.log=s.quran.log.slice(-200);return s}
function logDoc(k,date){const p=P.log(k,ymOf(date));return C[p]||(C[p]={days:{}})}
function dayLog(k,date){const L=logDoc(k,date);L.days||={};const d=L.days[date]||(L.days[date]={});d.done||={};d.pr||={};d.az||={};d.water||=0;return d}
const peekDay=(k,date)=>(C[P.log(k,ymOf(date))]?.days||{})[date];
const touchKid=k=>touch(P.kid(k)),touchPlan=k=>touch(P.plan(k)),touchCfg=()=>touch(P.cfg),touchLog=(k,date=TODAY())=>touch(P.log(k,ymOf(date)));
const ageOf=k=>+(M(k)?.age)||9;
const waterGoal=k=>{const a=ageOf(k);return a<=8?5:a<=13?7:8};
const isWeekend=d=>{const w=dowOf(d);return w===5||w===6};
function ptFor(k,date=TODAY()){const st=S(),loc=k&&kidS(k).loc;const la=loc?loc.lat:st.lat,ln=loc?loc.lng:st.lng;return prayerTimes(date,+la,+ln,st.method)}
const levelOf=p=>{const l=Math.floor(p/200);return{l:l+1,n:LEVELS[Math.min(l,LEVELS.length-1)],cur:p%200,need:200}};
const skLevel=xp=>{const l=Math.min(9,Math.floor((xp||0)/100));return{l:l+1,n:LEVELS[l],p:(xp||0)%100}};
