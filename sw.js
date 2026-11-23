// نماء — عامل الخدمة: يجعل الموقع يفتح بدون إنترنت ويستقبل الإشعارات
const V='namaa-v1';
const SHELL=['./','./index.html','./config.js','./vendor/supabase.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET')return;
  if(/supabase\.co$/.test(u.hostname))return; // البيانات لا تُخزَّن هنا
  if(u.origin===location.origin){
    // الشبكة أولًا (لتصل التحديثات)، ثم النسخة المحفوظة عند انقطاع الاتصال
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put(e.request,c));return res})));
  }
});
self.addEventListener('push',e=>{
  let d={};try{d=e.data.json()}catch(x){d={title:'نماء',body:e.data?e.data.text():''}}
  e.waitUntil(self.registration.showNotification(d.title||'نماء',{body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',dir:'rtl',lang:'ar',tag:d.tag||undefined,data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('focus' in c)return c.focus()}return self.clients.openWindow(e.notification.data&&e.notification.data.url||'./')}));
});
