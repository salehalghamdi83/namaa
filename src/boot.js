// ================= التشغيل =================
loadLocal();loadDevLocal();sbInit();
if(myDev&&sb){db=makeDB();cfgSeen=!!cfg()}
render(true);
(async()=>{
 initCaps();
 if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
 if(!sb){queueRender();return}
 if(myDev){
  startRealtime();
  try{await ensureSession();const r=await sb.rpc('my_device');
   if(!r.error){const d=(r.data||[])[0];if(!d){toast('سُحب الدخول من هذا الجهاز');await deviceLogout();return}setDev(d)}}catch(e){}
  try{await loadAll()}catch(e){}
  cfgSeen=true;ensureSubs();flush();
 }else{try{await ensureSession()}catch(e){}}
 queueRender();
 const expire=()=>{const m=ME();if(!m||m.role!=='child')return;const ks=kidS(m.id);let ch=false;for(const x of ks.mentor.missions)if(x.status==='active'&&addDays(x.start,(+x.days||1)-1)<TODAY()){x.status='expired';ch=true}if(ch)touchKid(m.id)};setTimeout(expire,4000);
 const autoLoc=()=>{const m=ME();if(m&&m.role==='child'){const l=kidS(m.id).loc;if(!l||l.src!=='paste')tryGPS(m.id,{silent:true})}};setTimeout(autoLoc,3000);setInterval(autoLoc,30*60000);
})();
