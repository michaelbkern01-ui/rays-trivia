// Automated finishability check: node check_holes.js
// Loads the engine from index.html and, for every hole, beam-searches shot sequences
// (angle x power) with the real physics until the ball is holed within par+2.
const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const src=html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1];
const ctx={module:{exports:{}},Math};vm.createContext(ctx);vm.runInContext(src,ctx);
const E=ctx.module.exports;
const POW=[.04,.06,.08,.1,.13,.16,.2,.25,.3,.36,.43,.5,.6,.72,.85,1];
function heur(co,s){const k=Math.round(s.x)+","+Math.round(s.z),d=co.dist[k];return(d===undefined?99:d)+Math.hypot(s.x-co.cup[0],s.z-co.cup[1])*.3;}
let fail=0;const only=process.argv[2]!==undefined?+process.argv[2]:null;
E.HOLES.forEach((h,i)=>{if(only!==null&&i!==only)return;const co=E.buildCourse(h);
 let beam=[{x:co.tee[0],z:co.tee[1],t:0,shots:[]}],found=null;
 for(let depth=1;depth<=h.p+2&&!found;depth++){const next=[];
  for(const n of beam){for(let a=0;a<360&&!found;a+=3)for(const p of POW){const r=E.simulate(co,n.x,n.z,a*Math.PI/180,p,n.t);
    const shots=n.shots.concat([[a,p]]);if(r.state==="sunk"){found=shots;break;}if(r.state==="water")continue;next.push({x:r.x,z:r.z,t:r.t,shots,h:heur(co,r)});}if(found)break;}
  next.sort((a,b)=>a.h-b.h);beam=[];for(const n of next){if(beam.every(b=>Math.hypot(b.x-n.x,b.z-n.z)>.25))beam.push(n);if(beam.length>=5)break;}}
 const ok=found&&found.length<=h.p+2;if(!ok)fail++;
 console.log(`${String(i).padStart(2)} ${h.n.padEnd(24)} par ${h.p}  ${ok?"OK in "+found.length+" ("+found.map(s=>s[0]+"°@"+Math.round(s[1]*100)+"%").join(", ")+")":"FAIL"}`);});
console.log(fail?fail+" hole(s) failed":"ALL HOLES FINISHABLE within par+2");process.exit(fail?1:0);
