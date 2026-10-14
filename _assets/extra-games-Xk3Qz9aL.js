import{j as m,r as g}from"./vendor-CYxKxS8R.js";
const W=360,H=540;
const cl=(v,a,b)=>Math.max(a,Math.min(b,v)),rd=(a,b)=>a+Math.random()*(b-a),ri=n=>Math.floor(Math.random()*n);
const hud=(c,l,r)=>{c.save();c.font="700 15px Inter, sans-serif";c.fillStyle="#eef3ff";c.textAlign="left";c.fillText(l,10,18);c.textAlign="right";c.fillText(r,W-10,18);c.restore()};
const hint=(c,t)=>{c.save();c.font="600 13px Inter, sans-serif";c.fillStyle="#9aa2cc";c.textAlign="center";c.fillText(t,W/2,H-16);c.restore()};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};

/* ---------- Snake Run ---------- */
function snake(onOver){
const N=18,M=27,S=20;
let body=[[9,13],[8,13],[7,13]],dir=[1,0],nd=[1,0],food=[12,13],t=0,score=0,over=false,speed=.14,sx=0,sy=0,sd=false;
const place=()=>{for(let k=0;k<500;k++){const f=[ri(N),ri(M)];if(!body.some(b=>b[0]===f[0]&&b[1]===f[1])){food=f;return}}};
const turn=(dx,dy)=>{if(dx===-dir[0]&&dy===-dir[1])return;nd=[dx,dy]};
return{
down(x,y){sx=x;sy=y;sd=true},
move(x,y){if(!sd)return;const dx=x-sx,dy=y-sy;if(Math.abs(dx)>16||Math.abs(dy)>16){if(Math.abs(dx)>Math.abs(dy))turn(Math.sign(dx),0);else turn(0,Math.sign(dy));sx=x;sy=y}},
up(){sd=false},
key(k){const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[k];if(d)turn(d[0],d[1])},
step(dt){if(over)return;t+=dt;while(t>=speed&&!over){t-=speed;dir=nd;const h=[body[0][0]+dir[0],body[0][1]+dir[1]];
if(h[0]<0||h[1]<0||h[0]>=N||h[1]>=M||body.some(b=>b[0]===h[0]&&b[1]===h[1])){over=true;onOver(score);return}
body.unshift(h);if(h[0]===food[0]&&h[1]===food[1]){score+=10;speed=Math.max(.07,speed-.003);place()}else body.pop()}},
draw(c){c.fillStyle="#070a22";c.fillRect(0,0,W,H);c.strokeStyle="rgba(120,140,255,.08)";c.lineWidth=1;c.beginPath();
for(let i=0;i<=N;i++){c.moveTo(i*S,0);c.lineTo(i*S,M*S)}for(let j=0;j<=M;j++){c.moveTo(0,j*S);c.lineTo(W,j*S)}c.stroke();
c.font="18px sans-serif";c.fillText("🍎",food[0]*S+S/2,food[1]*S+S/2+1);
body.forEach((b,i)=>{c.fillStyle=i===0?"#00cfff":i%2?"#6ee7b7":"#34d399";c.fillRect(b[0]*S+1,b[1]*S+1,S-2,S-2)});
hud(c,`Score ${score}`,`Length ${body.length}`);if(score===0)hint(c,"Swipe to steer · eat 🍎 · don't hit walls or yourself")}}}

/* ---------- Whack-a-Mole ---------- */
function whack(onOver){
const HO=[[60,190],[180,190],[300,190],[60,310],[180,310],[300,310],[60,430],[180,430],[300,430]];
let moles=HO.map(()=>({up:false,t:0,life:0,gold:false,hit:false})),time=30,sp=.4,score=0,over=false;
return{
down(x,y){if(over)return;for(let i=0;i<9;i++){const m=moles[i];if(m.up&&!m.hit&&Math.hypot(x-HO[i][0],y-HO[i][1]+14)<46){m.hit=true;score+=m.gold?25:10;m.t=Math.max(m.t,m.life-.18);break}}},
step(dt){if(over)return;time-=dt;if(time<=0){time=0;over=true;onOver(score);return}
sp-=dt;if(sp<=0){sp=Math.max(.3,.85-(30-time)*.02);const free=[];moles.forEach((m,i)=>{if(!m.up)free.push(i)});
if(free.length){const i=free[ri(free.length)];moles[i]={up:true,t:0,life:rd(.7,1.2)*Math.max(.55,1-(30-time)/60),gold:Math.random()<.12,hit:false}}}
moles.forEach(m=>{if(m.up){m.t+=dt;if(m.t>=m.life)m.up=false}})},
draw(c){c.fillStyle="#0d1030";c.fillRect(0,0,W,H);
HO.forEach((h,i)=>{const m=moles[i];c.fillStyle="#2a2150";c.beginPath();c.ellipse(h[0],h[1]+22,44,16,0,0,Math.PI*2);c.fill();
if(m.up){const p=Math.min(1,Math.min(m.t,m.life-m.t)/.12);c.font="46px sans-serif";c.fillText(m.hit?"💥":m.gold?"🐲":"🐹",h[0],h[1]+14-30*p)}
c.fillStyle="#3a2f6a";c.beginPath();c.ellipse(h[0],h[1]+26,44,10,0,0,Math.PI);c.fill()});
hud(c,`Score ${score}`,`⏱ ${Math.ceil(time)}s`);if(time>26)hint(c,"Tap the moles! 🐲 is worth 25")}}}

/* ---------- Sky Hop ---------- */
function skyhop(onOver){
const BX=90,R=14,GAP=150,PW=56;
let y=270,vy=0,started=false,over=false,score=0,pipes=[],sp=0,t=0;
const flap=()=>{if(over)return;started=true;vy=-300};
return{down:flap,key(k){if(k===" "||k==="ArrowUp")flap()},
step(dt){t+=dt;if(over)return;if(!started){y=270+Math.sin(t*5)*8;return}
vy+=900*dt;y+=vy*dt;sp-=dt;if(sp<=0){sp=1.55;pipes.push({x:W+PW,top:rd(70,H-GAP-90),ok:false})}
const v=130+Math.min(60,score*.8);pipes.forEach(p=>p.x-=v*dt);pipes=pipes.filter(p=>p.x>-PW-10);
for(const p of pipes){if(!p.ok&&p.x+PW<BX-R){p.ok=true;score+=10}
if(BX+R>p.x&&BX-R<p.x+PW&&(y-R<p.top||y+R>p.top+GAP)){over=true;onOver(score);return}}
if(y+R>H-20||y-R<0){over=true;onOver(score)}},
draw(c){c.fillStyle="#0a1030";c.fillRect(0,0,W,H);
for(const p of pipes){c.fillStyle="#1fb97a";c.fillRect(p.x,0,PW,p.top);c.fillRect(p.x,p.top+GAP,PW,H-p.top-GAP);c.fillStyle="#6ee7b7";c.fillRect(p.x-3,p.top-14,PW+6,14);c.fillRect(p.x-3,p.top+GAP,PW+6,14)}
c.fillStyle="#3a2f6a";c.fillRect(0,H-20,W,20);c.font="34px sans-serif";c.fillText(over?"💥":"🛸",BX,y);
hud(c,`Score ${score}`,"");if(!started)hint(c,"Tap to hop through the gaps")}}}

/* ---------- Brick Breaker ---------- */
function bricks(onOver){
const BW=40,BH=18,COLS=8,ROWS=5,PW=70,PY=500,CO=["#ff20d5","#ffcf5a","#6ee7b7","#00cfff","#8a7bff"];
let px=W/2,lives=3,score=0,level=1,over=false,launched=false,sp=300,bx=W/2,by=PY-12,vx=0,vy=0,bs=[];
const build=()=>{bs=[];for(let r=0;r<ROWS;r++)for(let k=0;k<COLS;k++)bs.push({x:20+k*43,y:60+r*24,r,alive:true})};build();
const attach=()=>{launched=false;bx=px;by=PY-12;vx=0;vy=0};
const launch=()=>{if(launched||over)return;launched=true;const a=rd(-.4,.4);vx=Math.sin(a)*sp;vy=-Math.cos(a)*sp};
const setX=x=>{px=cl(x,PW/2,W-PW/2);if(!launched)bx=px};
return{
down(x){setX(x);launch()},move(x){setX(x)},key(k){if(k==="ArrowLeft")setX(px-24);if(k==="ArrowRight")setX(px+24);if(k===" "||k==="ArrowUp")launch()},
step(dt){if(over||!launched)return;const n=Math.max(1,Math.ceil(sp*dt/4)),h=dt/n;
for(let s=0;s<n;s++){bx+=vx*h;by+=vy*h;
if(bx<7){bx=7;vx=Math.abs(vx)}if(bx>W-7){bx=W-7;vx=-Math.abs(vx)}if(by<28){by=28;vy=Math.abs(vy)}
if(vy>0&&by+7>=PY&&by+7<=PY+14&&Math.abs(bx-px)<=PW/2+7){let o=cl((bx-px)/(PW/2),-1,1);if(Math.abs(o)<.12)o=(Math.random()<.5?-1:1)*.12;const a=o*1.05;vx=Math.sin(a)*sp;vy=-Math.cos(a)*sp;by=PY-7}
for(const b of bs){if(!b.alive)continue;if(bx+7>b.x&&bx-7<b.x+BW&&by+7>b.y&&by-7<b.y+BH){b.alive=false;score+=10;
const ox=Math.min(bx+7-b.x,b.x+BW-(bx-7)),oy=Math.min(by+7-b.y,b.y+BH-(by-7));
if(ox<oy)vx=bx<b.x+BW/2?-Math.abs(vx):Math.abs(vx);else vy=by<b.y+BH/2?-Math.abs(vy):Math.abs(vy);break}}
if(by>H+10){lives--;if(lives<=0){over=true;onOver(score);return}attach();return}}
if(!bs.some(b=>b.alive)){level++;score+=50;sp=Math.min(520,sp*1.08);build();attach()}},
draw(c){c.fillStyle="#070a22";c.fillRect(0,0,W,H);
for(const b of bs)if(b.alive){c.fillStyle=CO[b.r%CO.length];c.fillRect(b.x,b.y,BW,BH)}
c.fillStyle="#eef3ff";c.fillRect(px-PW/2,PY,PW,10);c.beginPath();c.arc(bx,by,7,0,Math.PI*2);c.fillStyle="#00cfff";c.fill();
hud(c,`Score ${score} · Level ${level}`,"❤️".repeat(Math.max(0,lives)));if(!launched)hint(c,"Drag to move · tap to launch")}}}

/* ---------- Number Merge (2048) ---------- */
function g2Add(b){const e=[];b.forEach((v,i)=>{if(!v)e.push(i)});if(e.length)b[e[ri(e.length)]]=Math.random()<.9?2:4}
function g2New(){const b=Array(16).fill(0);g2Add(b);g2Add(b);return b}
function g2Slide(line){const a=line.filter(Boolean);let sc=0;for(let i=0;i<a.length-1;i++){if(a[i]===a[i+1]){a[i]*=2;sc+=a[i];a.splice(i+1,1)}}while(a.length<4)a.push(0);return[a,sc]}
/* dir: 0 left, 1 right, 2 up, 3 down */
function g2Move(b,dir){const nb=Array(16).fill(0);let sc=0;
for(let k=0;k<4;k++){const idx=[];for(let j=0;j<4;j++)idx.push(dir<2?k*4+j:j*4+k);if(dir===1||dir===3)idx.reverse();
const [r,s]=g2Slide(idx.map(i=>b[i]));sc+=s;idx.forEach((i,j)=>nb[i]=r[j])}
return{b:nb,score:sc,moved:nb.some((v,i)=>v!==b[i])}}
function g2Over(b){return[0,1,2,3].every(d=>!g2Move(b,d).moved)}

/* ---------- Memory Match ---------- */
const MEM=["🚀","👾","🍉","🏎️","🧩","🛡️","🫧","⚡"];
const memNew=()=>shuffle([...MEM,...MEM].map((v,i)=>({id:i,v,open:false,done:false})));
const memScore=(moves,secs)=>Math.max(50,1000-moves*20-secs*5);

const MAKERS={"snake-run":snake,"whack-a-mole":whack,"sky-hop":skyhop,"brick-breaker":bricks};
const EXTRA_DESC={
"snake-run":"Swipe to steer the snake, eat 🍎 to grow and speed up. Don't hit the walls or yourself.",
"memory-match":"Flip two cards at a time and find all 8 pairs. Fewer moves and less time means a higher score.",
"whack-a-mole":"Tap the moles as they pop up — you have 30 seconds. The golden 🐲 is worth 25 points.",
"sky-hop":"Tap to hop your ship through the gaps. Every gap you clear scores points.",
"brick-breaker":"Drag to move the paddle, tap to launch the ball and break every brick. You have 3 lives.",
"number-merge":"Swipe to slide the tiles. Merge matching numbers to build bigger ones. Game ends when no moves are left."};
const LSK="ouer_local_best";
const readLB=()=>{try{return JSON.parse(localStorage.getItem(LSK)||"{}")||{}}catch{return{}}};
const localBest=s=>Number(readLB()[s])||0;
const saveLocal=(s,v)=>{const b=readLB(),prev=Number(b[s])||0,isNew=v>prev;if(isNew){b[s]=v;try{localStorage.setItem(LSK,JSON.stringify(b))}catch{}}return{best:Math.max(prev,v),isNew}};
const pt=(cv,e)=>{const b=cv.getBoundingClientRect();return[(e.clientX-b.left)/b.width*W,(e.clientY-b.top)/b.height*H]};
function CanvasGame({make,onOver}){
const ref=g.useRef(null);
g.useEffect(()=>{
const cv=ref.current,dpr=Math.min(2,window.devicePixelRatio||1);cv.width=W*dpr;cv.height=H*dpr;
const c=cv.getContext("2d");c.scale(dpr,dpr);c.textAlign="center";c.textBaseline="middle";
const gm=make(onOver);
const d=e=>{const p=pt(cv,e);try{cv.setPointerCapture&&cv.setPointerCapture(e.pointerId)}catch(_){}gm.down&&gm.down(p[0],p[1])};
const mv=e=>{const p=pt(cv,e);gm.move&&gm.move(p[0],p[1])};
const up=()=>{gm.up&&gm.up()};
const k=e=>{if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"," "].includes(e.key))e.preventDefault();gm.key&&gm.key(e.key)};
cv.addEventListener("pointerdown",d);cv.addEventListener("pointermove",mv);cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);window.addEventListener("keydown",k);
let id=0,last=performance.now();
const f=t=>{const dt=Math.min(.05,(t-last)/1e3);last=t;gm.step(dt);gm.draw(c);id=requestAnimationFrame(f)};
id=requestAnimationFrame(f);
return()=>{cancelAnimationFrame(id);cv.removeEventListener("pointerdown",d);cv.removeEventListener("pointermove",mv);cv.removeEventListener("pointerup",up);cv.removeEventListener("pointercancel",up);window.removeEventListener("keydown",k)}
},[]);
return m.jsx("canvas",{ref,className:"_canvas_152h1_1",style:{aspectRatio:`${W} / ${H}`,touchAction:"none"}})}
const canvasGame=slug=>({onOver})=>m.jsx(CanvasGame,{make:MAKERS[slug],onOver});

const boxStyle={maxWidth:360,margin:"0 auto",color:"#eef3ff",fontFamily:"Inter, sans-serif"};
const barStyle={display:"flex",justifyContent:"space-between",fontWeight:700,margin:"0 4px 10px"};
function Memory({onOver}){
const[cards,setCards]=g.useState(memNew),[sel,setSel]=g.useState([]),[moves,setMoves]=g.useState(0),[secs,setSecs]=g.useState(0),[lock,setLock]=g.useState(!1),[done,setDone]=g.useState(!1);
g.useEffect(()=>{if(done)return;const id=setInterval(()=>{if(!document.hidden)setSecs(s=>s+1)},1e3);return()=>clearInterval(id)},[done]);
const tap=i=>{
if(lock||done)return;const c=cards[i];if(c.open||c.done)return;
const nc=cards.map((x,j)=>j===i?{...x,open:!0}:x);setCards(nc);
if(sel.length===0){setSel([i]);return}
const a=sel[0];setSel([]);const mv=moves+1;setMoves(mv);
if(nc[a].v===nc[i].v){const dn=nc.map((x,j)=>j===a||j===i?{...x,done:!0}:x);setCards(dn);if(dn.every(x=>x.done)){setDone(!0);onOver(memScore(mv,secs))}}
else{setLock(!0);setTimeout(()=>{setCards(cs=>cs.map((x,j)=>j===a||j===i?{...x,open:!1}:x));setLock(!1)},700)}};
return m.jsxs("div",{style:boxStyle,children:[
m.jsxs("div",{style:barStyle,children:[m.jsxs("span",{children:["Moves ",moves]}),m.jsxs("span",{children:["⏱ ",secs,"s"]})]}),
m.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10},children:cards.map((c,i)=>
m.jsx("button",{type:"button","aria-label":c.open||c.done?c.v:"Hidden card",onClick:()=>tap(i),style:{aspectRatio:"1",fontSize:34,borderRadius:14,border:"1px solid "+(c.done?"#6ee7b7":"#2f3a7a"),background:c.open||c.done?"#1b2460":"linear-gradient(135deg,#2b3a8f,#6b3fb0)",color:"#fff",cursor:"pointer",opacity:c.done?.75:1},children:c.open||c.done?c.v:"❔"},c.id))}),
m.jsx("p",{style:{textAlign:"center",color:"#9aa2cc",fontSize:13,marginTop:12},children:"Find all 8 pairs — fewer moves and less time score more."})]})}

const TILE={0:"#161a45",2:"#2b3a8f",4:"#3b4fc7",8:"#0a9fcf",16:"#00cfff",32:"#34d399",64:"#ffcf5a",128:"#ff9f43",256:"#ff6b6b",512:"#ff20d5",1024:"#8a7bff",2048:"#ffffff"};
function Merge({onOver}){
const[b,setB]=g.useState(g2New),[sc,setSc]=g.useState(0),[over,setOver]=g.useState(!1),st=g.useRef(null);
const mv=d=>{if(over)return;const r=g2Move(b,d);if(!r.moved)return;const nb=r.b;g2Add(nb);const ns=sc+r.score;setB(nb);setSc(ns);if(g2Over(nb)){setOver(!0);onOver(ns)}};
g.useEffect(()=>{const k=e=>{const d={ArrowLeft:0,ArrowRight:1,ArrowUp:2,ArrowDown:3}[e.key];if(d!==void 0){e.preventDefault();mv(d)}};window.addEventListener("keydown",k);return()=>window.removeEventListener("keydown",k)});
const down=e=>{st.current=[e.clientX,e.clientY]};
const up=e=>{const s=st.current;st.current=null;if(!s)return;const dx=e.clientX-s[0],dy=e.clientY-s[1];if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))mv(dx>0?1:0);else mv(dy>0?3:2)};
const pad=(l,d)=>m.jsx("button",{type:"button","aria-label":"Move "+l,onClick:()=>mv(d),style:{flex:1,height:46,borderRadius:12,border:"1px solid #2f3a7a",background:"#161a45",color:"#eef3ff",fontSize:20,cursor:"pointer"},children:l},l);
return m.jsxs("div",{style:boxStyle,children:[
m.jsxs("div",{style:barStyle,children:[m.jsxs("span",{children:["Score ",sc]}),m.jsxs("span",{children:["Best tile ",Math.max(...b)]})]}),
m.jsx("div",{onPointerDown:down,onPointerUp:up,style:{touchAction:"none",display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,padding:8,borderRadius:16,background:"#0b0d28",border:"1px solid #2f3a7a"},children:b.map((v,i)=>
m.jsx("div",{style:{aspectRatio:"1",display:"grid",placeItems:"center",borderRadius:10,fontWeight:800,fontSize:v>=1024?20:v>=128?24:30,background:TILE[v]||"#fff",color:v>=64||v===2048?"#0b0d28":"#eef3ff"},children:v||""},i))}),
m.jsx("div",{style:{display:"flex",gap:8,marginTop:12},children:[pad("◀",0),pad("▲",2),pad("▼",3),pad("▶",1)]}),
m.jsx("p",{style:{textAlign:"center",color:"#9aa2cc",fontSize:13,marginTop:12},children:"Swipe, use the arrows, or press arrow keys."})]})}

const COMPONENTS={"snake-run":canvasGame("snake-run"),"whack-a-mole":canvasGame("whack-a-mole"),"sky-hop":canvasGame("sky-hop"),"brick-breaker":canvasGame("brick-breaker"),"memory-match":Memory,"number-merge":Merge};
export{COMPONENTS,EXTRA_DESC,localBest,saveLocal};
