"use strict";
/* ============================================================
   BLOCK-LOTTO 方塊樂透 — Balatro × Breakout roguelike
   ============================================================ */

/* ---------------- i18n ---------------- */
const I18N = {
  ante:{en:"ANTE",zh:"底注"}, score:{en:"SCORE",zh:"分數"}, target:{en:"TARGET",zh:"目標"},
  balls:{en:"BALLS",zh:"球"}, chips:{en:"BRICKS",zh:"磚塊"}, mult:{en:"MULT",zh:"倍率"},
  tagline:{en:"BALATRO × BREAKOUT · A LUCKY ROGUELIKE",zh:"小丑牌 × 打磚塊 · 好運肉鴿"},
  random:{en:"RANDOM",zh:"隨機"},
  seedHint:{en:"Seed: 0–8 chars · 1-9 & A-Z (no 0) · empty = fate decides, hidden til the end",
            zh:"種子:0–8 位 · 1-9 和 A-Z(沒有 0)· 留空 = 聽天由命,結局才揭曉"},
  start:{en:"▶ START RUN",zh:"▶ 開局"},
  credit:{en:"8 is lucky. 88 is VERY lucky. 發發發",zh:"8 很旺,88 超級旺!發發發"},
  chooseBlind:{en:"CHOOSE YOUR BLIND",zh:"選擇盲注"},
  skipNote:{en:"Skip for the tag reward — but no shop, no glory.",zh:"跳過可拿標籤獎勵 — 但沒有商店,也沒有榮耀。"},
  shop:{en:"THE LUCKY SHOP",zh:"好運商店"},
  forSale:{en:"TODAY'S FORTUNES",zh:"今日好貨"},
  yourJokers:{en:"YOUR JOKERS",zh:"你的小丑"},
  nextRound:{en:"NEXT ROUND ▶",zh:"下一輪 ▶"},
  again:{en:"↻ RUN IT BACK",zh:"↻ 再來一局"},
  endlessBtn:{en:"ENDLESS ▶",zh:"無盡模式 ▶"},
  paused:{en:"PAUSED",zh:"暫停"}, resume:{en:"RESUME ▶",zh:"繼續 ▶"},
  restart:{en:"RESTART RUN",zh:"重新開始"}, quitRun:{en:"QUIT TO MENU",zh:"回主選單"},
  tapLaunch:{en:"TAP TO LAUNCH",zh:"點擊發球"},
  tutLine:{en:"Combo resets when you catch · Mult burns down over time",zh:"接球會重置連擊 · 倍率會隨時間燒掉"},
  continueRun:{en:"▶ CONTINUE RUN",zh:"▶ 繼續上局"},
  menu:{en:"MENU",zh:"主選單"},
  gameOver:{en:"RUN OVER",zh:"遊戲結束"},
  youWin:{en:"YOU WIN!",zh:"你贏了!"},
  small:{en:"Small Blind",zh:"小盲注"}, big:{en:"Big Blind",zh:"大盲注"}, boss:{en:"Boss Blind",zh:"Boss 盲注"},
  reroll:{en:"REROLL",zh:"重抽"},
  sectJokers:{en:"JOKERS — permanent scoring powers",zh:"小丑 — 永久加分能力"},
  sectTarot:{en:"TAROT — one-shot tricks",zh:"塔羅 — 一次性道具"},
  sectVoucher:{en:"VOUCHER — permanent shop upgrade",zh:"禮券 — 永久商店強化"},
  sold:{en:"SOLD",zh:"已售出"},
  shopHelp:{en:"Tap a card to buy it. Jokers stack and last the whole run!",zh:"點卡片購買。小丑可疊加,整局有效!"},
  skip:{en:"SKIP +$2",zh:"跳過 +$2"},
  best:{en:"BEST",zh:"最高分"},
  lucky8:{en:"LUCKY 8! ×8",zh:"幸運 8!×8"},
  jackpot88:{en:"JACKPOT 88!! 發發!",zh:"頭獎 88!!發發!"},
  funRuined:{en:"FUN RUINED",zh:"樂趣沒啦"},
  clodRegen:{en:"CLOD REGENERATES!",zh:"泥團再生!"},
  waterbearSave:{en:"WATERBEAR ENDURES!",zh:"水熊蟲挺住了!"},
  needMoney:{en:"Not enough $!",zh:"錢不夠!"},
  slotsFull:{en:"Joker slots full!",zh:"小丑欄位滿了!"},
  score88:{en:"Score had 88! +$8",zh:"分數帶 88!+$8"},
  finalStats:{en:"Final Score",zh:"最終分數"},
  roundsWon:{en:"Blinds Beaten",zh:"通過盲注"},
  seedUsed:{en:"Seed",zh:"種子"},
  boss_mod_wall:{en:"THE WALL: +2 brick rows",zh:"高牆:+2 排磚塊"},
  boss_mod_slicer:{en:"THE SLICER: paddle −55%!! so smol",zh:"剪刀手:球拍 −55%!!超迷你"},
  boss_mod_storm:{en:"THE STORM: ball +25% speed",zh:"風暴:球速 +25%"},
  boss_mod_armored:{en:"THE ARMORED: all bricks +1 HP",zh:"鐵甲:所有磚塊 +1 HP"},
  boss_mod_cheap:{en:"THE CHEAPSKATE: half earnings",zh:"鐵公雞:收入減半"},
  boss_mod_clod:{en:"CLOD: clay mass REGENERATES",zh:"CLOD:泥團會再生"},
  boss_mod_bigtoe:{en:"BIG TOE: The Fun Ruiner Ghost — combo decays ×2, fun randomly RUINED",zh:"大腳趾:掃興鬼 — 連擊衰减×2,隨機掃興"},
  endless:{en:"ENDLESS MODE — how deep does the luck go?",zh:"無盡模式 — 好運到底有多深?"},
  slotNothing:{en:"nothing… your mult burned!",zh:"沒中…倍率燒掉了!"},
  slotJackpot:{en:"SLOT JACKPOT 88! 發發發!",zh:"老虎機頭獎 88!發發發!"},
  targetDown:{en:"TARGET DOWN — CLEAR 'EM ALL!",zh:"目標達成 — 清空全場!"},
  clearBonus:{en:"FIELD CLEARED!",zh:"全場清空!"},
};
let LANG = localStorage.getItem('bl_lang') || 'en';
function t(k){ const e=I18N[k]; return e ? (e[LANG]||e.en) : k; }
function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{ el.textContent = t(el.dataset.i18n); });
  document.getElementById('langBtn').textContent = LANG==='en' ? '中' : 'EN';
  document.documentElement.lang = LANG==='zh' ? 'zh-CN' : 'en';
}

/* ---------------- seeded RNG (seed: 0-8 chars, 1-9 A-Z, no 0; "" valid) ---------------- */
const SEED_CHARS = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"; // exactly 35, no 0
function validSeed(s){ return s.length<=8 && [...s].every(c=>SEED_CHARS.includes(c)); }
function randomSeed(){ let s=""; const n=8; for(let i=0;i<n;i++) s+=SEED_CHARS[(Math.random()*35)|0]; return s; }
function hashSeed(str){
  let h = 2166136261>>>0;
  for(let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h,16777619); }
  return h>>>0;
}
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0;
  let z=Math.imul(a^a>>>15,1|a); z=z+Math.imul(z^z>>>7,61|z)^z;
  return ((z^z>>>14)>>>0)/4294967296; }; }
let rng = Math.random;          // run RNG (seeded)
let runSeed = "";

/* ---------------- audio (WebAudio bleeps) ---------------- */
let audioCtx=null, muted = localStorage.getItem('bl_mute')==='1';
function ac(){ if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)(); return audioCtx; }
function beep(freq,dur=0.07,type='square',vol=0.16,slide=0){
  if(muted) return;
  try{ const c=ac(), o=c.createOscillator(), g=c.createGain();
    o.type=type; o.frequency.setValueAtTime(freq,c.currentTime);
    if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),c.currentTime+dur);
    g.gain.setValueAtTime(vol,c.currentTime); g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime+dur); }catch(e){}
}
const sfx = {
  hit:(tier)=>beep(300+tier*90,0.05,'square',0.12),
  paddle:()=>beep(180,0.06,'triangle',0.18,-60),
  gold:()=>{beep(880,0.06,'square',0.14);setTimeout(()=>beep(1320,0.08,'square',0.14),60);},
  bomb:()=>beep(90,0.3,'sawtooth',0.3,-50),
  lose:()=>beep(220,0.4,'sawtooth',0.2,-160),
  buy:()=>{beep(660,0.06,'square',0.14);setTimeout(()=>beep(990,0.1,'square',0.14),70);},
  lucky:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,0.12,'square',0.16),i*90));},
  jackpot:()=>{[523,659,784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>beep(f,0.14,'square',0.18),i*80));},
  legendary:()=>{[392,523,659,784,1047,1319,1568,2093].forEach((f,i)=>setTimeout(()=>beep(f,0.15,'triangle',0.16),i*85));},
  ghost:()=>beep(440,0.5,'sine',0.2,-300),
};

/* ---------------- DOM refs ---------------- */
const $ = id => document.getElementById(id);
const cv=$('game'), ctx=cv.getContext('2d');
const fxc=$('fx'), fctx=fxc.getContext('2d');
const W=420, H=760;

/* ---------------- game state ---------------- */
const G = {
  state:'title', ante:1, blindIdx:0, // 0 small 1 big 2 boss
  money:4, lives:3, livesMax:3,
  chips:10, mult:1, multBonus:0,       // multBonus = combo streak bonus
  score:0, target:300, runScore:0, blindsWon:0,
  jokers:[], cons:[], vouchers:[], slots:5,
  combo:0, bestCombo:0, brickHitCount:0, spdMul:1, cleanup:false,
  endless:false, bossMod:null, rerollCost:2, skipTags:{}, rareShopPending:false,
  paddle:{w:80}, balls:[], bricks:[], shop:[],
  savedBalls:0, waterbearUsed:false, bigtoeTimer:0,
  interestCap:0, goldBoost:false, stats:{maxCombo:0,jackpots:0,lucky8s:0},
};
const BLIND_TYPES=['small','big','boss'];
function baseTarget(a){ return Math.round(300*Math.pow(1.62,a-1)/10)*10; } // 300 ... ~54k @ ante 8 boss x2
function blindTarget(){ const b=baseTarget(G.ante);
  return G.blindIdx===0?b : G.blindIdx===1?Math.round(b*1.5) : b*2; }
function blindReward(){ return G.blindIdx===0?3 : G.blindIdx===1?4 : 5; }

/* ---------------- rarity ---------------- */
const RARITY={common:{w:62,color:'#7fb3e8',price:[3,5]},uncommon:{w:26,color:'#63d68b',price:[6,8]},
              rare:{w:10,color:'#ff9d5c',price:[9,12]},legendary:{w:2,color:'#ffd23f',price:[15,20]}};
function priceOf(r){ const p=RARITY[r].price; return p[0]+((rng()*(p[1]-p[0]+1))|0); }
