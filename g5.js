"use strict";
/* ---------------- SCREENS ---------------- */
function buildLogo(el,txt){
  el.innerHTML=[...txt].map((c,i)=>
    `<span class="ch" style="animation-delay:${i*0.09}s">${c===' '?'\u00A0':c==='-'?'‑':c}</span>`).join('');
}
function showTitle(){
  G.state='title';
  ['blindScr','shopScr','overScr'].forEach(s=>$(s).classList.add('hidden'));
  $('hud').classList.add('hidden'); $('jokerbar').innerHTML=''; $('bossWarn').textContent='';
  $('titleScr').classList.remove('hidden');
  buildLogo($('logoTitle'),'BLOCK-LOTTO');
  $('zhSub').style.display = LANG==='zh' ? 'none' : 'block';
  const best=localStorage.getItem('bl_best');
  $('hiScoreNote').textContent = best ? `${t('best')}: ${(+best).toLocaleString()}` : '';
  $('continueBtn').classList.toggle('hidden', !localStorage.getItem('bl_run'));
}
function newRun(){
  localStorage.removeItem('bl_run');
  let s=$('seedInput').value.toUpperCase().trim();
  if(s && !validSeed(s)){ s=""; }
  if(!s) s=randomSeed();
  runSeed=s; rng=mulberry32(hashSeed(s));
  $('seedInput').value='';                          // seed stays hidden until win/game over
  Object.assign(G,{ante:1,blindIdx:0,money:4,livesMax:3,runScore:0,blindsWon:0,jokers:[],cons:[],
    vouchers:[],slots:5,endless:false,bossMod:null,rerollCost:2,flags:{},skipTags:{},rareShopPending:false,
    stats:{maxCombo:0,jackpots:0,lucky8s:0},combo:0,bestCombo:0});
  for(const k of Object.keys(G)) if(k.startsWith('seen_')) delete G[k];
  recompute();
  openBlindSelect();
}
function skipTagFor(i){
  if(!G.skipTags[i]) G.skipTags[i]=SKIP_TAGS[(rng()*SKIP_TAGS.length)|0];
  return G.skipTags[i];
}
function applySkipTag(tag){
  if(tag.id==='cash'){ G.money+=8; toast('+$8'); }
  if(tag.id==='joker'){
    if(G.jokers.length<G.slots){ const pool=JOKERS.filter(j=>j.r==='uncommon'||j.r==='common');
      const j=pool[(rng()*pool.length)|0]; G.jokers.push(j); recompute(); sfx.legendary();
      toast((LANG==='zh'?'免費小丑:':'FREE JOKER: ')+jn(j)); }
    else { G.money+=5; toast(t('slotsFull')+' +$5'); }
  }
  if(tag.id==='rare'){ G.rareShopPending=true; toast(LANG==='zh'?'下次商店必出稀有!':'NEXT SHOP: RARE+!'); }
  updateHUD();
}
function openBlindSelect(){
  G.state='blinds';
  if(!G.bossMod) G.bossMod=pickBoss();
  $('seedMask').textContent=runSeed?('SEED '+'•'.repeat(runSeed.length)):'';
  $('titleScr').classList.add('hidden'); $('shopScr').classList.add('hidden');
  $('blindScr').classList.remove('hidden');
  $('hud').classList.remove('hidden'); updateHUD();
  const row=$('blindRow'); row.innerHTML='';
  for(let i=0;i<3;i++){
    const isBoss=i===2, done=i<G.blindIdx, cur=i===G.blindIdx;
    const tag=cur&&!isBoss?skipTagFor(i):null;
    const bt=baseTarget(G.ante), tgt=i===0?bt:i===1?Math.round(bt*1.5):bt*2;
    const card=document.createElement('div');
    card.className='blindcard'+(isBoss?' boss':'')+(isBoss&&G.bossMod==='bigtoe'?' legend':'')+(done||!cur?' skipped':'');
    const bname=isBoss?(BOSS_NAME[G.bossMod][LANG]||BOSS_NAME[G.bossMod].en):'';
    card.innerHTML=`<div class="face">${bname}</div><h3>${t(BLIND_TYPES[i])}</h3>
      <div class="stake">${LANG==='zh'?'底注':'ANTE'} ${G.endless?G.ante+'∞':G.ante}</div>
      <div class="target">${tgt.toLocaleString()}</div>
      <div class="reward">$${i===0?3:i===1?4:5}</div>
      <div class="mod">${isBoss&&G.bossMod?t('boss_mod_'+G.bossMod):''}</div>
      ${cur&&!isBoss?`<button class="btn ghost small" style="margin-top:6px">${tag.txt[LANG]||tag.txt.en}</button>`:''}`;
    if(cur){
      card.querySelector('button')?.addEventListener('click',ev=>{ev.stopPropagation();
        applySkipTag(tag);
        G.blindIdx++; if(G.blindIdx>2){G.ante++;G.blindIdx=0;G.bossMod=null;G.skipTags={};} openBlindSelect();});
      card.addEventListener('click',()=>{ startBlind(); });
    }
    row.appendChild(card);
  }
}
/* ------- SHOP ------- */
function rollJoker(excludeId, minRar){
  /* rarity odds improve as the run deepens — late antes earn their luck */
  const w={common:Math.max(30,62-G.ante*3), uncommon:26+G.ante*1.2,
           rare:10+G.ante*1.6, legendary:2+G.ante*0.6};
  if(minRar==='rare'){ w.common=0; w.uncommon=0; w.legendary+=6; }
  const tot=w.common+w.uncommon+w.rare+w.legendary;
  let x=rng()*tot, rar='common';
  for(const k of ['common','uncommon','rare','legendary']){ if(x<w[k]){rar=k;break;} x-=w[k]; }
  let pool=JOKERS.filter(j=>j.r===rar&&j.id!==excludeId);
  if(!pool.length) pool=JOKERS.filter(j=>j.id!==excludeId);
  return pool[(rng()*pool.length)|0];
}
function openShop(){
  saveRun();
  G.state='shop';
  $('blindScr').classList.add('hidden'); $('shopScr').classList.remove('hidden');
  G.rerollCost=2-(G.vouchers.find(v=>v.id==='rr')?1:0);
  buildShop(); updateHUD();
}
function buildShop(){
  const vpool=VOUCHERS.filter(v=>!G.vouchers.find(o=>o.id===v.id));   // owned vouchers leave the pool
  const j1=G.rareShopPending?rollJoker(null,'rare'):rollJoker();
  G.rareShopPending=false;
  const j2=rollJoker(j1.id);                                        // never a matching pair
  G.shop=[j1,j2,{...CONSUMABLES[(rng()*CONSUMABLES.length)|0],kind:'cons'},
          vpool.length?{...vpool[(rng()*vpool.length)|0],kind:'vouch'}:null];
  renderShop();
}
function renderShop(){
  $('shopMoney').textContent=G.money;
  $('slotInfo').textContent=G.jokers.length+'/'+G.slots;
  const rb=$('rerollBtn');
  rb.textContent=`${t('reroll')} · $${G.rerollCost}`;
  rb.disabled=G.money<G.rerollCost;
  const grid=$('shopGrid'); grid.innerHTML='';
  const groups=[[t('sectJokers'),[0,1],'01'],[t('sectTarot'),[2],'02'],[t('sectVoucher'),[3],'03']];
  let idx=0;
  for(const [label,idxs,num] of groups){
    const ttl=document.createElement('div'); ttl.className='s-sect';
    ttl.innerHTML=`<span class="idx">${num}</span>${label}`;
    grid.appendChild(ttl);
    const row=document.createElement('div'); row.className='s-row';
    grid.appendChild(row);
    for(const i of idxs){
      idx++;
      const item=G.shop[i];
      const rk=item?(item.kind==='cons'?'cons':item.kind==='vouch'?'vouch':item.r):'common';
      const el=document.createElement('div');
      el.className='scard'+(item&&rk==='legendary'?' legendary':'')+(!item?' sold':'');
      if(!item){
        el.innerHTML=`<div class="s-top"><span></span><span class="s-idx">0${idx}</span></div>
          <div class="s-art"></div><div class="s-name" style="opacity:.5">${t('sold')}</div>
          <div class="s-desc"></div><div class="s-foot"><span class="s-price" style="opacity:.4">—</span></div>`;
        row.appendChild(el); continue;
      }
      const price=item.kind?item.price:priceOf(item.r);
      const rl={common:'COMMON',uncommon:'UNCOMMON',rare:'RARE',legendary:'LEGENDARY',
                cons:'TAROT',vouch:'VOUCHER'}[rk];
      const rlZh={common:'普通',uncommon:'罕見',rare:'稀有',legendary:'傳說',cons:'消耗',vouch:'禮券'}[rk];
      el.innerHTML=`<div class="s-top"><span class="rar-${rk}">${LANG==='zh'?rlZh:rl}</span>
          <span class="s-idx">0${idx}</span></div>
        <img class="s-art" src="${ASSETS[item.id]}" alt="">
        <div class="s-name">${jn(item)}</div>
        <div class="s-desc">${jd(item)}</div>
        <div class="s-foot"><span class="s-price">$${Math.max(1,Math.round(price*disc()))}</span></div>`;
      el.addEventListener('click',()=>buy(item,Math.max(1,Math.round(price*disc())),el));
      row.appendChild(el);
    }
  }
  $('ownedRow').innerHTML=G.jokers.map(j=>
    `<div class="mini ${j.r}" title="${jd(j)}"><img src="${ASSETS[j.id]}" alt=""><small>${jn(j)}</small></div>`).join('')
    ||'<span style="opacity:.3;font-size:10px;letter-spacing:.2em">—</span>';
}
function buy(item,price,el){
  if(G.money<price){ toast(t('needMoney')); return; }
  if(!item.kind && G.jokers.length>=G.slots){ toast(t('slotsFull')); return; }
  G.money-=price;
  if(item.kind==='cons'){
    if(item.id==='row') G.flags.rowClear=true;
    if(item.id==='nuke') G.flags.nuke=true;
    if(item.id==='life'){ G.livesMax++; }
    if(item.id==='scr'){ const win=rng()<0.08?88:1+((rng()*8)|0); G.money+=win;
      if(win===88){ luckyBanner('+$88!! 發發!'); sfx.jackpot(); goldRain(30); } }
    if(item.id==='slow') G.flags.slow=true;
  } else if(item.kind==='vouch'){
    G.vouchers.push(item);
    if(item.id==='slot') G.slots++;
    recompute();
  } else {
    G.jokers.push(item); recompute();
    if(item.r==='legendary'){ sfx.legendary(); goldRain(24); luckyBanner(jn(item)+'!'); }
  }
  sfx.buy(); G.shop[G.shop.indexOf(item)]=null; renderShop(); updateHUD();
}
/* ------- GAME OVER / WIN ------- */
function gameOver(win){
  localStorage.removeItem('bl_run');
  G.state='over';
  if(win){ $('endlessBtn').classList.remove('hidden'); }
  else { $('endlessBtn').classList.add('hidden'); }
  const best=+(localStorage.getItem('bl_best')||0);
  if(G.runScore>best) localStorage.setItem('bl_best',G.runScore);
  $('hud').classList.add('hidden'); $('shopScr').classList.add('hidden');
  $('overScr').classList.remove('hidden');
  buildLogo($('overTitle'), win?t('youWin'):t('gameOver'));
  $('overStats').innerHTML=`
    <span>${t('finalStats')}</span><b>${G.runScore.toLocaleString()}</b>
    <span>${t('roundsWon')}</span><b>${G.blindsWon}</b>
    <span>${t('seedUsed')}</span><b id="seedReveal" style="cursor:pointer;text-decoration:underline dotted">${runSeed||'—'}</b>
    <span>Max Combo</span><b>${G.stats.maxCombo}</b>
    <span>Lucky 8s</span><b>${G.stats.lucky8s}</b>
    <span>Jackpots</span><b>${G.stats.jackpots}</b>`;
  if(win){ luckyBanner('發 發 發'); sfx.jackpot(); goldRain(60); }
  else sfx.ghost();
  const sr=$('seedReveal');
  if(sr&&runSeed) sr.addEventListener('click',()=>{
    try{ navigator.clipboard.writeText(runSeed); toast(LANG==='zh'?'種子已複製!':'SEED COPIED!'); }
    catch(e){ toast(runSeed); }
    beep(880,0.06);
  });
}

/* ---------------- INPUT (touch + mouse + keys, iPhone-tuned) ---------------- */
function pointerX(clientX){
  const r=cv.getBoundingClientRect();
  return Math.max(0,Math.min(W,(clientX-r.left)*(W/r.width)));
}
let dragging=false;
const frame=$('frame');
frame.addEventListener('pointerdown',e=>{ if(e.target.closest('.screen')) return;
  dragging=true; paddle.x=pointerX(e.clientX);
  const pw3=paddleW()/2; paddle.x=Math.max(pw3,Math.min(W-pw3,paddle.x));
  if(G.state==='play') launchBalls(); },{passive:true});
window.addEventListener('pointermove',e=>{ if(G.state==='play'&&(dragging||e.pointerType==='mouse')){ paddle.x=pointerX(e.clientX);
  const pw2=paddleW()/2; paddle.x=Math.max(pw2,Math.min(W-pw2,paddle.x)); } },{passive:true});
window.addEventListener('pointerup',()=>dragging=false,{passive:true});
window.addEventListener('pointercancel',()=>dragging=false,{passive:true});
document.addEventListener('touchmove',e=>{ if(!e.target.closest('.screen')) e.preventDefault(); },{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault());
document.addEventListener('gesturestart',e=>e.preventDefault());
const keys={};
window.addEventListener('keydown',e=>{ keys[e.key]=true;
  if(e.key==='m'||e.key==='M') toggleMute();
  if(e.key===' '&&G.state==='title'){ e.preventDefault(); newRun(); }
  if(e.key===' '&&G.state==='play'){ e.preventDefault(); launchBalls(); } });
window.addEventListener('keyup',e=>keys[e.key]=false);
setInterval(()=>{ if(G.state==='play'){ const pw4=paddleW()/2;
  if(keys['ArrowLeft']||keys['a']) paddle.x=Math.max(pw4,paddle.x-9);
  if(keys['ArrowRight']||keys['d']) paddle.x=Math.min(W-pw4,paddle.x+9); } },16);

/* ---------------- FIT TO SCREEN (portrait, safe areas) ---------------- */
/* sizing is pure CSS now (aspect-ratio + dvh) — no JS measurement to get wrong */

/* ---------------- BUTTONS ---------------- */
function toggleMute(){ muted=!muted; localStorage.setItem('bl_mute',muted?'1':'0');
  if(typeof syncIconBtns==='function') syncIconBtns(); else $('muteBtn').textContent=muted?'SFX OFF':'SFX ON'; }
$('muteBtn').addEventListener('click',toggleMute);
$('muteBtn2').addEventListener('click',toggleMute);
function syncIconBtns(){ const s=muted?'SFX OFF':'SFX ON'; $('muteBtn').textContent=s; $('muteBtn2').textContent=s;
  $('langBtn').textContent=LANG==='en'?'中':'EN'; $('langBtn2').textContent=LANG==='en'?'中':'EN'; }
syncIconBtns();
function toggleLang(){
  LANG=LANG==='en'?'zh':'en'; localStorage.setItem('bl_lang',LANG);
  applyI18n(); syncIconBtns(); showTitleRefresh(); updateHUD();
}
$('langBtn').addEventListener('click',toggleLang);
$('langBtn2').addEventListener('click',toggleLang);
/* pause */
$('pauseBtn').addEventListener('click',()=>{
  if(G.state!=='play') return;
  G.state='pause';
  $('pauseInfo').textContent=`${t('ante')} ${G.endless?G.ante+'∞':G.ante} · ${t(BLIND_TYPES[G.blindIdx])} · $${G.money}`;
  $('pauseScr').classList.remove('hidden');
});
$('resumeBtn').addEventListener('click',()=>{ $('pauseScr').classList.add('hidden'); G.state='play'; lastT=performance.now(); });
$('restartBtn').addEventListener('click',()=>{ $('pauseScr').classList.add('hidden'); newRun(); });
$('quitBtn').addEventListener('click',()=>{ $('pauseScr').classList.add('hidden'); localStorage.removeItem('bl_run'); showTitle(); });
function showTitleRefresh(){
  if(G.state==='title') showTitle();
  if(G.state==='blinds') openBlindSelect();
  if(G.state==='shop') renderShop();
}
$('startBtn').addEventListener('click',()=>{ ac(); newRun(); });
$('continueBtn').addEventListener('click',()=>{ ac(); if(loadRun()) openBlindSelect(); else newRun(); });
$('randSeed').addEventListener('click',()=>{ $('seedInput').value=randomSeed(); beep(880,0.05); });
$('seedInput').addEventListener('input',e=>{
  const v=e.target.value.toUpperCase().split('').filter(c=>SEED_CHARS.includes(c)).join('').slice(0,8);
  e.target.value=v;
});
$('rerollBtn').addEventListener('click',()=>{
  if(G.money<G.rerollCost) return;
  G.money-=G.rerollCost; G.rerollCost++; buildShop(); updateHUD(); beep(660,0.05);
});
$('nextBtn').addEventListener('click',()=>{ openBlindSelect(); });
$('againBtn').addEventListener('click',()=>{ $('overScr').classList.add('hidden'); newRun(); });
$('endlessBtn').addEventListener('click',()=>{
  G.endless=true; G.ante=9; G.blindIdx=0; G.bossMod=null; G.lives=G.livesMax+MOD.ballsPlus;
  $('overScr').classList.add('hidden'); openBlindSelect();
});
$('menuBtn').addEventListener('click',()=>{ showTitle(); });

/* ---------------- LIQUID INK BACKGROUND ----------------
   flow-field ribbons + swirl core; touch stirs the current. */
const bgc=$('bg'), bctx=bgc.getContext('2d');
const BW2=210, BH2=380;                       // half-res: soft fluffy upscale
const INK_A=[255,106,38], INK_B=[255,190,60], INK_C=[200,40,50]; // ember / gold / crimson
let ink=[], inkT=0, bgInit=false;
const pokes=new Map();
function inkSpawn(){ return {x:Math.random()*BW2,y:Math.random()*BH2,px:0,py:0,
  hue:Math.random(),spd:0.3+Math.random()*0.5,life:400+Math.random()*900}; }
function initBg(){ bctx.fillStyle='#1a0508'; bctx.fillRect(0,0,BW2,BH2);
  ink=[]; for(let i=0;i<80;i++){ const p=inkSpawn(); p.px=p.x; p.py=p.y; ink.push(p); } bgInit=true; }
function flowAngle(x,y,t){
  return (Math.sin(x*0.022+t*0.35)+Math.cos(y*0.018-t*0.28)
        + Math.sin((x+y)*0.012+t*0.15))*1.9;
}
function stepBg(dt){
  if(!bgInit) initBg();
  dt*=0.5;                                     // slow drift — ambience, not a rave
  inkT+=dt; const t=inkT;
  // swirl core drifts slowly; while playing, leans toward the ball
  let cx=BW2*0.5+Math.sin(t*0.05)*BW2*0.16, cy=BH2*0.45+Math.cos(t*0.04)*BH2*0.12;
  if(G.state==='play'&&G.balls.length){ cx=cx*0.6+(G.balls[0].x/2)*0.4; cy=cy*0.6+(G.balls[0].y/2)*0.4; }
  // fade trails
  bctx.globalCompositeOperation='source-over';
  bctx.fillStyle='rgba(26,5,8,0.05)'; bctx.fillRect(0,0,BW2,BH2);
  // decay pokes
  for(const p of pokes.values()){ p.amp*=Math.exp(-dt*2.2); p.vx*=Math.exp(-dt*3.2); p.vy*=Math.exp(-dt*3.2);
    if(p.amp<0.03) pokes.delete(p.id); }
  bctx.globalCompositeOperation='lighter';
  bctx.lineCap='round';
  const lw=2.2;
  for(const p of ink){
    const a=flowAngle(p.x,p.y,t);
    let vx=Math.cos(a)*p.spd, vy=Math.sin(a)*p.spd;
    // gentle spiral pull toward core
    const dx=cx-p.x, dy=cy-p.y, r2=dx*dx+dy*dy+450;
    vx+=(dx/r2)*20+(-dy/r2)*30; vy+=(dy/r2)*20+(dx/r2)*30;
    // pokes stir
    for(const pk of pokes.values()){
      const pdx=p.x-pk.x, pdy=p.y-pk.y, pr2=pdx*pdx+pdy*pdy;
      const g=Math.exp(-pr2/1300)*pk.amp;
      vx+=(pk.vx-pk.vy*0.4)*g*0.5; vy+=(pk.vy+pk.vx*0.4)*g*0.5;
    }
    p.px=p.x; p.py=p.y;
    p.x+=vx*dt*46; p.y+=vy*dt*46;
    // soft wrap
    if(p.x<-4)p.x=BW2+4; if(p.x>BW2+4)p.x=-4; if(p.y<-4)p.y=BH2+4; if(p.y>BH2+4)p.y=-4;
    if(--p.life<0){ Object.assign(p,inkSpawn()); continue; }
    /* teleporting across the wrap = no stroke, or it lasers a line across the screen */
    if(Math.abs(p.x-p.px)>BW2/2 || Math.abs(p.y-p.py)>BH2/2){ p.px=p.x; p.py=p.y; continue; }
    const m=p.hue<0.5?INK_A:(p.hue<0.85?INK_B:INK_C);
    const fade=Math.min(1,p.life/160);
    bctx.strokeStyle=`rgba(${m[0]},${m[1]},${m[2]},${0.13*fade})`;
    bctx.lineWidth=lw*(0.6+p.hue*0.7);
    bctx.beginPath(); bctx.moveTo(p.px,p.py); bctx.lineTo(p.x,p.y); bctx.stroke();
  }
}
window.addEventListener('pointermove',e=>{
  const r=bgc.getBoundingClientRect(); if(!r.width) return;
  const x=(e.clientX-r.left)*(BW2/r.width), y=(e.clientY-r.top)*(BH2/r.height);
  const now=performance.now()/1000;
  let p=pokes.get(e.pointerId);
  if(!p){ pokes.set(e.pointerId,{id:e.pointerId,x,y,vx:0,vy:0,amp:0.25,lastT:now}); return; }
  const dt=Math.max(0.004,now-p.lastT);
  let ivx=(x-p.x)/dt, ivy=(y-p.y)/dt;
  const sp=Math.hypot(ivx,ivy), cap=130;
  if(sp>cap){ ivx*=cap/sp; ivy*=cap/sp; }
  p.vx+=(ivx-p.vx)*0.35; p.vy+=(ivy-p.vy)*0.35;
  p.x=x; p.y=y; p.lastT=now; p.amp=Math.min(1.3,p.amp+0.35);
},{passive:true});
window.addEventListener('pointerdown',e=>{ const p=pokes.get(e.pointerId); if(p) p.amp=1.6; },{passive:true});
window.addEventListener('pointerup',e=>pokes.delete(e.pointerId),{passive:true});
window.addEventListener('pointercancel',e=>pokes.delete(e.pointerId),{passive:true});

/* ---------------- RUN PERSISTENCE ---------------- */
function saveRun(){
  if(G.state==='over'||G.state==='title'){ return; }
  const seen={}; for(const k of Object.keys(G)) if(k.startsWith('seen_')) seen[k]=true;
  const data={ante:G.ante,blindIdx:G.blindIdx,money:G.money,livesMax:G.livesMax,slots:G.slots,
    runScore:G.runScore,blindsWon:G.blindsWon,stats:G.stats,endless:G.endless,bossMod:G.bossMod,
    seed:runSeed,jokers:G.jokers.map(j=>j.id),vouchers:G.vouchers.map(v=>v.id),seen};
  try{ localStorage.setItem('bl_run',JSON.stringify(data)); }catch(e){}
}
function loadRun(){
  try{ const d=JSON.parse(localStorage.getItem('bl_run')); if(!d||!d.seed) return null;
    runSeed=d.seed; rng=mulberry32(hashSeed(d.seed));
    Object.assign(G,{ante:d.ante,blindIdx:d.blindIdx,money:d.money,livesMax:d.livesMax,slots:d.slots,
      runScore:d.runScore,blindsWon:d.blindsWon,stats:d.stats,endless:d.endless,bossMod:d.bossMod,
      combo:0,bestCombo:0,rerollCost:2,flags:{},skipTags:{},rareShopPending:false,cleanup:false});
    G.jokers=d.jokers.map(id=>JOKERS.find(j=>j.id===id)).filter(Boolean);
    G.vouchers=d.vouchers.map(id=>VOUCHERS.find(v=>v.id===id)).filter(Boolean);
    for(const k of Object.keys(d.seen||{})) G[k]=true;
    recompute(); return d;
  }catch(e){ return null; }
}

/* ---------------- BOOT ---------------- */
applyI18n(); showTitle();
requestAnimationFrame(loop);
/* watchdog: if rAF stalls (throttled webviews), tick WITHOUT spawning new rAF chains;
   and never run the world while the tab is hidden */
setInterval(()=>{ const now=performance.now();
  if(!document.hidden && now-lastT>250){ tick(now); } },250);
