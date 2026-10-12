import * as THREE from "three";
import {GLTFLoader} from "./lib/loaders/GLTFLoader.js";
import * as SkeletonUtils from "./lib/utils/SkeletonUtils.js";
import {RoomEnvironment} from "./lib/environments/RoomEnvironment.js";
const $=id=>document.getElementById(id);
// ---------- storage ----------
let DB;try{DB=JSON.parse(localStorage.getItem("raysderby_v1"))||{}}catch(e){DB={}}DB.daily=DB.daily||{};DB.best=DB.best||0;DB.longest=DB.longest||0;DB.bestHR=DB.bestHR||0;
const save=()=>{try{localStorage.setItem("raysderby_v1",JSON.stringify(DB))}catch(e){}};
const T0=new Date();const DKEY=T0.getFullYear()+"-"+String(T0.getMonth()+1).padStart(2,"0")+"-"+String(T0.getDate()).padStart(2,"0");
const DAYNUM=Math.round((Date.UTC(T0.getFullYear(),T0.getMonth(),T0.getDate())-Date.UTC(2026,9,1))/864e5)+1;
// ---------- progression ----------
DB.xp=DB.xp||0;DB.streak=DB.streak||0;DB.lastDaily=DB.lastDaily||null;DB.opt=DB.opt||{bat:"ash",uni:"home",night:false,fw:"classic"};
const lvlXP=l=>50*l*(l-1);
const level=()=>{let l=1;while(DB.xp>=lvlXP(l+1))l++;return l;};
const UNLOCKS=[
 {lv:1,kind:"bat",id:"ash",name:"Ash bat",col:0x9a6a3b},{lv:1,kind:"uni",id:"home",name:"Home navy",col:0x092C5C},{lv:1,kind:"fw",id:"classic",name:"Classic fireworks"},
 {lv:2,kind:"bat",id:"black",name:"Black bat",col:0x15151a},{lv:3,kind:"night",id:"night",name:"Night game"},{lv:4,kind:"uni",id:"powder",name:"Powder blue uni",col:0x8FBCE6},
 {lv:5,kind:"fw",id:"rainbow",name:"Rainbow fireworks"},{lv:6,kind:"bat",id:"gold",name:"Gold bat",col:0xF5D130},{lv:7,kind:"uni",id:"devil",name:"'98 throwback",col:0x1f5e3a},
 {lv:8,kind:"fw",id:"mega",name:"Mega fireworks"},{lv:10,kind:"bat",id:"sky",name:"Sky blue bat",col:0x6fb3ef},{lv:12,kind:"uni",id:"gold",name:"Gold rush uni",col:0xc9a20f}];
function dayKey(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function streakNow(){if(!DB.lastDaily)return 0;const y=new Date();y.setDate(y.getDate()-1);return(DB.lastDaily===dayKey(new Date())||DB.lastDaily===dayKey(y))?DB.streak:0;}
// ---------- renderer ----------
const cv=$("c"),renderer=new THREE.WebGLRenderer({canvas:cv,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xa9c9e8,220,700);
{const pm=new THREE.PMREMGenerator(renderer);scene.environment=pm.fromScene(new RoomEnvironment(),.04).texture;pm.dispose();}
const camera=new THREE.PerspectiveCamera(30,1,.1,1200);
const hemi=new THREE.HemisphereLight(0xdfeeff,0x4a6a3a,.9);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,2.6);sun.position.set(-22,40,14);sun.target.position.set(0,0,-8);scene.add(sun,sun.target);
sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-16,right:16,top:16,bottom:-16,near:5,far:90});sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;
const ENV=.35; // env-map strength for standard mats
const SM=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:0,envMapIntensity:ENV,...o});
function tex(w,h,fn,srgb=true){const c=document.createElement("canvas");c.width=w;c.height=h;fn(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t;}
const rnd=(()=>{let s=12345;return()=>(s=(s*16807)%2147483647)/2147483647;})();
// sky
let skyMesh;{const g=new THREE.SphereGeometry(900,32,16),col=[],p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i)/900;const c=new THREE.Color().lerpColors(new THREE.Color(0xd9ebfb),new THREE.Color(0x2a66b0),Math.pow(Math.max(0,y),.6));col.push(c.r,c.g,c.b);}
 g.setAttribute("color",new THREE.Float32BufferAttribute(col,3));skyMesh=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,fog:false,toneMapped:false}));scene.add(skyMesh);}
// clouds
const clouds=[];{const ct=tex(256,128,(g,w,h)=>{for(let i=0;i<26;i++){const x=40+rnd()*176,y=50+rnd()*40,r=18+rnd()*30;const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,"rgba(255,255,255,.55)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,w,h);}});
 for(let i=0;i<9;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(260,110),new THREE.MeshBasicMaterial({map:ct,transparent:true,depthWrite:false,fog:false}));const a=-1.2+i*.3+rnd()*.2;m.position.set(Math.sin(a)*700,160+rnd()*160,-Math.cos(a)*700);m.lookAt(0,60,0);scene.add(m);clouds.push(m);}}
// ---------- field ----------
const grassT=tex(512,512,(g,w,h)=>{const id=g.createImageData(w,h),d=id.data;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=((x<w/2)^(y<h/2))?1:0,n=rnd()*.10+Math.sin(x*.9)*.015;const i=(y*w+x)*4;
 const b=c?1.0:.9;d[i]=(52+n*60)*b;d[i+1]=(128+n*90)*b;d[i+2]=(50+n*40)*b;d[i+3]=255;}g.putImageData(id,0,0);});
grassT.wrapS=grassT.wrapT=THREE.RepeatWrapping;grassT.repeat.set(34,34);grassT.rotation=Math.PI/4;
const grassM=SM(0xffffff,{map:grassT,roughness:.95});
const field=new THREE.Mesh(new THREE.CircleGeometry(190,80),grassM);field.rotation.x=-Math.PI/2;field.receiveShadow=true;scene.add(field);
const dirtT=tex(256,256,(g,w,h)=>{const id=g.createImageData(w,h),d=id.data;for(let i=0;i<w*h;i++){const n=rnd();d[i*4]=170+n*40;d[i*4+1]=112+n*30;d[i*4+2]=70+n*22;d[i*4+3]=255;}g.putImageData(id,0,0);});
dirtT.wrapS=dirtT.wrapT=THREE.RepeatWrapping;dirtT.repeat.set(6,6);
const dirtM=SM(0xffffff,{map:dirtT,roughness:1});const chalk=SM(0xf4f4f0,{roughness:.9});
const flat=(geo,mat,y,rz=0)=>{const m=new THREE.Mesh(geo,mat);m.rotation.x=-Math.PI/2;m.rotation.z=rz;m.position.y=y;m.receiveShadow=true;scene.add(m);return m;};
{const d=flat(new THREE.PlaneGeometry(27.4,27.4),dirtM,.01,Math.PI/4);d.position.z=-19.4;
 const ig=new THREE.MeshStandardMaterial({map:grassT.clone(),roughness:.95,envMapIntensity:ENV});ig.map.repeat.set(3.2,3.2);ig.map.needsUpdate=true;
 const g=flat(new THREE.PlaneGeometry(23,23),ig,.015,Math.PI/4);g.position.z=-19.4;
 flat(new THREE.RingGeometry(25.5,29.2,64,1,Math.PI/4,Math.PI/2),dirtM,.012);
 const mound=new THREE.Mesh(new THREE.CylinderGeometry(.9,2.74,.25,40),dirtM);mound.position.set(0,.125,-18.44);mound.receiveShadow=true;scene.add(mound);
 const rub=new THREE.Mesh(new THREE.BoxGeometry(.61,.03,.15),chalk);rub.position.set(0,.26,-18.44);scene.add(rub);
 flat(new THREE.CircleGeometry(4.0,40),dirtM,.02);
 const sh=new THREE.Shape();sh.moveTo(-.216,0);sh.lineTo(.216,0);sh.lineTo(.216,.216);sh.lineTo(0,.432);sh.lineTo(-.216,.216);sh.closePath();
 const pl=new THREE.Mesh(new THREE.ShapeGeometry(sh),SM(0xffffff,{roughness:.6}));pl.rotation.x=Math.PI/2;pl.position.set(0,.032,-.216);scene.add(pl);
 // batter's boxes + catcher box
 const line=(x,z,w,l)=>{const m=flat(new THREE.PlaneGeometry(w,l),chalk,.028);m.position.x=x;m.position.z=z;};
 for(const s of [-1,1]){const cx=s*.98;line(cx-.61,0,.06,1.83);line(cx+.61,0,.06,1.83);line(cx,-.915,1.28,.06);line(cx,.915,1.28,.06);}
 for(const [x,z] of [[19.4,-19.4],[0,-38.8],[-19.4,-19.4]]){const b=new THREE.Mesh(new THREE.BoxGeometry(.38,.08,.38),SM(0xffffff,{roughness:.7}));b.position.set(x,.05,z);b.rotation.y=Math.PI/4;b.castShadow=true;scene.add(b);
  const c=flat(new THREE.CircleGeometry(2.2,24),dirtM,.013);c.position.x=x;c.position.z=z;}
 for(const s of [-1,1]){const L=fenceDist(s*45);const l=flat(new THREE.PlaneGeometry(.08,L),chalk,.03,-s*Math.PI/4*-1);l.rotation.z=-s*Math.PI/4;l.position.set(s*L/2*Math.SQRT1_2,.03,-L/2*Math.SQRT1_2);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,24,10),SM(0xf5d130,{roughness:.5}));const fd=fenceDist(s*45)+.5;pole.position.set(s*fd*Math.SQRT1_2,12,-fd*Math.SQRT1_2);scene.add(pole);}}
// ---------- wall, markers, stands ----------
const N=72,wallTop=[];
const strip=(pts,mat)=>{const pos=[],idx=[];pts.forEach(q=>pos.push(...q));for(let i=0;i<pts.length/2-1;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=new THREE.Mesh(g,mat);scene.add(m);return m;};
for(let i=0;i<=N;i++){const a=-50+100*i/N,fd=fenceDist(Math.max(-45,Math.min(45,a))),r=a*Math.PI/180;wallTop.push([Math.sin(r),-Math.cos(r),fd]);}
{const W=[],T=[],WT=[],B=[];wallTop.forEach(([sx,cz,fd])=>{W.push([sx*fd,0,cz*fd],[sx*fd,DCFG.wallH,cz*fd]);T.push([sx*fd,DCFG.wallH,cz*fd],[sx*(fd+.25),DCFG.wallH+.12,cz*(fd+.25)]);
  WT.push([sx*(fd-4.6),.02,cz*(fd-4.6)],[sx*fd,.02,cz*fd]);B.push([sx*(fd+.3),DCFG.wallH,cz*(fd+.3)],[sx*(fd+38),26,cz*(fd+38)]);});
 strip(W,SM(0x0b2f5e,{side:THREE.DoubleSide,roughness:.7}));strip(T,new THREE.MeshBasicMaterial({color:0xf5d130,side:THREE.DoubleSide}));
 const wt=strip(WT,new THREE.MeshStandardMaterial({color:0xb8865a,roughness:1,side:THREE.DoubleSide,envMapIntensity:ENV}));wt.receiveShadow=true;
 const crowdT=tex(512,128,(g,w,h)=>{g.fillStyle="#2b3a4c";g.fillRect(0,0,w,h);const cs=["#8FBCE6","#F5D130","#ffffff","#092C5C","#4a8fd0","#e0e8f0","#d04040","#3a3a3a"];for(let y=2;y<h;y+=5)for(let x=1;x<w;x+=3){if(rnd()<.12)continue;g.fillStyle=cs[(rnd()*8)|0];g.fillRect(x,y,2,3);g.fillStyle="#d9a77f";g.fillRect(x,y-1,2,1);}});
 crowdT.wrapS=THREE.RepeatWrapping;crowdT.repeat.set(14,1);
 const bl=strip(B,SM(0xffffff,{map:crowdT,side:THREE.DoubleSide,roughness:1}));const uv=[];B.forEach((q,i)=>uv.push(Math.floor(i/2)/N,i%2));bl.geometry.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
 // distance markers
 for(const [ang,ft] of [[-45,315],[-22,370],[0,404],[22,375],[45,322]]){const r=ang*Math.PI/180,fd=fenceDist(ang)-.06;
  const t=tex(256,128,(g)=>{g.fillStyle="#ffffff";g.font="bold 96px Arial Black,Arial";g.textAlign="center";g.fillText(ft,128,96);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(3.4,1.7),new THREE.MeshBasicMaterial({map:t,transparent:true}));m.position.set(Math.sin(r)*fd,1.7,-Math.cos(r)*fd);m.lookAt(0,1.7,0);scene.add(m);}
 // batter's eye
 const be=new THREE.Mesh(new THREE.BoxGeometry(40,10,1),SM(0x16301f));be.position.set(0,5,-fenceDist(0)-3);scene.add(be);}
// scoreboard
const sbCanvas=document.createElement("canvas");sbCanvas.width=512;sbCanvas.height=200;const sbTex=new THREE.CanvasTexture(sbCanvas);sbTex.colorSpace=THREE.SRGBColorSpace;
{const b=new THREE.Mesh(new THREE.PlaneGeometry(34,13.3),new THREE.MeshBasicMaterial({map:sbTex,fog:false,toneMapped:false}));b.position.set(0,44,-170);scene.add(b);
 const post=new THREE.Mesh(new THREE.BoxGeometry(36,15,1.5),SM(0x0d2a4f));post.position.set(0,44,-171);scene.add(post);}
function drawBoard(msg){const g=sbCanvas.getContext("2d");g.fillStyle="#0b1626";g.fillRect(0,0,512,200);g.strokeStyle="#F5D130";g.lineWidth=8;g.strokeRect(4,4,504,192);
 g.fillStyle="#8FBCE6";g.font="bold 30px sans-serif";g.textAlign="center";g.fillText("RAYS DERBY",256,44);
 g.font="bold 64px monospace";g.fillStyle="#F5D130";g.fillText(msg||`HR ${S.hr}  OUTS ${10-S.outs}`,256,120);
 g.font="bold 28px monospace";g.fillStyle="#fff";g.fillText(`LONGEST ${S.longest||"---"} FT`,256,172);sbTex.needsUpdate=true;}

// fan atlas: 8 variants (shirt, skin, hair, cap) drawn to canvas; instanced quads pick a column
const fanT=tex(512,128,(g)=>{const shirts=["#092C5C","#8FBCE6","#ffffff","#F5D130","#092C5C","#4a8fd0","#d8dde3","#8FBCE6"],skins=["#f1c7a5","#c68c63","#8d5a3b","#e0ac80","#5b3a26","#f3d0b5","#a8714b","#d9a06e"],hair=["#2a1a10","#111","#6b4a2a","#c9a35a","#111","#3b2a1d","#888","#2a1a10"];
 for(let i=0;i<8;i++){const x=i*64;g.fillStyle=shirts[i];g.beginPath();g.ellipse(x+32,118,26,40,0,Math.PI,0);g.fill();g.fillRect(x+6,100,52,28);
  g.fillStyle=skins[i];g.fillRect(x+27,58,10,12);g.beginPath();g.ellipse(x+32,46,14,17,0,0,Math.PI*2);g.fill();
  if(i%3===0){g.fillStyle=i%2?"#8FBCE6":"#092C5C";g.beginPath();g.ellipse(x+32,36,15,10,0,Math.PI,0);g.fill();g.fillRect(x+28,34,22,4);}else{g.fillStyle=hair[i];g.beginPath();g.ellipse(x+32,38,15,11,0,Math.PI,0);g.fill();}
  if(i===2||i===6){g.fillStyle=skins[i];g.save();g.translate(x+10,96);g.rotate(-.5);g.fillRect(-4,-34,9,36);g.restore();}}});
let fanItems=null;
function makeFans(A0,A1){const geo=new THREE.PlaneGeometry(.55,1.1);geo.translate(0,.55,0);const items=[];
 for(let r=19.8;r<71;r+=.9){const y=1.5+(r-18.6)*(32.5/53.4);const n=Math.floor((A1-A0)*r/.55);for(let j=0;j<n;j++){if(rnd()<.12)continue;const a=A0+(A1-A0)*(j+.5+(rnd()-.5)*.3)/n;items.push([Math.sin(a)*r,y,Math.cos(a)*r,a]);}}
 const vars=new Float32Array(items.length);items.forEach((_,i)=>vars[i]=(rnd()*8)|0);geo.setAttribute("aVar",new THREE.InstancedBufferAttribute(vars,1));
 const mat=new THREE.MeshLambertMaterial({map:fanT,alphaTest:.5,side:THREE.DoubleSide});
 mat.onBeforeCompile=sh=>{sh.uniforms.uT=crowdU;sh.uniforms.uH=crowdHype;sh.vertexShader="uniform float uT;uniform float uH;attribute float aVar;\n"+sh.vertexShader
  .replace("#include <uv_vertex>","#include <uv_vertex>\nvMapUv.x=(vMapUv.x+aVar)/8.0;")
  .replace("#include <begin_vertex>","#include <begin_vertex>\nfloat ph=float(gl_InstanceID)*1.731;transformed.y+=0.02*sin(uT*2.0+ph)+uH*max(0.0,sin(uT*9.0+ph))*0.3;");};
 const im=new THREE.InstancedMesh(geo,mat,items.length),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),col=new THREE.Color();
 items.forEach(([x,y,z,a],i)=>{q.setFromAxisAngle(new THREE.Vector3(0,1,0),a+Math.PI);const sc=.9+rnd()*.2;m4.compose(new THREE.Vector3(x,y,z),q,new THREE.Vector3(sc,sc,sc));im.setMatrixAt(i,m4);im.setColorAt(i,col.setScalar(.8+rnd()*.25));});
 return im;}
const seatT=tex(64,64,(g)=>{g.fillStyle="#3b4552";g.fillRect(0,0,64,64);g.fillStyle="#0e2e5c";g.fillRect(0,28,64,26);g.fillStyle="#08203f";for(let x=0;x<64;x+=16)g.fillRect(x,28,2,26);});seatT.wrapS=seatT.wrapT=THREE.RepeatWrapping;
// home-plate bowl: backstop, seating, instanced crowd
const crowdMat=new THREE.MeshLambertMaterial({color:0xffffff});let crowdU={value:0},crowdHype={value:0};
crowdMat.onBeforeCompile=sh=>{sh.uniforms.uT=crowdU;sh.uniforms.uH=crowdHype;sh.vertexShader="uniform float uT;uniform float uH;\n"+sh.vertexShader.replace("#include <begin_vertex>",
 "#include <begin_vertex>\nfloat ph=float(gl_InstanceID)*1.731;transformed.y+=(0.03*sin(uT*2.0+ph)+uH*max(0.0,sin(uT*9.0+ph))*0.35)*step(0.2,position.y+0.5);");};
{const A0=-1.95,A1=1.95; // angle from +z axis (behind home), spanning down both lines
 const back=[],net=[];for(let i=0;i<=48;i++){const a=A0*.62+(A1-A0)*.62*i/48,s=Math.sin(a),c=Math.cos(a);back.push([s*18,0,c*18],[s*18,1.5,c*18]);net.push([s*18,1.5,c*18],[s*18.4,10,c*18.4]);}
 {const adT=tex(1024,64,(g)=>{g.fillStyle="#0b2f5e";g.fillRect(0,0,1024,64);g.font="900 34px Arial";const w=["RAYS UP","HOME RUN DERBY","TAMPA BAY"];let x=24;w.forEach((t,i)=>{g.fillStyle=i%2?"#8FBCE6":"#F5D130";g.fillText(t,x,45);x+=g.measureText(t).width+60;});});adT.wrapS=THREE.RepeatWrapping;adT.repeat.x=1;
  const bk=strip(back,new THREE.MeshBasicMaterial({map:adT,side:THREE.DoubleSide}));const u=[];back.forEach((q,i)=>u.push(-Math.floor(i/2)/48*6,i%2));bk.geometry.setAttribute("uv",new THREE.Float32BufferAttribute(u,2));}strip(net,new THREE.MeshBasicMaterial({color:0x223344,transparent:true,opacity:.05,side:THREE.DoubleSide,depthWrite:false}));
 const bowl=[];for(let i=0;i<=64;i++){const a=A0+(A1-A0)*i/64,s=Math.sin(a),c=Math.cos(a);const r0=18.6,r1=72;bowl.push([s*r0,1.5,c*r0],[s*r1,34,c*r1]);}
 // dugout-side bowl hugging foul territory: clip so that it never enters fair ground (|a|<=~2.36 is fine)
 const bw=strip(bowl,SM(0xffffff,{map:seatT,side:THREE.DoubleSide,roughness:1}));const buv=[];bowl.forEach((q,i)=>buv.push(Math.floor(i/2)/64*60,i%2*56));bw.geometry.setAttribute("uv",new THREE.Float32BufferAttribute(buv,2));
 const im=makeFans(A0,A1);scene.add(im);
 // roof rim + light towers
 const rim=[];for(let i=0;i<=64;i++){const a=A0+(A1-A0)*i/64;rim.push([Math.sin(a)*72,34,Math.cos(a)*72],[Math.sin(a)*76,42,Math.cos(a)*76]);}strip(rim,SM(0x0d2a4f,{side:THREE.DoubleSide}));}
const lampMats=[];
for(const [x,z] of [[-60,40],[60,40],[-115,-70],[115,-70],[-70,-150],[70,-150]]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.6,.9,58,8),SM(0x8a96a2,{metalness:.5,roughness:.5}));pole.position.set(x,29,z);scene.add(pole);
 const lm=new THREE.MeshBasicMaterial({color:0xcfd6dd,fog:false});lampMats.push(lm);const panel=new THREE.Mesh(new THREE.BoxGeometry(14,7,1),lm);panel.position.set(x,60,z);panel.lookAt(0,0,-30);scene.add(panel);
 const fr=new THREE.Mesh(new THREE.BoxGeometry(14.6,7.6,.8),SM(0x2a3440));fr.position.copy(panel.position).add(new THREE.Vector3(x,0,z).normalize().multiplyScalar(.5));fr.lookAt(0,0,-30);scene.add(fr);}
// ---------- characters ----------
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);const _q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_v=new THREE.Vector3(),_v2=new THREE.Vector3(),_v3=new THREE.Vector3();
const UP=V3(0,1,0);
let SRC=null; // loaded gltf scene
const UNI={pitcher:{jersey:0xf3f5f8,trim:0x092C5C,pants:0xf0f2f5,sock:0x092C5C,shoe:0x15181d,belt:0x092C5C,num:1},
 batter:{jersey:0x092C5C,trim:0x8FBCE6,pants:0xf0f2f5,sock:0x092C5C,shoe:0x15181d,belt:0x092C5C,num:1},
 catcher:{jersey:0x092C5C,trim:0x8FBCE6,pants:0xe8eaee,sock:0x092C5C,shoe:0x15181d,belt:0x111111,num:1},
 ump:{jersey:0x1b2230,trim:0x1b2230,pants:0x6b7079,sock:0x111111,shoe:0x0c0c0c,belt:0x0c0c0c,num:0}};
function uniformMat(base,u){const m=base.clone();m.envMapIntensity=ENV;m.roughness=.8;m.metalness=0;
 const U={uJ:{value:new THREE.Color(u.jersey)},uT:{value:new THREE.Color(u.trim)},uP:{value:new THREE.Color(u.pants)},uS:{value:new THREE.Color(u.sock)},uC:{value:new THREE.Color(u.shoe)},uB:{value:new THREE.Color(u.belt)}};m.userData.U=U;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader="attribute vec3 bindPos;varying vec3 vBP;\n"+sh.vertexShader.replace("#include <begin_vertex>","#include <begin_vertex>\nvBP=bindPos;");
  sh.fragmentShader="varying vec3 vBP;uniform vec3 uJ,uT,uP,uS,uC,uB;\n"+sh.fragmentShader.replace("#include <map_fragment>",`#include <map_fragment>
  {vec3 p=vBP;float ax=abs(p.x);vec3 c=diffuseColor.rgb;float sh=0.0;
   if(p.y<0.10){c=uC;}
   else if(p.y<0.40){c=uS;}
   else if(p.y<0.93){c=uP;sh=1.0;}
   else if(p.y<1.0 && ax<0.26){c=uB;}
   else if(p.y<1.56 && ax<0.25 && !(p.y>1.45 && ax<0.075)){c=uJ;sh=1.0;}
   else if(p.y>1.30 && p.y<1.60 && ax<0.47 && ax>=0.25){c=(ax>0.44)?uT:uJ;sh=1.0;}
   if(p.y>=0.93&&p.y<1.47&&ax<0.25&&p.z>0.0&&abs(p.x)<0.012)c=mix(c,uT,0.6);
   diffuseColor.rgb=c*(1.0-0.06*sh*(0.5+0.5*sin(p.y*140.0+p.x*20.0)));}`);};
 m.customProgramCacheKey=()=>"uni";return m;}
function prepSource(g){ // add bind-pose positions (root space) as attribute so uniform zones follow the body when skinned
 g.updateMatrixWorld(true);g.traverse(o=>{if(o.isSkinnedMesh){const geo=o.geometry,n=geo.attributes.position.count,arr=new Float32Array(n*3),v=new THREE.Vector3();
  for(let i=0;i<n;i++){o.getVertexPosition(i,v);v.applyMatrix4(o.matrixWorld);arr[i*3]=v.x;arr[i*3+1]=v.y;arr[i*3+2]=v.z;}geo.setAttribute("bindPos",new THREE.BufferAttribute(arr,3));}});}
class Player{
 constructor(u,opts={}){this.g=new THREE.Group();this.root=SkeletonUtils.clone(SRC);this.g.add(this.root);this.B={};this.mats=[];
  this.root.traverse(o=>{if(o.isBone)this.B[o.name]=o;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;
   if(o.material.name&&o.material.name.includes("Superhero")){o.material=uniformMat(o.material,u);this.mats.push(o.material);}else{o.material=o.material.clone();o.material.envMapIntensity=ENV;}}});
  this.bind=new Map();for(const k in this.B)this.bind.set(this.B[k],this.B[k].quaternion.clone());this.pelBind=this.B.pelvis.position.clone();
  this.g.updateMatrixWorld(true);this.len={};for(const [a,b,c] of [["thigh_l","calf_l","foot_l"],["thigh_r","calf_r","foot_r"],["upperarm_l","lowerarm_l","hand_l"],["upperarm_r","lowerarm_r","hand_r"]])
   this.len[a]=[this.wp(a).distanceTo(this.wp(b)),this.wp(b).distanceTo(this.wp(c))];
  this.pelvis0=this.wp("pelvis").clone();scene.add(this.g);}
 wp(n,t=new THREE.Vector3()){return this.B[n].getWorldPosition(t);}
 attach(bone,obj,localPos,rot){ // obj positioned in CHARACTER bind space then reparented to bone
  this.g.updateMatrixWorld(true);const b=this.B[bone];const wpos=this.g.localToWorld(localPos.clone());b.add(obj);obj.position.copy(b.worldToLocal(wpos));
  const bq=b.getWorldQuaternion(new THREE.Quaternion()).invert();const gq=this.g.getWorldQuaternion(new THREE.Quaternion());obj.quaternion.copy(bq.multiply(gq));if(rot)obj.quaternion.multiply(rot);
  obj.traverse(o=>{if(o.isMesh)o.castShadow=true;});return obj;}
 reset(){for(const [b,q] of this.bind)b.quaternion.copy(q);this.B.pelvis.position.copy(this.pelBind);}
 C(v){return this.g.localToWorld(_v3.set(v[0],v[1],v[2])).clone();} // char-space -> world
 dirW(v){return _v3.set(v[0],v[1],v[2]).transformDirection(this.g.matrixWorld).clone();}
 rotW(name,q){const b=this.B[name];const bw=b.getWorldQuaternion(_q2);const pw=b.parent.getWorldQuaternion(new THREE.Quaternion());b.quaternion.copy(pw.invert().multiply(q).multiply(bw));b.updateMatrixWorld(true);}
 aim(name,child,target){const a=this.wp(name),c=this.wp(child,_v2);const from=c.sub(a).normalize(),to=target.clone().sub(a).normalize();this.rotW(name,_q.setFromUnitVectors(from,to));}
 ik(a,b,c,T,pole){const A=this.wp(a),[l1,l2]=this.len[a];let d=T.clone().sub(A);const dist=Math.min(Math.max(d.length(),.02),l1+l2-.002);const dir=d.normalize();
  const x=(l1*l1-l2*l2+dist*dist)/(2*dist),h=Math.sqrt(Math.max(0,l1*l1-x*x));const pp=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  const K=A.clone().add(dir.clone().multiplyScalar(x)).add(pp.multiplyScalar(h));this.aim(a,b,K);this.aim(b,c,A.clone().add(dir.multiplyScalar(dist)));}
 // pose: {pel:[x,y,z] offset, yaw, lean, side, sp:[yaw,lean], fl,fr (feet char), hl,hr (hands char), pk:[x,y,z] knee pole, pel_l, pel_r elbow poles, look:[x,y,z]}
 pose(P){this.reset();this.g.updateMatrixWorld(true);const B=this.B;
  // pelvis translation (char space offset)
  const tgt=this.g.localToWorld(this.pelvis0.clone().add(V3(...P.pel)));
  B.pelvis.position.copy(B.pelvis.parent.worldToLocal(tgt));B.pelvis.updateMatrixWorld(true);
  const gq=this.g.getWorldQuaternion(new THREE.Quaternion());
  const rq=(yaw,lean,side=0)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(lean,yaw,side,"YXZ")).premultiply(gq).multiply(gq.clone().invert());
  this.rotW("pelvis",rq(P.yaw||0,(P.lean||0)*.5,P.side||0));
  const sp=P.sp||[0,0];this.rotW("spine_01",rq(sp[0]*.5,(P.lean||0)*.25+sp[1]*.5));this.rotW("spine_03",rq(sp[0]*.5,(P.lean||0)*.25+sp[1]*.5));
  const kp=P.pk||[0,0,1];
  this.ik("thigh_l","calf_l","foot_l",this.C(P.fl),this.dirW(P.pkl||kp));this.ik("thigh_r","calf_r","foot_r",this.C(P.fr),this.dirW(P.pkr||kp));
  if(P.hl)this.ik("upperarm_l","lowerarm_l","hand_l",this.C(P.hl),this.dirW(P.el||[.6,-.6,-.4]));
  if(P.hr)this.ik("upperarm_r","lowerarm_r","hand_r",this.C(P.hr),this.dirW(P.er||[-.6,-.6,-.4]));
  if(P.look){const HN=B.Head?"Head":"head";const h=this.wp(HN);const want=this.C(P.look).sub(h);want.y*=.6;want.normalize();
   const cur=V3(0,0,1).applyQuaternion(B[HN].getWorldQuaternion(new THREE.Quaternion()));cur.y=0;want.y=Math.max(-.5,Math.min(.5,want.y));const cf=cur.clone().normalize(),wf=want.clone().setY(0).normalize();
   let ang=Math.atan2(cf.x*wf.z-cf.z*wf.x,cf.x*wf.x+cf.z*wf.z);ang=-Math.max(-1.3,Math.min(1.3,ang));this.rotW("neck_01",_q.setFromAxisAngle(UP,ang*.6));this.rotW(HN,_q.setFromAxisAngle(UP,ang*.4));}
 }}
const lerpArr=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
function lerpPose(A,B,t){const o={};for(const k in A){const a=A[k],b=B[k]===undefined?a:B[k];o[k]=Array.isArray(a)?lerpArr(a,b,t):typeof a==="number"?a+(b-a)*t:a;}return o;}
const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function track(keys,t){if(t<=keys[0][0])return keys[0][1];for(let i=1;i<keys.length;i++)if(t<=keys[i][0]){const [t0,a]=keys[i-1],[t1,b]=keys[i];return lerpPose(a,b,ease((t-t0)/(t1-t0)));}return keys[keys.length-1][1];}
// ---------- cast ----------
const BATTER_X=-.95,PITCH_Z=-18.3;
let pitcherP=null,batterP=null,catcherP=null,umpP=null,FALLBACK=false,fb={};
const capMat=SM(0x8FBCE6,{roughness:.7}),navyM=SM(0x092C5C,{roughness:.6}),leather=SM(0x7a4a22,{roughness:.6}),blackM=SM(0x15171b,{roughness:.5});
function cap(col,brimCol){const g=new THREE.Group();const c=new THREE.Mesh(new THREE.SphereGeometry(.118,20,10,0,Math.PI*2,0,Math.PI*.55),col);c.scale.set(1,.95,1.12);g.add(c);
 const b=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.012,20,1,false,-Math.PI/2,Math.PI),brimCol);b.scale.set(1,1,.9);b.position.set(0,-.005,.085);b.rotation.x=.12;g.add(b);
 const btn=new THREE.Mesh(new THREE.SphereGeometry(.012,6,4),brimCol);btn.position.y=.106;g.add(btn);return g;}
function helmet(){const g=new THREE.Group();const m=SM(0x092C5C,{roughness:.25,metalness:.2,envMapIntensity:.9});
 const c=new THREE.Mesh(new THREE.SphereGeometry(.125,22,12,0,Math.PI*2,0,Math.PI*.6),m);c.scale.set(1,.98,1.08);g.add(c);
 const flap=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8,0,Math.PI*2,0,Math.PI*.5),m);flap.rotation.z=Math.PI/2;flap.position.set(.105,-.06,0);g.add(flap); // left ear flap (faces pitcher for RHB)
 const b=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,.012,20,1,false,-Math.PI/2,Math.PI),m);b.scale.set(1,1,.6);b.position.set(0,-.01,.07);g.add(b);
 const logo=new THREE.Mesh(new THREE.CircleGeometry(.03,12),SM(0x8FBCE6));logo.position.set(0,.03,.128);logo.rotation.x=-.3;g.add(logo);return g;}
function mask(){const g=new THREE.Group();const m=new THREE.Mesh(new THREE.TorusGeometry(.085,.008,6,16),blackM);m.scale.set(1,1.25,1);m.position.z=.12;g.add(m);
 for(let i=-1;i<=1;i++){const bar=new THREE.Mesh(new THREE.BoxGeometry(.16,.008,.008),blackM);bar.position.set(0,i*.04,.125);g.add(bar);}return g;}
function glove(scale=1){const g=new THREE.Group();const m=new THREE.Mesh(new THREE.SphereGeometry(.1,14,10),leather);m.scale.set(.55*scale,1.05*scale,.95*scale);g.add(m);return g;}
function makeBat(){const pts=[[.031,0],[.031,.012],[.014,.03],[.0125,.32],[.019,.47],[.03,.64],[.0335,.80],[.032,.85],[.02,.862],[0,.864]].map(([r,y])=>new THREE.Vector2(r,y));
 const m=new THREE.Mesh(new THREE.LatheGeometry(pts,16),SM(0x9a6a3b,{roughness:.4,envMapIntensity:.8}));m.castShadow=true;const g=new THREE.Group();g.add(m);scene.add(g);return g;}
const bat=makeBat();
function buildCast(){
 pitcherP=new Player(UNI.pitcher);pitcherP.g.position.set(0,.25,PITCH_Z);
 pitcherP.attach("Head",cap(capMat,navyM),V3(0,1.74,.012));pitcherP.attach("hand_l",glove(),V3(.80,1.455,.02));
 batterP=new Player(UNI.batter);batterP.g.position.set(BATTER_X,0,0);batterP.g.rotation.y=Math.PI/2;
 batterP.attach("Head",helmet(),V3(0,1.70,.0));
 catcherP=new Player(UNI.catcher);catcherP.g.position.set(0,0,1.05);catcherP.g.rotation.y=Math.PI;
 const ch=catcherP.attach("Head",helmet(),V3(0,1.70,0));ch.rotation.y+=Math.PI;catcherP.attach("Head",mask(),V3(0,1.62,.0));
 const pad=new THREE.Mesh(new THREE.BoxGeometry(.30,.36,.05),navyM);catcherP.attach("spine_03",pad,V3(0,1.24,.115));
 for(const s of [-1,1]){const sg=new THREE.Mesh(new THREE.BoxGeometry(.13,.42,.08),navyM);catcherP.attach(s<0?"calf_r":"calf_l",sg,V3(s*.114,.3,.07));}
 catcherP.attach("hand_l",glove(1.45),V3(.81,1.455,.03));
 umpP=new Player(UNI.ump);umpP.g.position.set(-.38,0,1.85);umpP.g.rotation.y=Math.PI;
 umpP.attach("Head",cap(blackM,blackM),V3(0,1.74,.012));umpP.attach("Head",mask(),V3(0,1.62,0));
 const up=new THREE.Mesh(new THREE.BoxGeometry(.4,.45,.12),blackM);umpP.attach("spine_03",up,V3(0,1.25,.14));
 for(const P of [pitcherP,batterP,catcherP,umpP])curlFingers(P);
}
function curlFingers(P){for(const k in P.B){const m=k.match(/^(index|middle|ring|pinky)_0([123])_([lr])$/);if(m){const q=new THREE.Quaternion().setFromAxisAngle(V3(0,0,1),m[3]==="l"?-1.1:1.1);P.bind.get(P.B[k]).multiply(q);}}}
function buildFallback(){FALLBACK=true;const fig=(j)=>{const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CapsuleGeometry(.26,.7,4,8),SM(j));b.position.y=1.1;g.add(b);
  const l=new THREE.Mesh(new THREE.CapsuleGeometry(.2,.6,4,8),SM(0xdfe6ee));l.position.y=.45;g.add(l);const h=new THREE.Mesh(new THREE.SphereGeometry(.17,12,10),SM(0xc68c63));h.position.y=1.72;g.add(h);
  const c=cap(capMat,navyM);c.position.y=1.76;c.scale.setScalar(1.5);g.add(c);g.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(g);return g;};
 fb.p=fig(0xffffff);fb.p.position.set(0,.25,PITCH_Z);fb.b=fig(0x092C5C);fb.b.position.set(BATTER_X,0,0);fb.b.rotation.y=Math.PI/2;fb.c=fig(0x092C5C);fb.c.position.set(0,-.5,1.05);}
// ---- pitcher keyframes (char space: +z to plate, +x = glove side) ----
const REL_C=[DCFG.relX,DCFG.relY-.25,DCFG.relZ-PITCH_Z];
const PK=[
 [0,{pel:[0,-.02,0],yaw:0,lean:.08,sp:[0,0],fl:[.15,0,.02],fr:[-.14,0,-.02],hl:[.06,1.12,.32],hr:[-.04,1.10,.32],look:[0,1.5,20],pk:[0,0,1],el:[.8,-.6,0],er:[-.8,-.6,0]}],
 [.25,{pel:[.0,-.0,-.04],yaw:-.5,lean:.05,sp:[0,0],fl:[.15,0,.02],fr:[-.08,0,-.04],hl:[0,1.3,.25],hr:[-.02,1.28,.25],look:[0,1.5,20]}],
 [.55,{pel:[.02,.02,-.08],yaw:-1.35,lean:-.05,sp:[-.1,0],fl:[.14,.60,.12],fr:[-.08,0,-.05],hl:[.05,1.28,.18],hr:[-.02,1.26,.18],pkl:[.2,.4,1],look:[0,1.5,20]}],
 [.88,{pel:[.02,-.22,.38],yaw:-1.15,lean:.05,sp:[-.45,0],fl:[.22,.06,.98],fr:[-.08,0,-.05],hl:[.35,1.32,.65],hr:[-.55,1.42,-.30],er:[-.6,.4,-.6],look:[0,1.5,20]}],
 [1.15,{pel:[.02,-.30,.58],yaw:.2,lean:.5,sp:[.35,.25],fl:[.2,0,1.0],fr:[-.10,.16,-.02],hl:[.32,1.02,.45],hr:REL_C,er:[-.8,.3,-.3],look:[0,1.3,20]}],
 [1.45,{pel:[.06,-.36,.72],yaw:.75,lean:.8,sp:[.5,.3],fl:[.2,0,1.0],fr:[.02,.30,.32],hl:[.38,.95,.4],hr:[.42,.62,.85],er:[-.3,-.8,.2],look:[0,1.3,20]}],
 [2.1,{pel:[.03,-.15,.62],yaw:.25,lean:.25,sp:[.1,0],fl:[.2,0,1.0],fr:[-.05,0,.55],hl:[.3,1.05,.6],hr:[-.1,1.0,.65],look:[0,1.5,20]}],
 [2.8,{pel:[0,-.02,0],yaw:0,lean:.08,sp:[0,0],fl:[.15,0,.02],fr:[-.14,0,-.02],hl:[.06,1.12,.32],hr:[-.04,1.10,.32],look:[0,1.5,20]}]];
// ---- batter keyframes (char space: +x toward pitcher, +z toward plate) ----
const BK={
 stance:{pel:[0,-.10,-.02],yaw:-.12,lean:.32,sp:[-.1,0],fl:[.38,0,.03],fr:[-.38,0,0],grip:[-.17,1.30,.20],dir:[-.42,.88,-.18],pkl:[.5,0,1],pkr:[-.4,0,1]},
 load:{pel:[-.06,-.12,-.03],yaw:-.32,lean:.32,sp:[-.25,0],fl:[.30,.10,.06],fr:[-.38,0,0],grip:[-.27,1.36,.12],dir:[-.55,.8,-.2]},
 stride:{pel:[.04,-.16,-.02],yaw:-.25,lean:.3,sp:[-.3,0],fl:[.55,0,.06],fr:[-.38,0,0],grip:[-.27,1.32,.12],dir:[-.6,.75,-.25]},
 follow:{pel:[.10,-.12,0],yaw:1.35,lean:.15,sp:[.75,-.05],fl:[.56,0,.06],fr:[-.30,.12,.06],grip:[.18,1.52,.02],dir:[-.25,.35,-.9]}};
const tmpBat=new THREE.Quaternion();
function batterPose(P,lookW){const B=batterP;const dir=V3(...P.dir).normalize();const grip=V3(...P.grip);
 const pose=Object.assign({},P,{hl:grip.toArray(),hr:grip.clone().addScaledVector(dir,.10).toArray(),el:[0,-1,-.3],er:[0,-1,-.4],look:lookW});B.pose(pose);
 // place bat: knob just below bottom hand
 const knob=B.C(grip.clone().addScaledVector(dir,-.04).toArray());bat.position.copy(knob);bat.quaternion.setFromUnitVectors(UP,B.dirW(dir.toArray()));}
function contactPose(bx,by,early){ // bat sweet spot (.68 m) meets the ball at world (bx,by,0)
 const bc=[0,by,bx-BATTER_X]; // char: x=-worldZ, z=worldX-BATTER_X
 const a=Math.max(-.6,Math.min(.6,early*4)),dir=V3(Math.sin(a),-.08-(1.0-by)*.25,Math.cos(a)).normalize();
 const grip=V3(...bc).addScaledVector(dir,-.68);grip.y=Math.max(.6,Math.min(1.35,grip.y));grip.z=Math.max(.15,grip.z);
 return {pel:[.08,-.16,0],yaw:.95,lean:.32,sp:[.45,.1],fl:[.56,0,.06],fr:[-.34,.05,.03],grip:grip.toArray(),dir:dir.toArray()};}
// strike zone (subtle, broadcast-style)
const zoneBox=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(DCFG.zoneX*2,DCFG.zoneY1-DCFG.zoneY0)),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.45}));
zoneBox.position.set(0,(DCFG.zoneY0+DCFG.zoneY1)/2,0);scene.add(zoneBox);
const tapMark=new THREE.Mesh(new THREE.RingGeometry(.035,.05,24),new THREE.MeshBasicMaterial({color:0xf5d130,transparent:true,depthTest:false}));tapMark.visible=false;tapMark.renderOrder=5;scene.add(tapMark);
// ball with seams
const seamT=tex(512,256,(g,w,h)=>{g.fillStyle="#f6f3ec";g.fillRect(0,0,w,h);g.strokeStyle="#c22";g.lineWidth=3;
 for(const off of [0,Math.PI]){g.beginPath();for(let i=0;i<=w;i+=2){const ph=i/w*Math.PI*2;const y=h/2+Math.sin(ph*2+off)*h*.28;i?g.lineTo(i,y):g.moveTo(i,y);}g.stroke();
  for(let i=0;i<w;i+=7){const ph=i/w*Math.PI*2,y=h/2+Math.sin(ph*2+off)*h*.28;g.beginPath();g.moveTo(i-3,y-5);g.lineTo(i+3,y+5);g.stroke();}}});
const ball=new THREE.Mesh(new THREE.SphereGeometry(.037,20,14),SM(0xffffff,{map:seamT,roughness:.55,envMapIntensity:.6}));ball.visible=false;ball.castShadow=true;scene.add(ball);
const TR=40,trailG=new THREE.BufferGeometry();trailG.setAttribute("position",new THREE.Float32BufferAttribute(new Float32Array(TR*3),3));
const trail=new THREE.Line(trailG,new THREE.LineBasicMaterial({color:0xfff3a0,transparent:true,opacity:.6}));trail.frustumCulled=false;scene.add(trail);let trailPts=[];
const cue=new THREE.Mesh(new THREE.SphereGeometry(.07,12,8),new THREE.MeshBasicMaterial({color:0xf5d130,transparent:true,depthTest:false}));cue.visible=false;cue.renderOrder=4;scene.add(cue);
// fireworks
const FW=[];function firework(x,y,z){const n=90,pos=new Float32Array(n*3),vel=[];for(let i=0;i<n;i++){pos.set([x,y,z],i*3);const a=Math.random()*Math.PI*2,b=Math.acos(2*Math.random()-1),s=10+Math.random()*6;vel.push([Math.sin(b)*Math.cos(a)*s,Math.cos(b)*s,Math.sin(b)*Math.sin(a)*s]);}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(pos,3));const st=DB.opt.fw,col=st==="rainbow"?new THREE.Color().setHSL(Math.random(),1,.6).getHex():[0xf5d130,0x8fbce6,0xffffff][FW.length%3];
 const p=new THREE.Points(g,new THREE.PointsMaterial({color:col,size:st==="mega"?2.6:1.6,transparent:true,fog:false}));scene.add(p);FW.push({p,vel,t:0});}
function stepFW(dt){for(let i=FW.length-1;i>=0;i--){const f=FW[i];f.t+=dt;const a=f.p.geometry.attributes.position;for(let k=0;k<f.vel.length;k++){const v=f.vel[k];v[1]-=6*dt;a.setXYZ(k,a.getX(k)+v[0]*dt,a.getY(k)+v[1]*dt,a.getZ(k)+v[2]*dt);}
 a.needsUpdate=true;f.p.material.opacity=Math.max(0,1-f.t/1.6);if(f.t>1.6){scene.remove(f.p);f.p.geometry.dispose();FW.splice(i,1);}}}
function applyOpts(){const o=DB.opt,f=k=>UNLOCKS.find(u=>u.kind===k&&u.id===o[k]);
 bat.children[0].material.color.setHex((f("bat")||UNLOCKS[0]).col);
 const uc=(f("uni")||UNLOCKS[1]).col;if(batterP)for(const m of batterP.mats){m.userData.U.uJ.value.setHex(uc);m.userData.U.uT.value.setHex(uc===0x8FBCE6?0x092C5C:0x8FBCE6);}
 if(FALLBACK&&fb.b)fb.b.children[0].material.color.setHex(uc);
 const n=!!o.night;skyMesh.material.color.setHex(n?0x141c33:0xffffff);hemi.intensity=n?.35:.9;sun.intensity=n?1.6:2.6;sun.color.setHex(n?0xe8f0ff:0xfff0d8);
 sun.position.set(n?-10:-22,n?55:40,n?20:14);scene.fog.color.setHex(n?0x0b1630:0xa9c9e8);clouds.forEach(c=>c.visible=!n);
 lampMats.forEach(m=>{m.color.setHex(n?0xffffff:0xcfd6dd);m.toneMapped=!n;});renderer.toneMappingExposure=n?.95:1.0;}
// ---------- audio / haptics ----------
let AC=null;function ac(){try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();}catch(e){}return AC;}
function crack(q){const a=ac();if(!a)return;const t=a.currentTime,len=.12,buf=a.createBuffer(1,a.sampleRate*len,a.sampleRate),d=buf.getChannelData(0);
 for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,q>.7?6:3);const src=a.createBufferSource();src.buffer=buf;
 const f=a.createBiquadFilter();f.type="bandpass";f.frequency.value=q>.7?2400:900;f.Q.value=.8;const g=a.createGain();g.gain.value=.9;src.connect(f);f.connect(g);g.connect(a.destination);src.start(t);
 const o=a.createOscillator(),og=a.createGain();o.frequency.setValueAtTime(q>.7?1800:500,t);o.frequency.exponentialRampToValueAtTime(200,t+.06);og.gain.setValueAtTime(.3,t);og.gain.exponentialRampToValueAtTime(.001,t+.07);o.connect(og);og.connect(a.destination);o.start(t);o.stop(t+.08);}
function tone(f,dur,type="sine",vol=.2,at=0){const a=ac();if(!a)return;const t=a.currentTime+at,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur);}
function cowbell(n=4){for(let i=0;i<n;i++){tone(540,.35,"square",.06,i*.22);tone(800,.3,"square",.05,i*.22);}}
function whoosh(){tone(180,.12,"triangle",.08);}
const buzz=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};
// ---------- game state ----------
const S={mode:null,hr:0,outs:0,score:0,streak:0,longest:0,row:[],phase:"idle",pitch:null,r:null,t:0,swing:null,fly:null,flyT:0,camMode:"bat"};
const CAM_TV={pos:new THREE.Vector3(.8,4.1,-33.5),look:new THREE.Vector3(-.2,.62,0)};
camera.position.copy(CAM_TV.pos);const camLook=CAM_TV.look.clone();camera.lookAt(camLook);
function start(mode){S.mode=mode;S.hr=0;S.outs=0;S.score=0;S.streak=0;S.longest=0;S.row=[];S.n=0;S.perfects=0;applyOpts();S.r=rng(mode==="daily"?hashStr("raysderby-"+DKEY):(Math.random()*4e9)>>>0);
 $("sStart").classList.remove("on");$("sEnd").classList.remove("on");hud();drawBoard();ac();nextPitch(1.2);}
function hud(){$("hr").textContent=S.hr;$("score").textContent=S.score;$("outsv").textContent="●".repeat(10-S.outs)+"○".repeat(S.outs);
 const m=$("mult");if(S.streak>=1){m.style.display="block";m.textContent="🔥 x"+(S.streak+1)+" next";}else m.style.display="none";}
const WIND=1.15;
function nextPitch(delay){S.bFrom=lastBatPose;S.bFromT=0;S.phase="wait";S.wait=delay;S.pitch=null;S.swing=null;S.fly=null;ball.visible=false;tapMark.visible=false;trailPts=[];}
function beginPitch(){S.pitch=makePitch(S.r,S.n++);S.phase="windup";S.t=0;S.arrive=WIND+S.pitch.t;$("pitch").textContent="";}
// swing input
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,0,1),0),hv=new THREE.Vector3();
function swingAt(sx,sy,tOverride){if(S.phase==="replay"){S.replayEnd=true;return;}if(!(S.phase==="windup"||S.phase==="pitch")||S.swing)return;
 ndc.set(sx/innerWidth*2-1,-(sy/innerHeight)*2+1);ray.setFromCamera(ndc,camera);if(!ray.ray.intersectPlane(plane,hv))return;
 const ts=tOverride!==undefined?tOverride:S.t;S.swing={t:ts,x:hv.x,y:hv.y,anim:0};tapMark.position.set(hv.x,hv.y,.01);tapMark.visible=true;S.swing.cp=contactPose(Math.max(-.6,Math.min(.6,hv.x)),hv.y,S.arrive-ts);buzz(8);whoosh();}
cv.addEventListener("pointerdown",e=>{e.preventDefault();ac();const lag=Math.max(0,Math.min(.1,(performance.now()-lastFrameNow)/1000));swingAt(e.clientX,e.clientY,S.t+lag);},{passive:false});
["touchstart","touchmove","gesturestart","dblclick"].forEach(ev=>document.addEventListener(ev,e=>{if(e.target===cv||ev!=="touchstart")e.preventDefault();},{passive:false}));
function screenOf(x,y,z){const v=new THREE.Vector3(x,y,z).project(camera);return[(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight];}
function resolve(){if(S.phase!=="pitch"&&S.phase!=="windup")return;S.phase="post";const p=S.pitch,sw=S.swing;let res;
 if(!sw){if(p.strike){res={out:true,label:"Called strike",sub:p.name+" · "+p.mph+" mph"};S.row.push("❌");}
  else{res={out:false,label:"Ball",sub:"Good eye. No out."};}
  show(res.label,res.sub);if(res.out)addOut();else nextPitch(1.1);return;}
 const c=contact(p,sw.t-S.arrive,sw.x,sw.y);meter(sw.t-S.arrive);if(!c.whiff&&Math.abs(sw.t-S.arrive)<=DCFG.perfect)S.perfects++;
 if(c.whiff){S.row.push("❌");buzz(20);show("Swing and miss",(sw.t<S.arrive?"Way early":"Too late")+" · "+p.name+" "+p.mph+" mph");addOut();return;}
 S.goneShown=false;crack(c.q);buzz(c.hr?[30,40,60]:25);S.fly=c;S.flyT=0;S.phase="flight";ball.visible=true;trailPts=[];
 S.camMode="hit";S.camT=0;S.camCut=false;
S.hitOff=[ball.position.x-c.pts[0][0],ball.position.y-c.pts[0][1],ball.position.z-c.pts[0][2]];
}
let mT;function meter(dt){const ms=Math.round(dt*1000),c=Math.max(-150,Math.min(150,ms));$("tick").style.left=(50+c/3)+"%";
 $("ms").textContent=Math.abs(ms)<=DCFG.perfect*1000?"PERFECT ✨ "+(ms===0?"":Math.abs(ms)+" ms "+(ms<0?"early":"late")):Math.abs(ms)+" ms "+(ms<0?"early":"late");
 $("ms").style.color=Math.abs(ms)<=DCFG.perfect*1000?"#F5D130":"#fff";$("meter").classList.add("on");clearTimeout(mT);mT=setTimeout(()=>$("meter").classList.remove("on"),2200);}
function addOut(){S.outs++;S.streak=0;hud();drawBoard();if(S.outs>=10)setTimeout(end,1500);else nextPitch(1.6);}
function celebrate(c){$("gone").classList.add("on");setTimeout(()=>$("gone").classList.remove("on"),1700);show(c.dist+" ft",c.ev+" mph · "+c.la+"° · "+c.timing);
 cowbell(S.streak>0?6:4);buzz([40,60,40,60,80]);const n=(DB.opt.fw==="mega"?10:5)+S.streak;for(let i=0;i<n;i++)setTimeout(()=>firework(ball.position.x+(Math.random()-.5)*70,25+Math.random()*30,ball.position.z-10-Math.random()*30),i*200);}
function landed(){const c=S.fly;
 if(c.hr){S.hr++;S.streak++;const pts=S.streak;S.score+=pts;S.row.push("⚾");S.longest=Math.max(S.longest,c.dist);
  show(c.dist+" ft",c.ev+" mph · "+c.la+"° · "+c.timing+(pts>1?" · x"+pts+" streak!":""));
  hud();drawBoard();startReplay();}
 else{S.camMode="return";S.row.push("❌");const kind=c.foul?"Foul ball":c.wall?"Off the wall!":c.la<8?"Grounder":c.la>48?"Pop up":"Fly out";show(kind+(c.foul?"":" · "+c.dist+" ft"),c.ev+" mph · "+c.la+"° · "+c.timing);addOut();}}
function startReplay(){S.phase="replay";S.rt=-.55;S.replayEnd=false;$("replay").classList.add("on");S.camMode="replay";camera.position.set(8.5,1.9,4.2);camLook.set(-.6,1.1,0);trailPts=[];}
function endReplay(){$("replay").classList.remove("on");S.camMode="return";nextPitch(.6);}
let rdT;function show(a,b){$("rd1").textContent=a;$("rd2").textContent=b;$("read").classList.add("on");clearTimeout(rdT);rdT=setTimeout(()=>$("read").classList.remove("on"),2000);}
function end(){S.phase="over";const d=S.mode==="daily";let isBest=false;const prevBestHR=DB.bestHR,lvBefore=level();
 if(d){const prev=DB.daily[DKEY];if(!prev||S.score>prev.score){DB.daily[DKEY]={score:S.score,hr:S.hr,longest:S.longest,row:S.row.join("")};isBest=true;}}
 if(S.score>DB.best){DB.best=S.score;isBest=true;}DB.bestHR=Math.max(DB.bestHR,S.hr);DB.longest=Math.max(DB.longest,S.longest);save();
 $("eMode").textContent=d?"DAILY DERBY #"+DAYNUM:"FREE PLAY";$("eHR").textContent=S.hr+" HR · "+S.score+" pts";$("eLong").textContent=S.longest?"Longest: "+S.longest+" ft":"No homers this time";
 $("eRow").textContent=S.row.join("");$("eBest").textContent=(isBest?"🏆 New best! ":"")+"Best score "+DB.best+" · Longest ever "+DB.longest+" ft";
 const xp=S.hr*10+Math.min(S.score,50)*2+S.perfects*5+10;DB.xp+=xp;
 if(d&&DB.lastDaily!==DKEY){const y=new Date();y.setDate(y.getDate()-1);DB.streak=DB.lastDaily===dayKey(y)?DB.streak+1:1;DB.lastDaily=DKEY;}save();
 const gap=prevBestHR-S.hr;$("eChase").textContent=S.hr>prevBestHR&&prevBestHR>0?"🏆 New HR record! (old: "+prevBestHR+")":gap===0&&S.hr>0?"Tied your record of "+S.hr+" HR!":gap>0?(gap===1?"Just 1 HR":gap+" HR")+" from your best ("+prevBestHR+")":"";
 const lv=level(),newU=UNLOCKS.filter(u=>u.lv>lvBefore&&u.lv<=lv);
 $("eXP").innerHTML="<b>+"+xp+" XP</b>"+(S.perfects?" · "+S.perfects+" perfect swing"+(S.perfects>1?"s":""):"")+(d?" · 🔥 "+streakNow()+"-day streak":"")+"<br>Level "+lv+(lv>lvBefore?" — LEVEL UP! 🎉":"")+xpBar()+(newU.length?"<br>🔓 Unlocked: "+newU.map(u=>u.name).join(", "):"");
 $("sEnd").classList.add("on");drawBoard("FINAL "+S.hr+" HR");}
function xpBar(){const l=level(),a=lvlXP(l),b=lvlXP(l+1);return `<div class="xpbar"><i style="width:${(DB.xp-a)/(b-a)*100}%"></i></div><span style="font-size:11px">${DB.xp-a}/${b-a} XP to level ${l+1}</span>`;}
function shareText(){return "Rays Derby"+(S.mode==="daily"?" #"+DAYNUM:"")+" 💥 "+S.hr+" HR · "+(S.longest?"longest "+S.longest+" ft":"no homers")+"\n"+S.row.join("")+"\n"+location.href.split(/[?#]/)[0];}
$("bShare").onclick=async()=>{const t=shareText();try{if(navigator.share){await navigator.share({text:t});return;}}catch(e){if(e&&e.name==="AbortError")return;}
 try{await navigator.clipboard.writeText(t);show("Copied!","Paste it anywhere");}catch(e){prompt("Copy:",t);}};
$("bAgain").onclick=()=>start(S.mode==="daily"?"daily":"free");$("bMenu").onclick=()=>{$("sEnd").classList.remove("on");$("sStart").classList.add("on");menu();};
$("bDaily").onclick=()=>start("daily");$("bFree").onclick=()=>start("free");
function menu(){const d=DB.daily[DKEY];$("bDaily").textContent="Daily Derby #"+DAYNUM+(d?" · best "+d.score:"");
 const lv=level(),st=streakNow();
 $("lvl").innerHTML="<b>Level "+lv+"</b>"+(st?" · 🔥 "+st+"-day daily streak":"")+xpBar()+"<div style='margin-top:6px;font-weight:800'>Locker</div><div class='opts'>"+
  UNLOCKS.map(u=>{const sel=u.kind==="night"?DB.opt.night:DB.opt[u.kind]===u.id;return `<button class="opt${sel?" sel":""}" data-k="${u.kind}" data-id="${u.id}" ${u.lv>lv?"disabled":""}>${u.lv>lv?"🔒 L"+u.lv+" ":""}${u.name}</button>`}).join("")+"</div>";
 document.querySelectorAll(".opt").forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(k==="night")DB.opt.night=!DB.opt.night;else DB.opt[k]=b.dataset.id;save();applyOpts();menu();});
 $("bests").textContent="Best score "+DB.best+" · Most HR "+DB.bestHR+" · Longest "+(DB.longest||"—")+" ft";}
applyOpts();menu();drawBoard("PLAY BALL");
// ---------- loop ----------
const FOVW=()=>{const a=innerWidth/innerHeight,half=a<1?2.25:3.4*a;return 2*Math.atan(half/CAM_TV.pos.distanceTo(CAM_TV.look)/a)*180/Math.PI;};
const FOVH=()=>innerWidth<innerHeight?52:40;
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.fov=S.camMode==="tv"?FOVW():FOVH();camera.updateProjectionMatrix();}
addEventListener("resize",resize);
function cutTV(){S.camMode="tv";camera.position.copy(CAM_TV.pos);camLook.copy(CAM_TV.look);camera.fov=FOVW();camera.updateProjectionMatrix();}
let last=performance.now(),lastFrameNow=last,clock=0;S.pt=3;S.bFrom=null;S.bFromT=9;let lastBatPose=BK.stance;
const PITCHER_HEAD=V3(0,1.75,PITCH_Z),_w=new THREE.Vector3();
function swingPose(s,cp){if(s<0)return BK.stride;if(s<.055)return lerpPose(BK.stride,cp,s/.055);if(s<.42)return lerpPose(cp,BK.follow,ease((s-.055)/.365));return BK.follow;}
function animate(dt){
 const p=S.pitch;
 // pitcher
 let pt=S.pt;if(S.phase==="replay"&&p)pt=WIND+p.t+S.rt;
 if(pitcherP){pitcherP.pose(track(PK,pt));}
 else if(FALLBACK){const w=Math.min(1,pt/WIND);fb.p.rotation.y=Math.sin(w*Math.PI)*.5;}
 // batter
 let P;const sw=S.swing;
 if(sw&&(S.phase!=="replay")){P=swingPose(sw.anim+.035,sw.cp);}
 else if(S.phase==="replay"&&sw){P=swingPose(S.rt+(S.arrive-sw.t)+.035,sw.cp);}
 else if(S.phase==="windup"||S.phase==="pitch"||S.phase==="post"){const t=S.t;
  if(t<WIND-.45)P=BK.stance;else if(t<WIND-.1)P=lerpPose(BK.stance,BK.load,ease((t-WIND+.45)/.35));else if(t<WIND+.18)P=lerpPose(BK.load,BK.stride,ease((t-WIND+.1)/.28));
  else if(p&&t>S.arrive+.15)P=lerpPose(BK.stride,BK.stance,Math.min(1,(t-S.arrive-.15)/.6));else P=BK.stride;}
 else P=BK.stance;
 if(S.bFrom&&S.bFromT<.7&&!(sw)){S.bFromT+=dt;P=lerpPose(S.bFrom,P,ease(Math.min(1,S.bFromT/.7)));}
 if(P===BK.stance){P=Object.assign({},P);P.grip=[P.grip[0]+Math.sin(clock*2.2)*.03,P.grip[1]+Math.sin(clock*1.1)*.015,P.grip[2]];}
 lastBatPose=P;
 if(batterP){const lookW=(S.phase==="flight"||S.phase==="done")?ball.position:PITCHER_HEAD;batterPose(P,batterP.g.worldToLocal(lookW.clone()).toArray());}
 else if(FALLBACK){bat.position.set(BATTER_X+.25,1.25,0);const k=sw?Math.min(1,sw.anim/.13):0;bat.rotation.set(0,0,0);bat.rotateY(k*Math.PI*1.1);bat.rotateZ(-1.2+k*1.3);}
 // catcher: glove tracks the pitch
 if(catcherP){let gw=V3(0,.78,.25);if(p&&(S.phase==="pitch"||S.phase==="post")){gw.set(Math.max(-.5,Math.min(.5,p.x)),Math.max(.35,Math.min(1.3,p.y)),.25);}
  const g=catcherP.g.worldToLocal(gw.clone());S.glove=S.glove||g.clone();S.glove.lerp(g,1-Math.exp(-10*dt));
  catcherP.pose({pel:[0,-.50,.02],yaw:0,lean:.38,sp:[0,0],fl:[.32,0,-.02],fr:[-.32,0,-.02],pkl:[.8,0,1],pkr:[-.8,0,1],hl:S.glove.toArray(),hr:[-.22,.52,.18],el:[.8,-.6,0],er:[-.9,-.4,0],look:[0,1.0,18]});}
 if(umpP){const b=Math.sin(clock*1.6)*.01;umpP.pose({pel:[0,-.30+b,0],yaw:0,lean:.55,sp:[0,0],fl:[.34,0,0],fr:[-.34,0,0],pkl:[.6,0,1],pkr:[-.6,0,1],hl:[.24,.60,.30],hr:[-.24,.60,.30],el:[1,0,-.3],er:[-1,0,-.3],look:[0,.9,18]});}
}
function frame(now){const dt=Math.min(.05,(now-last)/1000)*(window.__derby?__derby.dtScale:1);last=now;lastFrameNow=now;clock+=dt;S.pt+=dt;
 if(S.phase==="wait"){S.wait-=dt;if(S.camMode!=="tv"&&S.wait<1.0)cutTV();if(S.wait<=0){if(S.camMode!=="tv")cutTV();beginPitch();S.pt=0;}}
 if(S.swing)S.swing.anim+=dt;
 animate(dt);
 if(S.phase==="windup"||S.phase==="pitch"){S.t+=dt;const p=S.pitch;
  if(S.t<WIND){const h=pitcherP?pitcherP.wp("hand_r",_w).clone().add(V3(.02,.05,.06)):null;if(h&&S.t>.05){ball.visible=true;ball.position.copy(h);S.relOff=h.clone().sub(V3(DCFG.relX,DCFG.relY,DCFG.relZ));}}
  if(S.t>=WIND-.12&&S.t<WIND+.08){cue.visible=true;cue.position.copy(pitcherP?pitcherP.wp("hand_r",_w):V3(DCFG.relX,DCFG.relY,DCFG.relZ));cue.material.opacity=.8*(1-Math.abs(S.t-WIND+.02)/.1);cue.scale.setScalar(1+(S.t-WIND+.12)*5);}else cue.visible=false;
  if(S.t>=WIND){if(S.phase!=="pitch"){S.phase="pitch";$("pitch").textContent=p.name+" · "+p.mph+" mph";}
   const u=(S.t-WIND)/p.t;let q=pitchPos(p,Math.min(u,1));
   if(u<1&&S.relOff){const k=Math.pow(1-u,3);q=[q[0]+S.relOff.x*k,q[1]+S.relOff.y*k,q[2]+S.relOff.z*k];}
   if(u>=1&&catcherP){const gp=catcherP.wp("hand_l",_w);q=[gp.x,gp.y,gp.z-.05];}else if(u>1){q=[q[0],q[1],(u-1)*-DCFG.relZ];}
   ball.visible=true;ball.position.set(q[0],q[1],q[2]);ball.rotation.x-=(p.name==="Curveball"?-40:55)*dt;
   if(u>=1.15||(S.swing&&S.t>S.swing.t&&Math.abs(S.swing.t-S.arrive)<=DCFG.window&&S.t>=S.arrive-.001)){resolve();}}}
 if(S.phase==="flight"){S.flyT+=dt;const c=S.fly,i=Math.min(c.pts.length-1,Math.floor(S.flyT*120));let q=c.pts[i];if(S.hitOff){const k=Math.pow(Math.max(0,1-S.flyT/.3),2);q=[q[0]+S.hitOff[0]*k,q[1]+S.hitOff[1]*k,q[2]+S.hitOff[2]*k];}ball.position.set(q[0],q[1],q[2]);ball.rotation.x+=70*dt;trailPts.push(q);
  if(c.hr&&!S.goneShown&&i>=c.clearI){S.goneShown=true;celebrate(c);crowdHype.value=1;}
  if(i>=c.pts.length-1&&S.flyT>(c.pts.length/120)+.15){S.phase="done";landed();}}
 if(S.phase==="replay"){const p=S.pitch,c=S.fly;S.rt+=dt*(S.rt<.3?.3:1);let q;
  if(S.rt<0){const u=1+S.rt/p.t;q=pitchPos(p,Math.max(0,u));}else{const i=Math.min(c.pts.length-1,Math.floor(S.rt*120));q=c.pts[i];trailPts.push(q);}
  ball.visible=true;ball.position.set(q[0],q[1],q[2]);
  if(S.rt>.25){const d=ball.position.clone();camLook.lerp(d,1-Math.exp(-3*dt));camera.position.lerp(V3(10,3+Math.min(10,d.y*.25),6),1-Math.exp(-.8*dt));}
  if(S.replayEnd||S.rt>2.8)endReplay();}
 // trail
 if(trailPts.length>TR)trailPts=trailPts.slice(-TR);const ta=trailG.attributes.position;for(let i=0;i<TR;i++){const q=trailPts[Math.max(0,trailPts.length-TR+i)]||[0,-5,0];ta.setXYZ(i,q[0],q[1],q[2]);}ta.needsUpdate=true;trail.visible=ball.visible&&trailPts.length>1&&S.phase!=="windup";
 // camera
 if(S.camMode==="hit"&&S.fly&&S.phase!=="replay"&&(S.camT+=dt)>.4){if(!S.camCut){S.camCut=true;camera.position.set(1.5,5.2,13);camLook.set(0,1,0);}const b=ball.position,tgt=V3(b.x*.3,6+b.y*.45,10+b.z*.18);camera.position.lerp(tgt,1-Math.exp(-1.6*dt));camLook.lerp(b,1-Math.exp(-7*dt));
  const f=FOVH();if(Math.abs(camera.fov-f)>.1){camera.fov=f;camera.updateProjectionMatrix();}}
 camera.lookAt(camLook);
 const bd=camera.position.distanceTo(ball.position);ball.scale.setScalar(Math.min(2.6,Math.max(1,bd/(S.camMode==="tv"?9:12))));
 crowdU.value=clock;crowdHype.value=Math.max(0,crowdHype.value-dt*.25);
 stepFW(dt);renderer.render(scene,camera);requestAnimationFrame(frame);}
// ---------- boot: load players ----------
resize();applyOpts();menu();drawBoard("PLAY BALL");requestAnimationFrame(frame);
(async()=>{const ld=$("load");try{const gl=await new GLTFLoader().loadAsync("models/player.glb",e=>{if(e.total)$("ldBar").style.width=(e.loaded/e.total*100)+"%";});
  SRC=gl.scene;prepSource(SRC);buildCast();}
 catch(e){console.warn("player model failed, using simple figures",e);buildFallback();}
 applyOpts();ld.classList.add("done");setTimeout(()=>ld.remove(),600);window.__derby.ready=true;})();
window.__derby={S,start,swingAt,screenOf,contact,now:()=>S.t+Math.max(0,Math.min(.1,(performance.now()-lastFrameNow)/1000)),get arrive(){return S.arrive},ready:false,dtScale:1};
