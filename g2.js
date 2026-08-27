"use strict";
/* ---------------- ITEMS (jokers) ---------------- */
const JOKERS=[
 {id:'red',   r:'common',   n:{en:'Red Joker',zh:'紅小丑'},     d:{en:'+4 Mult',zh:'+4 倍率'},
   apply:j=>j.multFlat=(j.multFlat||0)+4},
 {id:'blue',  r:'common',   n:{en:'Blue Joker',zh:'藍小丑'},    d:{en:'+50 Chips',zh:'+50 籌碼'},
   apply:j=>j.chipsFlat=(j.chipsFlat||0)+50},
 {id:'wide',  r:'common',   n:{en:'Wide Load',zh:'寬板'},       d:{en:'Paddle +22% wider',zh:'球拍加寬 22%'},
   apply:j=>j.paddleW=(j.paddleW||1)*1.22},
 {id:'gold',  r:'common',   n:{en:'Red Envelope',zh:'紅包'},    d:{en:'Gold bricks +$4',zh:'金磚 +$4'},
   apply:j=>j.goldPlus=(j.goldPlus||0)+4},
 {id:'tea',   r:'common',   n:{en:'Calm Tea',zh:'靜心茶'},      d:{en:'Ball 12% slower',zh:'球速 −12%'},
   apply:j=>j.ballSpd=(j.ballSpd||1)*0.88},
 {id:'extrab',r:'uncommon', n:{en:'Spare Ball',zh:'備用球'},    d:{en:'+1 ball each blind',zh:'每個盲注 +1 球'},
   apply:j=>j.ballsPlus=(j.ballsPlus||0)+1},
 {id:'twin',  r:'uncommon', n:{en:'Twin Luck',zh:'雙喜'},       d:{en:'12% multiball on brick break',zh:'破磚 12% 機率分裂球'},
   apply:j=>j.twinCh=(j.twinCh||0)+0.12},
 {id:'bomb2', r:'uncommon', n:{en:'Big Boom',zh:'大爆炸'},     d:{en:'Bombs blast radius +1',zh:'炸彈範圍 +1'},
   apply:j=>j.bombR=(j.bombR||0)+1},
 {id:'combo', r:'uncommon', n:{en:'Hot Streak',zh:'連勝火'},    d:{en:'Paddle keeps HALF your combo mult',zh:'接球時保留一半連擊倍率'},
   apply:j=>j.keepCombo=true},
 {id:'cat',   r:'uncommon', n:{en:'Lucky Cat',zh:'招財貓'},     d:{en:'+1 interest cap, more gold bricks',zh:'利息上限 +1,金磚更多'},
   apply:j=>{j.interestCap=(j.interestCap||0)+1;j.goldBoost=true;}},
 {id:'frenzy',r:'rare',     n:{en:'Frenzy',zh:'狂熱'},         d:{en:'+1 Mult per brick broken (resets each blind)',zh:'每破一磚 +1 倍率(每盲注重置)'},
   apply:j=>j.frenzy=true},
 {id:'xmult', r:'rare',     n:{en:'Golden 8',zh:'黃金八'},      d:{en:'×1.5 Mult',zh:'×1.5 倍率'},
   apply:j=>j.multX=(j.multX||1)*1.5},
 {id:'steel', r:'rare',     n:{en:'Steelbreaker',zh:'破鋼鎬'},  d:{en:'Steel bricks breakable (4 hits, 200 chips)',zh:'鋼磚可破(4 擊,200 籌碼)'},
   apply:j=>j.steelBreak=true},
 {id:'rich',  r:'rare',     n:{en:'Moneybags',zh:'錢袋子'},     d:{en:'+$1 per 800 score at blind end',zh:'盲注結束每 800 分 +$1'},
   apply:j=>j.rich=true},
 {id:'lives', r:'rare',     n:{en:'Peach of Life',zh:'壽桃'},   d:{en:'+1 ball AND +20 Chips',zh:'+1 球且 +20 籌碼'},
   apply:j=>{j.ballsPlus=(j.ballsPlus||0)+1;j.chipsFlat=(j.chipsFlat||0)+20;}},
 /* ------- LEGENDARIES ------- */
 {id:'waterbear',r:'legendary',n:{en:'WATERBEAR',zh:'水熊蟲'}, d:{en:'Indestructible: first ball lost each blind RETURNS. Shrugs off Big Toe.',zh:'不死之身:每盲注第一顆丟失的球會回來。不怕掃興鬼。'},
   apply:j=>j.waterbear=true},
 {id:'tun',   r:'legendary', n:{en:'TUN',zh:'隱生態'},          d:{en:'Cryptobiosis: ball −20% speed, Chips ×2',zh:'隱生:球速 −20%,籌碼 ×2'},
   apply:j=>{j.ballSpd=(j.ballSpd||1)*0.8;j.chipsX=(j.chipsX||1)*2;}},
 {id:'jammy', r:'legendary', n:{en:'JAMMY',zh:'好運莓'},        d:{en:'ALL lucky chances ×2. Lucky procs give +8 chips',zh:'所有幸運機率 ×2,幸運觸發 +8 籌碼'},
   apply:j=>j.jammy=true},
 {id:'ursa',  r:'legendary', n:{en:'URSA',zh:'巨熊'},           d:{en:'Paddle +25%. Paddle hits send a shockwave through the lowest row',zh:'球拍 +25%。接球衝擊波打穿最底排'},
   apply:j=>{j.paddleW=(j.paddleW||1)*1.25;j.ursa=true;}},
 {id:'crouton',r:'legendary',n:{en:'CROUTON',zh:'麵包丁'},      d:{en:'Every 8th brick CRUMBLES its neighbors (1 dmg)',zh:'每第 8 塊磚震碎鄰磚(1 傷害)'},
   apply:j=>j.crouton=true},
];
const CONSUMABLES=[
 {id:'row',  n:{en:'Row Clear',zh:'清一排'},   d:{en:'Destroy lowest brick row next blind',zh:'下個盲注摧毀最底排'}, price:4},
 {id:'nuke', n:{en:'Nuke',zh:'核彈'},          d:{en:'Destroy 25% of bricks next blind',zh:'下個盲注摧毀 25% 磚塊'}, price:6},
 {id:'life', n:{en:'Extra Life',zh:'額外生命'},d:{en:'+1 ball, right now, forever (this run)',zh:'立即永久 +1 球(本局)'}, price:6},
 {id:'scr',  n:{en:'Scratch Card',zh:'刮刮樂'},d:{en:'Win $1–8… 8% chance of $88!!',zh:'刮出 $1–8,8% 機率 $88!!'}, price:3},
 {id:'slow', n:{en:'Slow Syrup',zh:'慢速糖漿'},d:{en:'Ball 25% slower next blind',zh:'下個盲注球速 −25%'}, price:3},
];
const VOUCHERS=[
 {id:'slot', n:{en:'Extra Slot',zh:'額外欄位'}, d:{en:'+1 joker slot',zh:'+1 小丑欄位'}, price:8},
 {id:'disc', n:{en:'Coupon',zh:'折扣券'},       d:{en:'Shop 25% off',zh:'商店 75 折'}, price:7},
 {id:'rr',   n:{en:'Reroll Sale',zh:'重抽特價'},d:{en:'Rerolls cost $1 less',zh:'重抽便宜 $1'}, price:5},
 {id:'int',  n:{en:'Fortune Bank',zh:'發財銀行'},d:{en:'Interest: $1 per $8 held (cap $8)',zh:'利息:每存 $8 得 $1(上限 $8)'}, price:8},
];
/* ---------------- SKIP TAGS (seeded per blind) ---------------- */
const SKIP_TAGS=[
 {id:'cash',  txt:{en:'SKIP · +$8',zh:'跳過 · +$8'}},
 {id:'joker', txt:{en:'SKIP · FREE JOKER',zh:'跳過 · 免費小丑'}},
 {id:'rare',  txt:{en:'SKIP · RARE SHOP NEXT',zh:'跳過 · 下次商店必出稀有'}},
];

/* aggregated per-run modifiers, recomputed from owned jokers */
let MOD={};
function recompute(){
  MOD={multFlat:0,chipsFlat:0,paddleW:1,ballSpd:1,goldPlus:0,ballsPlus:0,twinCh:0,bombR:0,
       keepCombo:false,interestCap:0,goldBoost:false,frenzy:false,multX:1,chipsX:1,steelBreak:false,
       rich:false,waterbear:false,jammy:false,ursa:false,crouton:false};
  for(const j of G.jokers) j.apply(MOD);
  if(G.vouchers.find(v=>v.id==='int')) MOD.interestCap=(MOD.interestCap||0)+8;
}
function disc(){ return G.vouchers.find(v=>v.id==='disc')?0.75:1; }

/* ---------------- BOSSES ---------------- */
const BOSSES=['wall','slicer','storm','armored','cheap','clod'];
function pickBoss(){
  if(G.ante===8) return 'bigtoe';           // final boss: Big Toe, The Fun Ruiner Ghost
  const pool=BOSSES.filter(b=>!G['seen_'+b]); const b=pool.length?pool[(rng()*pool.length)|0]:BOSSES[(rng()*BOSSES.length)|0];
  G['seen_'+b]=true; return b;
}
const BOSS_NAME={wall:{en:'THE WALL',zh:'高牆'},slicer:{en:'THE SLICER',zh:'剪刀手'},storm:{en:'THE STORM',zh:'風暴'},armored:{en:'THE ARMORED',zh:'鐵甲'},cheap:{en:'THE CHEAPSKATE',zh:'鐵公雞'},clod:{en:'CLOD',zh:'泥團 CLOD'},bigtoe:{en:'BIG TOE',zh:'大腳趾'}};
/* boss powers ONLY apply during the boss blind itself */
function bossActive(){ return G.blindIdx===2; }

/* ---------------- BRICKS ---------------- */
const COLS=8, BW=48, BH=24, BGX=2, BGY=2, GRID_X=(W-(COLS*BW+(COLS-1)*BGX))/2;
let gridTop=340;   // bricks vertically centered in the play field (set by genBricks)
const TIERS=[
  {c:'#63d68b',chips:10},{c:'#4a90d4',chips:20},{c:'#c58fff',chips:30},
  {c:'#ff9d5c',chips:40},{c:'#ff5c7a',chips:50},
];
function genBricks(){
  G.bricks=[];
  let rows=3+Math.min(4,Math.ceil(G.ante/2));           // 4..7
  if(bossActive()&&G.bossMod==='wall') rows+=2;
  const hpBase=G.ante>=6?3:G.ante>=4?2:1;
  const special=Math.min(0.34,0.10+G.ante*0.028+(MOD.goldBoost?0.06:0));
  /* center the grid in the field between HUD and paddle */
  const playTop=336, playBot=H-64-40, gridH=rows*(BH+BGY)-BGY;
  gridTop=Math.round(playTop+Math.max(0,(playBot-playTop-gridH)/2));
  for(let r=0;r<rows;r++) for(let c=0;c<COLS;c++){
    if(rng()<0.10 && G.ante<4) continue;                 // gaps early
    let type='norm', hp=Math.max(1,hpBase-(r<2?1:0)), tier=Math.min(4,(G.ante-1+r)%5);
    const roll=rng();
    if(roll<special*0.28)      {type='gold'; hp=1;}
    else if(roll<special*0.48) {type='bomb'; hp=1;}
    else if(roll<special*0.68) {type='mult'; hp=1;}
    else if(roll<special*0.78 && G.ante>=3){type='steel'; hp=MOD.steelBreak?4:Infinity;}
    if(bossActive()&&G.bossMod==='armored'&&type==='norm') hp++;
    if(bossActive()&&G.bossMod==='clod'&&type==='norm'){ type='clay'; hp=2; }
    G.bricks.push({c,r,x:GRID_X+c*(BW+BGX),y:gridTop+r*(BH+BGY),type,hp,maxhp:hp,tier,alive:true,wob:rng()*6.28});
  }
  // consumable pre-effects
  if(G.flags.rowClear){ const maxR=Math.max(...G.bricks.map(b=>b.r)); G.bricks.forEach(b=>{if(b.r===maxR)b.alive=false;}); }
  if(G.flags.nuke){ G.bricks.forEach(b=>{ if(rng()<0.25) b.alive=false; }); }
  G.bricks=G.bricks.filter(b=>b.alive);
}
function aliveBricks(){ return G.bricks.filter(b=>b.alive); }
