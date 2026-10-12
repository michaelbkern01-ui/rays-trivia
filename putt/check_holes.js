// Automated hole checks: node check_holes.js [holeIndex]
// For every hole, using the game's real physics (engine loaded from index.html):
//  1. NORMAL: beam search (secret kicker disabled) finds a way to hole it within par+1.
//  2. NO CHEAP ACE: no single shot (1° x 4% power grid, kicker disabled) holes it with 0 or 1 rail bank.
//  3. SECRET: some shot through the hidden kicker flies to the cup for an eagle-or-better.
const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const ctx={module:{exports:{}},Math};vm.createContext(ctx);vm.runInContext(html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1],ctx);
const E=ctx.module.exports,D2R=Math.PI/180;
const POW=[.04,.06,.08,.1,.13,.16,.2,.25,.3,.36,.43,.5,.6,.72,.85,1];
function heur(co,s){const d=co.dist[Math.round(s.x)+","+Math.round(s.z)];return(d===undefined?99:d)+Math.hypot(s.x-co.cup[0],s.z-co.cup[1])*.3;}
function normal(co,max){let beam=[{x:co.tee[0],z:co.tee[1],t:0,shots:[]}];
 for(let depth=1;depth<=max;depth++){const next=[];
  for(const n of beam)for(let a=0;a<360;a+=3)for(const p of POW){const r=E.simulate(co,n.x,n.z,a*D2R,p,n.t,true),shots=n.shots.concat([[a,p]]);
   if(r.state==="sunk")return shots;if(r.state!=="water")next.push({x:r.x,z:r.z,t:r.t,shots,h:heur(co,r)});}
  next.sort((a,b)=>a.h-b.h);beam=[];for(const n of next){if(beam.every(b=>Math.hypot(b.x-n.x,b.z-n.z)>.25))beam.push(n);if(beam.length>=6)break;}}
 return null;}
function cheapAces(co){const out={cheap:0,multi:0};
 for(let a=0;a<360;a+=1)for(let p=.04;p<=1.0001;p+=.04){const r=E.simulate(co,co.tee[0],co.tee[1],a*D2R,p,0,true);if(r.state==="sunk"){if(r.banks<=1){out.cheap++;out.ex=out.ex||[a,+p.toFixed(2),r.banks];}else out.multi++;}}
 return out;}
function secret(co){const K=co.kick;let hits=0,ex=null;
 for(let da=-8;da<=8;da+=.5)for(let p=.5;p<=1.0001;p+=.02){const r=E.simulate(co,co.tee[0],co.tee[1],K.ang+da*D2R,p,0,false);if(r.secret&&r.state==="sunk"){hits++;ex=ex||[+(K.ang/D2R+da).toFixed(1),+p.toFixed(2)];}}
 return{hits,ex};}
let fail=0;const only=process.argv[2]!==undefined?+process.argv[2]:null;
E.HOLES.forEach((h,i)=>{if(only!==null&&i!==only)return;const co=E.buildCourse(h);
 const n=normal(co,h.p+1),ac=cheapAces(co),se=secret(co);
 const ok=n&&ac.cheap===0&&se.hits>0;if(!ok)fail++;
 console.log(`${String(i).padStart(2)} ${h.n.padEnd(22)} par ${h.p} | normal: ${n?n.length+" strokes":"NOT FOUND"} | 0-1-bank aces: ${ac.cheap}${ac.ex?" e.g. "+ac.ex:""} (multi-bank flukes: ${ac.multi}/9000) | secret: ${se.hits?"ace, "+se.hits+" combos e.g. "+se.ex[0]+"°@"+Math.round(se.ex[1]*100)+"%":"BROKEN"} | ${ok?"PASS":"FAIL"}`);});
if(only===null)console.log(fail?fail+" hole(s) FAILED":"ALL HOLES PASS");process.exit(fail?1:0);
