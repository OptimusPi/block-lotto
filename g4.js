"use strict";
/* ---------------- UPDATE LOOP ---------------- */
let lastT=0;
function tick(now){
  const dt=Math.max(0.0001,Math.min(0.033,(now-lastT)/1000||0.016)); lastT=Math.max(now,lastT);
  if(typeof stepBg==='function') stepBg(dt);
  if(G.state==='play') update(dt);
  render(); drawFx(dt);
}
function loop(ts){ tick(ts); requestAnimationFrame(loop); }
function update(dt){
  const step=dt*60;
  /* mult burns down 1/sec naturally — keep triggering shit or lose it */
  if(G.multBonus>0){ const b4=Math.floor(G.multBonus);
    G.multBonus=Math.max(0,G.multBonus-dt*1.0);
    if(Math.floor(G.multBonus)!==b4) updateHUD(); }
  /* slot machine timers */
  if(SLOT.cd>0) SLOT.cd-=dt;
  if(SLOT.spin>0){ SLOT.spin-=dt; SLOT.st+=dt;
    if(SLOT.st>0.09){ SLOT.st=0;
      SLOT.sym=[REELS[(Math.random()*8)|0],REELS[(Math.random()*8)|0],REELS[(Math.random()*8)|0]];
      beep(500+Math.random()*400,0.03,'square',0.06); }
    if(SLOT.spin<=0) slotResolve(); }
  // balls
  for(let i=G.balls.length-1;i>=0;i--){
    const b=G.balls[i];
    if(b.stuck){ b.x=paddle.x; b.y=paddle.y-11; continue; }
    b.x+=b.vx*step; b.y+=b.vy*step;
    if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx);}
    if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx);}
    if(b.y<b.r+100){b.y=b.r+100;b.vy=Math.abs(b.vy);}
    // paddle
    const pw=paddleW();
    if(b.vy>0 && b.y+b.r>=paddle.y && b.y+b.r<=paddle.y+paddle.h+10 && Math.abs(b.x-paddle.x)<=pw/2+b.r){
      const off=Math.max(-1,Math.min(1,(b.x-paddle.x)/(pw/2)));
      /* paddle = the brake: volley speed resets to x1.0 like combo does */
      G.spdMul=1;
      const sp=Math.max(2.2,Math.min(8.5,ballSpeed()));
      const ang=off*1.15;                                     // up to ~66°
      b.vx=Math.sin(ang)*sp; b.vy=-Math.cos(ang)*sp; b.y=paddle.y-b.r-1;
      G.combo=0; G.multBonus=MOD.keepCombo?Math.floor(G.multBonus/2):0; sfx.paddle(); updateHUD();
      if(MOD.ursa) ursaWave();
    }
    // bricks
    for(const br of G.bricks){ if(!br.alive) continue;
      if(b.x+b.r>br.x && b.x-b.r<br.x+BW && b.y+b.r>br.y && b.y-b.r<br.y+BH){
        const overlapL=b.x+b.r-br.x, overlapR=br.x+BW-(b.x-b.r);
        const overlapT=b.y+b.r-br.y, overlapB=br.y+BH-(b.y-b.r);
        const m=Math.min(overlapL,overlapR,overlapT,overlapB);
        if(m===overlapL||m===overlapR) b.vx*=-1; else b.vy*=-1;
        hitBrick(br,b); break;
      }
    }
    /* SLOT MACHINE: ball lands in → reels spin, time burns, fate decides */
    if(SLOT.cd<=0 && SLOT.spin<=0 &&
       b.x+b.r>SLOT.x && b.x-b.r<SLOT.x+SLOT.w && b.y+b.r>SLOT.y && b.y-b.r<SLOT.y+SLOT.h){
      SLOT.captured=G.multBonus;
      G.balls.splice(i,1); SLOT.spin=1.8; SLOT.st=0; SLOT.cd=6;
      floatText(b.x,SLOT.y-10,(LANG==='zh'?'被老虎機吃掉…':'SWALLOWED…'),'#ffd23f',14);
      sfx.buy(); shake(); continue;
    }
    /* on cooldown the machine is a solid block — bounce off */
    if(SLOT.spin<=0 && b.x+b.r>SLOT.x && b.x-b.r<SLOT.x+SLOT.w && b.y+b.r>SLOT.y && b.y-b.r<SLOT.y+SLOT.h){
      if(b.y<SLOT.y||b.y>SLOT.y+SLOT.h) b.vy*=-1; else b.vx*=-1;
      b.x+=b.vx*step; b.y+=b.vy*step;
    }
    if(b.y>H+20){ G.balls.splice(i,1); }
  }
  if(G.balls.length===0 && SLOT.spin<=0) loseBall();
  // CLOD regenerates
  if(bossActive()&&G.bossMod==='clod'&&!G.cleanup){ G.clodT=(G.clodT||0)+dt;
    if(G.clodT>4){ G.clodT=0; const dead=G.bricks.find(x=>!x.alive&&x.type==='clay');
      if(dead){ dead.alive=true; dead.hp=2; floatText(dead.x+BW/2,dead.y,t('clodRegen'),'#c58f6a',12); sfx.ghost(); } } }
  // BIG TOE ruins fun randomly
  if(bossActive()&&G.bossMod==='bigtoe' && !MOD.waterbear){ G.bigtoeTimer+=dt;
    if(G.bigtoeTimer>9){ G.bigtoeTimer=0;
      if(rng()<0.5 && G.combo>0){ G.combo=0; G.multBonus=Math.floor(G.multBonus/2);
        luckyBanner(t('funRuined')); sfx.ghost(); shake(); } } }
  // win flow: hit target -> cleanup mode, shop only after field cleared or ball spent
  if(!G.cleanup && G.score>=G.target){ G.cleanup=true; luckyBanner(t('targetDown')); sfx.lucky(); goldRain(14); updateHUD(); }
  if(G.cleanup && breakableLeft()===0){ floatText(W/2,H/2,t('clearBonus'),'#7CFC9B',20); G.money+=2; endBlind(true); }
  updateComboTag();
}
function loseBall(){
  if(G.cleanup){ endBlind(true); return; }              // target already down — ball spent, take the win
  if(MOD.waterbear && !G.waterbearUsed){ G.waterbearUsed=true;
    luckyBanner(t('waterbearSave')); sfx.legendary(); resetBall(true); return; }
  G.lives--; sfx.lose(); shake(); updateHUD();
  if(G.lives<=0){ endBlind(false); } else resetBall(true);
}
function endBlind(won){
  if(won){
    let pay=blindReward();
    // interest: $1 per $8 held
    const cap=8+MOD.interestCap;
    pay+=Math.min(cap,(G.money/8)|0);
    if(MOD.rich) pay+=(G.score/800)|0;
    if(String(Math.round(G.score)).includes('88')){ pay+=8; toast(t('score88')); }
    if(bossActive()&&G.bossMod==='cheap') pay=Math.ceil(pay/2);
    G.money+=pay; G.runScore+=G.score; G.blindsWon++;
    sfx.buy(); goldRain(18);
  }
  advance(won);
}
function advance(won){
  if(!won && G.lives<=0){ return gameOver(false); }
  if(G.blindIdx<2){ G.blindIdx++; openShop(); }
  else{
    if(G.ante>=8 && !G.endless){ return gameOver(true); }
    G.ante++; G.blindIdx=0; G.bossMod=null; openShop();
  }
}

/* ---------------- RENDER ---------------- */
function render(){
  ctx.clearRect(0,0,W,H);
  if(G.state!=='play') { drawIdle(); return; }
  // bricks
  const now=performance.now()/1000;
  for(const b of G.bricks){ if(!b.alive) continue;
    const wob=Math.sin(now*2+b.wob)*1.2;
    ctx.save(); ctx.translate(b.x,b.y+wob);
    if(b.type==='gold'){ ctx.fillStyle='#f5b301'; rr(0,0,BW,BH,5); ctx.fill();
      ctx.fillStyle='#8f1d22'; ctx.font='bold 13px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('發',BW/2,BH/2+1);
    } else if(b.type==='bomb'){ ctx.fillStyle='#3a3a44'; rr(0,0,BW,BH,5); ctx.fill();
      ctx.fillStyle='#17171c'; ctx.beginPath(); ctx.arc(BW/2,BH/2+2,6,0,6.29); ctx.fill();
      ctx.strokeStyle='#f5b301'; ctx.lineWidth=1.5; ctx.beginPath();
      ctx.moveTo(BW/2+4,BH/2-3); ctx.quadraticCurveTo(BW/2+8,BH/2-8,BW/2+11,BH/2-6); ctx.stroke();
      ctx.fillStyle='#ffd23f'; ctx.beginPath(); ctx.arc(BW/2+11,BH/2-6,2,0,6.29); ctx.fill();
    } else if(b.type==='mult'){ ctx.fillStyle='#b33951'; rr(0,0,BW,BH,5); ctx.fill();
      ctx.fillStyle='#fff'; ctx.font='bold 12px monospace'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('×2',BW/2,BH/2+1);
    } else if(b.type==='steel'){ const g=ctx.createLinearGradient(0,0,0,BH);
      g.addColorStop(0,'#9aa4b0'); g.addColorStop(1,'#5a626c'); ctx.fillStyle=g; rr(0,0,BW,BH,4); ctx.fill();
    } else if(b.type==='clay'){ ctx.fillStyle='#8a5a3a'; rr(0,0,BW,BH,7); ctx.fill();
      ctx.fillStyle='rgba(0,0,0,.25)'; rr(6,5,BW-12,BH-10,5); ctx.fill();
    } else { ctx.fillStyle=TIERS[b.tier].c; rr(0,0,BW,BH,5); ctx.fill();
      if(b.maxhp>1){ ctx.fillStyle='rgba(0,0,0,.4)'; ctx.font='bold 10px monospace';
        ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(b.hp,BW/2,BH/2+1); }
    }
    ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1.5; rr(0,0,BW,BH,5); ctx.stroke();
    ctx.restore();
  }
  // slot machine
  drawSlot();
  // paddle — gold-trimmed red
  const pw=paddleW();
  ctx.save(); ctx.translate(paddle.x,paddle.y);
  const pg=ctx.createLinearGradient(0,0,0,paddle.h);
  pg.addColorStop(0,'#e0483f'); pg.addColorStop(1,'#8f1d22');
  ctx.fillStyle=pg; rr(-pw/2,0,pw,paddle.h,6); ctx.fill();
  ctx.strokeStyle='#ffd23f'; ctx.lineWidth=2; rr(-pw/2,0,pw,paddle.h,6); ctx.stroke();
  ctx.restore();
  // balls
  for(const b of G.balls){ ctx.save();
    ctx.shadowColor='rgba(255,210,63,.8)'; ctx.shadowBlur=10;
    ctx.fillStyle='#fff7e6'; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,6.29); ctx.fill(); ctx.restore(); }
}
function drawIdle(){
  // floating decorative bricks behind title
  const now=performance.now()/1000;
  for(let i=0;i<10;i++){ const x=(i*97)%W, y=(now*22+i*90)%(H+80)-40;
    ctx.save(); ctx.globalAlpha=0.16; ctx.fillStyle=TIERS[i%5].c;
    ctx.translate(x,y); ctx.rotate(Math.sin(now+i)*0.2); rr(0,0,BW,BH,5); ctx.fill(); ctx.restore(); }
}
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function drawFx(dt){
  fctx.clearRect(0,0,W,H);
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.life-=dt*1.4;
    if(p.life<=0){parts.splice(i,1);continue;}
    p.x+=p.vx; p.y+=p.vy; if(!p.gold) p.vy+=0.08;
    fctx.save(); fctx.globalAlpha=Math.min(1,p.life); fctx.fillStyle=p.color;
    fctx.beginPath(); fctx.arc(p.x,p.y,p.r,0,6.29); fctx.fill(); fctx.restore(); }
  for(let i=floats.length-1;i>=0;i--){ const f=floats[i]; f.life-=dt*1.1; f.y-=0.9;
    if(f.life<=0){floats.splice(i,1);continue;}
    fctx.save(); fctx.globalAlpha=Math.min(1,f.life); fctx.fillStyle=f.color;
    fctx.font=`900 ${f.size}px "Avenir Next","PingFang SC",monospace`; fctx.textAlign='center';
    fctx.shadowColor='#000'; fctx.shadowBlur=4; fctx.fillText(f.txt,f.x,f.y); fctx.restore(); }
}

/* ---------------- HUD ---------------- */
function updateHUD(){
  const stuck=G.state==='play'&&G.balls.some(b=>b.stuck);
  $('launchHint').classList.toggle('hidden',!stuck);
  if(stuck) $('launchHint').textContent=t('tapLaunch');
  $('hudAnte').textContent=G.endless?G.ante+'∞':G.ante+'/8';
  $('hudScore').textContent=Math.round(G.score).toLocaleString();
  $('hudTarget').textContent=G.cleanup?'CLEAR!':G.target.toLocaleString();
  $('hudMoney').textContent=G.money;
  $('hudBalls').textContent='×'+G.lives;
  $('hudChips').textContent=Math.round((10+MOD.chipsFlat)*MOD.chipsX||G.chips);
  $('hudMult').textContent=Math.round(effMult()*10)/10;
  // joker bar
  $('jokerbar').innerHTML=G.jokers.map(j=>
    `<div class="mini ${j.r}" title="${jn(j)}"><img src="${ASSETS[j.id]}" alt=""></div>`).join('');
}
function updateComboTag(){
  const el=$('comboTag');
  if(G.combo>=3||G.spdMul>1.05){ el.style.opacity=1; el.textContent=`${G.combo} COMBO · SPD ×${G.spdMul.toFixed(2)}`;
    if(G.combo>=8&&G.combo<88) el.style.color='#ffd23f'; else if(G.combo>=88) el.style.color='#ff5c7a'; }
  else el.style.opacity=0;
}
function jn(j){ return j.n[LANG]||j.n.en; } function jd(j){ return j.d[LANG]||j.d.en; }
