// node check_derby.js — verifies the swing model with the game's own engine (loaded from index.html)
const fs=require("fs"),vm=require("vm"),path=require("path");
const html=fs.readFileSync(path.join(__dirname,"index.html"),"utf8");
const ctx={module:{exports:{}},Math};vm.createContext(ctx);vm.runInContext(html.match(/<script id="engine">([\s\S]*?)<\/script>/)[1],ctx);
const E=ctx.module.exports;const r=E.rng(12345),P=[];for(let i=0;i<1000;i++)P.push(E.makePitch(r,i%40));
function rate(fn,flt){const Q=P.filter(flt||(()=>true));let hr=0;for(const p of Q){const c=fn(p);if(c&&!c.whiff&&c.hr)hr++;}return hr/Q.length;}
const cases=[
 ["perfect timing, perfect aim",p=>E.contact(p,0,p.x,p.y),v=>v>=.95],
 ["perfect timing, aimed 3cm under",p=>E.contact(p,0,p.x,p.y-.03),v=>v>=.95],
 ["10 ms early, perfect aim",p=>E.contact(p,-.01,p.x,p.y),v=>v>=.95],
 ["30 ms late, first pitches of a round",p=>E.contact(p,.03,p.x,p.y),v=>v>=.3,p=>p.ramp===0],
 ["30 ms late, late-round pitches",p=>E.contact(p,.03,p.x,p.y),v=>v<=.1,p=>p.ramp>=1],
 ["late-round pitches (#25+), perfect",p=>E.contact(p,0,p.x,p.y),v=>v>=.95,p=>p.ramp>=1],
 ["70 ms early",p=>E.contact(p,-.07,p.x,p.y),v=>v<=.05],
 ["70 ms late",p=>E.contact(p,.07,p.x,p.y),v=>v<=.05],
 ["150 ms early (whiff)",p=>E.contact(p,-.15,p.x,p.y),v=>v===0],
 ["perfect timing, aimed 15cm high (chopper)",p=>E.contact(p,0,p.x,p.y+.15),v=>v<=.05],
 ["perfect timing, aimed 15cm low (popup)",p=>E.contact(p,0,p.x,p.y-.15),v=>v<=.05],
 ["perfect timing, aimed 30cm off (miss)",p=>E.contact(p,0,p.x+.4,p.y),v=>v===0]];
let fail=0;for(const [n,fn,ok,flt] of cases){const v=rate(fn,flt),pass=ok(v);if(!pass)fail++;console.log((pass?"PASS ":"FAIL ")+n.padEnd(42)+(v*100).toFixed(1)+"% homers");}
const c=E.contact(P[0],0,P[0].x,P[0].y);console.log("sample perfect:",P[0].name,P[0].mph+"mph ->",c.ev+"mph",c.la+"°",c.dist+"ft");
// full-round simulation by player skill (timing σ scales with pitch speed)
function gauss(r){return Math.sqrt(-2*Math.log(r()+1e-9))*Math.cos(2*Math.PI*r());}
function round(seed,st,sa,eye){const r=E.rng(seed),pr=E.rng(seed*7+1);let outs=0,hr=0,n=0;
 while(outs<10&&n<400){const p=E.makePitch(r,n);n++;const swing=p.strike?pr()<eye:pr()>eye;if(!swing){if(p.strike)outs++;continue;}
  const c=E.contact(p,gauss(pr)*st*(p.mph/88),p.x+gauss(pr)*sa,p.y+gauss(pr)*sa);if(c.whiff||!c.hr)outs++;else hr++;}return{hr,n};}
for(const [nm,st,sa,eye,lo,hi] of [["new (±50ms)",.05,.07,.7,1.5,4.5],["casual (±40ms)",.04,.06,.8,2,5],["decent (±28ms)",.028,.045,.85,4,12],["skilled (±18ms)",.018,.03,.92,8,99]]){
 let t=0,np=0,N=120;for(let i=0;i<N;i++){const o=round(i+1,st,sa,eye);t+=o.hr;np+=o.n;}const avg=t/N,ok=avg>=lo&&avg<=hi;if(!ok)fail++;
 console.log((ok?"PASS ":"FAIL ")+("round sim "+nm).padEnd(42)+avg.toFixed(1)+" HR avg, "+(np/N).toFixed(0)+" pitches/round");}
process.exit(fail?1:0);
