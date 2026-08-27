"use strict";
/* ---------------- EFFECTS ---------------- */
const parts=[], floats=[];
function burst(x,y,color,n=14,spd=3.2){ for(let i=0;i<n;i++){ const a=Math.random()*6.28, v=(0.4+Math.random())*spd;
  parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,life:1,color,r:2+Math.random()*3}); } }
function goldRain(n=28){ for(let i=0;i<n;i++) parts.push({x:Math.random()*W,y:-10-Math.random()*120,
  vx:(Math.random()-0.5)*1.5,vy:2+Math.random()*3,life:2.2,color:'#ffd23f',r:2.5+Math.random()*3,gold:true}); }
function floatText(x,y,txt,color='#fff',size=15){ floats.push({x,y,txt,color,size,life:1}); }
function shake(){ const f=$('frame'); f.classList.remove('shaker'); void f.offsetWidth; f.classList.add('shaker'); }
function luckyBanner(txt){ const b=$('luckyBanner'); b.textContent=txt; b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
let toastT=null;
function toast(msg){ const el=$('toast'); el.textContent=msg; el.style.opacity=1;
  clearTimeout(toastT); toastT=setTimeout(()=>el.style.opacity=0,1700); }

/* ---------------- PLAY SETUP ---------------- */
G.flags={};
function startBlind(){
  G.target=blindTarget(); G.score=0; G.combo=0; G.multBonus=0; G.brickHitCount=0;
  G.waterbearUsed=false; G.bigtoeTimer=0; G.cleanup=false;
  SLOT.spin=0; SLOT.cd=0; SLOT.captured=0;
  G.lives = G.livesMax + MOD.ballsPlus;
  G.chips = 10 + MOD.chipsFlat; G.mult = 1 + MOD.multFlat; if(G.multX>1) G.mult=G.mult; // multX applied at scoring
  genBricks();
  G.flags={};                                   // one-shot consumables spent
  resetBall(true);
  G.state='play';
  saveRun();
  ['titleScr','blindScr','shopScr','overScr'].forEach(s=>$(s).classList.add('hidden'));
  $('hud').classList.remove('hidden');
  $('bossWarn').textContent = G.blindIdx===2 ? t('boss_mod_'+G.bossMod) : '';
  if(G.ante===1&&G.blindIdx===0&&!localStorage.getItem('bl_tut'))
    setTimeout(()=>{ if(G.state==='play') toast(t('tutLine')); },1200);
  updateHUD();
}
function ballSpeed(){ let s=(3.3+G.ante*0.15)*MOD.ballSpd*(G.flags.slow?0.75:1);
  if(bossActive()&&G.bossMod==='storm') s*=1.25; return Math.min(s,8.5); }
function resetBall(all){
  if(all) G.balls=[];
  G.spdMul=1;
  G.balls.push({x:paddle.x,y:paddle.y-11,vx:0,vy:0,r:7,stuck:true});
}
function launchBalls(){
  $('launchHint').classList.add('hidden');
  localStorage.setItem('bl_tut','1');
  let ok=false;
  for(const b of G.balls) if(b.stuck){
    const sp=Math.max(2.2,ballSpeed()*G.spdMul);
    b.vx=sp*0.38*(rng()<0.5?-1:1);
    b.vy=-Math.sqrt(Math.max(1,sp*sp-b.vx*b.vx));
    b.stuck=false; ok=true;
  }
  if(ok){ beep(320,0.09,'triangle',0.16,220); floatText(paddle.x,paddle.y-30,(LANG==='zh'?'發球!':'LAUNCH!'),'#9fe8ff',13); }
}
function paddleW(){ let w=80*MOD.paddleW; if(bossActive()&&G.bossMod==='slicer') w*=0.45; return w; }
const paddle={x:W/2,y:H-64,h:12};

/* ---------------- SLOT MACHINE (ball-eating menace) ---------------- */
const SLOT={x:W/2-44,y:252,w:88,h:62,cd:0,spin:0,st:0,captured:0,sym:['7','★','8']};
const REELS=['7','8','★','♦','♣','♠','✚','☠'];
function slotResolve(){
  const r=rng(), sp=ballSpeed(), cx=SLOT.x+SLOT.w/2, cy=SLOT.y+SLOT.h+14;
  G.balls.push({x:cx,y:cy,vx:(rng()-0.5)*sp*0.9,vy:Math.abs(sp*0.9),r:7});
  const nothingCh=MOD.jammy?0.30:0.50;
  if(r<nothingCh){
    SLOT.sym=['♦','☠','♣'];
    floatText(cx,SLOT.y+SLOT.h/2,t('slotNothing'),'#9aa4b0',13);
  } else if(r<0.92){
    const win=3+G.ante*2; G.money+=win;
    G.multBonus=Math.max(G.multBonus,SLOT.captured);   // your pre-spin mult comes back
    SLOT.sym=['8','★','8'];
    floatText(cx,SLOT.y+SLOT.h/2,(LANG==='zh'?'中獎 +$':'WIN +$')+win+(LANG==='zh'?' · 倍率歸還!':' · MULT RETURNED!'),'#7CFC9B',15);
    sfx.lucky(); goldRain(10);
  } else {
    G.money+=88;
    G.multBonus=Math.max(G.multBonus,SLOT.captured);
    SLOT.sym=['8','8','8'];
    luckyBanner(t('slotJackpot')); sfx.jackpot(); goldRain(44); shake(); G.stats.jackpots++;
  }
  updateHUD();
}
function drawSlot(){
  const s=SLOT;
  ctx.save(); ctx.translate(s.x,s.y);
  ctx.fillStyle=s.spin>0?'#d1483e':'#8f1d22'; rr(0,0,s.w,s.h,10); ctx.fill();
  ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2.5; rr(0,0,s.w,s.h,10); ctx.stroke();
  for(let k=0;k<3;k++){ ctx.fillStyle='#12060a'; rr(7+k*26,9,24,26,4); ctx.fill();
    ctx.font='900 15px ui-monospace,monospace'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=s.spin>0?'#fff':'#ffd23f'; ctx.fillText(s.sym[k],19+k*26,24); }
  ctx.fillStyle='#ffd23f'; ctx.font='900 9px monospace'; ctx.fillText('SLOT-O-MATIC',s.w/2,s.h-9);
  ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(s.w+3,16); ctx.lineTo(s.w+11,s.spin>0?36:6); ctx.stroke();
  ctx.fillStyle='#e0483f'; ctx.beginPath(); ctx.arc(s.w+11,s.spin>0?38:8,4.5,0,6.29); ctx.fill();
  if(s.cd>0&&s.spin<=0){ ctx.globalAlpha=0.45; ctx.fillStyle='#000'; rr(0,0,s.w,s.h,10); ctx.fill(); }
  ctx.restore();
}

/* ---------------- SCORING (chips × mult, Balatro style) ---------------- */
function brickChips(b){
  let c = b.type==='steel'?200 : b.type==='gold'?88 : TIERS[b.tier].chips;
  if(String(c).includes('8')) c*=2;                    // 8 in the value = lucky ×2
  return c*MOD.chipsX;
}
function effMult(){
  let m=(G.mult+G.multBonus)*MOD.multX;
  if(bossActive()&&G.bossMod==='bigtoe') m=Math.min(m,88);           // Big Toe caps the fun at 88
  return m;
}
function jammyBoost(ch){ return MOD.jammy?ch*2:ch; }
function hitBrick(b,ball){
  if(!b.alive) return;
  b.hp--; if(b.hp>0){ sfx.hit(b.tier); floatText(b.x+BW/2,b.y,""+brickChips(b),'#cfe8ff',12); return; }
  b.alive=false; G.brickHitCount++;
  const luckyCh = jammyBoost(1);
  /* combo & lucky-8 */
  G.combo++; G.bestCombo=Math.max(G.bestCombo,G.combo); G.stats.maxCombo=Math.max(G.stats.maxCombo,G.combo);
  G.multBonus++;                                     // every hit pumps the mult — keep the streak alive
  let mult=effMult(), chips=brickChips(b), note=null;
  if(G.combo===8 || (G.combo%8===0 && G.combo%88!==0 && G.combo<=88)){
    mult*=8; note=t('lucky8'); G.stats.lucky8s++; sfx.lucky(); luckyBanner(note); goldRain(12);
  }
  if(G.combo===88){ mult*=88; G.stats.jackpots++; sfx.jackpot(); luckyBanner(t('jackpot88'));
    goldRain(60); G.money+=88; shake(); }
  const gained=Math.round(chips*mult);
  G.score+=gained;
  const col = b.type==='gold'?'#ffd23f':b.type==='mult'?'#ff9d5c':'#fff';
  floatText(b.x+BW/2,b.y,`${Math.round(chips)}×${Math.round(mult)}`,col,note?20:14);
  /* per-type effects */
  if(b.type==='gold'){ const g=(2+MOD.goldPlus)*luckyCh; G.money+=g; floatText(b.x+BW/2,b.y-14,"+$"+g,'#7CFC9B',13); sfx.gold(); }
  if(b.type==='mult'){ G.mult+=2; floatText(b.x+BW/2,b.y-14,"+2 MULT",'#ff9d5c',13); }
  if(b.type==='bomb'){ explode(b); }
  if(MOD.frenzy) G.multBonus+=1;
  /* every hit speeds the ball up a notch: x1.05 -> x1.10 -> x1.15 ... */
  if(G.spdMul<2.1){ G.spdMul=Math.min(2.1,Math.round((G.spdMul+0.05)*100)/100);
    const target=Math.min(8.5,ballSpeed()*G.spdMul);
    for(const bl of G.balls){ const c=Math.hypot(bl.vx,bl.vy)||1; bl.vx*=target/c; bl.vy*=target/c; } }
  if(MOD.crouton && G.brickHitCount%8===0) crumble(b);
  if(rng()<MOD.twinCh*luckyCh && G.balls.length<5){ const sp=ballSpeed();
    G.balls.push({x:ball.x,y:ball.y,vx:-ball.vx*0.9,vy:ball.vy,r:7}); floatText(ball.x,ball.y-16,(LANG==='zh'?'分裂球!':'MULTIBALL!'),'#9fe8ff',15); }
  burst(b.x+BW/2,b.y+BH/2,TIERS[b.tier].c,10,2.6);
  sfx.hit(b.tier);
  checkCleared(); updateHUD();
}
function explode(b){
  const R=1+MOD.bombR; shake(); sfx.bomb();
  burst(b.x+BW/2,b.y+BH/2,'#ff9d5c',26,4.5);
  G.bricks.forEach(o=>{ if(o.alive&&Math.abs(o.c-b.c)<=R&&Math.abs(o.r-b.r)<=R&&o!==b){ o.hp=0; hitBrickChain(o); }});
}
function hitBrickChain(o){ if(!o.alive) return; o.alive=false; G.score+=Math.round(brickChips(o)*effMult());
  burst(o.x+BW/2,o.y+BH/2,'#ffca7a',8,2.2); }
function crumble(b){
  floatText(b.x+BW/2,b.y-24,(LANG==='zh'?'碎裂!':'CRUMBLE!'),'#e8c98a',14);
  G.bricks.forEach(o=>{ if(o.alive&&Math.abs(o.c-b.c)+Math.abs(o.r-b.r)===1){ o.hp--; if(o.hp<=0){o.alive=false;
    G.score+=Math.round(brickChips(o)*effMult()); burst(o.x+BW/2,o.y+BH/2,'#e8c98a',8,2);} }});
  shake();
}
function ursaWave(){
  const alive=aliveBricks(); if(!alive.length) return;
  const maxR=Math.max(...alive.map(b=>b.r));
  alive.filter(b=>b.r===maxR).forEach(b=>{ b.hp--; burst(b.x+BW/2,b.y+BH/2,'#c58f6a',5,1.8);
    if(b.hp<=0){ b.alive=false; G.score+=Math.round(brickChips(b)*effMult()); } });
  floatText(paddle.x,paddle.y-26,(LANG==='zh'?'巨熊衝擊波':'URSA WAVE'),'#c58fff',13); shake();
}
function breakableLeft(){ return G.bricks.filter(b=>b.alive&&(b.type!=='steel'||MOD.steelBreak)).length; }
function checkCleared(){
  if(G.cleanup) return;  // no respawns once target is down — just finish the field
  /* cleared = nothing breakable remains — lone steel bricks don't hold the run hostage */
  if(breakableLeft()===0){
    if(G.score>=G.target) return;                       // blind will end
    if(!MOD.steelBreak) G.bricks.forEach(b=>{ if(b.alive&&b.type==='steel') b.alive=false; }); // sweep stranded steel
    const r0=G.bricks.length?Math.max(...G.bricks.map(b=>b.r))+1:0;
    const nRows=G.ante>=6?3:2;
    for(let r=0;r<nRows;r++) for(let c=0;c<COLS;c++){ if(rng()<0.85)
      G.bricks.push({c,r:r0+r,x:GRID_X+c*(BW+BGX),y:gridTop+(r0+r)*(BH+BGY),type:'norm',
        hp:1,maxhp:1,tier:Math.min(4,G.ante%5),alive:true,wob:rng()*6.28}); }
    floatText(W/2,H/2,(LANG==='zh'?"+ 補充磚排 +":"+ BONUS ROWS +"),'#9fe8ff',16);
  }
}
